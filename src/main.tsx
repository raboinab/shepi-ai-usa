// IMPORTANT: polyfill must be the first import so it runs before any module
// (transitively) touches `localStorage` / `window` at evaluation time.
import "./ssg-polyfill";
import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./App";
import "./index.css";

// Pre-React OAuth interception — browser-only. Catches OAuth tokens that land
// on wrong paths and redirects to /auth/callback before React mounts.
if (typeof window !== "undefined" && typeof window.fetch === "function" && typeof window.location !== "undefined") {
  const installStaticLoaderDataFetchGuard = () => {
    if ((window as typeof window & { __SHEPI_STATIC_LOADER_FETCH_GUARD__?: boolean }).__SHEPI_STATIC_LOADER_FETCH_GUARD__) {
      return;
    }

    const originalFetch = window.fetch.bind(window);
    (window as typeof window & { __SHEPI_STATIC_LOADER_FETCH_GUARD__?: boolean }).__SHEPI_STATIC_LOADER_FETCH_GUARD__ = true;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : typeof Request !== "undefined" && input instanceof Request
              ? input.url
              : "";

      let isStaticLoaderRequest = false;
      let isSameOriginJson = false;
      try {
        const parsed = new URL(requestUrl, window.location.origin);
        const sameOrigin = parsed.origin === window.location.origin;
        isStaticLoaderRequest = parsed.pathname.includes("/static-loader-data");
        isSameOriginJson = sameOrigin && parsed.pathname.endsWith(".json");
      } catch {
        isStaticLoaderRequest = false;
      }

      if (!isStaticLoaderRequest && !isSameOriginJson) {
        return originalFetch(input, init);
      }


      try {
        const response = await originalFetch(input, init);
        const contentType = response.headers.get("content-type") || "";
        if (response.ok && contentType.includes("application/json")) {
          return response;
        }

        console.warn("[SSG] Ignoring invalid static loader data response", response.status, requestUrl);
      } catch (error) {
        console.warn("[SSG] Static loader data request failed", requestUrl, error);
      }

      return new Response("{}", {
        status: 200,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    };
  };

  installStaticLoaderDataFetchGuard();

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

// On the SPA shell HTML (non-prerendered routes like /dashboard, /auth,
// /project/*, /admin/*) the root container is intentionally empty and the
// data-server-rendered marker is absent. We must avoid vite-react-ssg's
// auto-hydration in that case — hydrateRoot against an empty container in
// React 19 throws (React error #418) and forces a full client re-render,
// which is what was making /dashboard refreshes appear to hang. Instead we
// rename #root so the library's IIFE no-ops, then mount with createRoot
// ourselves.
const isSpaShell =
  typeof window !== "undefined" &&
  !document.querySelector("[data-server-rendered=true]");

if (isSpaShell) {
  const rootEl = document.getElementById("root");
  if (rootEl) {
    rootEl.id = "__shepi_spa_root__";
    // Clear the boot loader so React's first commit replaces it cleanly.
    rootEl.innerHTML = "";
  }
}

// vite-react-ssg entry: returns a function the framework calls during prerender
// (server) and hydration (client). Providers (Unhead, ErrorBoundary, Query, etc.)
// are mounted inside RootLayout in App.tsx so the same tree runs in both envs.
// On the SPA shell, ViteReactSSG's IIFE will see no #root and bail out.
export const createRoot = ViteReactSSG({ routes });

if (isSpaShell && typeof window !== "undefined") {
  void (async () => {
    const [
      { createRoot: reactCreateRoot },
      { RouterProvider, createBrowserRouter, matchRoutes },
      { HelmetProvider },
      React,
    ] = await Promise.all([
      import("react-dom/client"),
      import("react-router-dom"),
      import("react-helmet-async"),
      import("react"),
    ]);

    const container = document.getElementById("__shepi_spa_root__");
    if (!container) return;

    // Resolve lazy routes for the current path before mounting so the first
    // render produces the real page instead of a generic Suspense fallback.
    const matches = matchRoutes(routes as never, window.location) as
      | Array<{ route: { lazy?: () => Promise<Record<string, unknown>> } }>
      | null;
    if (matches) {
      await Promise.all(
        matches
          .filter((m) => m.route.lazy)
          .map(async (m) => {
            const mod = await m.route.lazy!();
            Object.assign(m.route, { ...mod, lazy: undefined });
          }),
      );
    }

    const router = createBrowserRouter(routes as never);
    const root = reactCreateRoot(container);
    React.startTransition(() => {
      root.render(
        React.createElement(
          HelmetProvider,
          null,
          React.createElement(RouterProvider, { router }),
        ),
      );
    });
  })();
}

