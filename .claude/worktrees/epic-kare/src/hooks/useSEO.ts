import { useEffect } from "react";

interface SEOProps {
  title: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
  ogImage?: string;
  ogType?: string;
}

/**
 * Dynamically injects per-page SEO meta tags into <head>.
 * This is the standard approach for React SPAs without SSR.
 * Google executes JS and will pick up these tags (with a delay vs SSR).
 */
export function useSEO({
  title,
  description,
  canonical,
  noindex = false,
  ogImage = "/og-image.png",
  ogType = "website",
}: SEOProps) {
  useEffect(() => {
    // Title
    document.title = title;

    const setMeta = (selector: string, content: string, attr = "content") => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        // Parse attribute from selector, e.g. name="description" → name attr
        const nameMatch = selector.match(/\[name="([^"]+)"\]/);
        const propMatch = selector.match(/\[property="([^"]+)"\]/);
        if (nameMatch) el.setAttribute("name", nameMatch[1]);
        if (propMatch) el.setAttribute("property", propMatch[1]);
        document.head.appendChild(el);
      }
      el.setAttribute(attr, content);
    };

    const removeMeta = (selector: string) => {
      const el = document.querySelector(selector);
      if (el) el.remove();
    };

    // Description
    if (description) {
      setMeta('meta[name="description"]', description);
      setMeta('meta[property="og:description"]', description);
      setMeta('meta[name="twitter:description"]', description);
    }

    // Robots
    if (noindex) {
      setMeta('meta[name="robots"]', "noindex, nofollow");
      setMeta('meta[name="googlebot"]', "noindex, nofollow");
    } else {
      setMeta('meta[name="robots"]', "index, follow");
      setMeta(
        'meta[name="googlebot"]',
        "index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1"
      );
    }

    // OG Title & Twitter Title
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[name="twitter:title"]', title);

    // OG Type
    setMeta('meta[property="og:type"]', ogType);

    // OG Image & Twitter Image
    if (ogImage) {
      const absoluteImage = ogImage.startsWith("http")
        ? ogImage
        : `https://shepi.ai${ogImage}`;
      setMeta('meta[property="og:image"]', absoluteImage);
      setMeta('meta[name="twitter:image"]', absoluteImage);
      setMeta('meta[name="twitter:card"]', "summary_large_image");
    }

    // Canonical — always set; fall back to shepi.ai + current path
    const resolvedCanonical = canonical || `https://shepi.ai${window.location.pathname}`;
    let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalEl) {
      canonicalEl = document.createElement("link");
      canonicalEl.rel = "canonical";
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.href = resolvedCanonical;

    // OG URL mirrors canonical
    setMeta('meta[property="og:url"]', resolvedCanonical);
    setMeta('meta[name="twitter:url"]', resolvedCanonical);

    // Cleanup on unmount: restore defaults
    return () => {
      document.title = "AI Quality of Earnings Software | QoE Analysis Platform | Shepi";
    };
  }, [title, description, canonical, noindex, ogImage, ogType]);
}
