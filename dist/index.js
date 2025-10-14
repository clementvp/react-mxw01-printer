import { useState as C, useRef as W, useCallback as T } from "react";
const _ = 384, E = _ / 8, q = 90 * E, G = [
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
], y = {
  GetStatus: 161,
  SetIntensity: 162,
  PrintRequest: 169,
  FlushData: 173,
  PrintComplete: 170
};
function O(a) {
  let t = 0;
  for (const n of a)
    t = G[(t ^ n) & 255];
  return t & 255;
}
function D(a) {
  return new Promise((t) => setTimeout(() => t(), a));
}
class L {
  controlWrite;
  dataWrite;
  printComplete;
  pendingResolvers;
  state;
  constructor(t, n) {
    this.controlWrite = t, this.dataWrite = n, this.printComplete = !1, this.pendingResolvers = /* @__PURE__ */ new Map(), this.state = {
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
    const n = t[2], i = t[4] | t[5] << 8, s = t.slice(6, 6 + i);
    if (n === y.PrintComplete && (this.printComplete = !0), n === y.GetStatus && s.length >= 7) {
      const r = s[6];
      this.state = {
        printing: (r & 1) !== 0,
        paper_jam: (r & 2) !== 0,
        out_of_paper: (r & 4) !== 0,
        cover_open: (r & 8) !== 0,
        battery_low: (r & 16) !== 0,
        overheat: (r & 32) !== 0
      };
    }
    const e = this.pendingResolvers.get(n);
    e && (e(s), this.pendingResolvers.delete(n));
  }
  makeCommand(t, n) {
    const i = n.length, s = new Uint8Array([
      34,
      33,
      t,
      0,
      i & 255,
      i >> 8 & 255
    ]), e = new Uint8Array(s.length + n.length);
    e.set(s), e.set(n, s.length);
    const r = O(n), o = new Uint8Array(e.length + 2);
    return o.set(e), o[o.length - 2] = r, o[o.length - 1] = 255, o;
  }
  waitForNotification(t, n = 1e4) {
    return new Promise((i, s) => {
      const e = setTimeout(() => {
        this.pendingResolvers.delete(t), s(
          new Error(`Timeout waiting for notification 0x${t.toString(16)}`)
        );
      }, n);
      this.pendingResolvers.set(t, (r) => {
        clearTimeout(e), i(r);
      });
    });
  }
  async setIntensity(t = 93) {
    const n = this.makeCommand(
      y.SetIntensity,
      Uint8Array.of(t)
    );
    await this.controlWrite(n), await D(50);
  }
  async requestStatus() {
    const t = this.makeCommand(y.GetStatus, Uint8Array.of(0));
    return await this.controlWrite(t), this.waitForNotification(y.GetStatus, 5e3);
  }
  async printRequest(t, n = 0) {
    const i = new Uint8Array(4);
    i[0] = t & 255, i[1] = t >> 8 & 255, i[2] = 48, i[3] = n;
    const s = this.makeCommand(y.PrintRequest, i);
    return await this.controlWrite(s), this.waitForNotification(y.PrintRequest, 5e3);
  }
  async flushData() {
    const t = this.makeCommand(y.FlushData, Uint8Array.of(0));
    await this.controlWrite(t), await D(50);
  }
  async sendDataChunks(t, n = E) {
    let i = 0;
    for (; i < t.length; ) {
      const s = t.slice(i, Math.min(i + n, t.length));
      await this.dataWrite(s), i += s.length, await D(15);
    }
  }
  async waitForPrintComplete(t = 2e4) {
    this.printComplete = !1;
    const n = Date.now();
    for (; !this.printComplete && Date.now() - n < t; )
      await D(100);
    if (!this.printComplete)
      throw new Error("Print timeout: Did not receive completion notification");
  }
}
function Y(a) {
  if (a.length !== _)
    throw new Error(
      `Row length must be ${_}, got ${a.length}`
    );
  const t = new Uint8Array(E);
  for (let n = 0; n < E; n++) {
    let i = 0;
    for (let s = 0; s < 8; s++)
      a[n * 8 + s] && (i |= 1 << s);
    t[n] = i;
  }
  return t;
}
function X(a) {
  const t = a.length;
  let n = new Uint8Array(0);
  for (let i = 0; i < t; i++) {
    const s = Y(a[i]), e = new Uint8Array(n.length + s.length);
    e.set(n), e.set(s, n.length), n = e;
  }
  if (n.length < q) {
    const i = new Uint8Array(q - n.length), s = new Uint8Array(n.length + i.length);
    s.set(n), s.set(i, n.length), n = s;
  }
  return n;
}
function z(a, t = 128, n = !0) {
  const i = new Uint8ClampedArray(a.length);
  let s = 0, e = 0, r = 0, o = 0, c = 0, l = 0;
  for (let f = 0; f < i.length; ++f)
    l = a[f], s = l & 255, e = l >> 8 & 255, r = l >> 16 & 255, o = (l >> 24 & 255) / 255, o < 1 && n ? (o = 1 - o, s += (255 - s) * o, e += (255 - e) * o, r += (255 - r) * o) : (s *= o, e *= o, r *= o), c = s * 0.2125 + e * 0.7154 + r * 0.0721, c += (t - 128) * (1 - c / 255) * (c / 255) * 2, i[f] = c;
  return i;
}
function J(a, t = !1) {
  const n = new Uint32Array(a.length);
  for (let i = 0; i < a.length; ++i) {
    const s = a[i] === 255 && t ? 0 : 4278190080;
    n[i] = s | a[i] << 16 | a[i] << 8 | a[i];
  }
  return n;
}
function K(a) {
  for (let t = 0; t < a.length; ++t)
    a[t] = a[t] > 128 ? 255 : 0;
  return a;
}
function Q(a, t, n) {
  let i = 0, s = 0, e = 0, r = 0;
  for (let o = 0; o < n; ++o)
    for (let c = 0; c < t; ++c)
      s = a[i], e = a[i] > 128 ? 255 : 0, r = s - e, a[i] = e, c >= 0 && c < t - 1 && o >= 0 && o < n && (a[i + 1] += r * 7 / 16), c >= 1 && c < t && o >= 0 && o < n - 1 && (a[i + t - 1] += r * 3 / 16), c >= 0 && c < t && o >= 0 && o < n - 1 && (a[i + t] += r * 5 / 16), c >= 0 && c < t - 1 && o >= 0 && o < n - 1 && (a[i + t + 1] += r * 1 / 16), ++i;
  return a;
}
function Z(a, t, n) {
  let r = 0, o = 0, c = 0, l = 0, f = 0;
  for (o = 0; o < n - 4; o += 4) {
    for (r = 0; r < t - 4; r += 4) {
      for (f = 0, c = 0; c < 4; ++c)
        for (l = 0; l < 4; ++l)
          f += a[(o + l) * t + r + c];
      for (f = (1 - f / 16 / 255) * 4, c = 0; c < 4; ++c)
        for (l = 0; l < 4; ++l)
          a[(o + l) * t + r + c] = Math.abs(c - 3) >= f || Math.abs(l - 3) >= f ? 255 : 0;
    }
    for (; r < t; ++r) a[o * t + r] = 255;
  }
  for (; o < n; ++o)
    for (r = 0; r < t; ++r) a[o * t + r] = 255;
  return a;
}
function tt(a, t, n) {
  const i = [
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
  let e = 0;
  for (let r = 0; r < n; ++r)
    for (let o = 0; o < t; ++o) {
      const c = i[r % 8 * 8 + o % 8];
      let l = a[e];
      l = l + (c - 32) * s, l < 0 && (l = 0), l > 255 && (l = 255), a[e] = l > 128 ? 255 : 0, ++e;
    }
  return a;
}
function et(a, t, n) {
  let i = 0, s = 0, e = 0, r = 0;
  for (let o = 0; o < n; ++o)
    for (let c = 0; c < t; ++c)
      s = a[i], e = s > 128 ? 255 : 0, r = s - e >> 3, a[i] = e, c < t - 1 && (a[i + 1] += r), c < t - 2 && (a[i + 2] += r), o < n - 1 && (c > 0 && (a[i + t - 1] += r), a[i + t] += r, c < t - 1 && (a[i + t + 1] += r)), o < n - 2 && (a[i + 2 * t] += r), ++i;
  return a;
}
function M(a, t, n, i) {
  const s = new Uint8ClampedArray(a.length);
  switch (i) {
    case 0:
      return a;
    case 90:
      for (let e = 0; e < n; e++)
        for (let r = 0; r < t; r++)
          s[e * t + r] = a[(t - r - 1) * n + e];
      break;
    case 180:
      for (let e = 0; e < n; e++)
        for (let r = 0; r < t; r++)
          s[e * t + r] = a[(n - e - 1) * t + (t - r - 1)];
      break;
    case 270:
      for (let e = 0; e < n; e++)
        for (let r = 0; r < t; r++)
          s[e * t + r] = a[r * n + (n - e - 1)];
      break;
  }
  return s;
}
function rt(a, t, n, i) {
  const s = new Uint8ClampedArray(a.length);
  switch (i) {
    case "none":
      return a;
    case "h":
      for (let e = 0; e < n; e++)
        for (let r = 0; r < t; r++)
          s[e * t + r] = a[e * t + (t - r - 1)];
      break;
    case "v":
      for (let e = 0; e < n; e++)
        for (let r = 0; r < t; r++)
          s[e * t + r] = a[(n - e - 1) * t + r];
      break;
    case "both":
      for (let e = 0; e < n; e++)
        for (let r = 0; r < t; r++)
          s[e * t + r] = a[(n - e - 1) * t + (t - r - 1)];
      break;
  }
  return s;
}
function nt(a, t) {
  const n = new Uint32Array(
    new Uint8ClampedArray(a.data).buffer
  ), i = a.width, s = a.height;
  let e = z(n, t.brightness, !0);
  switch (t.dither) {
    case "steinberg":
      e = Q(e, i, s);
      break;
    case "bayer":
      e = tt(e, i, s);
      break;
    case "atkinson":
      e = et(e, i, s);
      break;
    case "pattern":
      e = Z(e, i, s);
      break;
    case "threshold":
    default:
      e = K(e);
      break;
  }
  e = rt(e, i, s, t.flip);
  let r = i, o = s;
  t.rotate === 0 || t.rotate === 180 ? e = M(e, i, s, t.rotate) : (e = M(e, s, i, t.rotate), r = s, o = i);
  const c = J(e, !0), l = [];
  for (let f = 0; f < o; f++) {
    const U = [];
    for (let h = 0; h < r; h++) {
      const w = f * r + h, b = e[w];
      U.push(b < 128);
    }
    l.push(U);
  }
  return {
    processedData: c,
    width: r,
    height: o,
    binaryRows: l
  };
}
const j = "0000ae30-0000-1000-8000-00805f9b34fb", x = "0000af30-0000-1000-8000-00805f9b34fb", it = "0000ae01-0000-1000-8000-00805f9b34fb", at = "0000ae02-0000-1000-8000-00805f9b34fb", st = "0000ae03-0000-1000-8000-00805f9b34fb";
function ct() {
  const [a, t] = C(!1), [n, i] = C(!1), [s, e] = C(null), [r, o] = C(
    "Ready to connect printer"
  ), [c, l] = C("steinberg"), [f, U] = C(93), h = W(null), w = W(null), b = W(null), H = T(async () => {
    try {
      o("Connecting to printer...");
      const u = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [j] },
          { services: [x] }
        ],
        optionalServices: [j, x]
      });
      w.current = u;
      const m = await u.gatt?.connect();
      if (!m) throw new Error("Failed to connect to GATT server");
      let p;
      try {
        p = await m.getPrimaryService(j);
      } catch {
        console.log("Trying alternate UUID for macOS compatibility..."), p = await m.getPrimaryService(x);
      }
      const [I, P, S] = await Promise.all([
        p.getCharacteristic(it),
        p.getCharacteristic(at),
        p.getCharacteristic(st)
      ]);
      b.current = P;
      const R = new L(
        I.writeValueWithoutResponse.bind(I),
        S.writeValueWithoutResponse.bind(S)
      );
      h.current = R;
      const g = (d) => {
        const v = d.target.value;
        v && (R.notify(new Uint8Array(v.buffer)), e({ ...R.state }));
      };
      await P.startNotifications(), P.addEventListener("characteristicvaluechanged", g), t(!0), o("Printer connected"), await A();
    } catch (u) {
      throw console.error("Connection error:", u), o(`Error: ${u.message}`), u;
    }
  }, []), A = T(async () => {
    if (!h.current || !a)
      return o("Printer not connected"), null;
    try {
      await h.current.requestStatus();
      const u = { ...h.current.state };
      return e(u), u;
    } catch (u) {
      return console.error("Error requesting status:", u), o(`Error: ${u.message}`), null;
    }
  }, [a]), B = T(
    async (u, m = {}) => {
      if (!h.current || !a) {
        o("Printer not connected");
        return;
      }
      try {
        i(!0), o("Preparing to print...");
        const p = {
          dither: c,
          brightness: 128,
          flip: "none",
          rotate: 180,
          // Required rotation for MXW01 printer
          ...m
        }, I = u.width, P = u.height, S = _ / I, R = Math.floor(P * S), g = document.createElement("canvas"), d = g.getContext("2d");
        if (!d)
          throw new Error("Failed to create 2D context");
        g.width = _, g.height = R, d.fillStyle = "white", d.fillRect(0, 0, g.width, g.height), d.drawImage(u, 0, 0, g.width, g.height);
        const F = d.getImageData(
          0,
          0,
          g.width,
          g.height
        );
        o("Processing image...");
        const { binaryRows: v } = nt(
          F,
          p
        ), $ = X(v);
        o("Configuring printer..."), await h.current.setIntensity(f);
        const k = await h.current.requestStatus();
        if (k.length >= 13 && k[12] !== 0)
          throw new Error(`Printer error: ${k[13]}`);
        o("Sending data...");
        const N = await h.current.printRequest(v.length, 0);
        if (!N || N[0] !== 0)
          throw new Error("Print request rejected");
        await h.current.sendDataChunks($), await h.current.flushData(), o("Printing..."), await h.current.waitForPrintComplete(), o("Print completed"), await A();
      } catch (p) {
        console.error("Print error:", p), o(`Error: ${p.message}`);
      } finally {
        i(!1);
      }
    },
    [a, c, f, A]
  ), V = T(async () => {
    if (b.current)
      try {
        await b.current.stopNotifications();
      } catch (u) {
        console.warn("Error stopping notifications:", u);
      }
    w.current?.gatt?.connected && w.current.gatt.disconnect(), h.current = null, b.current = null, w.current = null, t(!1), e(null), o("Printer disconnected");
  }, []);
  return {
    isConnected: a,
    isPrinting: n,
    printerState: s,
    statusMessage: r,
    ditherMethod: c,
    printIntensity: f,
    connectPrinter: H,
    printCanvas: B,
    getPrinterStatus: A,
    disconnect: V,
    setDitherMethod: l,
    setPrintIntensity: U
  };
}
export {
  y as Command,
  q as MIN_DATA_BYTES,
  L as MXW01Printer,
  _ as PRINTER_WIDTH,
  E as PRINTER_WIDTH_BYTES,
  Y as encode1bppRow,
  X as prepareImageDataBuffer,
  nt as processImageForPrinter,
  ct as useThermalPrinter
};
//# sourceMappingURL=index.js.map
