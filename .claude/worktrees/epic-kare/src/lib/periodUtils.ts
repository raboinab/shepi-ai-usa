export interface Period {
  id: string;           // "2022-01" 
  label: string;        // "Jan 2022"
  year: number;         // 2022
  month: number;        // 1
  isStub?: boolean;     // true for partial periods
  startDate?: string;   // For stub periods: "2024-10-01"
  endDate?: string;     // For stub periods: "2024-12-31"
}

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
] as const;

export const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
] as const;

export function generatePeriods(
  startMonth: number,
  startYear: number,
  endMonth: number,
  endYear: number
): Period[] {
  const periods: Period[] = [];
  
  let currentYear = startYear;
  let currentMonth = startMonth;
  
  while (
    currentYear < endYear || 
    (currentYear === endYear && currentMonth <= endMonth)
  ) {
    const shortYear = String(currentYear).slice(-2);
    periods.push({
      id: `${currentYear}-${String(currentMonth).padStart(2, '0')}`,
      label: `${SHORT_MONTHS[currentMonth - 1]}-${shortYear}`,
      year: currentYear,
      month: currentMonth,
    });
    
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
  }
  
  return periods;
}

/** @deprecated Use createStubPeriods (plural) instead */
export function createStubPeriod(startDate: Date, endDate: Date): Period {
  const startMonth = SHORT_MONTHS[startDate.getMonth()];
  const endMonth = SHORT_MONTHS[endDate.getMonth()];
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  
  const label = startYear === endYear 
    ? `${startMonth}-${endMonth} ${endYear} (Stub)`
    : `${startMonth} ${startYear}-${endMonth} ${endYear} (Stub)`;
  
  const fmtDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return {
    id: `stub-${fmtDate(startDate)}`,
    label,
    year: endYear,
    month: endDate.getMonth() + 1,
    isStub: true,
    startDate: fmtDate(startDate),
    endDate: fmtDate(endDate),
  };
}

/**
 * Generate individual monthly stub periods for a date range.
 * Each month gets its own period marked with isStub: true.
 */
export function createStubPeriods(startDate: Date, endDate: Date): Period[] {
  const periods: Period[] = [];
  let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (current <= end) {
    const year = current.getFullYear();
    const month = current.getMonth() + 1;
    const shortYear = String(year).slice(-2);
    periods.push({
      id: `stub-${year}-${String(month).padStart(2, '0')}`,
      label: `${SHORT_MONTHS[month - 1]}-${shortYear}`,
      year,
      month,
      isStub: true,
      startDate: `${year}-${String(month).padStart(2, '0')}-01`,
      endDate: `${year}-${String(month).padStart(2, '0')}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`,
    });
    current.setMonth(current.getMonth() + 1);
  }
  return periods;
}

export function formatStubDateRange(startDate: Date | null, endDate: Date | null): string {
  if (!startDate || !endDate) return "";
  const format = (d: Date) => `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  return `${format(startDate)} - ${format(endDate)}`;
}

export function getYearRange(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  // Only allow years up to current year (no future years since QuickBooks can't sync future data)
  for (let year = currentYear - 10; year <= currentYear; year++) {
    years.push(year);
  }
  return years;
}

/**
 * Get the maximum allowed end month based on the selected end year
 * If end year is current year, only allow up to current month
 */
export function getMaxEndMonth(endYear: number): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed
  
  if (endYear === currentYear) {
    return currentMonth;
  }
  return 12; // Past years can use any month
}

/**
 * Check if a period selection is in the future
 */
export function isFuturePeriod(month: number, year: number): boolean {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  if (year > currentYear) return true;
  if (year === currentYear && month > currentMonth) return true;
  return false;
}

export function formatPeriodRange(periods: Period[]): string {
  if (periods.length === 0) return "No periods selected";
  const regularPeriods = periods.filter(p => !p.isStub);
  if (regularPeriods.length === 0) return "Stub period only";
  if (regularPeriods.length === 1) return regularPeriods[0].label;
  return `${regularPeriods[0].label} - ${regularPeriods[regularPeriods.length - 1].label}`;
}

// Convert legacy string array to Period objects
export function migrateLegacyPeriods(legacyPeriods: string[]): Period[] {
  return legacyPeriods.map((p, index) => ({
    id: `legacy-${index}`,
    label: p,
    year: 0,
    month: 0,
  }));
}
/** Parse "YYYY-MM-DD" as local-time Date to avoid UTC midnight mismatch */
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Coverage types based on document category
export type CoverageType = 'monthly' | 'annual' | 'point-in-time' | 'full-period' | 'none';

export interface DocumentCoverageConfig {
  type: CoverageType;
  label: string;
  description: string;
}

// Coverage validation types and functions
export interface CoverageResult {
  status: 'full' | 'partial' | 'none';
  coveredPeriods: Period[];
  missingPeriods: Period[];
  coveragePercentage: number;
}

export interface DocumentWithPeriod {
  period_start: string | null;
  period_end: string | null;
}

/**
 * Generate annual periods for coverage (e.g., tax returns)
 */
export function generateAnnualPeriods(startYear: number, endYear: number): Period[] {
  const periods: Period[] = [];
  for (let year = startYear; year <= endYear; year++) {
    periods.push({
      id: `${year}`,
      label: `${year}`,
      year,
      month: 12, // End of fiscal year
    });
  }
  return periods;
}

/**
 * Generate a single full-period marker (for documents covering entire range)
 */
export function generateFullPeriodMarker(
  startMonth: number,
  startYear: number,
  endMonth: number,
  endYear: number
): Period[] {
  return [{
    id: `full-${startYear}-${startMonth}-to-${endYear}-${endMonth}`,
    label: `${SHORT_MONTHS[startMonth - 1]} ${startYear} – ${SHORT_MONTHS[endMonth - 1]} ${endYear}`,
    year: endYear,
    month: endMonth,
    isStub: false,
  }];
}

/**
 * Calculate annual coverage (for tax returns)
 */
export function calculateAnnualCoverage(
  requiredYears: number[],
  documents: DocumentWithPeriod[]
): CoverageResult {
  if (requiredYears.length === 0) {
    return { status: 'full', coveredPeriods: [], missingPeriods: [], coveragePercentage: 100 };
  }

  const validDocs = documents.filter(d => d.period_start && d.period_end);
  
  if (validDocs.length === 0) {
    const missingPeriods = requiredYears.map(year => ({
      id: `${year}`,
      label: `${year}`,
      year,
      month: 12,
    }));
    return { status: 'none', coveredPeriods: [], missingPeriods, coveragePercentage: 0 };
  }

  const coveredPeriods: Period[] = [];
  const missingPeriods: Period[] = [];

  for (const year of requiredYears) {
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);

    const isCovered = validDocs.some(doc => {
      const docStart = parseLocalDate(doc.period_start!);
      const docEnd = parseLocalDate(doc.period_end!);
      // Year is covered if document range overlaps with the calendar year
      return docStart <= yearEnd && docEnd >= yearStart;
    });

    const period: Period = { id: `${year}`, label: `${year}`, year, month: 12 };
    if (isCovered) {
      coveredPeriods.push(period);
    } else {
      missingPeriods.push(period);
    }
  }

  const coveragePercentage = Math.round((coveredPeriods.length / requiredYears.length) * 100);
  
  let status: 'full' | 'partial' | 'none';
  if (missingPeriods.length === 0) {
    status = 'full';
  } else if (coveredPeriods.length === 0) {
    status = 'none';
  } else {
    status = 'partial';
  }

  return { status, coveredPeriods, missingPeriods, coveragePercentage };
}

/**
 * Calculate point-in-time coverage (just checks if any document exists)
 */
export function calculatePointInTimeCoverage(
  documents: DocumentWithPeriod[]
): CoverageResult {
  const hasDocument = documents.length > 0;
  return {
    status: hasDocument ? 'full' : 'none',
    coveredPeriods: [],
    missingPeriods: [],
    coveragePercentage: hasDocument ? 100 : 0,
  };
}

/**
 * Calculate full-period coverage (checks if documents cover entire range)
 */
export function calculateFullPeriodCoverage(
  startMonth: number,
  startYear: number,
  endMonth: number,
  endYear: number,
  documents: DocumentWithPeriod[]
): CoverageResult {
  const validDocs = documents.filter(d => d.period_start && d.period_end);

  if (validDocs.length === 0) {
    const marker = generateFullPeriodMarker(startMonth, startYear, endMonth, endYear);
    return { status: 'none', coveredPeriods: [], missingPeriods: marker, coveragePercentage: 0 };
  }

  const rangeStart = new Date(startYear, startMonth - 1, 1);
  const rangeEnd = new Date(endYear, endMonth, 0);

  // Check single-doc coverage first (fast path)
  const singleDocCovers = validDocs.some(doc => {
    const docStart = parseLocalDate(doc.period_start!);
    const docEnd = parseLocalDate(doc.period_end!);
    return docStart <= rangeStart && docEnd >= rangeEnd;
  });

  const marker = generateFullPeriodMarker(startMonth, startYear, endMonth, endYear);

  if (singleDocCovers) {
    return { status: 'full', coveredPeriods: marker, missingPeriods: [], coveragePercentage: 100 };
  }

  // Merge overlapping/adjacent document ranges and check combined coverage
  const sorted = validDocs
    .map(d => ({ start: parseLocalDate(d.period_start!), end: parseLocalDate(d.period_end!) }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const merged: { start: Date; end: Date }[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const next = sorted[i];
    // Allow 1-day gap tolerance for adjacent ranges
    const gapMs = next.start.getTime() - last.end.getTime();
    if (gapMs <= 86400000) {  // 1 day in ms
      last.end = next.end > last.end ? next.end : last.end;
    } else {
      merged.push({ start: next.start, end: next.end });
    }
  }

  const combinedCovers = merged.some(
    span => span.start <= rangeStart && span.end >= rangeEnd
  );

  if (combinedCovers) {
    return { status: 'full', coveredPeriods: marker, missingPeriods: [], coveragePercentage: 100 };
  }

  return { status: 'partial', coveredPeriods: [], missingPeriods: marker, coveragePercentage: 50 };
}

/**
 * Calculate which periods are covered by the given documents
 */
export function calculatePeriodCoverage(
  requiredPeriods: Period[],
  documents: DocumentWithPeriod[]
): CoverageResult {
  if (requiredPeriods.length === 0) {
    return { status: 'full', coveredPeriods: [], missingPeriods: [], coveragePercentage: 100 };
  }

  const validDocs = documents.filter(d => d.period_start && d.period_end);
  
  if (validDocs.length === 0) {
    return { status: 'none', coveredPeriods: [], missingPeriods: requiredPeriods, coveragePercentage: 0 };
  }

  const coveredPeriods: Period[] = [];
  const missingPeriods: Period[] = [];

  for (const period of requiredPeriods) {
    const periodStart = new Date(period.year, period.month - 1, 1);
    const periodEnd = new Date(period.year, period.month, 0); // Last day of month

    const isCovered = validDocs.some(doc => {
      const docStart = parseLocalDate(doc.period_start!);
      const docEnd = parseLocalDate(doc.period_end!);
      // Period is covered if document range overlaps with the period
      return docStart <= periodEnd && docEnd >= periodStart;
    });

    if (isCovered) {
      coveredPeriods.push(period);
    } else {
      missingPeriods.push(period);
    }
  }

  const coveragePercentage = Math.round((coveredPeriods.length / requiredPeriods.length) * 100);
  
  let status: 'full' | 'partial' | 'none';
  if (missingPeriods.length === 0) {
    status = 'full';
  } else if (coveredPeriods.length === 0) {
    status = 'none';
  } else {
    status = 'partial';
  }

  return { status, coveredPeriods, missingPeriods, coveragePercentage };
}

/**
 * Group consecutive missing periods for display
 */
export function groupConsecutivePeriods(periods: Period[]): string[] {
  if (periods.length === 0) return [];
  
  const sorted = [...periods].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  const groups: string[] = [];
  let rangeStart = sorted[0];
  let rangeEnd = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const prev = sorted[i - 1];
    
    // Check if consecutive
    const isConsecutive = 
      (current.year === prev.year && current.month === prev.month + 1) ||
      (current.year === prev.year + 1 && current.month === 1 && prev.month === 12);

    if (isConsecutive) {
      rangeEnd = current;
    } else {
      // End current range, start new one
      groups.push(rangeStart.label === rangeEnd.label ? rangeStart.label : `${rangeStart.label} - ${rangeEnd.label}`);
      rangeStart = current;
      rangeEnd = current;
    }
  }

  // Push final range
  groups.push(rangeStart.label === rangeEnd.label ? rangeStart.label : `${rangeStart.label} - ${rangeEnd.label}`);

  return groups;
}
