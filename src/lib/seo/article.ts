/**
 * Shared article metadata for guides, use-cases, and compare pages.
 *
 * Central source of truth for:
 *   - Named author (Person schema) — E-E-A-T signal for YMYL topics
 *   - dateModified — refreshed on every build via __BUILD_DATE__
 *
 * ContentPageLayout auto-applies both to any Article JSON-LD passed in,
 * and renders a matching visible byline. Individual guide files do not
 * need to reference this module directly.
 */

// Injected by Vite `define` in vite.config.ts (ISO YYYY-MM-DD).
// Falls back to today at runtime if the define isn't present (dev tooling).
declare const __BUILD_DATE__: string;
export const BUILD_DATE: string =
  typeof __BUILD_DATE__ !== "undefined"
    ? __BUILD_DATE__
    : new Date().toISOString().slice(0, 10);

export interface AuthorSchema {
  "@type": "Person" | "Organization";
  name: string;
  url?: string;
  description?: string;
  jobTitle?: string;
  worksFor?: {
    "@type": "Organization";
    name: string;
    url: string;
  };
}

/**
 * Named editorial author for guide/compare/use-case content.
 * Person-typed (rather than Organization) so search engines and LLMs
 * treat it as authored content, satisfying E-E-A-T requirements for
 * financial (YMYL) topics.
 */
export const SHEPI_AUTHOR: AuthorSchema = {
  "@type": "Person",
  name: "Shepi Editorial Team",
  url: "https://shepi.ai/about",
  description:
    "The Shepi Editorial Team writes Quality of Earnings and financial due-diligence guides for the M&A community, drawing on CPA-reviewed adjustments processed through the Shepi platform.",
  jobTitle: "Editorial Team",
  worksFor: {
    "@type": "Organization",
    name: "Shepi",
    url: "https://shepi.ai",
  },
};

export const SHEPI_AUTHOR_BYLINE = SHEPI_AUTHOR.name;

/**
 * Normalize an Article-like JSON-LD object so it carries:
 *   - a named Person author (if missing or Organization)
 *   - a fresh dateModified (BUILD_DATE) if not explicitly newer
 *   - a publisher (defaults to Shepi Organization)
 *
 * Non-Article schema types (BreadcrumbList, FAQPage, etc.) pass through.
 */
export function normalizeArticleJsonLd<T extends Record<string, unknown>>(node: T): T {
  const type = node["@type"];
  const isArticle =
    type === "Article" ||
    type === "NewsArticle" ||
    type === "BlogPosting" ||
    type === "TechArticle";
  if (!isArticle) return node;

  const existingAuthor = node.author as { "@type"?: string } | undefined;
  const needsAuthor = !existingAuthor || existingAuthor["@type"] !== "Person";

  const existingModified = typeof node.dateModified === "string" ? node.dateModified : "";
  // Take the later of the hardcoded value and the current build date.
  const dateModified = existingModified > BUILD_DATE ? existingModified : BUILD_DATE;

  return {
    ...node,
    ...(needsAuthor ? { author: SHEPI_AUTHOR } : {}),
    dateModified,
    publisher: node.publisher ?? {
      "@type": "Organization",
      name: "Shepi",
      url: "https://shepi.ai",
      logo: {
        "@type": "ImageObject",
        url: "https://shepi.ai/og-image.png",
      },
    },
  };
}
