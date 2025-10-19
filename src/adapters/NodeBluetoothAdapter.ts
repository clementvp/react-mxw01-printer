// Node.js Bluetooth adapter using Noble
// Requires: @abandonware/noble

import type {
  BluetoothAdapter,
  BluetoothDevice as PrinterBluetoothDevice,
  BluetoothConnection,
  BluetoothServiceInfo,
  BluetoothCharacteristic as PrinterBluetoothCharacteristic,
} from "../core/types";

// Bluetooth service UUIDs for MXW01 printer
const PRINTER_SERVICE_UUID = "ae30";
const CONTROL_CHAR_UUID = "ae01";
const NOTIFY_CHAR_UUID = "ae02";
const DATA_CHAR_UUID = "ae03";

/**
 * Wrapper for Noble characteristic to match our interface
 */
class NobleCharacteristicWrapper implements PrinterBluetoothCharacteristic {
  private characteristic: any;
  private dataListeners: Map<Function, Function> = new Map();

  constructor(characteristic: any) {
    this.characteristic = characteristic;
  }

  async writeValueWithoutResponse(data: BufferSource): Promise<void> {
    const buffer = Buffer.from(data as ArrayBuffer);
    await this.characteristic.writeAsync(buffer, true);
  }

  async startNotifications(): Promise<void> {
    await this.characteristic.subscribeAsync();
  }

  async stopNotifications(): Promise<void> {
    await this.characteristic.unsubscribeAsync();
  }

  addEventListener(event: string, callback: (event: any) => void): void {
    if (event === "characteristicvaluechanged") {
      const dataListener = (data: Buffer) => {
        callback({
          target: {
            value: {
              buffer: data.buffer.slice(
                data.byteOffset,
                data.byteOffset + data.byteLength
              ),
            },
          },
        });
      };

      this.dataListeners.set(callback, dataListener);
      this.characteristic.on("data", dataListener);
    }
  }

  removeEventListener(event: string, callback: (event: any) => void): void {
    if (event === "characteristicvaluechanged") {
      const dataListener = this.dataListeners.get(callback);
      if (dataListener) {
        this.characteristic.removeListener("data", dataListener);
        this.dataListeners.delete(callback);
      }
    }
  }
}

/**
 * Node.js Bluetooth adapter using Noble
 * Provides native Bluetooth access for Node.js and Bun environments
 *
 * @example
 * ```typescript
 * import { ThermalPrinterClient } from 'react-mxw01-printer';
 * import { NodeBluetoothAdapter } from 'react-mxw01-printer/adapters/node';
 *
 * const adapter = new NodeBluetoothAdapter();
 * const printer = new ThermalPrinterClient(adapter);
 * ```
 *
 * @requires @abandonware/noble
 */
export class NodeBluetoothAdapter implements BluetoothAdapter {
  private noble: any = null;
  private peripheral: any = null;
  private characteristics: {
    control?: any;
    notify?: any;
    data?: any;
  } = {};

  constructor() {
    try {
      // Dynamic import to avoid issues if noble is not installed
      this.noble = require("@abandonware/noble");
    } catch (error) {
      throw new Error(
        "Noble is not installed. Please run: npm install @abandonware/noble"
      );
    }
  }

  /**
   * Check if Bluetooth is available and powered on
   */
  isAvailable(): boolean {
    return this.noble && this.noble.state === "poweredOn";
  }

  /**
   * Scan for and request a Bluetooth printer device
   * Automatically finds devices with MXW01 printer service UUID
   */
  async requestDevice(): Promise<PrinterBluetoothDevice> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.noble.stopScanning();
        reject(new Error("Device scan timeout (30s)"));
      }, 30000);

      const onDiscover = (peripheral: any) => {
        const services = peripheral.advertisement.serviceUuids || [];
        const hasService = services.some(
          (uuid: string) =>
            uuid.toLowerCase().includes(PRINTER_SERVICE_UUID) ||
            uuid.toLowerCase().replace(/-/g, "").includes(PRINTER_SERVICE_UUID)
        );

        if (hasService) {
          this.noble.stopScanning();
          clearTimeout(timeout);
          this.peripheral = peripheral;
          this.noble.removeListener("discover", onDiscover);

          resolve({
            id: peripheral.id || peripheral.uuid,
            name: peripheral.advertisement.localName || "MXW01 Printer",
          });
        }
      };

      this.noble.on("discover", onDiscover);

      const startScanning = () => {
        console.log("Scanning for MXW01 printer...");
        this.noble.startScanning([], false);
      };

      if (this.noble.state === "poweredOn") {
        startScanning();
      } else {
        const onStateChange = (state: string) => {
          if (state === "poweredOn") {
            this.noble.removeListener("stateChange", onStateChange);
            startScanning();
          }
        };
        this.noble.on("stateChange", onStateChange);
      }
    });
  }

  /**
   * Connect to a Bluetooth device and get printer service characteristics
   */
  async connect(
    device: PrinterBluetoothDevice
  ): Promise<BluetoothConnection & BluetoothServiceInfo> {
    if (!this.peripheral) {
      throw new Error("No peripheral found. Call requestDevice() first.");
    }

    try {
      // Connect to peripheral
      await this.peripheral.connectAsync();
      console.log("Connected to peripheral");

      // Discover all services and characteristics
      const { characteristics } =
        await this.peripheral.discoverAllServicesAndCharacteristicsAsync();

      console.log(`Found ${characteristics.length} characteristics`);

      // Find the required characteristics by UUID
      for (const char of characteristics) {
        const uuid = char.uuid.toLowerCase().replace(/-/g, "");

        if (uuid.includes(CONTROL_CHAR_UUID)) {
          this.characteristics.control = char;
          console.log("Found control characteristic");
        }
        if (uuid.includes(NOTIFY_CHAR_UUID)) {
          this.characteristics.notify = char;
          console.log("Found notify characteristic");
        }
        if (uuid.includes(DATA_CHAR_UUID)) {
          this.characteristics.data = char;
          console.log("Found data characteristic");
        }
      }

      // Verify all required characteristics are found
      if (
        !this.characteristics.control ||
        !this.characteristics.notify ||
        !this.characteristics.data
      ) {
        throw new Error(
          `Missing required characteristics. Found: ${Object.keys(
            this.characteristics
          ).join(", ")}`
        );
      }

      const peripheral = this.peripheral;

      return {
        device,
        disconnect: async () => {
          if (peripheral && peripheral.state === "connected") {
            await peripheral.disconnectAsync();
            console.log("Disconnected from peripheral");
          }
          this.peripheral = null;
          this.characteristics = {};
        },
        controlCharacteristic: new NobleCharacteristicWrapper(
          this.characteristics.control
        ),
        dataCharacteristic: new NobleCharacteristicWrapper(
          this.characteristics.data
        ),
        notifyCharacteristic: new NobleCharacteristicWrapper(
          this.characteristics.notify
        ),
      };
    } catch (error) {
      // Ensure we disconnect on error
      if (this.peripheral && this.peripheral.state === "connected") {
        try {
          await this.peripheral.disconnectAsync();
        } catch (disconnectError) {
          console.error("Error disconnecting:", disconnectError);
        }
      }
      throw new Error(
        `Failed to connect to device: ${(error as Error).message}`
      );
    }
  }
}
