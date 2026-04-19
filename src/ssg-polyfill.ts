// Polyfill browser globals for SSG prerender (Node has no window/localStorage).
// This module is imported FIRST in src/main.tsx so that downstream modules
// (e.g. the auto-generated Supabase client which references `localStorage`
// at module top level) evaluate without crashing during prerender.
//
// On the client this is a no-op because the real browser globals already exist.
//
// IMPORTANT: we expose `__IS_SSG__` on globalThis BEFORE installing the window
// polyfill so downstream code (e.g. HeadProvider) can detect SSR. We can't
// rely on `typeof window === 'undefined'` after this module runs, since we
// install a `window` shim for module-evaluation safety.

const isNode =
  typeof process !== "undefined" &&
  !!(process as any).versions &&
  !!(process as any).versions.node &&
  typeof (globalThis as any).window === "undefined";

(globalThis as any).__IS_SSG__ = isNode;

if (isNode) {
  const noopStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  };

  // Minimal stand-ins. Components that actually use these only run inside
  // useEffect (post-mount), which never executes during prerender — so the
  // shapes only need to satisfy module-evaluation-time references.
  (globalThis as any).localStorage = noopStorage;
  (globalThis as any).sessionStorage = noopStorage;
  (globalThis as any).window = globalThis;
  (globalThis as any).document = {
    addEventListener: () => {},
    removeEventListener: () => {},
    createElement: () => ({}),
    documentElement: { style: {} },
    head: {},
    body: {},
  };
  (globalThis as any).navigator = { userAgent: "ssg" };
}

export {};
