// Image processing service for MXW01 thermal printer

/**
 * Convert RGBA image to grayscale
 */
export function rgbaToGray(
  rgba: Uint32Array,
  brightness: number = 128,
  alphaAsWhite: boolean = true
): Uint8ClampedArray {
  const mono = new Uint8ClampedArray(rgba.length);
  let r = 0.0,
    g = 0.0,
    b = 0.0,
    a = 0.0,
    m = 0.0,
    n = 0;

  for (let i = 0; i < mono.length; ++i) {
    n = rgba[i];
    r = n & 0xff;
    g = (n >> 8) & 0xff;
    b = (n >> 16) & 0xff;
    a = ((n >> 24) & 0xff) / 0xff;

    if (a < 1 && alphaAsWhite) {
      a = 1 - a;
      r += (0xff - r) * a;
      g += (0xff - g) * a;
      b += (0xff - b) * a;
    } else {
      r *= a;
      g *= a;
      b *= a;
    }

    // RGB to grayscale with weighting
    m = r * 0.2125 + g * 0.7154 + b * 0.0721;

    // Brightness adjustment
    m += (brightness - 0x80) * (1 - m / 0xff) * (m / 0xff) * 2;
    mono[i] = m;
  }

  return mono;
}

/**
 * Convert grayscale to RGBA
 */
export function grayToRgba(
  mono: Uint8ClampedArray,
  whiteAsTransparent: boolean = false
): Uint32Array {
  const rgba = new Uint32Array(mono.length);

  for (let i = 0; i < mono.length; ++i) {
    const base = mono[i] === 0xff && whiteAsTransparent ? 0 : 0xff000000;
    rgba[i] = base | (mono[i] << 16) | (mono[i] << 8) | mono[i];
  }

  return rgba;
}

// Dithering methods

/**
 * Simple threshold dithering
 */
export function ditherThreshold(mono: Uint8ClampedArray): Uint8ClampedArray {
  for (let i = 0; i < mono.length; ++i) {
    mono[i] = mono[i] > 0x80 ? 0xff : 0x00;
  }
  return mono;
}

/**
 * Floyd-Steinberg error diffusion dithering
 */
export function ditherSteinberg(
  mono: Uint8ClampedArray,
  w: number,
  h: number
): Uint8ClampedArray {
  let p = 0,
    m = 0,
    n = 0,
    o = 0;

  for (let j = 0; j < h; ++j) {
    for (let i = 0; i < w; ++i) {
      m = mono[p];
      n = mono[p] > 0x80 ? 0xff : 0x00;
      o = m - n;
      mono[p] = n;

      if (i >= 0 && i < w - 1 && j >= 0 && j < h) mono[p + 1] += (o * 7) / 16;
      if (i >= 1 && i < w && j >= 0 && j < h - 1)
        mono[p + w - 1] += (o * 3) / 16;
      if (i >= 0 && i < w && j >= 0 && j < h - 1) mono[p + w] += (o * 5) / 16;
      if (i >= 0 && i < w - 1 && j >= 0 && j < h - 1) {
        mono[p + w + 1] += (o * 1) / 16;
      }
      ++p;
    }
  }

  return mono;
}

/**
 * Halftone pattern dithering
 */
export function ditherHalftone(
  mono: Uint8ClampedArray,
  w: number,
  h: number
): Uint8ClampedArray {
  const spot = 4;
  const spot_h = spot / 2 + 1;
  const spot_s = spot * spot;
  let i = 0,
    j = 0,
    x = 0,
    y = 0,
    o = 0.0;

  for (j = 0; j < h - spot; j += spot) {
    for (i = 0; i < w - spot; i += spot) {
      o = 0;
      for (x = 0; x < spot; ++x) {
        for (y = 0; y < spot; ++y) {
          o += mono[(j + y) * w + i + x];
        }
      }
      o = (1 - o / spot_s / 0xff) * spot;

      for (x = 0; x < spot; ++x) {
        for (y = 0; y < spot; ++y) {
          mono[(j + y) * w + i + x] =
            Math.abs(x - spot_h) >= o || Math.abs(y - spot_h) >= o
              ? 0xff
              : 0x00;
        }
      }
    }

    for (; i < w; ++i) mono[j * w + i] = 0xff;
  }

  for (; j < h; ++j) {
    for (i = 0; i < w; ++i) mono[j * w + i] = 0xff;
  }

  return mono;
}

/**
 * Bayer matrix dithering
 */
export function ditherBayer(
  mono: Uint8ClampedArray,
  w: number,
  h: number
): Uint8ClampedArray {
  const bayer8 = [
    0, 48, 12, 60, 3, 51, 15, 63, 32, 16, 44, 28, 35, 19, 47, 31, 8, 56, 4, 52,
    11, 59, 7, 55, 40, 24, 36, 20, 43, 27, 39, 23, 2, 50, 14, 62, 1, 49, 13, 61,
    34, 18, 46, 30, 33, 17, 45, 29, 10, 58, 6, 54, 9, 57, 5, 53, 42, 26, 38, 22,
    41, 25, 37, 21,
  ];

  const ditherFactor = 0.6;
  let p = 0;

  for (let j = 0; j < h; ++j) {
    for (let i = 0; i < w; ++i) {
      const bayerValue = bayer8[(j % 8) * 8 + (i % 8)];
      let pixelValue = mono[p];
      pixelValue = pixelValue + (bayerValue - 32) * ditherFactor;
      if (pixelValue < 0) pixelValue = 0;
      if (pixelValue > 255) pixelValue = 255;
      mono[p] = pixelValue > 128 ? 0xff : 0x00;
      ++p;
    }
  }

  return mono;
}

/**
 * Atkinson dithering algorithm
 */
export function ditherAtkinson(
  mono: Uint8ClampedArray,
  w: number,
  h: number
): Uint8ClampedArray {
  let p = 0;
  let oldPixel = 0,
    newPixel = 0,
    error = 0;

  for (let j = 0; j < h; ++j) {
    for (let i = 0; i < w; ++i) {
      oldPixel = mono[p];
      newPixel = oldPixel > 0x80 ? 0xff : 0x00;
      error = (oldPixel - newPixel) >> 3; // Division by 8
      mono[p] = newPixel;

      if (i < w - 1) {
        mono[p + 1] += error;
      }
      if (i < w - 2) {
        mono[p + 2] += error;
      }
      if (j < h - 1) {
        if (i > 0) {
          mono[p + w - 1] += error;
        }
        mono[p + w] += error;
        if (i < w - 1) {
          mono[p + w + 1] += error;
        }
      }
      if (j < h - 2) {
        mono[p + 2 * w] += error;
      }

      ++p;
    }
  }

  return mono;
}

/**
 * Rotate an image
 */
export function rotate(
  before: Uint8ClampedArray,
  w: number,
  h: number,
  turn: 0 | 90 | 180 | 270
): Uint8ClampedArray {
  const after = new Uint8ClampedArray(before.length);

  switch (turn) {
    case 0:
      return before;
    case 90:
      for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
          after[j * w + i] = before[(w - i - 1) * h + j];
        }
      }
      break;
    case 180:
      for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
          after[j * w + i] = before[(h - j - 1) * w + (w - i - 1)];
        }
      }
      break;
    case 270:
      for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
          after[j * w + i] = before[i * h + (h - j - 1)];
        }
      }
      break;
  }

  return after;
}

/**
 * Flip an image
 */
export function flip(
  before: Uint8ClampedArray,
  w: number,
  h: number,
  mode: "none" | "h" | "v" | "both"
): Uint8ClampedArray {
  const after = new Uint8ClampedArray(before.length);

  switch (mode) {
    case "none":
      return before;
    case "h":
      for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
          after[j * w + i] = before[j * w + (w - i - 1)];
        }
      }
      break;
    case "v":
      for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
          after[j * w + i] = before[(h - j - 1) * w + i];
        }
      }
      break;
    case "both":
      for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
          after[j * w + i] = before[(h - j - 1) * w + (w - i - 1)];
        }
      }
      break;
  }

  return after;
}

export type DitherMethod =
  | "threshold"
  | "steinberg"
  | "bayer"
  | "atkinson"
  | "pattern";

export interface ImageProcessorOptions {
  dither: DitherMethod;
  rotate: 0 | 90 | 180 | 270;
  flip: "none" | "h" | "v" | "both";
  brightness: number;
}

/**
 * Process an image for thermal printer
 */
export function processImageForPrinter(
  imageData: ImageData,
  options: ImageProcessorOptions
): {
  processedData: Uint32Array;
  width: number;
  height: number;
  binaryRows: boolean[][];
} {
  // Convert to RGBA array
  const rgbaData = new Uint32Array(
    new Uint8ClampedArray(imageData.data).buffer
  );

  const w = imageData.width;
  const h = imageData.height;

  // Convert to grayscale
  let mono = rgbaToGray(rgbaData, options.brightness, true);

  // Apply dithering
  switch (options.dither) {
    case "steinberg":
      mono = ditherSteinberg(mono, w, h);
      break;
    case "bayer":
      mono = ditherBayer(mono, w, h);
      break;
    case "atkinson":
      mono = ditherAtkinson(mono, w, h);
      break;
    case "pattern":
      mono = ditherHalftone(mono, w, h);
      break;
    case "threshold":
    default:
      mono = ditherThreshold(mono);
      break;
  }

  // Apply flip
  mono = flip(mono, w, h, options.flip);

  // Apply rotation
  let finalWidth = w;
  let finalHeight = h;

  if (options.rotate === 0 || options.rotate === 180) {
    mono = rotate(mono, w, h, options.rotate);
  } else {
    mono = rotate(mono, h, w, options.rotate);
    finalWidth = h;
    finalHeight = w;
  }

  // Convert to RGBA for display if needed
  const processedData = grayToRgba(mono, true);

  // Create binary rows array for printing
  const binaryRows: boolean[][] = [];

  for (let y = 0; y < finalHeight; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < finalWidth; x++) {
      // true = black (print), false = white
      const idx = y * finalWidth + x;
      const lum = mono[idx];
      row.push(lum < 128);
    }
    binaryRows.push(row);
  }

  return {
    processedData,
    width: finalWidth,
    height: finalHeight,
    binaryRows,
  };
}
