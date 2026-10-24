import "@testing-library/jest-dom";

// Polyfill window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Polyfill ResizeObserver
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Polyfill HTMLCanvasElement.getContext for jsdom
if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = function (type: string) {
    if (type === "2d") {
      return {
        fillStyle: "",
        strokeStyle: "",
        lineWidth: 1,
        font: "",
        textAlign: "center",
        textBaseline: "middle",
        letterSpacing: "",
        fillRect: () => {},
        clearRect: () => {},
        getImageData: (_x: number, _y: number, w: number, h: number) => ({
          data: new Uint8ClampedArray(w * h * 4),
        }),
        putImageData: () => {},
        createLinearGradient: () => ({ addColorStop: () => {} }),
        createRadialGradient: () => ({ addColorStop: () => {} }),
        strokeRect: () => {},
        fillText: () => {},
        measureText: () => ({ width: 0 }),
      } as unknown as CanvasRenderingContext2D;
    }
    return null;
  } as unknown as typeof HTMLCanvasElement.prototype.getContext;
}

// Polyfill BroadcastChannel if not available in jsdom
if (typeof globalThis.BroadcastChannel === "undefined") {
  const channels = new Map<string, Set<(ev: MessageEvent) => void>>();
  globalThis.BroadcastChannel = class BroadcastChannel {
    name: string;
    private listener: ((ev: MessageEvent) => void) | null = null;
    constructor(name: string) {
      this.name = name;
      if (!channels.has(name)) channels.set(name, new Set());
    }
    postMessage(message: unknown) {
      const set = channels.get(this.name);
      if (set) {
        for (const cb of set) {
          if (cb !== this.listener) {
            cb(new MessageEvent("message", { data: message }));
          }
        }
      }
    }
    set onmessage(fn: ((ev: MessageEvent) => void) | null) {
      const set = channels.get(this.name);
      if (this.listener && set) set.delete(this.listener);
      this.listener = fn;
      if (fn && set) set.add(fn);
    }
    close() {
      const set = channels.get(this.name);
      if (this.listener && set) set.delete(this.listener);
    }
  } as unknown as typeof BroadcastChannel;
}
