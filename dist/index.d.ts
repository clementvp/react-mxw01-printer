/**
 * Abstract interface for Bluetooth adapters
 * Implementations can use Web Bluetooth API, Noble, or other BLE libraries
 */
export declare interface BluetoothAdapter {
    /**
     * Request a Bluetooth device with printer services
     */
    requestDevice(): Promise<BluetoothDevice_2>;
    /**
     * Connect to a Bluetooth device and get service characteristics
     */
    connect(device: BluetoothDevice_2): Promise<BluetoothConnection & BluetoothServiceInfo>;
    /**
     * Check if Bluetooth is available in the current environment
     */
    isAvailable(): boolean;
}

export declare interface BluetoothCharacteristic {
    writeValueWithoutResponse(data: BufferSource): Promise<void>;
    startNotifications(): Promise<void>;
    stopNotifications(): Promise<void>;
    addEventListener(event: string, callback: (event: any) => void): void;
    removeEventListener(event: string, callback: (event: any) => void): void;
}

export declare interface BluetoothConnection {
    device: BluetoothDevice_2;
    disconnect(): Promise<void>;
}

declare interface BluetoothDevice_2 {
    id: string;
    name?: string;
}
export { BluetoothDevice_2 as BluetoothDevice }

export declare interface BluetoothServiceInfo {
    controlCharacteristic: BluetoothCharacteristic;
    dataCharacteristic: BluetoothCharacteristic;
    notifyCharacteristic: BluetoothCharacteristic;
}

export declare const Command: {
    readonly GetStatus: 161;
    readonly SetIntensity: 162;
    readonly PrintRequest: 169;
    readonly FlushData: 173;
    readonly PrintComplete: 170;
};

/**
 * Options for image processing
 */
export declare type DitherMethod = "threshold" | "steinberg" | "bayer" | "atkinson" | "pattern";

declare type DitherMethod_2 = "threshold" | "steinberg" | "bayer" | "atkinson" | "pattern";

export declare function encode1bppRow(rowBool: boolean[]): Uint8Array;

export declare interface ImageProcessorOptions {
    dither: DitherMethod;
    rotate: 0 | 90 | 180 | 270;
    flip: "none" | "h" | "v" | "both";
    brightness: number;
}

declare interface ImageProcessorOptions_2 {
    dither: DitherMethod_2;
    rotate: 0 | 90 | 180 | 270;
    flip: "none" | "h" | "v" | "both";
    brightness: number;
}

export declare const MIN_DATA_BYTES: number;

export declare class MXW01Printer {
    private controlWrite;
    private dataWrite;
    private printComplete;
    private pendingResolvers;
    state: PrinterState_2;
    constructor(controlWrite: WriteFunction, dataWrite: WriteFunction);
    notify(message: Uint8Array): void;
    makeCommand(command: number, payload: Uint8Array): Uint8Array;
    waitForNotification(cmdId: number, timeoutMs?: number): Promise<Uint8Array>;
    setIntensity(intensity?: number): Promise<void>;
    requestStatus(): Promise<Uint8Array>;
    printRequest(lines: number, mode?: number): Promise<Uint8Array>;
    flushData(): Promise<void>;
    sendDataChunks(data: Uint8Array, chunkSize?: number): Promise<void>;
    waitForPrintComplete(timeoutMs?: number): Promise<void>;
}

export declare function prepareImageDataBuffer(imageRowsBool: boolean[][]): Uint8Array;

export declare const PRINTER_WIDTH = 384;

export declare const PRINTER_WIDTH_BYTES: number;

/**
 * Event types emitted by ThermalPrinterClient
 */
export declare type PrinterEvent = {
    type: "connected";
    device: BluetoothDevice_2;
} | {
    type: "disconnected";
} | {
    type: "stateChange";
    state: PrinterState;
} | {
    type: "printProgress";
    progress: number;
} | {
    type: "error";
    error: Error;
};

export declare type PrinterEventListener<T extends PrinterEventType = PrinterEventType> = (event: Extract<PrinterEvent, {
    type: T;
}>) => void;

export declare type PrinterEventType = PrinterEvent["type"];

/**
 * Image data interface - compatible with both Canvas and Node.js
 * Renamed to avoid conflict with DOM ImageData
 */
export declare interface PrinterImageData {
    data: Uint8ClampedArray;
    width: number;
    height: number;
}

export declare interface PrinterState {
    printing: boolean;
    paper_jam: boolean;
    out_of_paper: boolean;
    cover_open: boolean;
    battery_low: boolean;
    overheat: boolean;
}

declare interface PrinterState_2 {
    printing: boolean;
    paper_jam: boolean;
    out_of_paper: boolean;
    cover_open: boolean;
    battery_low: boolean;
    overheat: boolean;
}

/**
 * Print options
 */
export declare interface PrintOptions extends Partial<ImageProcessorOptions> {
    intensity?: number;
}

/**
 * Process an image for thermal printer
 */
export declare function processImageForPrinter(imageData: ImageData, options: ImageProcessorOptions_2): {
    processedData: Uint32Array;
    width: number;
    height: number;
    binaryRows: boolean[][];
};

/**
 * Platform-agnostic thermal printer client
 * Works with any BluetoothAdapter implementation (Web Bluetooth, Noble, etc.)
 */
export declare class ThermalPrinterClient {
    private adapter;
    private printer;
    private connection;
    private device;
    private eventListeners;
    private _isConnected;
    private _isPrinting;
    private _printerState;
    private _statusMessage;
    private _ditherMethod;
    private _printIntensity;
    constructor(adapter: BluetoothAdapter);
    get isConnected(): boolean;
    get isPrinting(): boolean;
    get printerState(): PrinterState | null;
    get statusMessage(): string;
    get ditherMethod(): ImageProcessorOptions["dither"];
    get printIntensity(): number;
    setDitherMethod(method: ImageProcessorOptions["dither"]): void;
    setPrintIntensity(intensity: number): void;
    /**
     * Event emitter
     */
    private emit;
    /**
     * Subscribe to events
     */
    on<T extends PrinterEventType>(eventType: T, listener: PrinterEventListener<T>): () => void;
    /**
     * Update status message and emit stateChange if printer state changed
     */
    private updateStatus;
    /**
     * Connect to printer via Bluetooth
     */
    connect(): Promise<void>;
    /**
     * Get current printer status
     */
    getStatus(): Promise<PrinterState | null>;
    /**
     * Print from image data
     * Works with Canvas ImageData or any compatible ImageData structure
     */
    print(imageData: PrinterImageData, options?: PrintOptions): Promise<void>;
    /**
     * Scale image data to target dimensions
     * Simple nearest-neighbor scaling
     */
    private scaleImageData;
    /**
     * Disconnect from printer
     */
    disconnect(): Promise<void>;
    /**
     * Dispose of the client and clean up resources
     */
    dispose(): void;
}

export declare interface ThermalPrinterHook {
    isConnected: boolean;
    isPrinting: boolean;
    printerState: PrinterState | null;
    statusMessage: string;
    ditherMethod: DitherMethod;
    printIntensity: number;
    connectPrinter: () => Promise<void>;
    printCanvas: (canvas: HTMLCanvasElement, options?: Partial<{
        dither: DitherMethod;
        brightness: number;
        intensity: number;
    }>) => Promise<void>;
    getPrinterStatus: () => Promise<PrinterState | null>;
    disconnect: () => Promise<void>;
    setDitherMethod: (method: DitherMethod) => void;
    setPrintIntensity: (intensity: number) => void;
}

/**
 * React hook for thermal printer
 * Provides a React-friendly interface to the ThermalPrinterClient
 */
export declare function useThermalPrinter(): ThermalPrinterHook;

/**
 * Web Bluetooth adapter for browser environments
 * Uses the Web Bluetooth API to connect to Bluetooth devices
 */
export declare class WebBluetoothAdapter implements BluetoothAdapter {
    private device;
    private server;
    /**
     * Check if Web Bluetooth is available
     */
    isAvailable(): boolean;
    /**
     * Request a Bluetooth device with printer services
     */
    requestDevice(): Promise<BluetoothDevice_2>;
    /**
     * Connect to a Bluetooth device and get service characteristics
     */
    connect(device: BluetoothDevice_2): Promise<BluetoothConnection & BluetoothServiceInfo>;
}

export declare type WriteFunction = (data: BufferSource) => Promise<void>;

export { }
