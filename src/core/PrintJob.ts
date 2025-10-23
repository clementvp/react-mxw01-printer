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
    // Default processing options
    const processingOptions: ImageProcessorOptions = {
      dither: this.options.dither ?? defaultDither,
      brightness: this.options.brightness ?? 128,
      flip: this.options.flip ?? "none",
      rotate: this.options.rotate ?? 0,
    };

    // Calculate scaling based on rotation
    // For 90° and 270° rotations, height becomes width after rotation
    // So we need to scale height to PRINTER_WIDTH instead of width
    let targetWidth: number;
    let targetHeight: number;
    
    if (processingOptions.rotate === 90 || processingOptions.rotate === 270) {
      // After rotation, height becomes width, so scale height to printer width
      const scale = PRINTER_WIDTH / this.imageData.height;
      targetWidth = Math.floor(this.imageData.width * scale);
      targetHeight = PRINTER_WIDTH;
    } else {
      // For 0° and 180°, scale width to printer width
      const scale = PRINTER_WIDTH / this.imageData.width;
      targetWidth = PRINTER_WIDTH;
      targetHeight = Math.floor(this.imageData.height * scale);
    }

    // Scale image to calculated dimensions
    const scaledImage = scaleImageData(
      this.imageData,
      targetWidth,
      targetHeight
    );

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
