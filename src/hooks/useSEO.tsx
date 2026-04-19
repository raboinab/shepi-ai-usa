import { Head } from "vite-react-ssg";

export interface SEOProps {
  title: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
  ogImage?: string;
  ogType?: string;
}

/**
 * Per-page SEO. Renders into the document <head> via vite-react-ssg's
 * native <Head> component (react-helmet-async under the hood). Tags are
 * collected during SSG prerender and serialized into static HTML for every
 * prerendered route, so Googlebot and social crawlers see per-page title /
 * description / canonical / OG without executing JS.
 *
 * Usage — render this component at the top of any page:
 *
 *   return (
 *     <>
 *       <SEO title="..." description="..." canonical="..." />
 *       <main>...</main>
 *     </>
 *   );
 */
export function SEO({
  title,
  description,
  canonical,
  noindex = false,
  ogImage = "/og-image.png",
  ogType = "website",
}: SEOProps) {
  const absoluteImage = ogImage.startsWith("http")
    ? ogImage
    : `https://shepi.ai${ogImage}`;

  // During prerender there is no `window`. Resolve canonical from the prop;
  // call sites should pass `canonical` for prerendered routes. On the client
  // we fall back to the current pathname.
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

  return (
    <Head>
      <title>{title}</title>
      <link rel="canonical" href={resolvedCanonical} />
      {description && <meta name="description" content={description} />}
      {description && <meta property="og:description" content={description} />}
      {description && <meta name="twitter:description" content={description} />}
      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content={googlebotContent} />
      <meta property="og:title" content={title} />
      <meta name="twitter:title" content={title} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={resolvedCanonical} />
      <meta name="twitter:url" content={resolvedCanonical} />
      <meta property="og:image" content={absoluteImage} />
      <meta name="twitter:image" content={absoluteImage} />
      <meta name="twitter:card" content="summary_large_image" />
    </Head>
  );
}

/**
 * Backward-compat shim for legacy `useSEO({...})` call sites. Returns a
 * JSX element the caller MUST render. Call sites that ignore the return
 * value will silently emit no head tags. Prefer `<SEO {...props} />`.
 */
export function useSEO(props: SEOProps) {
  return <SEO {...props} />;
}
