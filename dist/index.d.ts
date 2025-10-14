export declare const Command: {
    readonly GetStatus: 161;
    readonly SetIntensity: 162;
    readonly PrintRequest: 169;
    readonly FlushData: 173;
    readonly PrintComplete: 170;
};

export declare type DitherMethod = "threshold" | "steinberg" | "bayer" | "atkinson" | "pattern";

export declare function encode1bppRow(rowBool: boolean[]): Uint8Array;

export declare interface ImageProcessorOptions {
    dither: DitherMethod;
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
    state: PrinterState;
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

export declare interface PrinterState {
    printing: boolean;
    paper_jam: boolean;
    out_of_paper: boolean;
    cover_open: boolean;
    battery_low: boolean;
    overheat: boolean;
}

/**
 * Process an image for thermal printer
 */
export declare function processImageForPrinter(imageData: ImageData, options: ImageProcessorOptions): {
    processedData: Uint32Array;
    width: number;
    height: number;
    binaryRows: boolean[][];
};

export declare interface ThermalPrinterHook {
    isConnected: boolean;
    isPrinting: boolean;
    printerState: PrinterState | null;
    statusMessage: string;
    ditherMethod: DitherMethod;
    printIntensity: number;
    connectPrinter: () => Promise<void>;
    printCanvas: (canvas: HTMLCanvasElement, options?: Partial<ImageProcessorOptions>) => Promise<void>;
    getPrinterStatus: () => Promise<PrinterState | null>;
    disconnect: () => Promise<void>;
    setDitherMethod: (method: DitherMethod) => void;
    setPrintIntensity: (intensity: number) => void;
}

export declare function useThermalPrinter(): ThermalPrinterHook;

export declare type WriteFunction = (data: BufferSource) => Promise<void>;

export { }
