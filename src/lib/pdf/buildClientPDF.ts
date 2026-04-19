/**
 * Thin wrapper that spawns the PDF Web Worker, sends data, and returns a Blob.
 * The worker runs pdf-lib off the main thread — no UI blocking.
 */
import type { PDFReportData } from "./pdfWorker";

export interface PDFProgress {
  page: number;
  total: number;
}

export function buildClientPDF(
  reportData: PDFReportData,
  onProgress?: (p: PDFProgress) => void,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("./pdfWorker.ts", import.meta.url),
      { type: "module" },
    );

    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data;
      if (msg.type === "progress" && onProgress) {
        onProgress({ page: msg.page, total: msg.total });
      } else if (msg.type === "done") {
        const blob = new Blob([msg.pdf], { type: "application/pdf" });
        worker.terminate();
        resolve(blob);
      } else if (msg.type === "error") {
        worker.terminate();
        reject(new Error(msg.message));
      }
    };

    worker.onerror = (err) => {
      worker.terminate();
      reject(new Error(err.message || "Worker error"));
    };

    worker.postMessage({ type: "build", payload: reportData });
  });
}
