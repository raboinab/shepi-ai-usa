// IMPORTANT: polyfill must be the first import so it runs before any module
// (transitively) touches `localStorage` / `window` at evaluation time.
import "./ssg-polyfill";
import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./App";
import "./index.css";

// Pre-React OAuth interception — browser-only. Catches OAuth tokens that land
// on wrong paths and redirects to /auth/callback before React mounts.
if (typeof window !== "undefined") {
  if (
    window.location.hash.includes("access_token=") ||
    window.location.hash.includes("error=")
  ) {
    const hash = window.location.hash;
    const currentPath = window.location.pathname;
    if (currentPath !== "/auth/callback") {
      // eslint-disable-next-line no-console
      console.log(
        "[OAuth Bootstrap] Detected OAuth hash on path:",
        currentPath,
        "- redirecting to /auth/callback",
      );
      window.location.href = "/auth/callback" + hash;
      throw new Error("Redirecting to OAuth callback");
    }
  }

  window.addEventListener("error", (event) => {
    // eslint-disable-next-line no-console
    console.error(
      "[Global Error]",
      event.error?.message || event.message,
      event.error?.stack,
    );
  });
  window.addEventListener("unhandledrejection", (event) => {
    // eslint-disable-next-line no-console
    console.error("[Unhandled Promise Rejection]", event.reason);
  });
}

// vite-react-ssg entry: returns a function the framework calls during prerender
// (server) and hydration (client). Providers (Unhead, ErrorBoundary, Query, etc.)
// are mounted inside RootLayout in App.tsx so the same tree runs in both envs.
export const createRoot = ViteReactSSG({ routes });
