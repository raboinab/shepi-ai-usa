/**
 * Per-page SEO using React 19's native document metadata hoisting.
 *
 * React 19 automatically hoists <title>, <meta>, and <link> tags to <head>
 * regardless of where they are rendered in the tree. This works in both
 * renderToString (SSR/SSG prerender) and on the client during navigation.
 *
 * No HelmetProvider, no @unhead/react, no <Head> wrapper required. The tags
 * below are written exactly as React 19 expects and end up in the <head> of
 * the prerendered HTML for every route, so Googlebot and social crawlers see
 * per-page title / description / canonical / OG without executing JS.
 *
 * Why we do not use react-helmet-async or vite-react-ssg's <Head>:
 * - react-helmet-async@1.x peer-deps React <=18 and silently no-ops on React 19
 *   (its legacy-context child registration breaks).
 * - react-helmet-async@3.x changed the SSR context API in a way that crashes
 *   vite-react-ssg's extractHelmet().
 * - React 19's built-in metadata hoisting is the supported path forward and
 *   has zero dependencies.
 *
 * Usage — render this component (or the useSEO hook's return value) at the
 * top of any page:
 *
 *   return (
 *     <>
 *       <SEO title="..." description="..." canonical="..." />
 *       <main>...</main>
 *     </>
 *   );
 */

export interface SEOProps {
  title: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
  ogImage?: string;
  ogType?: string;
}

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
  const resolvedCanonical =
    canonical ||
    (typeof window !== "undefined"
      ? `https://shepi.ai${window.location.pathname}`
      : "https://shepi.ai/");

  const robotsContent = noindex ? "noindex, nofollow" : "index, follow";
  const googlebotContent = noindex
    ? "noindex, nofollow"
    : "index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1";

  return (
    <>
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
    </>
  );
}

/**
 * Backward-compat shim for legacy `useSEO({...})` call sites. Returns a
 * JSX fragment the caller MUST render. Call sites that ignore the return
 * value will silently emit no head tags. Prefer `<SEO {...props} />`.
 */
export function useSEO(props: SEOProps) {
  return <SEO {...props} />;
}
