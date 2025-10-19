// Image transformation utilities (rotate, flip, scale)

/**
 * Rotate an image by 0, 90, 180, or 270 degrees
 */
export function rotate(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  angle: 0 | 90 | 180 | 270
): Uint8ClampedArray {
  if (angle === 0) {
    return data;
  }

  const result = new Uint8ClampedArray(data.length);

  switch (angle) {
    case 90:
      for (let j = 0; j < height; j++) {
        for (let i = 0; i < width; i++) {
          result[j * width + i] = data[(width - i - 1) * height + j];
        }
      }
      break;
    case 180:
      for (let j = 0; j < height; j++) {
        for (let i = 0; i < width; i++) {
          result[j * width + i] = data[(height - j - 1) * width + (width - i - 1)];
        }
      }
      break;
    case 270:
      for (let j = 0; j < height; j++) {
        for (let i = 0; i < width; i++) {
          result[j * width + i] = data[i * height + (height - j - 1)];
        }
      }
      break;
  }

  return result;
}

/**
 * Flip an image horizontally, vertically, or both
 */
export function flip(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  mode: "none" | "h" | "v" | "both"
): Uint8ClampedArray {
  if (mode === "none") {
    return data;
  }

  const result = new Uint8ClampedArray(data.length);

  switch (mode) {
    case "h":
      for (let j = 0; j < height; j++) {
        for (let i = 0; i < width; i++) {
          result[j * width + i] = data[j * width + (width - i - 1)];
        }
      }
      break;
    case "v":
      for (let j = 0; j < height; j++) {
        for (let i = 0; i < width; i++) {
          result[j * width + i] = data[(height - j - 1) * width + i];
        }
      }
      break;
    case "both":
      for (let j = 0; j < height; j++) {
        for (let i = 0; i < width; i++) {
          result[j * width + i] = data[(height - j - 1) * width + (width - i - 1)];
        }
      }
      break;
  }

  return result;
}

/**
 * Convert RGBA to grayscale with brightness adjustment
 */
export function rgbaToGray(
  rgba: Uint32Array,
  brightness = 128,
  alphaAsWhite = true
): Uint8ClampedArray {
  const mono = new Uint8ClampedArray(rgba.length);

  for (let i = 0; i < mono.length; ++i) {
    const n = rgba[i];
    let r = n & 0xff;
    let g = (n >> 8) & 0xff;
    let b = (n >> 16) & 0xff;
    const alpha = ((n >> 24) & 0xff) / 0xff;

    // Handle transparency
    if (alpha < 1 && alphaAsWhite) {
      const a = 1 - alpha;
      r += (0xff - r) * a;
      g += (0xff - g) * a;
      b += (0xff - b) * a;
    } else {
      r *= alpha;
      g *= alpha;
      b *= alpha;
    }

    // RGB to grayscale with weighting
    let gray = r * 0.2125 + g * 0.7154 + b * 0.0721;

    // Brightness adjustment
    gray += (brightness - 0x80) * (1 - gray / 0xff) * (gray / 0xff) * 2;
    mono[i] = gray;
  }

  return mono;
}

/**
 * Convert grayscale to RGBA
 */
export function grayToRgba(
  mono: Uint8ClampedArray,
  whiteAsTransparent = false
): Uint32Array {
  const rgba = new Uint32Array(mono.length);

  for (let i = 0; i < mono.length; ++i) {
    const base = mono[i] === 0xff && whiteAsTransparent ? 0 : 0xff000000;
    rgba[i] = base | (mono[i] << 16) | (mono[i] << 8) | mono[i];
  }

  return rgba;
}

/**
 * Scale image data to target dimensions using nearest-neighbor interpolation
 */
export function scaleImageData(
  source: { data: Uint8ClampedArray; width: number; height: number },
  targetWidth: number,
  targetHeight: number
): { data: Uint8ClampedArray; width: number; height: number } {
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
