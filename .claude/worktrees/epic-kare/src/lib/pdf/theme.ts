/**
 * PDF Slide-Deck Theme Constants
 * Colors, spacing, and brand settings matching the diligence report style.
 */

export const PDF_COLORS = {
  // Primary palette
  darkBlue: "#0c2d48",
  midBlue: "#1a4d7c",
  lightBlue: "#3a7bbf",
  teal: "#2ca5a5",
  gold: "#d4a843",

  // Neutrals
  white: "#ffffff",
  offWhite: "#f8f9fa",
  lightGray: "#e9ecef",
  midGray: "#6c757d",
  darkGray: "#343a40",
  black: "#000000",

  // Status
  green: "#28a745",
  red: "#dc3545",
  amber: "#ffc107",
} as const;

export const PDF_FONTS = {
  heading: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
  body: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
} as const;

export const SLIDE_DIMENSIONS = {
  width: 1920,
  height: 1080,
  padding: 60,
  headerHeight: 80,
  footerHeight: 50,
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
