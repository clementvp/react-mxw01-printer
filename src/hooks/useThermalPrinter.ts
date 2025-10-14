import { useState, useCallback, useRef } from "react";
import {
  MXW01Printer,
  PRINTER_WIDTH,
  prepareImageDataBuffer,
} from "../services/printer";
import type { PrinterState } from "../services/printer";
import { processImageForPrinter } from "../services/imageProcessor";
import type {
  ImageProcessorOptions,
  DitherMethod,
} from "../services/imageProcessor";

// Bluetooth service UUIDs
const PRINTER_SERVICE_UUID = "0000ae30-0000-1000-8000-00805f9b34fb";
const PRINTER_SERVICE_UUID_ALT = "0000af30-0000-1000-8000-00805f9b34fb"; // macOS alternate UUID
const CONTROL_CHAR_UUID = "0000ae01-0000-1000-8000-00805f9b34fb";
const NOTIFY_CHAR_UUID = "0000ae02-0000-1000-8000-00805f9b34fb";
const DATA_CHAR_UUID = "0000ae03-0000-1000-8000-00805f9b34fb";

export interface ThermalPrinterHook {
  isConnected: boolean;
  isPrinting: boolean;
  printerState: PrinterState | null;
  statusMessage: string;
  ditherMethod: DitherMethod;
  printIntensity: number;
  connectPrinter: () => Promise<void>;
  printCanvas: (
    canvas: HTMLCanvasElement,
    options?: Partial<ImageProcessorOptions>
  ) => Promise<void>;
  getPrinterStatus: () => Promise<PrinterState | null>;
  disconnect: () => Promise<void>;
  setDitherMethod: (method: DitherMethod) => void;
  setPrintIntensity: (intensity: number) => void;
}

export function useThermalPrinter(): ThermalPrinterHook {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [printerState, setPrinterState] = useState<PrinterState | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>(
    "Ready to connect printer"
  );
  const [ditherMethod, setDitherMethod] = useState<DitherMethod>("steinberg");
  const [printIntensity, setPrintIntensity] = useState<number>(0x5d);

  // References for BLE connections
  const printerRef = useRef<MXW01Printer | null>(null);
  const deviceRef = useRef<BluetoothDevice | null>(null);
  const notifyCharRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);

  /**
   * Connect to printer via Bluetooth
   */
  const connectPrinter = useCallback(async () => {
    try {
      setStatusMessage("Connecting to printer...");

      // Request Bluetooth device with support for both standard and macOS UUIDs
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [PRINTER_SERVICE_UUID] },
          { services: [PRINTER_SERVICE_UUID_ALT] },
        ],
        optionalServices: [PRINTER_SERVICE_UUID, PRINTER_SERVICE_UUID_ALT],
      });

      deviceRef.current = device;

      // Connect to GATT server
      const server = await device.gatt?.connect();
      if (!server) throw new Error("Failed to connect to GATT server");

      // Access printer service - try standard UUID first, then macOS alternate
      let service;
      try {
        service = await server.getPrimaryService(PRINTER_SERVICE_UUID);
      } catch (error) {
        console.log("Trying alternate UUID for macOS compatibility...");
        service = await server.getPrimaryService(PRINTER_SERVICE_UUID_ALT);
      }

      // Get characteristics
      const [controlChar, notifyChar, dataChar] = await Promise.all([
        service.getCharacteristic(CONTROL_CHAR_UUID),
        service.getCharacteristic(NOTIFY_CHAR_UUID),
        service.getCharacteristic(DATA_CHAR_UUID),
      ]);

      notifyCharRef.current = notifyChar;

      // Initialize printer
      const printer = new MXW01Printer(
        controlChar.writeValueWithoutResponse.bind(controlChar),
        dataChar.writeValueWithoutResponse.bind(dataChar)
      );

      printerRef.current = printer;

      // Setup notifications
      const notifier = (event: Event) => {
        const characteristic =
          event.target as BluetoothRemoteGATTCharacteristic;
        const value = characteristic.value;
        if (value) {
          printer.notify(new Uint8Array(value.buffer));
          setPrinterState({ ...printer.state });
        }
      };

      await notifyChar.startNotifications();
      notifyChar.addEventListener("characteristicvaluechanged", notifier);

      setIsConnected(true);
      setStatusMessage("Printer connected");

      // Initial status request
      await getPrinterStatus();
    } catch (error) {
      console.error("Connection error:", error);
      setStatusMessage(`Error: ${(error as Error).message}`);
      throw error;
    }
  }, []);

  /**
   * Get current printer status
   */
  const getPrinterStatus =
    useCallback(async (): Promise<PrinterState | null> => {
      if (!printerRef.current || !isConnected) {
        setStatusMessage("Printer not connected");
        return null;
      }

      try {
        await printerRef.current.requestStatus();
        const newState = { ...printerRef.current.state };
        setPrinterState(newState);
        return newState;
      } catch (error) {
        console.error("Error requesting status:", error);
        setStatusMessage(`Error: ${(error as Error).message}`);
        return null;
      }
    }, [isConnected]);

  /**
   * Print from HTML canvas
   */
  const printCanvas = useCallback(
    async (
      canvas: HTMLCanvasElement,
      options: Partial<ImageProcessorOptions> = {}
    ) => {
      if (!printerRef.current || !isConnected) {
        setStatusMessage("Printer not connected");
        return;
      }

      try {
        setIsPrinting(true);
        setStatusMessage("Preparing to print...");

        // Default image processing options
        const defaultOptions: ImageProcessorOptions = {
          dither: ditherMethod,
          brightness: 128,
          flip: "none",
          rotate: 180, // Required rotation for MXW01 printer
          ...options,
        };

        // Get canvas dimensions
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        // Calculate scaling to fit printer width
        const scale = PRINTER_WIDTH / canvasWidth;
        const scaledHeight = Math.floor(canvasHeight * scale);

        // Create temporary canvas for resizing
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx) {
          throw new Error("Failed to create 2D context");
        }

        // Resize to printer width
        tempCanvas.width = PRINTER_WIDTH;
        tempCanvas.height = scaledHeight;

        // Draw with white background
        tempCtx.fillStyle = "white";
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);

        // Get image data
        const imageData = tempCtx.getImageData(
          0,
          0,
          tempCanvas.width,
          tempCanvas.height
        );

        // Process image for printing
        setStatusMessage("Processing image...");
        const { binaryRows } = processImageForPrinter(
          imageData,
          defaultOptions
        );

        // Prepare print buffer
        const imageBuffer = prepareImageDataBuffer(binaryRows);

        // Configure print intensity
        setStatusMessage("Configuring printer...");
        await printerRef.current.setIntensity(printIntensity);

        // Check printer status
        const status = await printerRef.current.requestStatus();
        if (status.length >= 13 && status[12] !== 0) {
          throw new Error(`Printer error: ${status[13]}`);
        }

        // Send print request
        setStatusMessage("Sending data...");
        const ack = await printerRef.current.printRequest(binaryRows.length, 0);
        if (!ack || ack[0] !== 0) {
          throw new Error("Print request rejected");
        }

        // Send image data
        await printerRef.current.sendDataChunks(imageBuffer);
        await printerRef.current.flushData();

        // Wait for print completion
        setStatusMessage("Printing...");
        await printerRef.current.waitForPrintComplete();

        setStatusMessage("Print completed");
        await getPrinterStatus();
      } catch (error) {
        console.error("Print error:", error);
        setStatusMessage(`Error: ${(error as Error).message}`);
      } finally {
        setIsPrinting(false);
      }
    },
    [isConnected, ditherMethod, printIntensity, getPrinterStatus]
  );

  /**
   * Disconnect printer
   */
  const disconnect = useCallback(async () => {
    if (notifyCharRef.current) {
      try {
        await notifyCharRef.current.stopNotifications();
      } catch (e) {
        console.warn("Error stopping notifications:", e);
      }
    }

    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.gatt.disconnect();
    }

    printerRef.current = null;
    notifyCharRef.current = null;
    deviceRef.current = null;

    setIsConnected(false);
    setPrinterState(null);
    setStatusMessage("Printer disconnected");
  }, []);

  return {
    isConnected,
    isPrinting,
    printerState,
    statusMessage,
    ditherMethod,
    printIntensity,
    connectPrinter,
    printCanvas,
    getPrinterStatus,
    disconnect,
    setDitherMethod,
    setPrintIntensity,
  };
}

export default useThermalPrinter;
