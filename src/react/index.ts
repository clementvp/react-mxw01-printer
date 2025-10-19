// React-specific exports
// Import from this path when using React: "react-mxw01-printer/react"

export { useThermalPrinter } from "./useThermalPrinter";
export type { ThermalPrinterHook } from "./useThermalPrinter";

// Re-export types that might be needed with the hook
export type {
  PrinterState,
  DitherMethod,
  PrintOptions,
} from "../core/types";
