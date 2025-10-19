// Print job encapsulation for ThermalPrinterClient

import { PRINTER_WIDTH, prepareImageDataBuffer } from "../services/printer";
import { processImageForPrinter } from "../services/imageProcessor";
import { scaleImageData } from "../services/imageTransforms";
import type { PrinterImageData, PrintOptions } from "./types";
import type { ImageProcessorOptions } from "../services/imageProcessor";

/**
 * Encapsulates a print job with image processing and preparation
 */
export class PrintJob {
  private imageData: PrinterImageData;
  private options: PrintOptions;

  constructor(imageData: PrinterImageData, options: PrintOptions = {}) {
    this.imageData = imageData;
    this.options = options;
  }

  /**
   * Process and prepare image for printing
   * @param defaultDither Default dithering method
   * @returns Prepared image buffer and metadata
   */
  prepare(defaultDither: ImageProcessorOptions["dither"]): {
    imageBuffer: Uint8Array;
    numLines: number;
  } {
    // Calculate scaling to fit printer width
    const scale = PRINTER_WIDTH / this.imageData.width;
    const scaledHeight = Math.floor(this.imageData.height * scale);

    // Scale image to printer width
    const scaledImage = scaleImageData(
      this.imageData,
      PRINTER_WIDTH,
      scaledHeight
    );

    // Default processing options
    const processingOptions: ImageProcessorOptions = {
      dither: this.options.dither ?? defaultDither,
      brightness: this.options.brightness ?? 128,
      flip: "none",
      rotate: 180, // Required rotation for MXW01 printer
    };

    // Process image for printing
    const { binaryRows } = processImageForPrinter(
      scaledImage as any,
      processingOptions
    );

    // Prepare print buffer
    const imageBuffer = prepareImageDataBuffer(binaryRows);

    return {
      imageBuffer,
      numLines: binaryRows.length,
    };
  }

  /**
   * Get print intensity from options or default
   * @param defaultIntensity Default intensity value
   * @returns Print intensity
   */
  getIntensity(defaultIntensity: number): number {
    return this.options.intensity ?? defaultIntensity;
  }
}
