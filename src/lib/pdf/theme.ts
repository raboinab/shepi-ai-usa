/**
 * PDF Slide-Deck Theme Constants — Navy Trust palette.
 * Shared with in-app workbook tokens in src/index.css so screen + PDF + XLSX align.
 */

export const PDF_COLORS = {
  // Navy Trust palette
  darkBlue: "#0F1B3D",   // deep navy — headers, cover, accents
  midBlue: "#264A66",    // section headers
  lightBlue: "#4A7FA3",  // interactive / link accent
  teal: "#C9A84C",       // (kept name for compatibility) — now gold accent
  gold: "#C9A84C",
  sand: "#E2D4BE",       // warm sand — highlight rows
  cream: "#F5F2EC",      // page rule / soft surfaces

  // Neutrals
  white: "#FFFFFF",
  offWhite: "#FAF7F1",   // zebra alt row
  lightGray: "#E8E2D5",
  midGray: "#7A7466",
  darkGray: "#2A2A2A",
  black: "#0A0A0A",

  // Status
  green: "#1E7A4D",
  red: "#B23A3A",
  amber: "#C9A84C",
} as const;

export const PDF_FONTS = {
  heading: "'Fraunces', 'Lora', Georgia, 'Times New Roman', serif",
  body: "'Inter Tight', 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
} as const;

export const SLIDE_DIMENSIONS = {
  width: 1920,
  height: 1080,
  padding: 72,
  headerHeight: 64,
  footerHeight: 44,
} as const;

/** Content area after accounting for padding + header + footer */
export const CONTENT_AREA = {
  x: SLIDE_DIMENSIONS.padding,
  y: SLIDE_DIMENSIONS.padding + SLIDE_DIMENSIONS.headerHeight,
  width: SLIDE_DIMENSIONS.width - SLIDE_DIMENSIONS.padding * 2,
  height:
    SLIDE_DIMENSIONS.height -
    SLIDE_DIMENSIONS.padding * 2 -
    SLIDE_DIMENSIONS.headerHeight -
    SLIDE_DIMENSIONS.footerHeight,
} as const;
