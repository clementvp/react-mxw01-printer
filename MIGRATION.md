# Migration Guide

## Migrating to v0.2.0

Version 0.2.0 introduces a platform-agnostic architecture while maintaining **100% backward compatibility** with existing React code.

### No Changes Required for React Users

If you're using the React hook, **your code will continue to work without any modifications**:

```tsx
// ✅ This code still works exactly the same
import { useThermalPrinter } from "react-mxw01-printer";

function MyComponent() {
  const { connectPrinter, printCanvas, isConnected } = useThermalPrinter();
  // ... your existing code
}
```

### What's New

#### 1. Platform-Agnostic Core

You can now use the library outside of React and browser environments:

```typescript
import { ThermalPrinterClient, WebBluetoothAdapter } from "react-mxw01-printer";

const adapter = new WebBluetoothAdapter();
const printer = new ThermalPrinterClient(adapter);
```

#### 2. Event-Driven Architecture

Subscribe to printer events:

```typescript
printer.on("connected", (event) => {
  console.log("Connected to:", event.device.name);
});

printer.on("stateChange", (event) => {
  console.log("State:", event.state);
});
```

#### 3. Custom Adapters

Create custom adapters for Node.js, Bun, or other environments:

```typescript
import { BluetoothAdapter } from "react-mxw01-printer";

class MyAdapter implements BluetoothAdapter {
  // Your implementation
}
```

### Breaking Changes

**None!** Version 0.2.0 is fully backward compatible.

### Deprecations

**None!** All existing APIs remain unchanged and supported.

### New Features

- `ThermalPrinterClient` - Platform-agnostic core client
- `BluetoothAdapter` interface - For creating custom adapters
- Event system - Subscribe to printer events
- `PrinterImageData` type - Platform-agnostic image data
- Better TypeScript types and documentation

### Upgrading

```bash
npm install react-mxw01-printer@latest
```

Or with Bun:

```bash
bun add react-mxw01-printer@latest
```

### Testing Your Migration

After upgrading, your existing code should work without changes. To verify:

1. Run your existing tests
2. Test printer connection
3. Test printing functionality

If you encounter any issues, please [open an issue](https://github.com/clementvp/react-mxw01-printer/issues).

### Future Plans

- Node.js Bluetooth adapter (using Noble)
- Additional image processing options
- Print queue management
- WebSocket adapter for remote printing

### Questions?

If you have questions about the migration or the new features, please open a discussion on GitHub.
