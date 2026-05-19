const SITE_ORIGIN = "https://shepi.ai";
function useBreadcrumbJsonLd(breadcrumbs, currentPath) {
  const homeItem = {
    "@type": "ListItem",
    position: 1,
    name: "Home",
    item: `${SITE_ORIGIN}/`
  };
  const items = breadcrumbs.map((b, i) => {
    const isLast = i === breadcrumbs.length - 1;
    const href = b.href ?? (isLast && currentPath ? currentPath : void 0);
    const item = {
      "@type": "ListItem",
      position: i + 2,
      // +1 for Home, +1 because positions are 1-indexed
      name: b.label
    };
    if (href) {
      item.item = href.startsWith("http") ? href : `${SITE_ORIGIN}${href}`;
    }
    return item;
  });
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [homeItem, ...items]
  };
}
export {
  useBreadcrumbJsonLd as u
};
