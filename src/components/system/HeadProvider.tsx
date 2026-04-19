import { ReactNode } from "react";
import { UnheadProvider as ClientUnheadProvider, createHead as createClientHead } from "@unhead/react/client";
import { UnheadProvider as ServerUnheadProvider } from "@unhead/react/server";
import { createHead as createServerHead } from "unhead/server";
import type { Unhead } from "unhead/types";

declare global {
  // Per-request server-side head, captured during prerender so the
  // vite.config onPageRendered hook can serialize it into <head>.
  // eslint-disable-next-line no-var
  var __SSR_HEAD__: Unhead | undefined;
}

// `__IS_SSG__` is set by src/ssg-polyfill.ts before any window shim is installed.
// We can't trust `typeof window` here because the polyfill defines a window stub.
const isServer = (globalThis as any).__IS_SSG__ === true;

/**
 * Mounts the correct Unhead provider based on environment.
 *
 * - SSR (prerender via vite-react-ssg): creates a server head, exposes it on
 *   `globalThis.__SSR_HEAD__` so `vite.config.ts` can call `renderSSRHead`
 *   on it inside `onPageRendered` and inject the resolved tags into `<head>`.
 * - Client (hydration & CSR navigation): creates a DOM-rendering head that
 *   updates document.head reactively as routes change.
 */
export function HeadProvider({ children }: { children: ReactNode }) {
  if (isServer) {
    const head = createServerHead();
    // Stash for the post-render hook in vite.config
    globalThis.__SSR_HEAD__ = head;
    return <ServerUnheadProvider value={head}>{children}</ServerUnheadProvider>;
  }
  // Singleton on the client — survives across route changes.
  const win = window as unknown as { __CLIENT_HEAD__?: Unhead };
  if (!win.__CLIENT_HEAD__) {
    win.__CLIENT_HEAD__ = createClientHead();
  }
  return (
    <ClientUnheadProvider head={win.__CLIENT_HEAD__}>
      {children}
    </ClientUnheadProvider>
  );
}
