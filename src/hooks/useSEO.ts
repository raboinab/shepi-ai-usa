import { useHead } from "@unhead/react";

interface SEOProps {
  title: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
  ogImage?: string;
  ogType?: string;
}

/**
 * Per-page SEO via @unhead/react. Works in both SSG (prerendered into raw HTML
 * for crawlers and social previews) and CSR (updates client-side on navigation).
 *
 * API is unchanged from the previous DOM-mutation implementation, so all
 * call sites continue to work without edits.
 */
export function useSEO({
  title,
  description,
  canonical,
  noindex = false,
  ogImage = "/og-image.png",
  ogType = "website",
}: SEOProps) {
  // Resolve absolute URLs. During SSG `window` is undefined, so we fall back to
  // the canonical prop (or the site root) — call sites should pass `canonical`
  // for routes where the path matters at prerender time.
  const absoluteImage = ogImage.startsWith("http")
    ? ogImage
    : `https://shepi.ai${ogImage}`;

  const isServer = (globalThis as any).__IS_SSG__ === true;
  const resolvedCanonical =
    canonical ||
    (!isServer && typeof window !== "undefined"
      ? `https://shepi.ai${window.location.pathname}`
      : "https://shepi.ai/");

  const robotsContent = noindex ? "noindex, nofollow" : "index, follow";
  const googlebotContent = noindex
    ? "noindex, nofollow"
    : "index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1";

  useHead({
    title,
    link: [{ rel: "canonical", href: resolvedCanonical }],
    meta: [
      ...(description
        ? [
            { name: "description", content: description },
            { property: "og:description", content: description },
            { name: "twitter:description", content: description },
          ]
        : []),
      { name: "robots", content: robotsContent },
      { name: "googlebot", content: googlebotContent },
      { property: "og:title", content: title },
      { name: "twitter:title", content: title },
      { property: "og:type", content: ogType },
      { property: "og:url", content: resolvedCanonical },
      { name: "twitter:url", content: resolvedCanonical },
      { property: "og:image", content: absoluteImage },
      { name: "twitter:image", content: absoluteImage },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  });
}
