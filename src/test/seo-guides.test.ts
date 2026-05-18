import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * SEO regression guard. Prevents a repeat of the title-truncation incident
 * where ~12 guide pages had their seoTitle/seoDescription chopped mid-word
 * (e.g. "Calculation & | Shepi"), tanking CTR.
 *
 * Rules enforced on every src/pages/guides/*.tsx:
 *   - seoTitle present, ends with "| Shepi", ≤ 60 chars, no mid-word truncation
 *   - seoDescription present, 80–160 chars, ends with proper punctuation
 */

const GUIDES_DIR = join(process.cwd(), "src/pages/guides");

// Match seoTitle="..." or seoTitle='...' or seoTitle={"..."} — quote-aware so
// apostrophes inside double-quoted strings don't terminate the match early.
const TITLE_RE = /seoTitle=\{?(?:"([^"]+)"|'([^']+)')\}?/;
const DESC_RE = /seoDescription=\{?(?:"([^"]+)"|'([^']+)')\}?/;

const guideFiles = readdirSync(GUIDES_DIR).filter((f) => f.endsWith(".tsx"));

describe("SEO metadata on guide pages", () => {
  it("has at least one guide file", () => {
    expect(guideFiles.length).toBeGreaterThan(0);
  });

  for (const file of guideFiles) {
    describe(file, () => {
      const src = readFileSync(join(GUIDES_DIR, file), "utf8");
      const titleMatch = src.match(TITLE_RE);
      const descMatch = src.match(DESC_RE);

      it("declares a seoTitle", () => {
        expect(titleMatch, `${file} is missing seoTitle`).toBeTruthy();
      });

      it("seoTitle ends with '| Shepi', is ≤ 60 chars, and isn't truncated mid-word", () => {
        const title = (titleMatch?.[1] ?? titleMatch?.[2]) ?? "";
        expect(title).toMatch(/\| Shepi$/);
        expect(
          title.length,
          `${file} seoTitle is ${title.length} chars (max 60): "${title}"`
        ).toBeLessThanOrEqual(60);
        expect(
          title,
          `${file} seoTitle looks truncated mid-phrase: "${title}"`
        ).not.toMatch(/[\s][-—–&,:/+][\s]?\|\s*Shepi$/);
      });

      it("declares a seoDescription", () => {
        expect(descMatch, `${file} is missing seoDescription`).toBeTruthy();
      });

      it("seoDescription is 80–160 chars and ends with terminal punctuation", () => {
        const desc = (descMatch?.[1] ?? descMatch?.[2]) ?? "";
        expect(
          desc.length,
          `${file} seoDescription is ${desc.length} chars (want 80–160): "${desc}"`
        ).toBeGreaterThanOrEqual(80);
        expect(
          desc.length,
          `${file} seoDescription is ${desc.length} chars (want 80–160): "${desc}"`
        ).toBeLessThanOrEqual(160);
        expect(
          desc,
          `${file} seoDescription doesn't end cleanly: "${desc}"`
        ).toMatch(/[.!?]$/);
      });
    });
  }
});
