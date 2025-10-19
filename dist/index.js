import { useRef as M, useReducer as D, useEffect as L, useCallback as y } from "react";
const O = [
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
];
function U(s) {
  let t = 0;
  for (const e of s)
    t = O[(t ^ e) & 255];
  return t & 255;
}
function T(s) {
  return new Promise((t) => setTimeout(() => t(), s));
}
const d = {
  GetStatus: 161,
  SetIntensity: 162,
  PrintRequest: 169,
  FlushData: 173,
  PrintComplete: 170
}, E = {
  HEADER_BYTE_1: 34,
  HEADER_BYTE_2: 33,
  TERMINATOR: 255
};
function _(s, t) {
  const e = t.length, r = new Uint8Array([
    E.HEADER_BYTE_1,
    E.HEADER_BYTE_2,
    s,
    0,
    e & 255,
    e >> 8 & 255
  ]), n = new Uint8Array(r.length + t.length);
  n.set(r), n.set(t, r.length);
  const a = U(t), i = new Uint8Array(n.length + 2);
  return i.set(n), i[i.length - 2] = a, i[i.length - 1] = E.TERMINATOR, i;
}
function x(s) {
  if (s[0] !== E.HEADER_BYTE_1 || s[1] !== E.HEADER_BYTE_2)
    return null;
  const t = s[2], e = s[4] | s[5] << 8, r = s.slice(6, 6 + e);
  return { cmdId: t, payload: r };
}
function B(s) {
  if (s.length < 7)
    return null;
  const t = s[6];
  return {
    printing: (t & 1) !== 0,
    paper_jam: (t & 2) !== 0,
    out_of_paper: (t & 4) !== 0,
    cover_open: (t & 8) !== 0,
    battery_low: (t & 16) !== 0,
    overheat: (t & 32) !== 0
  };
}
function W() {
  return {
    printing: !1,
    paper_jam: !1,
    out_of_paper: !1,
    cover_open: !1,
    battery_low: !1,
    overheat: !1
  };
}
class F {
  state;
  printComplete = !1;
  pendingResolvers = /* @__PURE__ */ new Map();
  constructor() {
    this.state = W();
  }
  /**
   * Get current printer state
   */
  getState() {
    return { ...this.state };
  }
  /**
   * Check if print is complete
   */
  isPrintComplete() {
    return this.printComplete;
  }
  /**
   * Reset print complete flag
   */
  resetPrintComplete() {
    this.printComplete = !1;
  }
  /**
   * Process notification and update state
   * @param cmdId Command ID from notification
   * @param payload Notification payload
   */
  processNotification(t, e) {
    if (t === d.PrintComplete && (this.printComplete = !0), t === d.GetStatus) {
      const n = B(e);
      n && (this.state = n);
    }
    const r = this.pendingResolvers.get(t);
    r && (r(e), this.pendingResolvers.delete(t));
  }
  /**
   * Wait for notification response
   * @param cmdId Command ID to wait for
   * @param timeoutMs Timeout in milliseconds
   * @returns Promise that resolves with the payload
   */
  waitForNotification(t, e = 1e4) {
    return new Promise((r, n) => {
      const a = setTimeout(() => {
        this.pendingResolvers.delete(t), n(
          new Error(`Timeout waiting for notification 0x${t.toString(16)}`)
        );
      }, e);
      this.pendingResolvers.set(t, (i) => {
        clearTimeout(a), r(i);
      });
    });
  }
}
const w = 384, C = w / 8, I = 90 * C;
class V {
  controlWrite;
  dataWrite;
  stateManager;
  constructor(t, e) {
    this.controlWrite = t, this.dataWrite = e, this.stateManager = new F();
  }
  /**
   * Get current printer state
   */
  get state() {
    return this.stateManager.getState();
  }
  /**
   * Process incoming notification from printer
   */
  notify(t) {
    const e = x(t);
    if (!e) {
      console.warn("Ignoring unexpected notification format");
      return;
    }
    this.stateManager.processNotification(e.cmdId, e.payload);
  }
  /**
   * Set print intensity (darkness)
   */
  async setIntensity(t = 93) {
    const e = _(d.SetIntensity, Uint8Array.of(t));
    await this.controlWrite(e), await T(50);
  }
  /**
   * Request current printer status
   */
  async requestStatus() {
    const t = _(d.GetStatus, Uint8Array.of(0));
    return await this.controlWrite(t), this.stateManager.waitForNotification(d.GetStatus, 5e3);
  }
  /**
   * Send print request with number of lines
   */
  async printRequest(t, e = 0) {
    const r = new Uint8Array(4);
    r[0] = t & 255, r[1] = t >> 8 & 255, r[2] = 48, r[3] = e;
    const n = _(d.PrintRequest, r);
    return await this.controlWrite(n), this.stateManager.waitForNotification(d.PrintRequest, 5e3);
  }
  /**
   * Flush data to printer
   */
  async flushData() {
    const t = _(d.FlushData, Uint8Array.of(0));
    await this.controlWrite(t), await T(50);
  }
  /**
   * Send data chunks to printer
   */
  async sendDataChunks(t, e = C) {
    let r = 0;
    for (; r < t.length; ) {
      const n = t.slice(r, Math.min(r + e, t.length));
      await this.dataWrite(n), r += n.length, await T(15);
    }
  }
  /**
   * Wait for print completion
   */
  async waitForPrintComplete(t = 2e4) {
    this.stateManager.resetPrintComplete();
    const e = Date.now();
    for (; !this.stateManager.isPrintComplete() && Date.now() - e < t; )
      await T(100);
    if (!this.stateManager.isPrintComplete())
      throw new Error("Print timeout: Did not receive completion notification");
  }
}
function q(s) {
  if (s.length !== w)
    throw new Error(
      `Row length must be ${w}, got ${s.length}`
    );
  const t = new Uint8Array(C);
  for (let e = 0; e < C; e++) {
    let r = 0;
    for (let n = 0; n < 8; n++)
      s[e * 8 + n] && (r |= 1 << n);
    t[e] = r;
  }
  return t;
}
function Y(s) {
  const t = s.length;
  let e = new Uint8Array(0);
  for (let r = 0; r < t; r++) {
    const n = q(s[r]), a = new Uint8Array(e.length + n.length);
    a.set(e), a.set(n, e.length), e = a;
  }
  if (e.length < I) {
    const r = new Uint8Array(I - e.length), n = new Uint8Array(e.length + r.length);
    n.set(e), n.set(r, e.length), e = n;
  }
  return e;
}
class H {
  listeners = /* @__PURE__ */ new Map();
  /**
   * Subscribe to an event
   * @param eventType Event type to listen for
   * @param listener Callback function
   * @returns Unsubscribe function
   */
  on(t, e) {
    return this.listeners.has(t) || this.listeners.set(t, /* @__PURE__ */ new Set()), this.listeners.get(t).add(e), () => {
      const r = this.listeners.get(t);
      r && r.delete(e);
    };
  }
  /**
   * Emit an event to all listeners
   * @param event Event to emit
   */
  emit(t) {
    const e = this.listeners.get(t.type);
    e && e.forEach((r) => {
      try {
        r(t);
      } catch (n) {
        console.error("Error in event listener:", n);
      }
    });
  }
  /**
   * Clear all event listeners
   */
  clear() {
    this.listeners.clear();
  }
  /**
   * Remove all listeners for a specific event type
   * @param eventType Event type to clear
   */
  clearEventType(t) {
    this.listeners.delete(t);
  }
}
class j {
  _isConnected = !1;
  _isPrinting = !1;
  _printerState = null;
  _statusMessage = "Ready to connect printer";
  _ditherMethod = "steinberg";
  _printIntensity = 93;
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
  // Setters with validation
  setConnected(t) {
    this._isConnected = t;
  }
  setPrinting(t) {
    this._isPrinting = t;
  }
  setPrinterState(t) {
    this._printerState = t;
  }
  setStatusMessage(t) {
    this._statusMessage = t;
  }
  setDitherMethod(t) {
    this._ditherMethod = t;
  }
  setPrintIntensity(t) {
    if (t < 0 || t > 255)
      throw new Error("Print intensity must be between 0 and 255");
    this._printIntensity = t;
  }
  /**
   * Reset to initial state
   */
  reset() {
    this._isConnected = !1, this._isPrinting = !1, this._printerState = null, this._statusMessage = "Ready to connect printer";
  }
}
class S {
}
class k extends S {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  apply(t, e, r) {
    for (let n = 0; n < t.length; ++n)
      t[n] = t[n] > 128 ? 255 : 0;
    return t;
  }
  getName() {
    return "threshold";
  }
}
class $ extends S {
  apply(t, e, r) {
    let n = 0;
    for (let a = 0; a < r; ++a)
      for (let i = 0; i < e; ++i) {
        const c = t[n], l = c > 128 ? 255 : 0, o = c - l;
        t[n] = l, i < e - 1 && (t[n + 1] += o * 7 / 16), a < r - 1 && (i > 0 && (t[n + e - 1] += o * 3 / 16), t[n + e] += o * 5 / 16, i < e - 1 && (t[n + e + 1] += o / 16)), ++n;
      }
    return t;
  }
  getName() {
    return "steinberg";
  }
}
class G extends S {
  bayer8 = [
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
  ];
  ditherFactor = 0.6;
  apply(t, e, r) {
    let n = 0;
    for (let a = 0; a < r; ++a)
      for (let i = 0; i < e; ++i) {
        const c = this.bayer8[a % 8 * 8 + i % 8];
        let l = t[n];
        l = l + (c - 32) * this.ditherFactor, l = Math.max(0, Math.min(255, l)), t[n] = l > 128 ? 255 : 0, ++n;
      }
    return t;
  }
  getName() {
    return "bayer";
  }
}
class z extends S {
  apply(t, e, r) {
    let n = 0;
    for (let a = 0; a < r; ++a)
      for (let i = 0; i < e; ++i) {
        const c = t[n], l = c > 128 ? 255 : 0, o = c - l >> 3;
        t[n] = l, i < e - 1 && (t[n + 1] += o), i < e - 2 && (t[n + 2] += o), a < r - 1 && (i > 0 && (t[n + e - 1] += o), t[n + e] += o, i < e - 1 && (t[n + e + 1] += o)), a < r - 2 && (t[n + 2 * e] += o), ++n;
      }
    return t;
  }
  getName() {
    return "atkinson";
  }
}
class X extends S {
  apply(t, e, r) {
    for (let c = 0; c < r - 4; c += 4) {
      for (let l = 0; l < e - 4; l += 4) {
        let o = 0;
        for (let h = 0; h < 4; ++h)
          for (let p = 0; p < 4; ++p)
            o += t[(c + p) * e + l + h];
        const u = (1 - o / 16 / 255) * 4;
        for (let h = 0; h < 4; ++h)
          for (let p = 0; p < 4; ++p)
            t[(c + p) * e + l + h] = Math.abs(h - 3) >= u || Math.abs(p - 3) >= u ? 255 : 0;
      }
      for (let l = e - e % 4; l < e; ++l)
        t[c * e + l] = 255;
    }
    for (let c = r - r % 4; c < r; ++c)
      for (let l = 0; l < e; ++l)
        t[c * e + l] = 255;
    return t;
  }
  getName() {
    return "pattern";
  }
}
function J(s) {
  switch (s) {
    case "steinberg":
      return new $();
    case "bayer":
      return new G();
    case "atkinson":
      return new z();
    case "pattern":
      return new X();
    case "threshold":
    default:
      return new k();
  }
}
function A(s, t, e, r) {
  if (r === 0)
    return s;
  const n = new Uint8ClampedArray(s.length);
  switch (r) {
    case 90:
      for (let a = 0; a < e; a++)
        for (let i = 0; i < t; i++)
          n[a * t + i] = s[(t - i - 1) * e + a];
      break;
    case 180:
      for (let a = 0; a < e; a++)
        for (let i = 0; i < t; i++)
          n[a * t + i] = s[(e - a - 1) * t + (t - i - 1)];
      break;
    case 270:
      for (let a = 0; a < e; a++)
        for (let i = 0; i < t; i++)
          n[a * t + i] = s[i * e + (e - a - 1)];
      break;
  }
  return n;
}
function K(s, t, e, r) {
  if (r === "none")
    return s;
  const n = new Uint8ClampedArray(s.length);
  switch (r) {
    case "h":
      for (let a = 0; a < e; a++)
        for (let i = 0; i < t; i++)
          n[a * t + i] = s[a * t + (t - i - 1)];
      break;
    case "v":
      for (let a = 0; a < e; a++)
        for (let i = 0; i < t; i++)
          n[a * t + i] = s[(e - a - 1) * t + i];
      break;
    case "both":
      for (let a = 0; a < e; a++)
        for (let i = 0; i < t; i++)
          n[a * t + i] = s[(e - a - 1) * t + (t - i - 1)];
      break;
  }
  return n;
}
function Q(s, t = 128, e = !0) {
  const r = new Uint8ClampedArray(s.length);
  for (let n = 0; n < r.length; ++n) {
    const a = s[n];
    let i = a & 255, c = a >> 8 & 255, l = a >> 16 & 255;
    const o = (a >> 24 & 255) / 255;
    if (o < 1 && e) {
      const h = 1 - o;
      i += (255 - i) * h, c += (255 - c) * h, l += (255 - l) * h;
    } else
      i *= o, c *= o, l *= o;
    let u = i * 0.2125 + c * 0.7154 + l * 0.0721;
    u += (t - 128) * (1 - u / 255) * (u / 255) * 2, r[n] = u;
  }
  return r;
}
function Z(s, t = !1) {
  const e = new Uint32Array(s.length);
  for (let r = 0; r < s.length; ++r) {
    const n = s[r] === 255 && t ? 0 : 4278190080;
    e[r] = n | s[r] << 16 | s[r] << 8 | s[r];
  }
  return e;
}
function tt(s, t, e) {
  const r = new Uint8ClampedArray(t * e * 4), n = s.width / t, a = s.height / e;
  for (let i = 0; i < e; i++)
    for (let c = 0; c < t; c++) {
      const l = Math.floor(c * n), u = (Math.floor(i * a) * s.width + l) * 4, h = (i * t + c) * 4;
      r[h] = s.data[u], r[h + 1] = s.data[u + 1], r[h + 2] = s.data[u + 2], r[h + 3] = s.data[u + 3];
    }
  return {
    data: r,
    width: t,
    height: e
  };
}
function et(s, t) {
  const e = new Uint32Array(
    new Uint8ClampedArray(s.data).buffer
  ), r = s.width, n = s.height;
  let a = Q(e, t.brightness, !0);
  a = J(t.dither).apply(a, r, n), a = K(a, r, n, t.flip);
  let c = r, l = n;
  t.rotate === 0 || t.rotate === 180 ? a = A(a, r, n, t.rotate) : (a = A(a, n, r, t.rotate), c = n, l = r);
  const o = Z(a, !0), u = [];
  for (let h = 0; h < l; h++) {
    const p = [];
    for (let g = 0; g < c; g++) {
      const b = h * c + g, v = a[b];
      p.push(v < 128);
    }
    u.push(p);
  }
  return {
    processedData: o,
    width: c,
    height: l,
    binaryRows: u
  };
}
class rt {
  imageData;
  options;
  constructor(t, e = {}) {
    this.imageData = t, this.options = e;
  }
  /**
   * Process and prepare image for printing
   * @param defaultDither Default dithering method
   * @returns Prepared image buffer and metadata
   */
  prepare(t) {
    const e = w / this.imageData.width, r = Math.floor(this.imageData.height * e), n = tt(
      this.imageData,
      w,
      r
    ), a = {
      dither: this.options.dither ?? t,
      brightness: this.options.brightness ?? 128,
      flip: "none",
      rotate: 180
      // Required rotation for MXW01 printer
    }, { binaryRows: i } = et(
      n,
      a
    );
    return {
      imageBuffer: Y(i),
      numLines: i.length
    };
  }
  /**
   * Get print intensity from options or default
   * @param defaultIntensity Default intensity value
   * @returns Print intensity
   */
  getIntensity(t) {
    return this.options.intensity ?? t;
  }
}
class nt {
  adapter;
  printer = null;
  connection = null;
  device = null;
  eventEmitter;
  state;
  constructor(t) {
    if (!t.isAvailable())
      throw new Error("Bluetooth is not available in this environment");
    this.adapter = t, this.eventEmitter = new H(), this.state = new j();
  }
  // Public getters delegated to state
  get isConnected() {
    return this.state.isConnected;
  }
  get isPrinting() {
    return this.state.isPrinting;
  }
  get printerState() {
    return this.state.printerState;
  }
  get statusMessage() {
    return this.state.statusMessage;
  }
  get ditherMethod() {
    return this.state.ditherMethod;
  }
  get printIntensity() {
    return this.state.printIntensity;
  }
  // Public setters delegated to state
  setDitherMethod(t) {
    this.state.setDitherMethod(t);
  }
  setPrintIntensity(t) {
    this.state.setPrintIntensity(t);
  }
  /**
   * Subscribe to events
   */
  on(t, e) {
    return this.eventEmitter.on(t, e);
  }
  /**
   * Update status message and emit state change if needed
   */
  updateStatus(t, e) {
    this.state.setStatusMessage(t), e && (this.state.setPrinterState(e), this.eventEmitter.emit({ type: "stateChange", state: e }));
  }
  /**
   * Connect to printer via Bluetooth
   */
  async connect() {
    try {
      this.updateStatus("Connecting to printer..."), this.device = await this.adapter.requestDevice(), this.connection = await this.adapter.connect(this.device), this.printer = new V(
        this.connection.controlCharacteristic.writeValueWithoutResponse.bind(
          this.connection.controlCharacteristic
        ),
        this.connection.dataCharacteristic.writeValueWithoutResponse.bind(
          this.connection.dataCharacteristic
        )
      ), await this.setupNotifications(), this.state.setConnected(!0), this.updateStatus("Printer connected"), this.eventEmitter.emit({ type: "connected", device: this.device }), await this.getStatus();
    } catch (t) {
      const e = t;
      throw this.updateStatus(`Error: ${e.message}`), this.eventEmitter.emit({ type: "error", error: e }), t;
    }
  }
  /**
   * Setup notification listener
   */
  async setupNotifications() {
    if (!this.connection || !this.printer)
      throw new Error("No connection or printer available");
    const t = (e) => {
      const n = e.target.value;
      n && this.printer && (this.printer.notify(new Uint8Array(n.buffer)), this.updateStatus("Printer state updated", { ...this.printer.state }));
    };
    await this.connection.notifyCharacteristic.startNotifications(), this.connection.notifyCharacteristic.addEventListener(
      "characteristicvaluechanged",
      t
    );
  }
  /**
   * Get current printer status
   */
  async getStatus() {
    if (!this.printer || !this.state.isConnected)
      return this.updateStatus("Printer not connected"), null;
    try {
      await this.printer.requestStatus();
      const t = { ...this.printer.state };
      return this.updateStatus("Status updated", t), t;
    } catch (t) {
      const e = t;
      return this.updateStatus(`Error: ${e.message}`), this.eventEmitter.emit({ type: "error", error: e }), null;
    }
  }
  /**
   * Print from image data
   */
  async print(t, e = {}) {
    if (!this.printer || !this.state.isConnected)
      throw new Error("Printer not connected");
    try {
      this.state.setPrinting(!0), this.updateStatus("Preparing to print...");
      const r = new rt(t, e), { imageBuffer: n, numLines: a } = r.prepare(
        this.state.ditherMethod
      ), i = r.getIntensity(this.state.printIntensity);
      this.updateStatus("Configuring printer..."), await this.printer.setIntensity(i);
      const c = await this.printer.requestStatus();
      if (c.length >= 13 && c[12] !== 0)
        throw new Error(`Printer error: ${c[13]}`);
      this.updateStatus("Sending data...");
      const l = await this.printer.printRequest(a, 0);
      if (!l || l[0] !== 0)
        throw new Error("Print request rejected");
      await this.printer.sendDataChunks(n), await this.printer.flushData(), this.updateStatus("Printing..."), await this.printer.waitForPrintComplete(), this.updateStatus("Print completed"), await this.getStatus();
    } catch (r) {
      const n = r;
      throw this.updateStatus(`Error: ${n.message}`), this.eventEmitter.emit({ type: "error", error: n }), r;
    } finally {
      this.state.setPrinting(!1);
    }
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
    this.printer = null, this.connection = null, this.device = null, this.state.reset(), this.updateStatus("Printer disconnected"), this.eventEmitter.emit({ type: "disconnected" });
  }
  /**
   * Dispose of the client and clean up resources
   */
  dispose() {
    this.disconnect(), this.eventEmitter.clear();
  }
}
const f = {
  // Service UUIDs
  PRINTER_SERVICE: "0000ae30-0000-1000-8000-00805f9b34fb",
  PRINTER_SERVICE_ALT: "0000af30-0000-1000-8000-00805f9b34fb",
  // macOS alternate
  // Characteristic UUIDs
  CONTROL: "0000ae01-0000-1000-8000-00805f9b34fb",
  NOTIFY: "0000ae02-0000-1000-8000-00805f9b34fb",
  DATA: "0000ae03-0000-1000-8000-00805f9b34fb",
  // Short format for Noble (Node.js)
  CONTROL_SHORT: "ae01",
  NOTIFY_SHORT: "ae02",
  DATA_SHORT: "ae03"
};
class N {
  dataListeners = /* @__PURE__ */ new Map();
  /**
   * Clear all registered listeners
   */
  clearListeners() {
    this.dataListeners.clear();
  }
}
class m extends N {
  constructor(t) {
    super(), this.characteristic = t;
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
class st {
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
          { services: [f.PRINTER_SERVICE] },
          { services: [f.PRINTER_SERVICE_ALT] }
        ],
        optionalServices: [
          f.PRINTER_SERVICE,
          f.PRINTER_SERVICE_ALT
        ]
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
        r = await this.server.getPrimaryService(
          f.PRINTER_SERVICE
        );
      } catch {
        console.log("Trying alternate UUID for macOS compatibility..."), r = await this.server.getPrimaryService(
          f.PRINTER_SERVICE_ALT
        );
      }
      const [n, a, i] = await Promise.all([
        r.getCharacteristic(f.CONTROL),
        r.getCharacteristic(f.NOTIFY),
        r.getCharacteristic(f.DATA)
      ]);
      return {
        device: t,
        disconnect: async () => {
          this.server?.connected && this.server.disconnect(), this.device = null, this.server = null;
        },
        controlCharacteristic: new m(
          n
        ),
        dataCharacteristic: new m(i),
        notifyCharacteristic: new m(a)
      };
    } catch (e) {
      throw new Error(
        `Failed to connect to device: ${e.message}`
      );
    }
  }
}
function it(s, t) {
  switch (t.type) {
    case "SET_CONNECTED":
      return { ...s, isConnected: t.payload };
    case "SET_PRINTING":
      return { ...s, isPrinting: t.payload };
    case "SET_PRINTER_STATE":
      return { ...s, printerState: t.payload };
    case "SET_STATUS":
      return { ...s, statusMessage: t.payload };
    case "SET_DITHER":
      return { ...s, ditherMethod: t.payload };
    case "SET_INTENSITY":
      return { ...s, printIntensity: t.payload };
    case "SYNC_CLIENT":
      return { ...s, ...t.payload };
    default:
      return s;
  }
}
const at = {
  isConnected: !1,
  isPrinting: !1,
  printerState: null,
  statusMessage: "Ready to connect printer",
  ditherMethod: "steinberg",
  printIntensity: 93
};
function ct() {
  const s = M(null), [t, e] = D(it, at);
  L(() => {
    try {
      const o = new st(), u = new nt(o);
      s.current = u;
      const h = u.on("connected", () => {
        e({ type: "SET_CONNECTED", payload: !0 });
      }), p = u.on("disconnected", () => {
        e({ type: "SET_CONNECTED", payload: !1 }), e({ type: "SET_PRINTER_STATE", payload: null });
      }), g = u.on("stateChange", (R) => {
        e({ type: "SET_PRINTER_STATE", payload: R.state });
      }), b = u.on("error", (R) => {
        console.error("Printer error:", R.error);
      }), v = setInterval(() => {
        e({
          type: "SYNC_CLIENT",
          payload: {
            statusMessage: u.statusMessage,
            isPrinting: u.isPrinting
          }
        });
      }, 100);
      return () => {
        h(), p(), g(), b(), clearInterval(v), u.dispose();
      };
    } catch (o) {
      console.error("Failed to initialize printer client:", o), e({
        type: "SET_STATUS",
        payload: `Initialization error: ${o.message}`
      });
    }
  }, []);
  const r = y(async () => {
    if (!s.current)
      throw new Error("Printer client not initialized");
    try {
      await s.current.connect(), e({ type: "SET_STATUS", payload: s.current.statusMessage });
    } catch (o) {
      throw e({
        type: "SET_STATUS",
        payload: `Connection error: ${o.message}`
      }), o;
    }
  }, []), n = y(async () => {
    if (!s.current)
      return null;
    const o = await s.current.getStatus();
    return o && e({ type: "SET_PRINTER_STATE", payload: o }), e({ type: "SET_STATUS", payload: s.current.statusMessage }), o;
  }, []), a = y(
    async (o, u = {}) => {
      if (!s.current)
        throw new Error("Printer client not initialized");
      try {
        e({ type: "SET_PRINTING", payload: !0 });
        const h = o.getContext("2d");
        if (!h)
          throw new Error("Failed to get canvas context");
        const p = h.getImageData(0, 0, o.width, o.height);
        await s.current.print(p, u), e({ type: "SET_STATUS", payload: s.current.statusMessage });
      } catch (h) {
        throw e({
          type: "SET_STATUS",
          payload: `Print error: ${h.message}`
        }), h;
      } finally {
        e({ type: "SET_PRINTING", payload: !1 });
      }
    },
    []
  ), i = y(async () => {
    s.current && (await s.current.disconnect(), e({ type: "SET_STATUS", payload: s.current.statusMessage }));
  }, []), c = y((o) => {
    e({ type: "SET_DITHER", payload: o }), s.current?.setDitherMethod(o);
  }, []), l = y((o) => {
    e({ type: "SET_INTENSITY", payload: o }), s.current?.setPrintIntensity(o);
  }, []);
  return {
    isConnected: t.isConnected,
    isPrinting: t.isPrinting,
    printerState: t.printerState,
    statusMessage: t.statusMessage,
    ditherMethod: t.ditherMethod,
    printIntensity: t.printIntensity,
    connectPrinter: r,
    printCanvas: a,
    getPrinterStatus: n,
    disconnect: i,
    setDitherMethod: c,
    setPrintIntensity: l
  };
}
class P extends N {
  characteristic;
  constructor(t) {
    super(), this.characteristic = t;
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
      const r = (n) => {
        e({
          target: {
            value: {
              buffer: n.buffer.slice(
                n.byteOffset,
                n.byteOffset + n.byteLength
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
      }, 3e4), n = (i) => {
        this.noble.stopScanning(), clearTimeout(r), this.peripheral = i, this.noble.removeListener("discover", n), t({
          id: i.id || i.uuid,
          name: i.advertisement.localName || "MXW01 Printer"
        });
      };
      this.noble.on("discover", n);
      const a = () => {
        console.log("Scanning for MXW01 printer..."), this.noble.startScanning(
          [f.PRINTER_SERVICE, f.PRINTER_SERVICE_ALT],
          !1
        );
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
      const { characteristics: e } = await this.peripheral.discoverAllServicesAndCharacteristicsAsync();
      if (console.log(`Found ${e.length} characteristics`), this.characteristics.control = e.find(
        (n) => n.uuid === f.CONTROL_SHORT
      ), this.characteristics.notify = e.find(
        (n) => n.uuid === f.NOTIFY_SHORT
      ), this.characteristics.data = e.find(
        (n) => n.uuid === f.DATA_SHORT
      ), console.log("Control:", this.characteristics.control ? "✅" : "❌"), console.log("Notify:", this.characteristics.notify ? "✅" : "❌"), console.log("Data:", this.characteristics.data ? "✅" : "❌"), !this.characteristics.control || !this.characteristics.notify || !this.characteristics.data)
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
        controlCharacteristic: new P(
          this.characteristics.control
        ),
        dataCharacteristic: new P(
          this.characteristics.data
        ),
        notifyCharacteristic: new P(
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
  d as Command,
  I as MIN_DATA_BYTES,
  V as MXW01Printer,
  lt as NodeBluetoothAdapter,
  w as PRINTER_WIDTH,
  C as PRINTER_WIDTH_BYTES,
  nt as ThermalPrinterClient,
  st as WebBluetoothAdapter,
  q as encode1bppRow,
  Y as prepareImageDataBuffer,
  et as processImageForPrinter,
  ct as useThermalPrinter
};
//# sourceMappingURL=index.js.map
