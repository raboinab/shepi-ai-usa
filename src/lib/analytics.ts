/**
 * Thin wrapper around the gtag() global loaded from index.html.
 * Safe no-op if gtag isn't on the page (ad-blockers, SSR-like envs, tests).
 */
declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void;
  }
}

export function trackEvent(name: string, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  try {
    window.gtag("event", name, params);
  } catch {
    // never let analytics break the app
  }
}
