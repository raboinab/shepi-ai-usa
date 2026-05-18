import "@testing-library/jest-dom";
import { vi } from "vitest";

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
    dispatchEvent: () => {},
  }),
});

// JSDOM doesn't implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// crypto.randomUUID polyfill for older jsdom
if (!globalThis.crypto?.randomUUID) {
  const c = (globalThis.crypto ?? {}) as Crypto;
  (c as { randomUUID: () => string }).randomUUID = () =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
      const r = (Math.random() * 16) | 0;
      const v = ch === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  (globalThis as { crypto: Crypto }).crypto = c;
}
