import { useRef as q, useState as y, useEffect as A, useCallback as w } from "react";
const v = 384, C = v / 8, M = 90 * C, x = [
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
function j(i) {
  let t = 0;
  for (const e of i)
    t = x[(t ^ e) & 255];
  return t & 255;
}
function b(i) {
  return new Promise((t) => setTimeout(() => t(), i));
}
class B {
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
      const n = s[6];
      this.state = {
        printing: (n & 1) !== 0,
        paper_jam: (n & 2) !== 0,
        out_of_paper: (n & 4) !== 0,
        cover_open: (n & 8) !== 0,
        battery_low: (n & 16) !== 0,
        overheat: (n & 32) !== 0
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
    const n = j(e), c = new Uint8Array(a.length + 2);
    return c.set(a), c[c.length - 2] = n, c[c.length - 1] = 255, c;
  }
  waitForNotification(t, e = 1e4) {
    return new Promise((r, s) => {
      const a = setTimeout(() => {
        this.pendingResolvers.delete(t), s(
          new Error(`Timeout waiting for notification 0x${t.toString(16)}`)
        );
      }, e);
      this.pendingResolvers.set(t, (n) => {
        clearTimeout(a), r(n);
      });
    });
  }
  async setIntensity(t = 93) {
    const e = this.makeCommand(
      p.SetIntensity,
      Uint8Array.of(t)
    );
    await this.controlWrite(e), await b(50);
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
    await this.controlWrite(t), await b(50);
  }
  async sendDataChunks(t, e = C) {
    let r = 0;
    for (; r < t.length; ) {
      const s = t.slice(r, Math.min(r + e, t.length));
      await this.dataWrite(s), r += s.length, await b(15);
    }
  }
  async waitForPrintComplete(t = 2e4) {
    this.printComplete = !1;
    const e = Date.now();
    for (; !this.printComplete && Date.now() - e < t; )
      await b(100);
    if (!this.printComplete)
      throw new Error("Print timeout: Did not receive completion notification");
  }
}
function O(i) {
  if (i.length !== v)
    throw new Error(
      `Row length must be ${v}, got ${i.length}`
    );
  const t = new Uint8Array(C);
  for (let e = 0; e < C; e++) {
    let r = 0;
    for (let s = 0; s < 8; s++)
      i[e * 8 + s] && (r |= 1 << s);
    t[e] = r;
  }
  return t;
}
function V(i) {
  const t = i.length;
  let e = new Uint8Array(0);
  for (let r = 0; r < t; r++) {
    const s = O(i[r]), a = new Uint8Array(e.length + s.length);
    a.set(e), a.set(s, e.length), e = a;
  }
  if (e.length < M) {
    const r = new Uint8Array(M - e.length), s = new Uint8Array(e.length + r.length);
    s.set(e), s.set(r, e.length), e = s;
  }
  return e;
}
function H(i, t = 128, e = !0) {
  const r = new Uint8ClampedArray(i.length);
  let s = 0, a = 0, n = 0, c = 0, o = 0, h = 0;
  for (let u = 0; u < r.length; ++u)
    h = i[u], s = h & 255, a = h >> 8 & 255, n = h >> 16 & 255, c = (h >> 24 & 255) / 255, c < 1 && e ? (c = 1 - c, s += (255 - s) * c, a += (255 - a) * c, n += (255 - n) * c) : (s *= c, a *= c, n *= c), o = s * 0.2125 + a * 0.7154 + n * 0.0721, o += (t - 128) * (1 - o / 255) * (o / 255) * 2, r[u] = o;
  return r;
}
function G(i, t = !1) {
  const e = new Uint32Array(i.length);
  for (let r = 0; r < i.length; ++r) {
    const s = i[r] === 255 && t ? 0 : 4278190080;
    e[r] = s | i[r] << 16 | i[r] << 8 | i[r];
  }
  return e;
}
function Y(i) {
  for (let t = 0; t < i.length; ++t)
    i[t] = i[t] > 128 ? 255 : 0;
  return i;
}
function z(i, t, e) {
  let r = 0, s = 0, a = 0, n = 0;
  for (let c = 0; c < e; ++c)
    for (let o = 0; o < t; ++o)
      s = i[r], a = i[r] > 128 ? 255 : 0, n = s - a, i[r] = a, o >= 0 && o < t - 1 && c >= 0 && c < e && (i[r + 1] += n * 7 / 16), o >= 1 && o < t && c >= 0 && c < e - 1 && (i[r + t - 1] += n * 3 / 16), o >= 0 && o < t && c >= 0 && c < e - 1 && (i[r + t] += n * 5 / 16), o >= 0 && o < t - 1 && c >= 0 && c < e - 1 && (i[r + t + 1] += n * 1 / 16), ++r;
  return i;
}
function X(i, t, e) {
  let n = 0, c = 0, o = 0, h = 0, u = 0;
  for (c = 0; c < e - 4; c += 4) {
    for (n = 0; n < t - 4; n += 4) {
      for (u = 0, o = 0; o < 4; ++o)
        for (h = 0; h < 4; ++h)
          u += i[(c + h) * t + n + o];
      for (u = (1 - u / 16 / 255) * 4, o = 0; o < 4; ++o)
        for (h = 0; h < 4; ++h)
          i[(c + h) * t + n + o] = Math.abs(o - 3) >= u || Math.abs(h - 3) >= u ? 255 : 0;
    }
    for (; n < t; ++n) i[c * t + n] = 255;
  }
  for (; c < e; ++c)
    for (n = 0; n < t; ++n) i[c * t + n] = 255;
  return i;
}
function J(i, t, e) {
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
  for (let n = 0; n < e; ++n)
    for (let c = 0; c < t; ++c) {
      const o = r[n % 8 * 8 + c % 8];
      let h = i[a];
      h = h + (o - 32) * s, h < 0 && (h = 0), h > 255 && (h = 255), i[a] = h > 128 ? 255 : 0, ++a;
    }
  return i;
}
function K(i, t, e) {
  let r = 0, s = 0, a = 0, n = 0;
  for (let c = 0; c < e; ++c)
    for (let o = 0; o < t; ++o)
      s = i[r], a = s > 128 ? 255 : 0, n = s - a >> 3, i[r] = a, o < t - 1 && (i[r + 1] += n), o < t - 2 && (i[r + 2] += n), c < e - 1 && (o > 0 && (i[r + t - 1] += n), i[r + t] += n, o < t - 1 && (i[r + t + 1] += n)), c < e - 2 && (i[r + 2 * t] += n), ++r;
  return i;
}
function T(i, t, e, r) {
  const s = new Uint8ClampedArray(i.length);
  switch (r) {
    case 0:
      return i;
    case 90:
      for (let a = 0; a < e; a++)
        for (let n = 0; n < t; n++)
          s[a * t + n] = i[(t - n - 1) * e + a];
      break;
    case 180:
      for (let a = 0; a < e; a++)
        for (let n = 0; n < t; n++)
          s[a * t + n] = i[(e - a - 1) * t + (t - n - 1)];
      break;
    case 270:
      for (let a = 0; a < e; a++)
        for (let n = 0; n < t; n++)
          s[a * t + n] = i[n * e + (e - a - 1)];
      break;
  }
  return s;
}
function Q(i, t, e, r) {
  const s = new Uint8ClampedArray(i.length);
  switch (r) {
    case "none":
      return i;
    case "h":
      for (let a = 0; a < e; a++)
        for (let n = 0; n < t; n++)
          s[a * t + n] = i[a * t + (t - n - 1)];
      break;
    case "v":
      for (let a = 0; a < e; a++)
        for (let n = 0; n < t; n++)
          s[a * t + n] = i[(e - a - 1) * t + n];
      break;
    case "both":
      for (let a = 0; a < e; a++)
        for (let n = 0; n < t; n++)
          s[a * t + n] = i[(e - a - 1) * t + (t - n - 1)];
      break;
  }
  return s;
}
function Z(i, t) {
  const e = new Uint32Array(
    new Uint8ClampedArray(i.data).buffer
  ), r = i.width, s = i.height;
  let a = H(e, t.brightness, !0);
  switch (t.dither) {
    case "steinberg":
      a = z(a, r, s);
      break;
    case "bayer":
      a = J(a, r, s);
      break;
    case "atkinson":
      a = K(a, r, s);
      break;
    case "pattern":
      a = X(a, r, s);
      break;
    case "threshold":
    default:
      a = Y(a);
      break;
  }
  a = Q(a, r, s, t.flip);
  let n = r, c = s;
  t.rotate === 0 || t.rotate === 180 ? a = T(a, r, s, t.rotate) : (a = T(a, s, r, t.rotate), n = s, c = r);
  const o = G(a, !0), h = [];
  for (let u = 0; u < c; u++) {
    const d = [];
    for (let f = 0; f < n; f++) {
      const m = u * n + f, S = a[m];
      d.push(S < 128);
    }
    h.push(d);
  }
  return {
    processedData: o,
    width: n,
    height: c,
    binaryRows: h
  };
}
class tt {
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
      this.updateStatus("Connecting to printer..."), this.device = await this.adapter.requestDevice(), this.connection = await this.adapter.connect(this.device), this.printer = new B(
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
      }, s = v / t.width, a = Math.floor(t.height * s), n = this.scaleImageData(
        t,
        v,
        a
      );
      this.updateStatus("Processing image...");
      const { binaryRows: c } = Z(
        n,
        r
      ), o = V(c), h = e.intensity ?? this._printIntensity;
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
    const s = new Uint8ClampedArray(e * r * 4), a = t.width / e, n = t.height / r;
    for (let c = 0; c < r; c++)
      for (let o = 0; o < e; o++) {
        const h = Math.floor(o * a), d = (Math.floor(c * n) * t.width + h) * 4, f = (c * e + o) * 4;
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
const I = "0000ae30-0000-1000-8000-00805f9b34fb", R = "0000af30-0000-1000-8000-00805f9b34fb", et = "0000ae01-0000-1000-8000-00805f9b34fb", rt = "0000ae02-0000-1000-8000-00805f9b34fb", it = "0000ae03-0000-1000-8000-00805f9b34fb";
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
class nt {
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
          { services: [I] },
          { services: [R] }
        ],
        optionalServices: [I, R]
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
        r = await this.server.getPrimaryService(I);
      } catch {
        console.log("Trying alternate UUID for macOS compatibility..."), r = await this.server.getPrimaryService(R);
      }
      const [s, a, n] = await Promise.all([
        r.getCharacteristic(et),
        r.getCharacteristic(rt),
        r.getCharacteristic(it)
      ]);
      return {
        device: t,
        disconnect: async () => {
          this.server?.connected && this.server.disconnect(), this.device = null, this.server = null;
        },
        controlCharacteristic: new D(
          s
        ),
        dataCharacteristic: new D(n),
        notifyCharacteristic: new D(a)
      };
    } catch (e) {
      throw new Error(
        `Failed to connect to device: ${e.message}`
      );
    }
  }
}
function ht() {
  const i = q(null), [t, e] = y(!1), [r, s] = y(!1), [a, n] = y(null), [c, o] = y(
    "Ready to connect printer"
  ), [h, u] = y("steinberg"), [d, f] = y(93);
  A(() => {
    try {
      const l = new nt();
      i.current = new tt(l);
      const _ = i.current.on("connected", () => {
        e(!0);
      }), g = i.current.on(
        "disconnected",
        () => {
          e(!1), n(null);
        }
      ), P = i.current.on(
        "stateChange",
        (E) => {
          n(E.state);
        }
      ), $ = i.current.on("error", (E) => {
        console.error("Printer error:", E.error);
      });
      return () => {
        _(), g(), P(), $(), i.current?.dispose();
      };
    } catch (l) {
      console.error("Failed to initialize printer client:", l), o(`Initialization error: ${l.message}`);
    }
  }, []), A(() => {
    i.current && (e(i.current.isConnected), s(i.current.isPrinting), n(i.current.printerState), o(i.current.statusMessage));
  }, []), A(() => {
    const l = setInterval(() => {
      i.current && (o(i.current.statusMessage), s(i.current.isPrinting));
    }, 100);
    return () => clearInterval(l);
  }, []);
  const m = w(async () => {
    if (!i.current)
      throw new Error("Printer client not initialized");
    try {
      await i.current.connect(), e(!0), o(i.current.statusMessage);
    } catch (l) {
      throw o(`Connection error: ${l.message}`), l;
    }
  }, []), S = w(async () => {
    if (!i.current)
      return null;
    const l = await i.current.getStatus();
    return l && n(l), o(i.current.statusMessage), l;
  }, []), N = w(
    async (l, _ = {}) => {
      if (!i.current)
        throw new Error("Printer client not initialized");
      try {
        s(!0);
        const g = l.getContext("2d");
        if (!g)
          throw new Error("Failed to get canvas context");
        const P = g.getImageData(0, 0, l.width, l.height);
        await i.current.print(P, _), o(i.current.statusMessage);
      } catch (g) {
        throw o(`Print error: ${g.message}`), g;
      } finally {
        s(!1);
      }
    },
    []
  ), k = w(async () => {
    i.current && (await i.current.disconnect(), e(!1), n(null), o(i.current.statusMessage));
  }, []), F = w((l) => {
    u(l), i.current?.setDitherMethod(l);
  }, []), W = w((l) => {
    f(l), i.current?.setPrintIntensity(l);
  }, []);
  return {
    isConnected: t,
    isPrinting: r,
    printerState: a,
    statusMessage: c,
    ditherMethod: h,
    printIntensity: d,
    connectPrinter: m,
    printCanvas: N,
    getPrinterStatus: S,
    disconnect: k,
    setDitherMethod: F,
    setPrintIntensity: W
  };
}
const L = "ae30", st = "ae01", at = "ae02", ct = "ae03";
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
class lt {
  noble = null;
  peripheral = null;
  characteristics = {};
  constructor() {
    try {
      this.noble = require("@abandonware/noble");
    } catch {
      throw new Error(
        "Noble is not installed. Please run: npm install @abandonware/noble"
      );
    }
  }
  /**
   * Check if Bluetooth is available and powered on
   */
  isAvailable() {
    return this.noble && this.noble.state === "poweredOn";
  }
  /**
   * Scan for and request a Bluetooth printer device
   * Automatically finds devices with MXW01 printer service UUID
   */
  async requestDevice() {
    return new Promise((t, e) => {
      const r = setTimeout(() => {
        this.noble.stopScanning(), e(new Error("Device scan timeout (30s)"));
      }, 3e4), s = (n) => {
        (n.advertisement.serviceUuids || []).some(
          (h) => h.toLowerCase().includes(L) || h.toLowerCase().replace(/-/g, "").includes(L)
        ) && (this.noble.stopScanning(), clearTimeout(r), this.peripheral = n, this.noble.removeListener("discover", s), t({
          id: n.id || n.uuid,
          name: n.advertisement.localName || "MXW01 Printer"
        }));
      };
      this.noble.on("discover", s);
      const a = () => {
        console.log("Scanning for MXW01 printer..."), this.noble.startScanning([], !1);
      };
      if (this.noble.state === "poweredOn")
        a();
      else {
        const n = (c) => {
          c === "poweredOn" && (this.noble.removeListener("stateChange", n), a());
        };
        this.noble.on("stateChange", n);
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
      const { characteristics: e } = await this.peripheral.discoverAllServicesAndCharacteristicsAsync();
      console.log(`Found ${e.length} characteristics`);
      for (const s of e) {
        const a = s.uuid.toLowerCase().replace(/-/g, "");
        a.includes(st) && (this.characteristics.control = s, console.log("Found control characteristic")), a.includes(at) && (this.characteristics.notify = s, console.log("Found notify characteristic")), a.includes(ct) && (this.characteristics.data = s, console.log("Found data characteristic"));
      }
      if (!this.characteristics.control || !this.characteristics.notify || !this.characteristics.data)
        throw new Error(
          `Missing required characteristics. Found: ${Object.keys(
            this.characteristics
          ).join(", ")}`
        );
      const r = this.peripheral;
      return {
        device: t,
        disconnect: async () => {
          r && r.state === "connected" && (await r.disconnectAsync(), console.log("Disconnected from peripheral")), this.peripheral = null, this.characteristics = {};
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
  B as MXW01Printer,
  lt as NodeBluetoothAdapter,
  v as PRINTER_WIDTH,
  C as PRINTER_WIDTH_BYTES,
  tt as ThermalPrinterClient,
  nt as WebBluetoothAdapter,
  O as encode1bppRow,
  V as prepareImageDataBuffer,
  Z as processImageForPrinter,
  ht as useThermalPrinter
};
//# sourceMappingURL=index.js.map
