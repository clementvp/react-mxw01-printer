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

```bash
npm install react-mxw01-printer
```

For Bun:

```bash
bun add react-mxw01-printer
```

## Usage

### React Hook (Browser)

The easiest way to use the library in a React application:

```tsx
import { useThermalPrinter } from "react-mxw01-printer";

function PrinterApp() {
  const {
    isConnected,
    isPrinting,
    statusMessage,
    connectPrinter,
    printCanvas,
    disconnect,
  } = useThermalPrinter();

  const handlePrint = async () => {
    const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
    await printCanvas(canvas, {
      dither: "steinberg",
      brightness: 128,
      intensity: 0x5d,
    });
  };

  return (
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
      <p>{statusMessage}</p>
    </div>
  );
}
```

### Platform-Agnostic Client (Browser)

Use the core client directly for more control:

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

// Get image data (from canvas, file, etc.)
const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

// Print
await printer.print(imageData, {
  dither: "steinberg",
  brightness: 128,
  intensity: 0x5d,
});

// Disconnect
await printer.disconnect();
```

### Node.js / Bun / OpenTUI

The library includes a complete `NodeBluetoothAdapter` that works with Node.js, Bun, and terminal applications like OpenTUI.

#### Installation

```bash
npm install react-mxw01-printer @abandonware/noble canvas
# or
bun add react-mxw01-printer @abandonware/noble canvas
```

**Required dependencies for Node.js:**

- `@abandonware/noble` - Native Bluetooth access
- `canvas` - Image generation (or use your own image source)

#### Basic Usage

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

See `examples/nodejs-example.ts` for a fully working example with:

- Event handling
- Error management
- Image generation with canvas
- Proper connection lifecycle

#### Using with Bun

The same code works with Bun! No changes needed:

```bash
bun add react-mxw01-printer @abandonware/noble canvas
bun run examples/nodejs-example.ts
```

#### Using with OpenTUI

```typescript
import {
  ThermalPrinterClient,
  NodeBluetoothAdapter,
} from "react-mxw01-printer";

// In your TUI application
const adapter = new NodeBluetoothAdapter();
const printer = new ThermalPrinterClient(adapter);

// Subscribe to events for UI updates
printer.on("connected", (event) => {
  // Update TUI: show connected status
});

printer.on("stateChange", (event) => {
  // Update TUI: show printer state
});

// Connect and print
await printer.connect();
await printer.print(imageData);
```

#### Features

- ✅ **Automatic device discovery** - Scans for MXW01 printer
- ✅ **Event-driven** - Real-time status updates
- ✅ **Error handling** - Comprehensive error messages
- ✅ **Connection management** - Automatic cleanup
- ✅ **Cross-platform** - Works on macOS, Linux, Windows\*

_\* Windows may require additional Bluetooth setup_

## API Reference

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

## Events

The client emits the following events:

- `connected` - Fired when connected to a device
- `disconnected` - Fired when disconnected
- `stateChange` - Fired when printer state changes
- `error` - Fired when an error occurs

## Architecture

The library is organized into layers:

```
┌─────────────────────────────────────┐
│         React Hook Layer            │  ← React-specific wrapper
├─────────────────────────────────────┤
│    Platform-Agnostic Core Layer     │  ← ThermalPrinterClient
├─────────────────────────────────────┤
│        Adapter Layer                │  ← WebBluetoothAdapter, etc.
├─────────────────────────────────────┤
│        Service Layer                │  ← Printer protocol, image processing
└─────────────────────────────────────┘
```

## Creating Custom Adapters

To use the library in environments without Web Bluetooth (e.g., Node.js, Bun), implement the `BluetoothAdapter` interface:

```typescript
import { BluetoothAdapter } from "react-mxw01-printer";

class MyCustomAdapter implements BluetoothAdapter {
  isAvailable(): boolean {
    // Check if Bluetooth is available
  }

  async requestDevice(): Promise<BluetoothDevice> {
    // Request/discover a device
  }

  async connect(
    device: BluetoothDevice
  ): Promise<BluetoothConnection & BluetoothServiceInfo> {
    // Connect and return characteristics
  }
}
```

## Browser Compatibility

Web Bluetooth API is supported in:

- Chrome/Edge 56+
- Opera 43+
- Chrome for Android

Not supported in:

- Firefox
- Safari (as of 2024)

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Credits

Based on the MXW01 thermal printer protocol.
