/**
 * WIP Schedule grid builder for construction/project-based businesses.
 * Renders job-level contract tracking with computed % complete and over/under billing.
 */
import type { DealData, GridData, GridRow, GridColumn } from "../workbook-types";

export function buildWIPScheduleGrid(dealData: DealData): GridData {
  const jobs = dealData.wipSchedule?.jobs ?? [];

  const columns: GridColumn[] = [
    { key: "label", label: "Job / Project", width: 220, frozen: true, format: "text" },
    { key: "status", label: "Status", width: 80, format: "text" },
    { key: "contractValue", label: "Contract Value", width: 120, format: "currency" },
    { key: "costsToDate", label: "Costs to Date", width: 120, format: "currency" },
    { key: "billingsToDate", label: "Billings to Date", width: 120, format: "currency" },
    { key: "pctComplete", label: "% Complete", width: 90, format: "percent" },
    { key: "overUnder", label: "Over/(Under) Billing", width: 140, format: "currency" },
  ];

  const calcPctComplete = (contractValue: number, costsToDate: number) =>
    contractValue > 0 ? costsToDate / contractValue : 0;

  const calcOverUnder = (contractValue: number, costsToDate: number, billingsToDate: number) => {
    const pct = calcPctComplete(contractValue, costsToDate);
    const earnedRevenue = contractValue * pct;
    return billingsToDate - earnedRevenue;
  };

  const rows: GridRow[] = [
    { id: "hdr", type: "section-header", label: "WIP Schedule", cells: { label: "WIP Schedule" } },
    ...jobs.map((job) => {
      const pct = calcPctComplete(job.contractValue, job.costsToDate);
      const overUnder = calcOverUnder(job.contractValue, job.costsToDate, job.billingsToDate);
      return {
        id: `wip-${job.id}`,
        type: "data" as const,
        indent: 1,
        cells: {
          label: job.jobName,
          status: job.status ?? "active",
          contractValue: job.contractValue,
          costsToDate: job.costsToDate,
          billingsToDate: job.billingsToDate,
          pctComplete: pct,
          overUnder,
        },
      };
    }),
  ];

  // Totals
  const totalContract = jobs.reduce((s, j) => s + j.contractValue, 0);
  const totalCosts = jobs.reduce((s, j) => s + j.costsToDate, 0);
  const totalBillings = jobs.reduce((s, j) => s + j.billingsToDate, 0);
  const totalPct = totalContract > 0 ? totalCosts / totalContract : 0;
  const totalOverUnder = jobs.reduce(
    (s, j) => s + calcOverUnder(j.contractValue, j.costsToDate, j.billingsToDate),
    0
  );

  rows.push({
    id: "total",
    type: "total",
    cells: {
      label: "Total",
      status: "",
      contractValue: totalContract,
      costsToDate: totalCosts,
      billingsToDate: totalBillings,
      pctComplete: totalPct,
      overUnder: totalOverUnder,
    },
  });

  // Summary breakdown
  const totalOverBilled = jobs.reduce((s, j) => {
    const ou = calcOverUnder(j.contractValue, j.costsToDate, j.billingsToDate);
    return ou > 0 ? s + ou : s;
  }, 0);
  const totalUnderBilled = jobs.reduce((s, j) => {
    const ou = calcOverUnder(j.contractValue, j.costsToDate, j.billingsToDate);
    return ou < 0 ? s + ou : s;
  }, 0);

  rows.push(
    { id: "s1", type: "spacer", cells: {} },
    { id: "hdr-summary", type: "section-header", label: "Summary", cells: { label: "Summary" } },
    { id: "over-billed", type: "data", indent: 1, cells: { label: "Total Over-Billed (Contract Liabilities)", status: "", contractValue: null, costsToDate: null, billingsToDate: null, pctComplete: null, overUnder: totalOverBilled } },
    { id: "under-billed", type: "data", indent: 1, cells: { label: "Total Under-Billed (Contract Assets)", status: "", contractValue: null, costsToDate: null, billingsToDate: null, pctComplete: null, overUnder: totalUnderBilled } },
    { id: "net", type: "total", cells: { label: "Net Over/(Under) Billing", status: "", contractValue: null, costsToDate: null, billingsToDate: null, pctComplete: null, overUnder: totalOverUnder } },
  );

  return { columns, rows, frozenColumns: 1 };
}

/** Compute WIP aggregates from dealData for use in other grids/insights */
export function computeWIPAggregates(dealData: DealData) {
  const jobs = dealData.wipSchedule?.jobs ?? [];
  if (jobs.length === 0) return null;

  const calcOverUnder = (j: typeof jobs[0]) => {
    const pct = j.contractValue > 0 ? j.costsToDate / j.contractValue : 0;
    return j.billingsToDate - j.contractValue * pct;
  };

  const totalContract = jobs.reduce((s, j) => s + j.contractValue, 0);
  let totalOverBilled = 0;
  let totalUnderBilled = 0;
  for (const j of jobs) {
    const ou = calcOverUnder(j);
    if (ou > 0) totalOverBilled += ou;
    else totalUnderBilled += ou;
  }
  const netOverUnder = totalOverBilled + totalUnderBilled;
  const highConcentrationJob = jobs.reduce((max, j) => j.contractValue > max.contractValue ? j : max, jobs[0]);
  const concentrationPct = totalContract > 0 ? (highConcentrationJob.contractValue / totalContract) * 100 : 0;
  const nearCompleteCount = jobs.filter(j => j.contractValue > 0 && j.costsToDate / j.contractValue > 0.9).length;

  return {
    totalContract,
    totalOverBilled,
    totalUnderBilled,
    netOverUnder,
    highConcentrationJob,
    concentrationPct,
    nearCompleteCount,
    jobCount: jobs.length,
  };
}
