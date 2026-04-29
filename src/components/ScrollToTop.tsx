import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Resets window scroll position on every route change.
 * If the new URL has a #hash, scrolls to that element instead.
 * Same-page anchor clicks (no pathname change) are left to the browser.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ block: "start" });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname, hash]);

  return null;
}

export default ScrollToTop;
