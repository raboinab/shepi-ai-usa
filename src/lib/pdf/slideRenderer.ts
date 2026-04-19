/**
 * Off-screen rendering pipeline: mounts React slide components,
 * captures them as PNGs via html-to-image, and assembles into jsPDF.
 *
 * Optimised: reused container, PNG for crisp text, batch rendering.
 */
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { createRoot } from "react-dom/client";
import { createElement } from "react";
import { SLIDE_DIMENSIONS } from "./theme";
import type { GenerateReportOptions, SlideProps } from "./reportTypes";

const QUALITY = 2; // 2x for crisp text on financial tables

/** Minimal wait for React commit + browser paint. */
function waitForPaint(): Promise<void> {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 80);
      });
    });
  });
}

/**
 * Create a shared off-screen container (reused across slides).
 * Full opacity so html-to-image captures correctly; hidden via off-screen positioning.
 */
function createSlideContainer(): HTMLDivElement {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "0";
  container.style.zIndex = "-9999";
  container.style.background = "white";
  container.style.width = `${SLIDE_DIMENSIONS.width}px`;
  container.style.height = `${SLIDE_DIMENSIONS.height}px`;
  container.style.overflow = "hidden";
  container.style.pointerEvents = "none";
  container.style.zIndex = "-1";
  container.style.opacity = "1";
  document.body.appendChild(container);
  return container;
}

/**
 * Render a single React slide component to a PNG data URL.
 */
async function renderSlideToImage(
  container: HTMLDivElement,
  SlideComponent: React.ComponentType<SlideProps>,
  props: SlideProps
): Promise<string> {
  const root = createRoot(container);
  root.render(createElement(SlideComponent, { ...props, key: `slide-${props.pageNumber}` }));

  await waitForPaint();

  let dataUrl: string | undefined;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      dataUrl = await toPng(container, {
        width: SLIDE_DIMENSIONS.width,
        height: SLIDE_DIMENSIONS.height,
        pixelRatio: QUALITY,
        cacheBust: false,
        skipAutoScale: true,
      });
      break;
    } catch (err) {
      if (attempt === 1) throw err;
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  root.unmount();
  return dataUrl!;
}

/**
 * Generate a full landscape PDF from an array of slide definitions.
 */
export async function generatePDF(options: GenerateReportOptions): Promise<void> {
  const { metadata, slides, onProgress } = options;

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [SLIDE_DIMENSIONS.width, SLIDE_DIMENSIONS.height],
    compress: true,
  });

  const container = createSlideContainer();

  try {
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      onProgress?.(i + 1, slides.length, slide.title);

      const props: SlideProps = {
        metadata,
        pageNumber: i + 1,
        totalPages: slides.length,
        data: {},
      };

      const imageData = await renderSlideToImage(container, slide.component, props);

      if (i > 0) {
        pdf.addPage([SLIDE_DIMENSIONS.width, SLIDE_DIMENSIONS.height], "landscape");
      }

      pdf.addImage(imageData, "PNG", 0, 0, SLIDE_DIMENSIONS.width, SLIDE_DIMENSIONS.height, undefined, "FAST");
    }

    const fileName = `${metadata.companyName.replace(/\s+/g, "_")}_Diligence_Report_${metadata.reportDate}.pdf`;
    pdf.save(fileName);
  } finally {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  }
}
