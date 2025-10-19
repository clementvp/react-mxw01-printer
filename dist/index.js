import { useRef as O, useState as y, useEffect as I, useCallback as w } from "react";
const b = 384, C = b / 8, M = 90 * C, V = [
  0,
  7,
  14,
  9,
  28,
  27,
  18,
  21,
  56,
  63,
  54,
  49,
  36,
  35,
  42,
  45,
  112,
  119,
  126,
  121,
  108,
  107,
  98,
  101,
  72,
  79,
  70,
  65,
  84,
  83,
  90,
  93,
  224,
  231,
  238,
  233,
  252,
  251,
  242,
  245,
  216,
  223,
  214,
  209,
  196,
  195,
  202,
  205,
  144,
  151,
  158,
  153,
  140,
  139,
  130,
  133,
  168,
  175,
  166,
  161,
  180,
  179,
  186,
  189,
  199,
  192,
  201,
  206,
  219,
  220,
  213,
  210,
  255,
  248,
  241,
  246,
  227,
  228,
  237,
  234,
  183,
  176,
  185,
  190,
  171,
  172,
  165,
  162,
  143,
  136,
  129,
  134,
  147,
  148,
  157,
  154,
  39,
  32,
  41,
  46,
  59,
  60,
  53,
  50,
  31,
  24,
  17,
  22,
  3,
  4,
  13,
  10,
  87,
  80,
  89,
  94,
  75,
  76,
  69,
  66,
  111,
  104,
  97,
  102,
  115,
  116,
  125,
  122,
  137,
  142,
  135,
  128,
  149,
  146,
  155,
  156,
  177,
  182,
  191,
  184,
  173,
  170,
  163,
  164,
  249,
  254,
  247,
  240,
  229,
  226,
  235,
  236,
  193,
  198,
  207,
  200,
  221,
  218,
  211,
  212,
  105,
  110,
  103,
  96,
  117,
  114,
  123,
  124,
  81,
  86,
  95,
  88,
  77,
  74,
  67,
  68,
  25,
  30,
  23,
  16,
  5,
  2,
  11,
  12,
  33,
  38,
  47,
  40,
  61,
  58,
  51,
  52,
  78,
  73,
  64,
  71,
  82,
  85,
  92,
  91,
  118,
  113,
  120,
  127,
  106,
  109,
  100,
  99,
  62,
  57,
  48,
  55,
  34,
  37,
  44,
  43,
  6,
  1,
  8,
  15,
  26,
  29,
  20,
  19,
  174,
  169,
  160,
  167,
  178,
  181,
  188,
  187,
  150,
  145,
  152,
  159,
  138,
  141,
  132,
  131,
  222,
  217,
  208,
  215,
  194,
  197,
  204,
  203,
  230,
  225,
  232,
  239,
  250,
  253,
  244,
  243
], p = {
  GetStatus: 161,
  SetIntensity: 162,
  PrintRequest: 169,
  FlushData: 173,
  PrintComplete: 170
};
function H(n) {
  let t = 0;
  for (const e of n)
    t = V[(t ^ e) & 255];
  return t & 255;
}
function v(n) {
  return new Promise((t) => setTimeout(() => t(), n));
}
class G {
  controlWrite;
  dataWrite;
  printComplete;
  pendingResolvers;
  state;
  constructor(t, e) {
    this.controlWrite = t, this.dataWrite = e, this.printComplete = !1, this.pendingResolvers = /* @__PURE__ */ new Map(), this.state = {
      printing: !1,
      paper_jam: !1,
      out_of_paper: !1,
      cover_open: !1,
      battery_low: !1,
      overheat: !1
    };
  }
  notify(t) {
    if (t[0] !== 34 || t[1] !== 33) {
      console.warn("Ignoring unexpected notification format");
      return;
    }
    const e = t[2], r = t[4] | t[5] << 8, s = t.slice(6, 6 + r);
    if (e === p.PrintComplete && (this.printComplete = !0), e === p.GetStatus && s.length >= 7) {
      const i = s[6];
      this.state = {
        printing: (i & 1) !== 0,
        paper_jam: (i & 2) !== 0,
        out_of_paper: (i & 4) !== 0,
        cover_open: (i & 8) !== 0,
        battery_low: (i & 16) !== 0,
        overheat: (i & 32) !== 0
      };
    }
    const a = this.pendingResolvers.get(e);
    a && (a(s), this.pendingResolvers.delete(e));
  }
  makeCommand(t, e) {
    const r = e.length, s = new Uint8Array([
      34,
      33,
      t,
      0,
      r & 255,
      r >> 8 & 255
    ]), a = new Uint8Array(s.length + e.length);
    a.set(s), a.set(e, s.length);
    const i = H(e), c = new Uint8Array(a.length + 2);
    return c.set(a), c[c.length - 2] = i, c[c.length - 1] = 255, c;
  }
  waitForNotification(t, e = 1e4) {
    return new Promise((r, s) => {
      const a = setTimeout(() => {
        this.pendingResolvers.delete(t), s(
          new Error(`Timeout waiting for notification 0x${t.toString(16)}`)
        );
      }, e);
      this.pendingResolvers.set(t, (i) => {
        clearTimeout(a), r(i);
      });
    });
  }
  async setIntensity(t = 93) {
    const e = this.makeCommand(
      p.SetIntensity,
      Uint8Array.of(t)
    );
    await this.controlWrite(e), await v(50);
  }
  async requestStatus() {
    const t = this.makeCommand(p.GetStatus, Uint8Array.of(0));
    return await this.controlWrite(t), this.waitForNotification(p.GetStatus, 5e3);
  }
  async printRequest(t, e = 0) {
    const r = new Uint8Array(4);
    r[0] = t & 255, r[1] = t >> 8 & 255, r[2] = 48, r[3] = e;
    const s = this.makeCommand(p.PrintRequest, r);
    return await this.controlWrite(s), this.waitForNotification(p.PrintRequest, 5e3);
  }
  async flushData() {
    const t = this.makeCommand(p.FlushData, Uint8Array.of(0));
    await this.controlWrite(t), await v(50);
  }
  async sendDataChunks(t, e = C) {
    let r = 0;
    for (; r < t.length; ) {
      const s = t.slice(r, Math.min(r + e, t.length));
      await this.dataWrite(s), r += s.length, await v(15);
    }
  }
  async waitForPrintComplete(t = 2e4) {
    this.printComplete = !1;
    const e = Date.now();
    for (; !this.printComplete && Date.now() - e < t; )
      await v(100);
    if (!this.printComplete)
      throw new Error("Print timeout: Did not receive completion notification");
  }
}
function Y(n) {
  if (n.length !== b)
    throw new Error(
      `Row length must be ${b}, got ${n.length}`
    );
  const t = new Uint8Array(C);
  for (let e = 0; e < C; e++) {
    let r = 0;
    for (let s = 0; s < 8; s++)
      n[e * 8 + s] && (r |= 1 << s);
    t[e] = r;
  }
  return t;
}
function z(n) {
  const t = n.length;
  let e = new Uint8Array(0);
  for (let r = 0; r < t; r++) {
    const s = Y(n[r]), a = new Uint8Array(e.length + s.length);
    a.set(e), a.set(s, e.length), e = a;
  }
  if (e.length < M) {
    const r = new Uint8Array(M - e.length), s = new Uint8Array(e.length + r.length);
    s.set(e), s.set(r, e.length), e = s;
  }
  return e;
}
function X(n, t = 128, e = !0) {
  const r = new Uint8ClampedArray(n.length);
  let s = 0, a = 0, i = 0, c = 0, o = 0, h = 0;
  for (let u = 0; u < r.length; ++u)
    h = n[u], s = h & 255, a = h >> 8 & 255, i = h >> 16 & 255, c = (h >> 24 & 255) / 255, c < 1 && e ? (c = 1 - c, s += (255 - s) * c, a += (255 - a) * c, i += (255 - i) * c) : (s *= c, a *= c, i *= c), o = s * 0.2125 + a * 0.7154 + i * 0.0721, o += (t - 128) * (1 - o / 255) * (o / 255) * 2, r[u] = o;
  return r;
}
function J(n, t = !1) {
  const e = new Uint32Array(n.length);
  for (let r = 0; r < n.length; ++r) {
    const s = n[r] === 255 && t ? 0 : 4278190080;
    e[r] = s | n[r] << 16 | n[r] << 8 | n[r];
  }
  return e;
}
function K(n) {
  for (let t = 0; t < n.length; ++t)
    n[t] = n[t] > 128 ? 255 : 0;
  return n;
}
function Q(n, t, e) {
  let r = 0, s = 0, a = 0, i = 0;
  for (let c = 0; c < e; ++c)
    for (let o = 0; o < t; ++o)
      s = n[r], a = n[r] > 128 ? 255 : 0, i = s - a, n[r] = a, o >= 0 && o < t - 1 && c >= 0 && c < e && (n[r + 1] += i * 7 / 16), o >= 1 && o < t && c >= 0 && c < e - 1 && (n[r + t - 1] += i * 3 / 16), o >= 0 && o < t && c >= 0 && c < e - 1 && (n[r + t] += i * 5 / 16), o >= 0 && o < t - 1 && c >= 0 && c < e - 1 && (n[r + t + 1] += i * 1 / 16), ++r;
  return n;
}
function Z(n, t, e) {
  let i = 0, c = 0, o = 0, h = 0, u = 0;
  for (c = 0; c < e - 4; c += 4) {
    for (i = 0; i < t - 4; i += 4) {
      for (u = 0, o = 0; o < 4; ++o)
        for (h = 0; h < 4; ++h)
          u += n[(c + h) * t + i + o];
      for (u = (1 - u / 16 / 255) * 4, o = 0; o < 4; ++o)
        for (h = 0; h < 4; ++h)
          n[(c + h) * t + i + o] = Math.abs(o - 3) >= u || Math.abs(h - 3) >= u ? 255 : 0;
    }
    for (; i < t; ++i) n[c * t + i] = 255;
  }
  for (; c < e; ++c)
    for (i = 0; i < t; ++i) n[c * t + i] = 255;
  return n;
}
function tt(n, t, e) {
  const r = [
    0,
    48,
    12,
    60,
    3,
    51,
    15,
    63,
    32,
    16,
    44,
    28,
    35,
    19,
    47,
    31,
    8,
    56,
    4,
    52,
    11,
    59,
    7,
    55,
    40,
    24,
    36,
    20,
    43,
    27,
    39,
    23,
    2,
    50,
    14,
    62,
    1,
    49,
    13,
    61,
    34,
    18,
    46,
    30,
    33,
    17,
    45,
    29,
    10,
    58,
    6,
    54,
    9,
    57,
    5,
    53,
    42,
    26,
    38,
    22,
    41,
    25,
    37,
    21
  ], s = 0.6;
  let a = 0;
  for (let i = 0; i < e; ++i)
    for (let c = 0; c < t; ++c) {
      const o = r[i % 8 * 8 + c % 8];
      let h = n[a];
      h = h + (o - 32) * s, h < 0 && (h = 0), h > 255 && (h = 255), n[a] = h > 128 ? 255 : 0, ++a;
    }
  return n;
}
function et(n, t, e) {
  let r = 0, s = 0, a = 0, i = 0;
  for (let c = 0; c < e; ++c)
    for (let o = 0; o < t; ++o)
      s = n[r], a = s > 128 ? 255 : 0, i = s - a >> 3, n[r] = a, o < t - 1 && (n[r + 1] += i), o < t - 2 && (n[r + 2] += i), c < e - 1 && (o > 0 && (n[r + t - 1] += i), n[r + t] += i, o < t - 1 && (n[r + t + 1] += i)), c < e - 2 && (n[r + 2 * t] += i), ++r;
  return n;
}
function T(n, t, e, r) {
  const s = new Uint8ClampedArray(n.length);
  switch (r) {
    case 0:
      return n;
    case 90:
      for (let a = 0; a < e; a++)
        for (let i = 0; i < t; i++)
          s[a * t + i] = n[(t - i - 1) * e + a];
      break;
    case 180:
      for (let a = 0; a < e; a++)
        for (let i = 0; i < t; i++)
          s[a * t + i] = n[(e - a - 1) * t + (t - i - 1)];
      break;
    case 270:
      for (let a = 0; a < e; a++)
        for (let i = 0; i < t; i++)
          s[a * t + i] = n[i * e + (e - a - 1)];
      break;
  }
  return s;
}
function rt(n, t, e, r) {
  const s = new Uint8ClampedArray(n.length);
  switch (r) {
    case "none":
      return n;
    case "h":
      for (let a = 0; a < e; a++)
        for (let i = 0; i < t; i++)
          s[a * t + i] = n[a * t + (t - i - 1)];
      break;
    case "v":
      for (let a = 0; a < e; a++)
        for (let i = 0; i < t; i++)
          s[a * t + i] = n[(e - a - 1) * t + i];
      break;
    case "both":
      for (let a = 0; a < e; a++)
        for (let i = 0; i < t; i++)
          s[a * t + i] = n[(e - a - 1) * t + (t - i - 1)];
      break;
  }
  return s;
}
function it(n, t) {
  const e = new Uint32Array(
    new Uint8ClampedArray(n.data).buffer
  ), r = n.width, s = n.height;
  let a = X(e, t.brightness, !0);
  switch (t.dither) {
    case "steinberg":
      a = Q(a, r, s);
      break;
    case "bayer":
      a = tt(a, r, s);
      break;
    case "atkinson":
      a = et(a, r, s);
      break;
    case "pattern":
      a = Z(a, r, s);
      break;
    case "threshold":
    default:
      a = K(a);
      break;
  }
  a = rt(a, r, s, t.flip);
  let i = r, c = s;
  t.rotate === 0 || t.rotate === 180 ? a = T(a, r, s, t.rotate) : (a = T(a, s, r, t.rotate), i = s, c = r);
  const o = J(a, !0), h = [];
  for (let u = 0; u < c; u++) {
    const d = [];
    for (let f = 0; f < i; f++) {
      const m = u * i + f, _ = a[m];
      d.push(_ < 128);
    }
    h.push(d);
  }
  return {
    processedData: o,
    width: i,
    height: c,
    binaryRows: h
  };
}
class nt {
  adapter;
  printer = null;
  connection = null;
  device = null;
  eventListeners = /* @__PURE__ */ new Map();
  // State
  _isConnected = !1;
  _isPrinting = !1;
  _printerState = null;
  _statusMessage = "Ready to connect printer";
  _ditherMethod = "steinberg";
  _printIntensity = 93;
  constructor(t) {
    if (!t.isAvailable())
      throw new Error("Bluetooth is not available in this environment");
    this.adapter = t;
  }
  // Getters
  get isConnected() {
    return this._isConnected;
  }
  get isPrinting() {
    return this._isPrinting;
  }
  get printerState() {
    return this._printerState;
  }
  get statusMessage() {
    return this._statusMessage;
  }
  get ditherMethod() {
    return this._ditherMethod;
  }
  get printIntensity() {
    return this._printIntensity;
  }
  // Setters
  setDitherMethod(t) {
    this._ditherMethod = t;
  }
  setPrintIntensity(t) {
    if (t < 0 || t > 255)
      throw new Error("Print intensity must be between 0 and 255");
    this._printIntensity = t;
  }
  /**
   * Event emitter
   */
  emit(t) {
    const e = this.eventListeners.get(t.type);
    e && e.forEach((r) => {
      try {
        r(t);
      } catch (s) {
        console.error("Error in event listener:", s);
      }
    });
  }
  /**
   * Subscribe to events
   */
  on(t, e) {
    return this.eventListeners.has(t) || this.eventListeners.set(t, /* @__PURE__ */ new Set()), this.eventListeners.get(t).add(e), () => {
      const r = this.eventListeners.get(t);
      r && r.delete(e);
    };
  }
  /**
   * Update status message and emit stateChange if printer state changed
   */
  updateStatus(t, e) {
    this._statusMessage = t, e && (this._printerState = e, this.emit({ type: "stateChange", state: e }));
  }
  /**
   * Connect to printer via Bluetooth
   */
  async connect() {
    try {
      this.updateStatus("Connecting to printer..."), this.device = await this.adapter.requestDevice(), this.connection = await this.adapter.connect(this.device), this.printer = new G(
        this.connection.controlCharacteristic.writeValueWithoutResponse.bind(
          this.connection.controlCharacteristic
        ),
        this.connection.dataCharacteristic.writeValueWithoutResponse.bind(
          this.connection.dataCharacteristic
        )
      );
      const t = (e) => {
        const s = e.target.value;
        s && this.printer && (this.printer.notify(new Uint8Array(s.buffer)), this.updateStatus("Printer state updated", { ...this.printer.state }));
      };
      await this.connection.notifyCharacteristic.startNotifications(), this.connection.notifyCharacteristic.addEventListener(
        "characteristicvaluechanged",
        t
      ), this._isConnected = !0, this.updateStatus("Printer connected"), this.emit({ type: "connected", device: this.device }), await this.getStatus();
    } catch (t) {
      const e = t;
      throw this.updateStatus(`Error: ${e.message}`), this.emit({ type: "error", error: e }), t;
    }
  }
  /**
   * Get current printer status
   */
  async getStatus() {
    if (!this.printer || !this._isConnected)
      return this.updateStatus("Printer not connected"), null;
    try {
      await this.printer.requestStatus();
      const t = { ...this.printer.state };
      return this.updateStatus("Status updated", t), t;
    } catch (t) {
      const e = t;
      return this.updateStatus(`Error: ${e.message}`), this.emit({ type: "error", error: e }), null;
    }
  }
  /**
   * Print from image data
   * Works with Canvas ImageData or any compatible ImageData structure
   */
  async print(t, e = {}) {
    if (!this.printer || !this._isConnected)
      throw new Error("Printer not connected");
    try {
      this._isPrinting = !0, this.updateStatus("Preparing to print...");
      const r = {
        dither: this._ditherMethod,
        brightness: 128,
        flip: "none",
        rotate: 180,
        // Required rotation for MXW01 printer
        ...e
      }, s = b / t.width, a = Math.floor(t.height * s), i = this.scaleImageData(
        t,
        b,
        a
      );
      this.updateStatus("Processing image...");
      const { binaryRows: c } = it(
        i,
        r
      ), o = z(c), h = e.intensity ?? this._printIntensity;
      this.updateStatus("Configuring printer..."), await this.printer.setIntensity(h);
      const u = await this.printer.requestStatus();
      if (u.length >= 13 && u[12] !== 0)
        throw new Error(`Printer error: ${u[13]}`);
      this.updateStatus("Sending data...");
      const d = await this.printer.printRequest(c.length, 0);
      if (!d || d[0] !== 0)
        throw new Error("Print request rejected");
      await this.printer.sendDataChunks(o), await this.printer.flushData(), this.updateStatus("Printing..."), await this.printer.waitForPrintComplete(), this.updateStatus("Print completed"), await this.getStatus();
    } catch (r) {
      const s = r;
      throw this.updateStatus(`Error: ${s.message}`), this.emit({ type: "error", error: s }), r;
    } finally {
      this._isPrinting = !1;
    }
  }
  /**
   * Scale image data to target dimensions
   * Simple nearest-neighbor scaling
   */
  scaleImageData(t, e, r) {
    const s = new Uint8ClampedArray(e * r * 4), a = t.width / e, i = t.height / r;
    for (let c = 0; c < r; c++)
      for (let o = 0; o < e; o++) {
        const h = Math.floor(o * a), d = (Math.floor(c * i) * t.width + h) * 4, f = (c * e + o) * 4;
        s[f] = t.data[d], s[f + 1] = t.data[d + 1], s[f + 2] = t.data[d + 2], s[f + 3] = t.data[d + 3];
      }
    return {
      data: s,
      width: e,
      height: r
    };
  }
  /**
   * Disconnect from printer
   */
  async disconnect() {
    if (this.connection?.notifyCharacteristic)
      try {
        await this.connection.notifyCharacteristic.stopNotifications();
      } catch (t) {
        console.warn("Error stopping notifications:", t);
      }
    if (this.connection)
      try {
        await this.connection.disconnect();
      } catch (t) {
        console.warn("Error disconnecting:", t);
      }
    this.printer = null, this.connection = null, this.device = null, this._isConnected = !1, this._printerState = null, this.updateStatus("Printer disconnected"), this.emit({ type: "disconnected" });
  }
  /**
   * Dispose of the client and clean up resources
   */
  dispose() {
    this.disconnect(), this.eventListeners.clear();
  }
}
const A = "0000ae30-0000-1000-8000-00805f9b34fb", R = "0000af30-0000-1000-8000-00805f9b34fb", st = "0000ae01-0000-1000-8000-00805f9b34fb", at = "0000ae02-0000-1000-8000-00805f9b34fb", ct = "0000ae03-0000-1000-8000-00805f9b34fb";
class D {
  constructor(t) {
    this.characteristic = t;
  }
  async writeValueWithoutResponse(t) {
    await this.characteristic.writeValueWithoutResponse(t);
  }
  async startNotifications() {
    await this.characteristic.startNotifications();
  }
  async stopNotifications() {
    await this.characteristic.stopNotifications();
  }
  addEventListener(t, e) {
    this.characteristic.addEventListener(t, e);
  }
  removeEventListener(t, e) {
    this.characteristic.removeEventListener(t, e);
  }
}
class ot {
  device = null;
  server = null;
  /**
   * Check if Web Bluetooth is available
   */
  isAvailable() {
    return typeof navigator < "u" && typeof navigator.bluetooth < "u";
  }
  /**
   * Request a Bluetooth device with printer services
   */
  async requestDevice() {
    if (!this.isAvailable())
      throw new Error("Web Bluetooth API is not available in this browser");
    try {
      return this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [A] },
          { services: [R] }
        ],
        optionalServices: [A, R]
      }), {
        id: this.device.id,
        name: this.device.name
      };
    } catch (t) {
      throw new Error(
        `Failed to request Bluetooth device: ${t.message}`
      );
    }
  }
  /**
   * Connect to a Bluetooth device and get service characteristics
   */
  async connect(t) {
    if (!this.device || this.device.id !== t.id)
      throw new Error("Device not found. Please request device first.");
    try {
      const e = this.device.gatt;
      if (!e)
        throw new Error("GATT not available on device");
      if (this.server = await e.connect(), !this.server)
        throw new Error("Failed to connect to GATT server");
      let r;
      try {
        r = await this.server.getPrimaryService(A);
      } catch {
        console.log("Trying alternate UUID for macOS compatibility..."), r = await this.server.getPrimaryService(R);
      }
      const [s, a, i] = await Promise.all([
        r.getCharacteristic(st),
        r.getCharacteristic(at),
        r.getCharacteristic(ct)
      ]);
      return {
        device: t,
        disconnect: async () => {
          this.server?.connected && this.server.disconnect(), this.device = null, this.server = null;
        },
        controlCharacteristic: new D(
          s
        ),
        dataCharacteristic: new D(i),
        notifyCharacteristic: new D(a)
      };
    } catch (e) {
      throw new Error(
        `Failed to connect to device: ${e.message}`
      );
    }
  }
}
function lt() {
  const n = O(null), [t, e] = y(!1), [r, s] = y(!1), [a, i] = y(null), [c, o] = y(
    "Ready to connect printer"
  ), [h, u] = y("steinberg"), [d, f] = y(93);
  I(() => {
    try {
      const l = new ot();
      n.current = new nt(l);
      const S = n.current.on("connected", () => {
        e(!0);
      }), g = n.current.on(
        "disconnected",
        () => {
          e(!1), i(null);
        }
      ), P = n.current.on(
        "stateChange",
        (E) => {
          i(E.state);
        }
      ), B = n.current.on("error", (E) => {
        console.error("Printer error:", E.error);
      });
      return () => {
        S(), g(), P(), B(), n.current?.dispose();
      };
    } catch (l) {
      console.error("Failed to initialize printer client:", l), o(`Initialization error: ${l.message}`);
    }
  }, []), I(() => {
    n.current && (e(n.current.isConnected), s(n.current.isPrinting), i(n.current.printerState), o(n.current.statusMessage));
  }, []), I(() => {
    const l = setInterval(() => {
      n.current && (o(n.current.statusMessage), s(n.current.isPrinting));
    }, 100);
    return () => clearInterval(l);
  }, []);
  const m = w(async () => {
    if (!n.current)
      throw new Error("Printer client not initialized");
    try {
      await n.current.connect(), e(!0), o(n.current.statusMessage);
    } catch (l) {
      throw o(`Connection error: ${l.message}`), l;
    }
  }, []), _ = w(async () => {
    if (!n.current)
      return null;
    const l = await n.current.getStatus();
    return l && i(l), o(n.current.statusMessage), l;
  }, []), $ = w(
    async (l, S = {}) => {
      if (!n.current)
        throw new Error("Printer client not initialized");
      try {
        s(!0);
        const g = l.getContext("2d");
        if (!g)
          throw new Error("Failed to get canvas context");
        const P = g.getImageData(0, 0, l.width, l.height);
        await n.current.print(P, S), o(n.current.statusMessage);
      } catch (g) {
        throw o(`Print error: ${g.message}`), g;
      } finally {
        s(!1);
      }
    },
    []
  ), q = w(async () => {
    n.current && (await n.current.disconnect(), e(!1), i(null), o(n.current.statusMessage));
  }, []), x = w((l) => {
    u(l), n.current?.setDitherMethod(l);
  }, []), j = w((l) => {
    f(l), n.current?.setPrintIntensity(l);
  }, []);
  return {
    isConnected: t,
    isPrinting: r,
    printerState: a,
    statusMessage: c,
    ditherMethod: h,
    printIntensity: d,
    connectPrinter: m,
    printCanvas: $,
    getPrinterStatus: _,
    disconnect: q,
    setDitherMethod: x,
    setPrintIntensity: j
  };
}
const L = "0000ae30-0000-1000-8000-00805f9b34fb", N = "0000af30-0000-1000-8000-00805f9b34fb", k = "0000ae01-0000-1000-8000-00805f9b34fb", F = "0000ae02-0000-1000-8000-00805f9b34fb", W = "0000ae03-0000-1000-8000-00805f9b34fb";
class U {
  characteristic;
  dataListeners = /* @__PURE__ */ new Map();
  constructor(t) {
    this.characteristic = t;
  }
  async writeValueWithoutResponse(t) {
    const e = Buffer.from(t);
    await this.characteristic.writeAsync(e, !0);
  }
  async startNotifications() {
    await this.characteristic.subscribeAsync();
  }
  async stopNotifications() {
    await this.characteristic.unsubscribeAsync();
  }
  addEventListener(t, e) {
    if (t === "characteristicvaluechanged") {
      const r = (s) => {
        e({
          target: {
            value: {
              buffer: s.buffer.slice(
                s.byteOffset,
                s.byteOffset + s.byteLength
              )
            }
          }
        });
      };
      this.dataListeners.set(e, r), this.characteristic.on("data", r);
    }
  }
  removeEventListener(t, e) {
    if (t === "characteristicvaluechanged") {
      const r = this.dataListeners.get(e);
      r && (this.characteristic.removeListener("data", r), this.dataListeners.delete(e));
    }
  }
}
class ut {
  noble = null;
  peripheral = null;
  characteristics = {};
  constructor() {
    try {
      this.noble = require("@stoprocent/noble");
    } catch {
      throw new Error(
        "Noble is not installed. Please run: npm install @stoprocent/noble"
      );
    }
  }
  /**
   * Check if Bluetooth is available (Noble is loaded)
   * The powered on state is checked during requestDevice()
   */
  isAvailable() {
    return this.noble !== null;
  }
  /**
   * Scan for and request a Bluetooth printer device
   * Automatically finds devices with MXW01 printer service UUID
   */
  async requestDevice() {
    return new Promise((t, e) => {
      const r = setTimeout(() => {
        this.noble.stopScanning(), e(new Error("Device scan timeout (30s)"));
      }, 3e4), s = (i) => {
        this.noble.stopScanning(), clearTimeout(r), this.peripheral = i, this.noble.removeListener("discover", s), t({
          id: i.id || i.uuid,
          name: i.advertisement.localName || "MXW01 Printer"
        });
      };
      this.noble.on("discover", s);
      const a = () => {
        console.log("Scanning for MXW01 printer..."), this.noble.startScanning([L, N], !1);
      };
      if (this.noble.state === "poweredOn")
        a();
      else {
        const i = (c) => {
          c === "poweredOn" && (this.noble.removeListener("stateChange", i), a());
        };
        this.noble.on("stateChange", i);
      }
    });
  }
  /**
   * Connect to a Bluetooth device and get printer service characteristics
   */
  async connect(t) {
    if (!this.peripheral)
      throw new Error("No peripheral found. Call requestDevice() first.");
    try {
      await this.peripheral.connectAsync(), console.log("Connected to peripheral");
      const { characteristics: e } = await this.peripheral.discoverSomeServicesAndCharacteristicsAsync(
        [L, N],
        [k, F, W]
      );
      console.log(`Found ${e.length} characteristics`);
      const r = (a) => a.toLowerCase().replace(/-/g, "");
      for (const a of e) {
        const i = r(a.uuid);
        (i === r(k) || i.includes("ae01")) && (this.characteristics.control = a, console.log("Found control characteristic")), (i === r(F) || i.includes("ae02")) && (this.characteristics.notify = a, console.log("Found notify characteristic")), (i === r(W) || i.includes("ae03")) && (this.characteristics.data = a, console.log("Found data characteristic"));
      }
      if (!this.characteristics.control || !this.characteristics.notify || !this.characteristics.data)
        throw new Error(
          `Missing required characteristics. Found: ${Object.keys(
            this.characteristics
          ).join(", ")}`
        );
      const s = this.peripheral;
      return {
        device: t,
        disconnect: async () => {
          s && s.state === "connected" && (await s.disconnectAsync(), console.log("Disconnected from peripheral")), this.peripheral = null, this.characteristics = {};
        },
        controlCharacteristic: new U(
          this.characteristics.control
        ),
        dataCharacteristic: new U(
          this.characteristics.data
        ),
        notifyCharacteristic: new U(
          this.characteristics.notify
        )
      };
    } catch (e) {
      if (this.peripheral && this.peripheral.state === "connected")
        try {
          await this.peripheral.disconnectAsync();
        } catch (r) {
          console.error("Error disconnecting:", r);
        }
      throw new Error(
        `Failed to connect to device: ${e.message}`
      );
    }
  }
}
export {
  p as Command,
  M as MIN_DATA_BYTES,
  G as MXW01Printer,
  ut as NodeBluetoothAdapter,
  b as PRINTER_WIDTH,
  C as PRINTER_WIDTH_BYTES,
  nt as ThermalPrinterClient,
  ot as WebBluetoothAdapter,
  Y as encode1bppRow,
  z as prepareImageDataBuffer,
  it as processImageForPrinter,
  lt as useThermalPrinter
};
//# sourceMappingURL=index.js.map
