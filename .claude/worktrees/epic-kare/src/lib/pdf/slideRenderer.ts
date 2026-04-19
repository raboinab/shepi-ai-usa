/**
 * Off-screen rendering pipeline: mounts React slide components,
 * captures them as PNGs via html-to-image, and assembles into jsPDF.
 */
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { createRoot } from "react-dom/client";
import { createElement } from "react";
import { SLIDE_DIMENSIONS } from "./theme";
import type { GenerateReportOptions, SlideProps } from "./reportTypes";

const QUALITY = 2; // 2x resolution for sharp output

/**
 * Render a single React slide component to a PNG data URL.
 */
async function renderSlideToImage(
  SlideComponent: React.ComponentType<SlideProps>,
  props: SlideProps
): Promise<string> {
  // Create container: on-screen but visually hidden so browser still paints it
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "0";
  container.style.width = `${SLIDE_DIMENSIONS.width}px`;
  container.style.height = `${SLIDE_DIMENSIONS.height}px`;
  container.style.overflow = "hidden";
  container.style.pointerEvents = "none";
  container.style.zIndex = "-1";
  document.body.appendChild(container);

  // Mount React component
  const root = createRoot(container);
  root.render(createElement(SlideComponent, { ...props, key: "slide" }));

  // Wait for React commit + browser paint (double-rAF + delay)
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 300);
      });
    });
  });

  // Capture to PNG with retry for resilience
  let dataUrl: string | undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      dataUrl = await toPng(container, {
        width: SLIDE_DIMENSIONS.width,
        height: SLIDE_DIMENSIONS.height,
        pixelRatio: QUALITY,
        cacheBust: true,
      });
      break;
    } catch (err) {
      if (attempt === 2) throw err;
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  // Cleanup
  root.unmount();
  document.body.removeChild(container);

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

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    onProgress?.(i + 1, slides.length, slide.title);

    const props: SlideProps = {
      metadata,
      pageNumber: i + 1,
      totalPages: slides.length,
      data: {},
    };

    const imageData = await renderSlideToImage(slide.component, props);

    if (i > 0) {
      pdf.addPage([SLIDE_DIMENSIONS.width, SLIDE_DIMENSIONS.height], "landscape");
    }

    pdf.addImage(imageData, "PNG", 0, 0, SLIDE_DIMENSIONS.width, SLIDE_DIMENSIONS.height);
  }

  const fileName = `${metadata.companyName.replace(/\s+/g, "_")}_Diligence_Report_${metadata.reportDate}.pdf`;
  pdf.save(fileName);
}
