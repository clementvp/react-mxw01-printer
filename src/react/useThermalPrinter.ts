// React hook for thermal printer - wrapper around ThermalPrinterClient

import { useState, useEffect, useRef, useCallback } from "react";
import { ThermalPrinterClient } from "../core/ThermalPrinterClient";
import { WebBluetoothAdapter } from "../adapters/WebBluetoothAdapter";
import type { PrinterState, DitherMethod } from "../core/types";

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
    options?: Partial<{
      dither: DitherMethod;
      brightness: number;
      intensity: number;
    }>
  ) => Promise<void>;
  getPrinterStatus: () => Promise<PrinterState | null>;
  disconnect: () => Promise<void>;
  setDitherMethod: (method: DitherMethod) => void;
  setPrintIntensity: (intensity: number) => void;
}

/**
 * React hook for thermal printer
 * Provides a React-friendly interface to the ThermalPrinterClient
 */
export function useThermalPrinter(): ThermalPrinterHook {
  const clientRef = useRef<ThermalPrinterClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printerState, setPrinterState] = useState<PrinterState | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    "Ready to connect printer"
  );
  const [ditherMethod, setDitherMethod] = useState<DitherMethod>("steinberg");
  const [printIntensity, setPrintIntensity] = useState(0x5d);

  // Initialize client on mount
  useEffect(() => {
    try {
      const adapter = new WebBluetoothAdapter();
      clientRef.current = new ThermalPrinterClient(adapter);

      // Subscribe to client events
      const unsubscribeConnected = clientRef.current.on("connected", () => {
        setIsConnected(true);
      });

      const unsubscribeDisconnected = clientRef.current.on(
        "disconnected",
        () => {
          setIsConnected(false);
          setPrinterState(null);
        }
      );

      const unsubscribeStateChange = clientRef.current.on(
        "stateChange",
        (event) => {
          setPrinterState(event.state);
        }
      );

      const unsubscribeError = clientRef.current.on("error", (event) => {
        console.error("Printer error:", event.error);
      });

      // Cleanup on unmount
      return () => {
        unsubscribeConnected();
        unsubscribeDisconnected();
        unsubscribeStateChange();
        unsubscribeError();
        clientRef.current?.dispose();
      };
    } catch (error) {
      console.error("Failed to initialize printer client:", error);
      setStatusMessage(`Initialization error: ${(error as Error).message}`);
    }
  }, []);

  // Sync state from client
  useEffect(() => {
    if (clientRef.current) {
      setIsConnected(clientRef.current.isConnected);
      setIsPrinting(clientRef.current.isPrinting);
      setPrinterState(clientRef.current.printerState);
      setStatusMessage(clientRef.current.statusMessage);
    }
  }, []);

  // Update status message from client periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (clientRef.current) {
        setStatusMessage(clientRef.current.statusMessage);
        setIsPrinting(clientRef.current.isPrinting);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const connectPrinter = useCallback(async () => {
    if (!clientRef.current) {
      throw new Error("Printer client not initialized");
    }

    try {
      await clientRef.current.connect();
      setIsConnected(true);
      setStatusMessage(clientRef.current.statusMessage);
    } catch (error) {
      setStatusMessage(`Connection error: ${(error as Error).message}`);
      throw error;
    }
  }, []);

  const getPrinterStatus = useCallback(async () => {
    if (!clientRef.current) {
      return null;
    }

    const state = await clientRef.current.getStatus();
    if (state) {
      setPrinterState(state);
    }
    setStatusMessage(clientRef.current.statusMessage);
    return state;
  }, []);

  const printCanvas = useCallback(
    async (
      canvas: HTMLCanvasElement,
      options: Partial<{
        dither: DitherMethod;
        brightness: number;
        intensity: number;
      }> = {}
    ) => {
      if (!clientRef.current) {
        throw new Error("Printer client not initialized");
      }

      try {
        setIsPrinting(true);

        // Get canvas image data
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Failed to get canvas context");
        }

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Print using client
        await clientRef.current.print(imageData, options);

        setStatusMessage(clientRef.current.statusMessage);
      } catch (error) {
        setStatusMessage(`Print error: ${(error as Error).message}`);
        throw error;
      } finally {
        setIsPrinting(false);
      }
    },
    []
  );

  const disconnect = useCallback(async () => {
    if (!clientRef.current) {
      return;
    }

    await clientRef.current.disconnect();
    setIsConnected(false);
    setPrinterState(null);
    setStatusMessage(clientRef.current.statusMessage);
  }, []);

  const handleSetDitherMethod = useCallback((method: DitherMethod) => {
    setDitherMethod(method);
    clientRef.current?.setDitherMethod(method);
  }, []);

  const handleSetPrintIntensity = useCallback((intensity: number) => {
    setPrintIntensity(intensity);
    clientRef.current?.setPrintIntensity(intensity);
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
    setDitherMethod: handleSetDitherMethod,
    setPrintIntensity: handleSetPrintIntensity,
  };
}

export default useThermalPrinter;
