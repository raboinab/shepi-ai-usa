/**
 * Excel workbook export — Navy Trust styled deliverable.
 * Delegates to buildStyledWorkbook for full ExcelJS styling.
 */
import type { DealData } from "./workbook-types";
import { buildStyledWorkbook } from "./buildStyledWorkbook";
import { fetchDocumentSources } from "./workbook-grid-builders";
import type { ProofOfCashBankData } from "./workbook-grid-builders";
import type { DocSourceItem } from "./workbook-grid-builders/buildDataSourcesGrid";
import { derivePriorBalances } from "./derivePriorBalances";
import { fetchProofOfCashBankData } from "./fetchPocBankData";

interface ExportOptions {
  dealData: DealData;
  projectId?: string;
  filename?: string;
  onProgress?: (current: number, total: number, label: string) => void;
}

export async function exportWorkbookXlsx({ dealData, projectId, filename, onProgress }: ExportOptions): Promise<void> {
  onProgress?.(1, 3, "Preparing data");

  const resolvedProjectId = projectId || dealData.deal.projectId;
  if (resolvedProjectId && !dealData.deal.priorBalances) {
    const priorBalances = await derivePriorBalances(
      resolvedProjectId,
      dealData.trialBalance,
      dealData.deal.periods
    );
    if (Object.keys(priorBalances).length > 0) {
      dealData.deal.priorBalances = priorBalances;
    }
  }

  let pocBankData: ProofOfCashBankData | undefined;
  let docSources: DocSourceItem[] | undefined;
  if (resolvedProjectId) {
    const [bankData, sources] = await Promise.all([
      fetchProofOfCashBankData(resolvedProjectId),
      fetchDocumentSources(resolvedProjectId),
    ]);
    pocBankData = bankData;
    docSources = sources;
  }

  onProgress?.(2, 3, "Styling workbook");
  const wb = await buildStyledWorkbook({ dealData, pocBankData, docSources });

  onProgress?.(3, 3, "Saving file");
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const companyName = dealData.deal.targetCompany || dealData.deal.projectName || "Company";
  const safeName = companyName.replace(/[^a-zA-Z0-9_\- ]/g, "").trim();
  const outputFilename = filename || `${safeName}_QoE_Workbook.xlsx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = outputFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
