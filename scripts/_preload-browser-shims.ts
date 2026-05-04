// Browser-global shims so transitively-imported modules (supabase client) can load in Node.
// @ts-expect-error
globalThis.localStorage = globalThis.localStorage || {
  getItem: () => null, setItem: () => {}, removeItem: () => {},
  clear: () => {}, key: () => null, length: 0,
};
