// Platform-agnostic thermal printer client

import {
  MXW01Printer,
  PRINTER_WIDTH,
  prepareImageDataBuffer,
} from "../services/printer";
import { processImageForPrinter } from "../services/imageProcessor";
import type {
  BluetoothAdapter,
  BluetoothDevice,
  BluetoothConnection,
  BluetoothServiceInfo,
  PrinterState,
  PrinterEvent,
  PrinterEventType,
  PrinterEventListener,
  PrinterImageData,
  PrintOptions,
  ImageProcessorOptions,
} from "./types";

/**
 * Platform-agnostic thermal printer client
 * Works with any BluetoothAdapter implementation (Web Bluetooth, Noble, etc.)
 */
export class ThermalPrinterClient {
  private adapter: BluetoothAdapter;
  private printer: MXW01Printer | null = null;
  private connection: (BluetoothConnection & BluetoothServiceInfo) | null =
    null;
  private device: BluetoothDevice | null = null;
  private eventListeners: Map<PrinterEventType, Set<PrinterEventListener>> =
    new Map();

  // State
  private _isConnected = false;
  private _isPrinting = false;
  private _printerState: PrinterState | null = null;
  private _statusMessage = "Ready to connect printer";
  private _ditherMethod: ImageProcessorOptions["dither"] = "steinberg";
  private _printIntensity = 0x5d;

  constructor(adapter: BluetoothAdapter) {
    if (!adapter.isAvailable()) {
      throw new Error("Bluetooth is not available in this environment");
    }
    this.adapter = adapter;
  }

  // Getters
  get isConnected(): boolean {
    return this._isConnected;
  }

  get isPrinting(): boolean {
    return this._isPrinting;
  }

  get printerState(): PrinterState | null {
    return this._printerState;
  }

  get statusMessage(): string {
    return this._statusMessage;
  }

  get ditherMethod(): ImageProcessorOptions["dither"] {
    return this._ditherMethod;
  }

  get printIntensity(): number {
    return this._printIntensity;
  }

  // Setters
  setDitherMethod(method: ImageProcessorOptions["dither"]): void {
    this._ditherMethod = method;
  }

  setPrintIntensity(intensity: number): void {
    if (intensity < 0 || intensity > 255) {
      throw new Error("Print intensity must be between 0 and 255");
    }
    this._printIntensity = intensity;
  }

  /**
   * Event emitter
   */
  private emit(event: PrinterEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          (listener as any)(event);
        } catch (error) {
          console.error("Error in event listener:", error);
        }
      });
    }
  }

  /**
   * Subscribe to events
   */
  on<T extends PrinterEventType>(
    eventType: T,
    listener: PrinterEventListener<T>
  ): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(listener as any);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(eventType);
      if (listeners) {
        listeners.delete(listener as any);
      }
    };
  }

  /**
   * Update status message and emit stateChange if printer state changed
   */
  private updateStatus(message: string, newPrinterState?: PrinterState): void {
    this._statusMessage = message;

    if (newPrinterState) {
      this._printerState = newPrinterState;
      this.emit({ type: "stateChange", state: newPrinterState });
    }
  }

  /**
   * Connect to printer via Bluetooth
   */
  async connect(): Promise<void> {
    try {
      this.updateStatus("Connecting to printer...");

      // Request device
      this.device = await this.adapter.requestDevice();

      // Connect and get characteristics
      this.connection = await this.adapter.connect(this.device);

      // Initialize printer
      this.printer = new MXW01Printer(
        this.connection.controlCharacteristic.writeValueWithoutResponse.bind(
          this.connection.controlCharacteristic
        ),
        this.connection.dataCharacteristic.writeValueWithoutResponse.bind(
          this.connection.dataCharacteristic
        )
      );

      // Setup notifications
      const notifier = (event: any) => {
        const characteristic = event.target;
        const value = characteristic.value;
        if (value && this.printer) {
          this.printer.notify(new Uint8Array(value.buffer));
          this.updateStatus("Printer state updated", { ...this.printer.state });
        }
      };

      await this.connection.notifyCharacteristic.startNotifications();
      this.connection.notifyCharacteristic.addEventListener(
        "characteristicvaluechanged",
        notifier
      );

      this._isConnected = true;
      this.updateStatus("Printer connected");
      this.emit({ type: "connected", device: this.device });

      // Initial status request
      await this.getStatus();
    } catch (error) {
      const err = error as Error;
      this.updateStatus(`Error: ${err.message}`);
      this.emit({ type: "error", error: err });
      throw error;
    }
  }

  /**
   * Get current printer status
   */
  async getStatus(): Promise<PrinterState | null> {
    if (!this.printer || !this._isConnected) {
      this.updateStatus("Printer not connected");
      return null;
    }

    try {
      await this.printer.requestStatus();
      const newState = { ...this.printer.state };
      this.updateStatus("Status updated", newState);
      return newState;
    } catch (error) {
      const err = error as Error;
      this.updateStatus(`Error: ${err.message}`);
      this.emit({ type: "error", error: err });
      return null;
    }
  }

  /**
   * Print from image data
   * Works with Canvas ImageData or any compatible ImageData structure
   */
  async print(
    imageData: PrinterImageData,
    options: PrintOptions = {}
  ): Promise<void> {
    if (!this.printer || !this._isConnected) {
      throw new Error("Printer not connected");
    }

    try {
      this._isPrinting = true;
      this.updateStatus("Preparing to print...");

      // Default image processing options
      const defaultOptions: ImageProcessorOptions = {
        dither: this._ditherMethod,
        brightness: 128,
        flip: "none",
        rotate: 180, // Required rotation for MXW01 printer
        ...options,
      };

      // Calculate scaling to fit printer width
      const scale = PRINTER_WIDTH / imageData.width;
      const scaledHeight = Math.floor(imageData.height * scale);

      // Create scaled image data
      const scaledImageData = this.scaleImageData(
        imageData,
        PRINTER_WIDTH,
        scaledHeight
      );

      // Process image for printing
      this.updateStatus("Processing image...");
      const { binaryRows } = processImageForPrinter(
        scaledImageData as any,
        defaultOptions
      );

      // Prepare print buffer
      const imageBuffer = prepareImageDataBuffer(binaryRows);

      // Configure print intensity
      const intensity = options.intensity ?? this._printIntensity;
      this.updateStatus("Configuring printer...");
      await this.printer.setIntensity(intensity);

      // Check printer status
      const status = await this.printer.requestStatus();
      if (status.length >= 13 && status[12] !== 0) {
        throw new Error(`Printer error: ${status[13]}`);
      }

      // Send print request
      this.updateStatus("Sending data...");
      const ack = await this.printer.printRequest(binaryRows.length, 0);
      if (!ack || ack[0] !== 0) {
        throw new Error("Print request rejected");
      }

      // Send image data
      await this.printer.sendDataChunks(imageBuffer);
      await this.printer.flushData();

      // Wait for print completion
      this.updateStatus("Printing...");
      await this.printer.waitForPrintComplete();

      this.updateStatus("Print completed");
      await this.getStatus();
    } catch (error) {
      const err = error as Error;
      this.updateStatus(`Error: ${err.message}`);
      this.emit({ type: "error", error: err });
      throw error;
    } finally {
      this._isPrinting = false;
    }
  }

  /**
   * Scale image data to target dimensions
   * Simple nearest-neighbor scaling
   */
  private scaleImageData(
    source: PrinterImageData,
    targetWidth: number,
    targetHeight: number
  ): PrinterImageData {
    const scaled = new Uint8ClampedArray(targetWidth * targetHeight * 4);
    const xRatio = source.width / targetWidth;
    const yRatio = source.height / targetHeight;

    for (let y = 0; y < targetHeight; y++) {
      for (let x = 0; x < targetWidth; x++) {
        const srcX = Math.floor(x * xRatio);
        const srcY = Math.floor(y * yRatio);
        const srcIdx = (srcY * source.width + srcX) * 4;
        const dstIdx = (y * targetWidth + x) * 4;

        scaled[dstIdx] = source.data[srcIdx];
        scaled[dstIdx + 1] = source.data[srcIdx + 1];
        scaled[dstIdx + 2] = source.data[srcIdx + 2];
        scaled[dstIdx + 3] = source.data[srcIdx + 3];
      }
    }

    return {
      data: scaled,
      width: targetWidth,
      height: targetHeight,
    };
  }

  /**
   * Disconnect from printer
   */
  async disconnect(): Promise<void> {
    if (this.connection?.notifyCharacteristic) {
      try {
        await this.connection.notifyCharacteristic.stopNotifications();
      } catch (error) {
        console.warn("Error stopping notifications:", error);
      }
    }

    if (this.connection) {
      try {
        await this.connection.disconnect();
      } catch (error) {
        console.warn("Error disconnecting:", error);
      }
    }

    this.printer = null;
    this.connection = null;
    this.device = null;
    this._isConnected = false;
    this._printerState = null;
    this.updateStatus("Printer disconnected");
    this.emit({ type: "disconnected" });
  }

  /**
   * Dispose of the client and clean up resources
   */
  dispose(): void {
    this.disconnect();
    this.eventListeners.clear();
  }
}
