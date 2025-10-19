// Main entry point for react-mxw01-printer library
// Platform-agnostic core - no React dependencies
// For React hook, import from "react-mxw01-printer/react"

// ============================================================================
// CORE (Platform-agnostic client)
// ============================================================================
export { ThermalPrinterClient } from "./core/ThermalPrinterClient";
export type {
  BluetoothAdapter,
  BluetoothDevice,
  BluetoothConnection,
  BluetoothServiceInfo,
  BluetoothCharacteristic,
  PrinterState,
  PrinterEvent,
  PrinterEventType,
  PrinterEventListener,
  PrinterImageData,
  PrintOptions,
  DitherMethod,
  ImageProcessorOptions,
} from "./core/types";

// ============================================================================
// ADAPTERS
// ============================================================================
export { WebBluetoothAdapter } from "./adapters/WebBluetoothAdapter";
export { NodeBluetoothAdapter } from "./adapters/NodeBluetoothAdapter";

// ============================================================================
// SERVICES (Existing exports - backward compatible)
// ============================================================================
export {
  MXW01Printer,
  PRINTER_WIDTH,
  PRINTER_WIDTH_BYTES,
  MIN_DATA_BYTES,
  Command,
  encode1bppRow,
  prepareImageDataBuffer,
} from "./services/printer";
export type { WriteFunction } from "./services/printer";

export { processImageForPrinter } from "./services/imageProcessor";
