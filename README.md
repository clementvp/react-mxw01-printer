# react-mxw01-printer

React hooks and utilities for MXW01 thermal printer via Web Bluetooth API.

## Features

- 🔌 Easy Bluetooth connection management
- 🎨 Canvas-agnostic (works with native HTML Canvas, Fabric.js, or any canvas library)
- 🖨️ Multiple dithering algorithms (Floyd-Steinberg, Bayer, Atkinson, etc.)
- ⚡ Real-time printer status monitoring
- 📦 TypeScript support with full type definitions
- 🎯 Simple and intuitive React hooks API
- 🍎 Automatic macOS compatibility (supports both standard and alternate Bluetooth UUIDs)

## Installation

```bash
npm install react-mxw01-printer
```

## Requirements

- React 18+ or React 19+
- A browser that supports Web Bluetooth API (Chrome, Edge, Opera)
- MXW01 thermal printer

## Quick Start

```tsx
import React, { useRef, useEffect } from "react";
import { useThermalPrinter } from "react-mxw01-printer";

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    isConnected,
    isPrinting,
    statusMessage,
    connectPrinter,
    printCanvas,
    disconnect,
  } = useThermalPrinter();

  useEffect(() => {
    // Draw something on canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "black";
        ctx.font = "30px Arial";
        ctx.fillText("Hello, Printer!", 50, 100);
      }
    }
  }, []);

  const handlePrint = async () => {
    if (canvasRef.current) {
      await printCanvas(canvasRef.current);
    }
  };

  return (
    <div>
      <h1>MXW01 Printer Demo</h1>

      <canvas
        ref={canvasRef}
        width={384}
        height={500}
        style={{ border: "1px solid black" }}
      />

      <div>
        <button onClick={connectPrinter} disabled={isConnected}>
          Connect Printer
        </button>
        <button onClick={handlePrint} disabled={!isConnected || isPrinting}>
          Print
        </button>
        <button onClick={disconnect} disabled={!isConnected}>
          Disconnect
        </button>
      </div>

      <p>Status: {statusMessage}</p>
    </div>
  );
}

export default App;
```

## API Reference

### `useThermalPrinter()`

Main hook for printer operations.

**Returns:**

```typescript
interface ThermalPrinterHook {
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
```

### Print Options

```typescript
interface ImageProcessorOptions {
  dither: DitherMethod; // Dithering algorithm
  rotate: 0 | 90 | 180 | 270; // Rotation angle
  flip: "none" | "h" | "v" | "both"; // Flip direction
  brightness: number; // Brightness adjustment (0-255)
}
```

### Dithering Methods

- `"threshold"` - Simple threshold (fast)
- `"steinberg"` - Floyd-Steinberg error diffusion (default, best quality)
- `"bayer"` - Bayer matrix ordered dithering
- `"atkinson"` - Atkinson dithering
- `"pattern"` - Halftone pattern

### Printer State

```typescript
interface PrinterState {
  printing: boolean; // Currently printing
  paper_jam: boolean; // Paper jam detected
  out_of_paper: boolean; // Out of paper
  cover_open: boolean; // Cover is open
  battery_low: boolean; // Low battery
  overheat: boolean; // Overheating
}
```

## Usage Examples

### With Native HTML Canvas

```tsx
import { useThermalPrinter } from "react-mxw01-printer";

function CanvasExample() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { connectPrinter, printCanvas } = useThermalPrinter();

  const drawOnCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw shapes
    ctx.fillStyle = "black";
    ctx.fillRect(50, 50, 100, 100);
    ctx.beginPath();
    ctx.arc(200, 100, 50, 0, Math.PI * 2);
    ctx.fill();

    // Draw text
    ctx.font = "24px Arial";
    ctx.fillText("Native Canvas", 50, 200);
  };

  const handlePrint = async () => {
    if (canvasRef.current) {
      await printCanvas(canvasRef.current, {
        dither: "steinberg",
        brightness: 128,
      });
    }
  };

  return (
    <div>
      <canvas ref={canvasRef} width={384} height={500} />
      <button onClick={drawOnCanvas}>Draw</button>
      <button onClick={connectPrinter}>Connect</button>
      <button onClick={handlePrint}>Print</button>
    </div>
  );
}
```

### With Fabric.js

```tsx
import { useRef, useEffect } from "react";
import { Canvas, Rect, Circle, Text } from "fabric";
import { useThermalPrinter } from "react-mxw01-printer";

function FabricExample() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const { connectPrinter, printCanvas } = useThermalPrinter();

  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      // Initialize Fabric.js canvas
      const fabricCanvas = new Canvas(canvasRef.current, {
        width: 384,
        height: 500,
        backgroundColor: "white",
      });

      // Add some shapes
      fabricCanvas.add(
        new Rect({
          left: 50,
          top: 50,
          width: 100,
          height: 100,
          fill: "black",
        })
      );

      fabricCanvas.add(
        new Circle({
          left: 200,
          top: 50,
          radius: 50,
          fill: "black",
        })
      );

      fabricCanvas.add(
        new Text("Fabric.js Canvas", {
          left: 50,
          top: 200,
          fontSize: 24,
          fill: "black",
        })
      );

      fabricCanvasRef.current = fabricCanvas;
    }

    return () => {
      fabricCanvasRef.current?.dispose();
    };
  }, []);

  const handlePrint = async () => {
    if (canvasRef.current) {
      // Print the underlying HTML canvas element
      await printCanvas(canvasRef.current, {
        dither: "bayer",
        brightness: 140,
      });
    }
  };

  return (
    <div>
      <canvas ref={canvasRef} />
      <button onClick={connectPrinter}>Connect Printer</button>
      <button onClick={handlePrint}>Print</button>
    </div>
  );
}
```

### Custom Print Options

```tsx
const { printCanvas, setDitherMethod, setPrintIntensity } = useThermalPrinter();

// Set dithering method
setDitherMethod("atkinson");

// Set print intensity (0x00 to 0xFF, default 0x5D)
setPrintIntensity(0x70);

// Print with custom options
await printCanvas(canvasElement, {
  dither: "steinberg",
  brightness: 150,
  rotate: 180,
  flip: "none",
});
```

### Monitoring Printer Status

```tsx
const { printerState, getPrinterStatus } = useThermalPrinter();

// Check printer status
await getPrinterStatus();

// Display status
if (printerState) {
  console.log("Printing:", printerState.printing);
  console.log("Paper jam:", printerState.paper_jam);
  console.log("Out of paper:", printerState.out_of_paper);
  console.log("Cover open:", printerState.cover_open);
  console.log("Battery low:", printerState.battery_low);
  console.log("Overheating:", printerState.overheat);
}
```

## Advanced Usage

### Direct Printer Control

For advanced use cases, you can use the lower-level printer service:

```tsx
import { MXW01Printer, prepareImageDataBuffer } from "react-mxw01-printer";

// You'll need to handle Bluetooth connection yourself
const controlWrite = (data: BufferSource) =>
  characteristic.writeValueWithoutResponse(data);
const dataWrite = (data: BufferSource) =>
  dataCharacteristic.writeValueWithoutResponse(data);

const printer = new MXW01Printer(controlWrite, dataWrite);

// Set intensity
await printer.setIntensity(0x5d);

// Request status
const status = await printer.requestStatus();

// Print with custom data
await printer.printRequest(lines, mode);
await printer.sendDataChunks(imageBuffer);
await printer.flushData();
await printer.waitForPrintComplete();
```

### Image Processing

```tsx
import { processImageForPrinter } from "react-mxw01-printer";

// Get image data from canvas
const ctx = canvas.getContext("2d");
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

// Process for printing
const { binaryRows, width, height } = processImageForPrinter(imageData, {
  dither: "steinberg",
  brightness: 128,
  flip: "none",
  rotate: 180,
});

// binaryRows is a 2D array of booleans ready for printing
```

## Technical Details

- **Printer Width**: 384 pixels (48 bytes per line)
- **Web Bluetooth Service UUID**:
  - Standard: `0000ae30-0000-1000-8000-00805f9b34fb`
  - macOS alternate: `0000af30-0000-1000-8000-00805f9b34fb` (automatically detected)
- **Supported Image Formats**: Any canvas content (automatically converted)
- **Dithering**: Multiple algorithms for optimal print quality
- **Platform Support**: Windows, Linux, Android, macOS (via Chrome/Edge/Opera)

## Browser Compatibility

Web Bluetooth API is supported in:

- Chrome 56+ (Desktop & Android)
- Edge 79+
- Opera 43+

**Not supported in**: Firefox, Safari, iOS browsers

## Troubleshooting

### Connection Issues

- Ensure Web Bluetooth is enabled in your browser
- Check that the printer is powered on and in range
- Try restarting the printer if connection fails

### Print Quality

- Try different dithering methods for better results
- Adjust brightness if the print is too light or dark
- Ensure your canvas has good contrast

### TypeScript Errors

- Make sure you have `"lib": ["WebBluetooth"]` in your tsconfig.json
- Install `@types/web-bluetooth` if needed: `npm install -D @types/web-bluetooth`

## Credits

This project is inspired by [catprinter](https://github.com/dropalltables/catprinter) by dropalltables.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.