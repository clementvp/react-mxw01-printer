// Main entry point for react-mxw01-printer library

// Export hook
export { useThermalPrinter } from "./hooks/useThermalPrinter";
export type { ThermalPrinterHook } from "./hooks/useThermalPrinter";

// Export printer service
export {
  MXW01Printer,
  PRINTER_WIDTH,
  PRINTER_WIDTH_BYTES,
  MIN_DATA_BYTES,
  Command,
  encode1bppRow,
  prepareImageDataBuffer,
} from "./services/printer";
export type { PrinterState, WriteFunction } from "./services/printer";

// Export image processor
export { processImageForPrinter } from "./services/imageProcessor";
export type {
  DitherMethod,
  ImageProcessorOptions,
} from "./services/imageProcessor";
