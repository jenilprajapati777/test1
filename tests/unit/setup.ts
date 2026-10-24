import '@testing-library/jest-dom';

// Polyfill window.matchMedia
Object.defineProperty(window, 'matchMedia', {
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

// Polyfill BroadcastChannel if not available in jsdom
if (typeof globalThis.BroadcastChannel === 'undefined') {
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
            cb(new MessageEvent('message', { data: message }));
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
