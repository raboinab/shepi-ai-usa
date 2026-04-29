/**
 * Build a Schema.org BreadcrumbList JSON-LD object from a breadcrumb array.
 *
 * Pass the result into useSEO({ jsonLd: ... }) so the breadcrumb structure
 * lands in the prerendered HTML alongside the visible breadcrumb UI. This is
 * the single source of truth for both — visible breadcrumbs and crawler
 * breadcrumbs are generated from the same array.
 *
 * The first item is always Home (https://shepi.ai/) — pages should pass the
 * trail starting from the section root (e.g. [{label:"Resources", href:"/resources"}, {label:"Quality of Earnings"}]).
 *
 * Pages without an `href` on the final entry will use the absolute current
 * URL as the item — best practice for the leaf page.
 */

const SITE_ORIGIN = "https://shepi.ai";

export interface BreadcrumbEntry {
  label: string;
  href?: string;
}

export function useBreadcrumbJsonLd(
  breadcrumbs: BreadcrumbEntry[],
  currentPath?: string
): object {
  const homeItem = {
    "@type": "ListItem",
    position: 1,
    name: "Home",
    item: `${SITE_ORIGIN}/`,
  };

  const items = breadcrumbs.map((b, i) => {
    const isLast = i === breadcrumbs.length - 1;
    const href =
      b.href ??
      (isLast && currentPath ? currentPath : undefined);
    const item: Record<string, unknown> = {
      "@type": "ListItem",
      position: i + 2, // +1 for Home, +1 because positions are 1-indexed
      name: b.label,
    };
    if (href) {
      item.item = href.startsWith("http") ? href : `${SITE_ORIGIN}${href}`;
    }
    return item;
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [homeItem, ...items],
  };
}
