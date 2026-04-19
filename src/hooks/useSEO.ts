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
 * Per-page SEO via direct DOM manipulation. Works in both SSG (prerendered into raw HTML
 * for crawlers and social previews) and CSR (updates client-side on navigation).
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
    // Resolve absolute URLs
    const absoluteImage = ogImage.startsWith("http")
      ? ogImage
      : `https://shepi.ai${ogImage}`;

    const isServer = typeof window === "undefined";
    const resolvedCanonical =
      canonical ||
      (!isServer
        ? `https://shepi.ai${window.location.pathname}`
        : "https://shepi.ai/");

    const robotsContent = noindex ? "noindex, nofollow" : "index, follow";
    const googlebotContent = noindex
      ? "noindex, nofollow"
      : "index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1";

    // Update document title
    document.title = title;

    // Helper to update or create meta tag
    const updateMeta = (selector: string, content: string) => {
      let meta = document.querySelector(selector);
      if (!meta) {
        meta = document.createElement("meta");
        const isProperty = selector.includes("property=");
        if (isProperty) {
          meta.setAttribute("property", selector.match(/property="([^"]+)"/)?.[1] || "");
        } else {
          meta.setAttribute("name", selector.match(/name="([^"]+)"/)?.[1] || "");
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    // Helper to update or create link tag
    const updateLink = (rel: string, href: string) => {
      let link = document.querySelector(`link[rel="${rel}"]`);
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", rel);
        document.head.appendChild(link);
      }
      link.setAttribute("href", href);
    };

    // Update all meta tags
    updateLink("canonical", resolvedCanonical);
    
    if (description) {
      updateMeta('meta[name="description"]', description);
      updateMeta('meta[property="og:description"]', description);
      updateMeta('meta[name="twitter:description"]', description);
    }

    updateMeta('meta[name="robots"]', robotsContent);
    updateMeta('meta[name="googlebot"]', googlebotContent);
    updateMeta('meta[property="og:title"]', title);
    updateMeta('meta[name="twitter:title"]', title);
    updateMeta('meta[property="og:type"]', ogType);
    updateMeta('meta[property="og:url"]', resolvedCanonical);
    updateMeta('meta[name="twitter:url"]', resolvedCanonical);
    updateMeta('meta[property="og:image"]', absoluteImage);
    updateMeta('meta[name="twitter:image"]', absoluteImage);
    updateMeta('meta[name="twitter:card"]', "summary_large_image");
  }, [title, description, canonical, noindex, ogImage, ogType]);
}
