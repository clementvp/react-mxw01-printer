// Web Bluetooth API adapter for browser environments

import type {
  BluetoothAdapter,
  BluetoothDevice as PrinterBluetoothDevice,
  BluetoothConnection,
  BluetoothServiceInfo,
  BluetoothCharacteristic as PrinterBluetoothCharacteristic,
} from "../core/types";

// Bluetooth service UUIDs
const PRINTER_SERVICE_UUID = "0000ae30-0000-1000-8000-00805f9b34fb";
const PRINTER_SERVICE_UUID_ALT = "0000af30-0000-1000-8000-00805f9b34fb"; // macOS alternate UUID
const CONTROL_CHAR_UUID = "0000ae01-0000-1000-8000-00805f9b34fb";
const NOTIFY_CHAR_UUID = "0000ae02-0000-1000-8000-00805f9b34fb";
const DATA_CHAR_UUID = "0000ae03-0000-1000-8000-00805f9b34fb";

/**
 * Wrapper for Web Bluetooth API characteristic to match our interface
 */
class WebBluetoothCharacteristicWrapper
  implements PrinterBluetoothCharacteristic
{
  constructor(private characteristic: BluetoothRemoteGATTCharacteristic) {}

  async writeValueWithoutResponse(data: BufferSource): Promise<void> {
    await this.characteristic.writeValueWithoutResponse(data);
  }

  async startNotifications(): Promise<void> {
    await this.characteristic.startNotifications();
  }

  async stopNotifications(): Promise<void> {
    await this.characteristic.stopNotifications();
  }

  addEventListener(event: string, callback: (event: any) => void): void {
    this.characteristic.addEventListener(event, callback);
  }

  removeEventListener(event: string, callback: (event: any) => void): void {
    this.characteristic.removeEventListener(event, callback);
  }
}

/**
 * Web Bluetooth adapter for browser environments
 * Uses the Web Bluetooth API to connect to Bluetooth devices
 */
export class WebBluetoothAdapter implements BluetoothAdapter {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;

  /**
   * Check if Web Bluetooth is available
   */
  isAvailable(): boolean {
    return (
      typeof navigator !== "undefined" &&
      typeof navigator.bluetooth !== "undefined"
    );
  }

  /**
   * Request a Bluetooth device with printer services
   */
  async requestDevice(): Promise<PrinterBluetoothDevice> {
    if (!this.isAvailable()) {
      throw new Error("Web Bluetooth API is not available in this browser");
    }

    try {
      // Request Bluetooth device with support for both standard and macOS UUIDs
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [PRINTER_SERVICE_UUID] },
          { services: [PRINTER_SERVICE_UUID_ALT] },
        ],
        optionalServices: [PRINTER_SERVICE_UUID, PRINTER_SERVICE_UUID_ALT],
      });

      return {
        id: this.device.id,
        name: this.device.name,
      };
    } catch (error) {
      throw new Error(
        `Failed to request Bluetooth device: ${(error as Error).message}`
      );
    }
  }

  /**
   * Connect to a Bluetooth device and get service characteristics
   */
  async connect(
    device: PrinterBluetoothDevice
  ): Promise<BluetoothConnection & BluetoothServiceInfo> {
    if (!this.device || this.device.id !== device.id) {
      throw new Error("Device not found. Please request device first.");
    }

    try {
      // Connect to GATT server
      const gatt = this.device.gatt;
      if (!gatt) {
        throw new Error("GATT not available on device");
      }
      this.server = await gatt.connect();
      if (!this.server) {
        throw new Error("Failed to connect to GATT server");
      }

      // Access printer service - try standard UUID first, then macOS alternate
      let service: BluetoothRemoteGATTService;
      try {
        service = await this.server.getPrimaryService(PRINTER_SERVICE_UUID);
      } catch (error) {
        console.log("Trying alternate UUID for macOS compatibility...");
        service = await this.server.getPrimaryService(PRINTER_SERVICE_UUID_ALT);
      }

      // Get characteristics
      const [controlChar, notifyChar, dataChar] = await Promise.all([
        service.getCharacteristic(CONTROL_CHAR_UUID),
        service.getCharacteristic(NOTIFY_CHAR_UUID),
        service.getCharacteristic(DATA_CHAR_UUID),
      ]);

      return {
        device,
        disconnect: async () => {
          if (this.server?.connected) {
            this.server.disconnect();
          }
          this.device = null;
          this.server = null;
        },
        controlCharacteristic: new WebBluetoothCharacteristicWrapper(
          controlChar
        ),
        dataCharacteristic: new WebBluetoothCharacteristicWrapper(dataChar),
        notifyCharacteristic: new WebBluetoothCharacteristicWrapper(notifyChar),
      };
    } catch (error) {
      throw new Error(
        `Failed to connect to device: ${(error as Error).message}`
      );
    }
  }
}
