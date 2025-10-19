# react-mxw01-printer

Platform-agnostic library for MXW01 thermal printer with React hooks and Node.js support.

## Features

- 🎯 **Platform-agnostic core** - Works in browsers, Node.js, Bun, and more
- ⚛️ **React hooks** - Easy integration with React applications
- 🔌 **Bluetooth adapters** - Web Bluetooth for browsers, extensible for Node.js
- 🖨️ **Image processing** - Multiple dithering algorithms (Floyd-Steinberg, Bayer, Atkinson, etc.)
- 📦 **TypeScript** - Full type safety
- 🔄 **Event-driven** - Subscribe to printer events
- ✅ **Backward compatible** - Existing code continues to work

## Installation

Choose the installation method based on your use case:

### 📱 For React Applications

Install the library with React:

```bash
npm install react-mxw01-printer react
```

**What you need:**
- `react-mxw01-printer` - The library
- `react` (18.0.0+) - Required for the React hook

Then import:
```typescript
import { useThermalPrinter } from "react-mxw01-printer/react";
```

---

### 🖥️ For Node.js / Bun (Server-Side)

Install the library with Bluetooth support:

```bash
npm install react-mxw01-printer @stoprocent/noble canvas
```

Or with Bun:
```bash
bun add react-mxw01-printer @stoprocent/noble canvas
```

**What you need:**
- `react-mxw01-printer` - The library
- `@stoprocent/noble` - Bluetooth access for Node.js/Bun
- `canvas` - Image generation (for creating printable content)

Then import:
```typescript
import { ThermalPrinterClient, NodeBluetoothAdapter } from "react-mxw01-printer";
```

---

### 🌐 For Browser (Without React)

If you want to use the core library in the browser without React:

```bash
npm install react-mxw01-printer
```

Then import:
```typescript
import { ThermalPrinterClient, WebBluetoothAdapter } from "react-mxw01-printer";
```

### ⚠️ Breaking Change in v0.3.0

**React imports have changed!** The React hook is now available via a separate export path to allow Node.js/Bun users to use the library without installing React.

**Old (v0.2.x):**
```typescript
import { useThermalPrinter } from "react-mxw01-printer";
```

**New (v0.3.0+):**
```typescript
import { useThermalPrinter } from "react-mxw01-printer/react";
```

This change allows the core library to work in Node.js, Bun, and other environments without requiring React as a dependency.

---

## 🚀 Quick Start

### React - Simple Example

The easiest way to get started with React:

```tsx
import { useThermalPrinter } from "react-mxw01-printer/react";
import { useRef, useEffect } from "react";

function PrinterApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    isConnected,
    isPrinting,
    statusMessage,
    connectPrinter,
    printCanvas,
    disconnect,
  } = useThermalPrinter();

  // Draw content on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // White background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Black text
    ctx.fillStyle = "black";
    ctx.font = "30px Arial";
    ctx.fillText("Hello from React!", 20, 100);
    
    // Draw a rectangle
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 364, 180);
  }, []);

  const handlePrint = async () => {
    if (!canvasRef.current) return;
    await printCanvas(canvasRef.current, {
      dither: "steinberg",
      brightness: 128,
      intensity: 93,
    });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Thermal Printer Demo</h2>
      
      {/* Canvas Preview */}
      <canvas 
        ref={canvasRef} 
        width={384} 
        height={200} 
        style={{ 
          border: "1px solid #ccc",
          display: "block",
          marginBottom: "20px"
        }} 
      />
      
      {/* Controls */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <button onClick={connectPrinter} disabled={isConnected}>
          Connect Printer
        </button>
        <button onClick={handlePrint} disabled={!isConnected || isPrinting}>
          {isPrinting ? "Printing..." : "Print"}
        </button>
        <button onClick={disconnect} disabled={!isConnected}>
          Disconnect
        </button>
      </div>
      
      {/* Status */}
      <p style={{ color: isConnected ? "green" : "gray" }}>
        {statusMessage}
      </p>
    </div>
  );
}

export default PrinterApp;
```

### React - Interactive Example with Fabric.js

For more advanced drawing capabilities:

```bash
npm install react-mxw01-printer fabric
```

```tsx
import { useThermalPrinter } from "react-mxw01-printer/react";
import { useRef, useEffect, useState } from "react";
import { Canvas as FabricCanvas } from "fabric";

function FabricPrinterApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const [fabricReady, setFabricReady] = useState(false);
  
  const {
    isConnected,
    isPrinting,
    statusMessage,
    connectPrinter,
    printCanvas,
    disconnect,
  } = useThermalPrinter();

  // Initialize Fabric canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new FabricCanvas(canvasRef.current, {
      width: 384,
      height: 400,
      backgroundColor: "white",
    });

    fabricCanvasRef.current = fabricCanvas;
    setFabricReady(true);

    // Cleanup
    return () => {
      fabricCanvas.dispose();
    };
  }, []);

  const addText = () => {
    if (!fabricCanvasRef.current) return;
    
    const text = new fabric.Text("Hello!", {
      left: 50,
      top: 50,
      fontSize: 30,
      fill: "black",
    });
    
    fabricCanvasRef.current.add(text);
  };

  const addRectangle = () => {
    if (!fabricCanvasRef.current) return;
    
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 150,
      height: 100,
      fill: "transparent",
      stroke: "black",
      strokeWidth: 2,
    });
    
    fabricCanvasRef.current.add(rect);
  };

  const addCircle = () => {
    if (!fabricCanvasRef.current) return;
    
    const circle = new fabric.Circle({
      left: 150,
      top: 150,
      radius: 50,
      fill: "transparent",
      stroke: "black",
      strokeWidth: 2,
    });
    
    fabricCanvasRef.current.add(circle);
  };

  const clearCanvas = () => {
    if (!fabricCanvasRef.current) return;
    fabricCanvasRef.current.clear();
    fabricCanvasRef.current.backgroundColor = "white";
    fabricCanvasRef.current.renderAll();
  };

  const handlePrint = async () => {
    if (!canvasRef.current) return;
    
    await printCanvas(canvasRef.current, {
      dither: "steinberg",
      brightness: 128,
      intensity: 93,
    });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Fabric.js Interactive Printer</h2>
      
      {/* Canvas */}
      <canvas 
        ref={canvasRef}
        style={{ 
          border: "1px solid #ccc",
          display: "block",
          marginBottom: "20px"
        }} 
      />
      
      {/* Drawing Tools */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <button onClick={addText} disabled={!fabricReady}>
          Add Text
        </button>
        <button onClick={addRectangle} disabled={!fabricReady}>
          Add Rectangle
        </button>
        <button onClick={addCircle} disabled={!fabricReady}>
          Add Circle
        </button>
        <button onClick={clearCanvas} disabled={!fabricReady}>
          Clear
        </button>
      </div>
      
      {/* Printer Controls */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <button onClick={connectPrinter} disabled={isConnected}>
          Connect Printer
        </button>
        <button onClick={handlePrint} disabled={!isConnected || isPrinting}>
          {isPrinting ? "Printing..." : "Print"}
        </button>
        <button onClick={disconnect} disabled={!isConnected}>
          Disconnect
        </button>
      </div>
      
      {/* Status */}
      <p style={{ color: isConnected ? "green" : "gray" }}>
        {statusMessage}
      </p>
    </div>
  );
}

export default FabricPrinterApp;
```

---

## 📖 Usage Guides

### 🌐 Browser Usage

#### React Hook

The `useThermalPrinter` hook provides a simple interface for React applications. See the [Quick Start](#-quick-start) section for complete examples.

**Hook API:**

```typescript
const {
  isConnected,      // Connection status
  isPrinting,       // Printing status
  statusMessage,    // Current status message
  connectPrinter,   // Connect to printer
  printCanvas,      // Print canvas content
  disconnect,       // Disconnect printer
  getPrinterStatus, // Get detailed status
  setDitherMethod,  // Set dithering algorithm
  setPrintIntensity // Set print intensity
} = useThermalPrinter();
```

#### Core Client (Advanced)

For more control or not React usage, use the platform-agnostic client directly:
Work only for web. For node/bun see [🖥️ Node.js / Bun / Server-Side](#-nodejs--bun--server-side).
```typescript
import { ThermalPrinterClient, WebBluetoothAdapter } from "react-mxw01-printer";

// Create adapter and client
const adapter = new WebBluetoothAdapter();
const printer = new ThermalPrinterClient(adapter);

// Subscribe to events
printer.on("connected", (event) => {
  console.log("Connected to:", event.device.name);
});

printer.on("stateChange", (event) => {
  console.log("Printer state:", event.state);
});

printer.on("error", (event) => {
  console.error("Error:", event.error);
});

// Connect
await printer.connect();

// Get image data from canvas
const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

// Print
await printer.print(imageData, {
  dither: "steinberg",
  brightness: 128,
  intensity: 93,
});

// Disconnect
await printer.disconnect();
```

### 🖥️ Node.js / Bun / Server-Side

#### Basic Usage

Note: you can replace the canvas lib by any libraries you like, like fabric js.

```typescript
import {
  ThermalPrinterClient,
  NodeBluetoothAdapter,
} from "react-mxw01-printer";
import { createCanvas } from "canvas";

async function printInNodeJS() {
  // Create adapter and printer client
  const adapter = new NodeBluetoothAdapter();
  const printer = new ThermalPrinterClient(adapter);

  // Subscribe to events
  printer.on("connected", (event) => {
    console.log("Connected to:", event.device.name);
  });

  printer.on("error", (event) => {
    console.error("Printer error:", event.error);
  });

  // Connect to printer
  console.log("Scanning for printer...");
  await printer.connect();

  // Create image to print
  const canvas = createCanvas(384, 200);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, 384, 200);
  ctx.fillStyle = "black";
  ctx.font = "30px Arial";
  ctx.fillText("Hello from Node.js!", 20, 100);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Print
  await printer.print(imageData, {
    dither: "steinberg",
    brightness: 128,
  });

  console.log("Print completed!");

  // Disconnect
  await printer.disconnect();
}

// Run
printInNodeJS().catch(console.error);
```

#### Complete Example

See `examples/nodejs-example.ts` for a fully working example.

#### Platform Support

- ✅ **Node.js** - Full support
- ✅ **Bun** - Full support (same code as Node.js)

---

## ⚙️ Configuration

### Print Options

```typescript
interface PrintOptions {
  dither?: DitherMethod;      // Dithering algorithm
  rotate?: 0 | 90 | 180 | 270; // Rotation angle
  flip?: "none" | "h" | "v" | "both"; // Flip direction
  brightness?: number;          // Image brightness (0-255)
  intensity?: number;           // Print intensity (0-255)
}
```

### Understanding `brightness` vs `intensity`

These parameters control different aspects of the printing process:

#### `brightness` - Image Pre-processing (Software)

- **Range**: 0-255 (default: 128)
- **Applied**: During image processing, before sending to printer
- **Effect**: Adjusts the lightness/darkness of the digital image
  - **0-127**: Darker image (more black pixels)
  - **128**: Normal (recommended starting point)
  - **129-255**: Lighter image (fewer black pixels)

#### `intensity` - Print Head Heat (Hardware)

- **Range**: 0-255 (default: 93)
- **Applied**: During actual printing (hardware level)
- **Effect**: Controls thermal print head temperature
  - **50-80**: Light printing (pale, may look faded)
  - **80-100**: Normal printing (recommended range)
  - **100-150**: Dark printing (strong, bold)
  - **150-255**: Very dark (risk of paper damage)

### Recommended Settings

| Use Case    | brightness | intensity | Description        |
| ----------- | ---------- | --------- | ------------------ |
| Normal text | 128        | 93        | Balanced, readable |
| Photos      | 140        | 100       | Good contrast      |
| Barcodes/QR | 128        | 110       | High contrast      |
| Light draft | 150        | 70        | Save ink, faster   |
| Dark/bold   | 110        | 120       | Maximum darkness   |

**Tips:**
- Start with default values (brightness: 128, intensity: 93)
- If print is too light, increase `intensity` first
- If image looks too dark before printing, increase `brightness`
- High `intensity` values (>150) may damage thermal paper

### Dithering Algorithms

| Method       | Best For              | Description                    |
| ------------ | --------------------- | ------------------------------ |
| `threshold`  | Text, simple graphics | Basic black/white conversion   |
| `steinberg`  | Photos, general use   | Floyd-Steinberg (recommended)  |
| `bayer`      | Patterns, textures    | Ordered dithering              |
| `atkinson`   | Comics, illustrations | Atkinson dithering             |
| `pattern`    | Special effects       | Pattern-based dithering        |

```typescript
// Example: Using different dithering methods
await printCanvas(canvas, { dither: "steinberg" }); // Best for photos
await printCanvas(canvas, { dither: "threshold" }); // Best for text
```

---

## 📚 API Reference

### ThermalPrinterClient

Platform-agnostic printer client.

#### Constructor

```typescript
new ThermalPrinterClient(adapter: BluetoothAdapter)
```

#### Methods

- `connect(): Promise<void>` - Connect to the printer
- `disconnect(): Promise<void>` - Disconnect from the printer
- `print(imageData: PrinterImageData, options?: PrintOptions): Promise<void>` - Print an image
- `getStatus(): Promise<PrinterState | null>` - Get printer status
- `setDitherMethod(method: DitherMethod): void` - Set dithering algorithm
- `setPrintIntensity(intensity: number): void` - Set print intensity (0-255)
- `on<T>(eventType: T, listener: PrinterEventListener<T>): () => void` - Subscribe to events
- `dispose(): void` - Clean up resources

#### Properties

- `isConnected: boolean` - Connection status
- `isPrinting: boolean` - Printing status
- `printerState: PrinterState | null` - Current printer state
- `statusMessage: string` - Current status message
- `ditherMethod: DitherMethod` - Current dithering method
- `printIntensity: number` - Current print intensity

### useThermalPrinter Hook

React hook providing printer functionality.

#### Returns

```typescript
{
  isConnected: boolean;
  isPrinting: boolean;
  printerState: PrinterState | null;
  statusMessage: string;
  ditherMethod: DitherMethod;
  printIntensity: number;
  connectPrinter: () => Promise<void>;
  printCanvas: (canvas: HTMLCanvasElement, options?: PrintOptions) => Promise<void>;
  getPrinterStatus: () => Promise<PrinterState | null>;
  disconnect: () => Promise<void>;
  setDitherMethod: (method: DitherMethod) => void;
  setPrintIntensity: (intensity: number) => void;
}
```

### Types

#### DitherMethod

```typescript
type DitherMethod =
  | "threshold"
  | "steinberg"
  | "bayer"
  | "atkinson"
  | "pattern";
```

#### PrintOptions

```typescript
interface PrintOptions {
  dither?: DitherMethod;
  rotate?: 0 | 90 | 180 | 270;
  flip?: "none" | "h" | "v" | "both";
  brightness?: number;
  intensity?: number;
}
```

#### PrinterState

```typescript
interface PrinterState {
  printing: boolean;
  paper_jam: boolean;
  out_of_paper: boolean;
  cover_open: boolean;
  battery_low: boolean;
  overheat: boolean;
}
```

### Events

The client emits the following events:

- `connected` - Fired when connected to a device
- `disconnected` - Fired when disconnected
- `stateChange` - Fired when printer state changes
- `error` - Fired when an error occurs

**Example:**

```typescript
printer.on("connected", (event) => {
  console.log("Connected to:", event.device.name);
});

printer.on("stateChange", (event) => {
  console.log("Printer state:", event.state);
});

printer.on("error", (event) => {
  console.error("Error:", event.error);
});
```

---

## 🏗️ Architecture

The library is organized into layers:

```
┌─────────────────────────────────────┐
│         React Hook Layer            │  ← React-specific wrapper
├─────────────────────────────────────┤
│    Platform-Agnostic Core Layer     │  ← ThermalPrinterClient
├─────────────────────────────────────┤
│        Adapter Layer                │  ← WebBluetoothAdapter, NodeBluetoothAdapter
├─────────────────────────────────────┤
│        Service Layer                │  ← Printer protocol, image processing
└─────────────────────────────────────┘
```

### Project Structure

```
src/
├── utils/
│   ├── helpers.ts              # Utility functions (crc8, delay)
│   └── bluetooth.ts            # Bluetooth constants
│
├── services/
│   ├── protocol.ts             # MXW01 protocol (commands)
│   ├── printerState.ts         # State management
│   ├── printer.ts              # MXW01Printer class
│   ├── dithering.ts            # Dithering algorithms
│   ├── imageTransforms.ts      # Image transformations
│   └── imageProcessor.ts       # Image processing
│
├── core/
│   ├── EventEmitter.ts         # Event system
│   ├── ClientState.ts          # Centralized state
│   ├── PrintJob.ts             # Print job encapsulation
│   ├── ThermalPrinterClient.ts # Main client
│   └── types.ts                # TypeScript types
│
├── adapters/
│   ├── BaseCharacteristicWrapper.ts # Base class
│   ├── WebBluetoothAdapter.ts       # Browser adapter
│   └── NodeBluetoothAdapter.ts      # Node.js adapter
│
└── react/
    └── useThermalPrinter.ts    # React hook
```

### Creating Custom Adapters

You can create custom Bluetooth adapters for different platforms:

```typescript
import { BluetoothAdapter } from "react-mxw01-printer";

class MyCustomAdapter implements BluetoothAdapter {
  async connect(): Promise<void> {
    // Your connection logic
  }

  async disconnect(): Promise<void> {
    // Your disconnection logic
  }

  async send(data: Uint8Array): Promise<void> {
    // Your send logic
  }

  on(event: string, listener: Function): void {
    // Your event handling
  }
}
```

---

## 🌍 Compatibility & Support

### Browser Compatibility

Web Bluetooth API is supported in:

- ✅ Chrome/Edge 56+
- ✅ Opera 43+
- ✅ Chrome for Android

Not supported in:

- ❌ Firefox
- ❌ Safari (as of 2024)

### Platform Support

| Platform     | Support | Notes                              |
| ------------ | ------- | ---------------------------------- |
| Browser      | ✅      | Requires Web Bluetooth API         |
| Node.js      | ✅      | Requires @stoprocent/noble         |
| Bun          | ✅      | Same as Node.js                    |
| Deno         | ⚠️      | Experimental (custom adapter)      |
| React Native | ⚠️      | Requires custom Bluetooth adapter  |

### Troubleshooting

**Connection Issues:**
- Ensure Bluetooth is enabled on your device
- Make sure the printer is charged and turned on
- Try disconnecting and reconnecting

**Print Quality Issues:**
- Adjust `brightness` and `intensity` settings
- Try different dithering algorithms
- Check that the thermal paper is properly loaded

**Node.js Issues:**
- Ensure `@stoprocent/noble` is properly installed
- On Linux, you may need to grant Bluetooth permissions
- On Windows, ensure Bluetooth drivers are up to date

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📄 License

MIT

## 💝 Credits

Based on the MXW01 thermal printer protocol.
The identification of the protocol and its operation would not have been possible without [dropalltables/catprinter](https://github.com/dropalltables/catprinter ).  
Big thank you.

##  🧔🏻‍♂️ Author

Made with ❤️ by Clément Van Peuter
