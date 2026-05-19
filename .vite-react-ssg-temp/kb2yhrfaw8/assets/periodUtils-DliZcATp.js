const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];
const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];
function generatePeriods(startMonth, startYear, endMonth, endYear) {
  const periods = [];
  let currentYear = startYear;
  let currentMonth = startMonth;
  while (currentYear < endYear || currentYear === endYear && currentMonth <= endMonth) {
    const shortYear = String(currentYear).slice(-2);
    periods.push({
      id: `${currentYear}-${String(currentMonth).padStart(2, "0")}`,
      label: `${SHORT_MONTHS[currentMonth - 1]}-${shortYear}`,
      year: currentYear,
      month: currentMonth
    });
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
  }
  return periods;
}
function createStubPeriods(startDate, endDate) {
  const periods = [];
  let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  while (current <= end) {
    const year = current.getFullYear();
    const month = current.getMonth() + 1;
    const shortYear = String(year).slice(-2);
    periods.push({
      id: `stub-${year}-${String(month).padStart(2, "0")}`,
      label: `${SHORT_MONTHS[month - 1]}-${shortYear}`,
      year,
      month,
      isStub: true,
      startDate: `${year}-${String(month).padStart(2, "0")}-01`,
      endDate: `${year}-${String(month).padStart(2, "0")}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`
    });
    current.setMonth(current.getMonth() + 1);
  }
  return periods;
}
function getYearRange() {
  const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  const years = [];
  for (let year = currentYear - 10; year <= currentYear; year++) {
    years.push(year);
  }
  return years;
}
function getMaxEndMonth(endYear) {
  const now = /* @__PURE__ */ new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  if (endYear === currentYear) {
    return currentMonth;
  }
  return 12;
}
function formatPeriodRange(periods) {
  if (periods.length === 0) return "No periods selected";
  const regularPeriods = periods.filter((p) => !p.isStub);
  if (regularPeriods.length === 0) return "Stub period only";
  if (regularPeriods.length === 1) return regularPeriods[0].label;
  return `${regularPeriods[0].label} - ${regularPeriods[regularPeriods.length - 1].label}`;
}
function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function generateAnnualPeriods(startYear, endYear) {
  const periods = [];
  for (let year = startYear; year <= endYear; year++) {
    periods.push({
      id: `${year}`,
      label: `${year}`,
      year,
      month: 12
      // End of fiscal year
    });
  }
  return periods;
}
function generateFullPeriodMarker(startMonth, startYear, endMonth, endYear) {
  return [{
    id: `full-${startYear}-${startMonth}-to-${endYear}-${endMonth}`,
    label: `${SHORT_MONTHS[startMonth - 1]} ${startYear} – ${SHORT_MONTHS[endMonth - 1]} ${endYear}`,
    year: endYear,
    month: endMonth,
    isStub: false
  }];
}
function calculateAnnualCoverage(requiredYears, documents) {
  if (requiredYears.length === 0) {
    return { status: "full", coveredPeriods: [], missingPeriods: [], coveragePercentage: 100 };
  }
  const validDocs = documents.filter((d) => d.period_start && d.period_end);
  if (validDocs.length === 0) {
    const missingPeriods2 = requiredYears.map((year) => ({
      id: `${year}`,
      label: `${year}`,
      year,
      month: 12
    }));
    return { status: "none", coveredPeriods: [], missingPeriods: missingPeriods2, coveragePercentage: 0 };
  }
  const coveredPeriods = [];
  const missingPeriods = [];
  for (const year of requiredYears) {
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);
    const isCovered = validDocs.some((doc) => {
      const docStart = parseLocalDate(doc.period_start);
      const docEnd = parseLocalDate(doc.period_end);
      return docStart <= yearEnd && docEnd >= yearStart;
    });
    const period = { id: `${year}`, label: `${year}`, year, month: 12 };
    if (isCovered) {
      coveredPeriods.push(period);
    } else {
      missingPeriods.push(period);
    }
  }
  const coveragePercentage = Math.round(coveredPeriods.length / requiredYears.length * 100);
  let status;
  if (missingPeriods.length === 0) {
    status = "full";
  } else if (coveredPeriods.length === 0) {
    status = "none";
  } else {
    status = "partial";
  }
  return { status, coveredPeriods, missingPeriods, coveragePercentage };
}
function calculatePointInTimeCoverage(documents) {
  const hasDocument = documents.length > 0;
  return {
    status: hasDocument ? "full" : "none",
    coveredPeriods: [],
    missingPeriods: [],
    coveragePercentage: hasDocument ? 100 : 0
  };
}
function calculateFullPeriodCoverage(startMonth, startYear, endMonth, endYear, documents) {
  const validDocs = documents.filter((d) => d.period_start && d.period_end);
  if (validDocs.length === 0) {
    const marker2 = generateFullPeriodMarker(startMonth, startYear, endMonth, endYear);
    return { status: "none", coveredPeriods: [], missingPeriods: marker2, coveragePercentage: 0 };
  }
  const rangeStart = new Date(startYear, startMonth - 1, 1);
  const rangeEnd = new Date(endYear, endMonth, 0);
  const singleDocCovers = validDocs.some((doc) => {
    const docStart = parseLocalDate(doc.period_start);
    const docEnd = parseLocalDate(doc.period_end);
    return docStart <= rangeStart && docEnd >= rangeEnd;
  });
  const marker = generateFullPeriodMarker(startMonth, startYear, endMonth, endYear);
  if (singleDocCovers) {
    return { status: "full", coveredPeriods: marker, missingPeriods: [], coveragePercentage: 100 };
  }
  const sorted = validDocs.map((d) => ({ start: parseLocalDate(d.period_start), end: parseLocalDate(d.period_end) })).sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const next = sorted[i];
    const gapMs = next.start.getTime() - last.end.getTime();
    if (gapMs <= 864e5) {
      last.end = next.end > last.end ? next.end : last.end;
    } else {
      merged.push({ start: next.start, end: next.end });
    }
  }
  const combinedCovers = merged.some(
    (span) => span.start <= rangeStart && span.end >= rangeEnd
  );
  if (combinedCovers) {
    return { status: "full", coveredPeriods: marker, missingPeriods: [], coveragePercentage: 100 };
  }
  return { status: "partial", coveredPeriods: [], missingPeriods: marker, coveragePercentage: 50 };
}
function calculatePeriodCoverage(requiredPeriods, documents) {
  if (requiredPeriods.length === 0) {
    return { status: "full", coveredPeriods: [], missingPeriods: [], coveragePercentage: 100 };
  }
  const validDocs = documents.filter((d) => d.period_start && d.period_end);
  if (validDocs.length === 0) {
    return { status: "none", coveredPeriods: [], missingPeriods: requiredPeriods, coveragePercentage: 0 };
  }
  const coveredPeriods = [];
  const missingPeriods = [];
  for (const period of requiredPeriods) {
    const periodStart = new Date(period.year, period.month - 1, 1);
    const periodEnd = new Date(period.year, period.month, 0);
    const isCovered = validDocs.some((doc) => {
      const docStart = parseLocalDate(doc.period_start);
      const docEnd = parseLocalDate(doc.period_end);
      return docStart <= periodEnd && docEnd >= periodStart;
    });
    if (isCovered) {
      coveredPeriods.push(period);
    } else {
      missingPeriods.push(period);
    }
  }
  const coveragePercentage = Math.round(coveredPeriods.length / requiredPeriods.length * 100);
  let status;
  if (missingPeriods.length === 0) {
    status = "full";
  } else if (coveredPeriods.length === 0) {
    status = "none";
  } else {
    status = "partial";
  }
  return { status, coveredPeriods, missingPeriods, coveragePercentage };
}
function groupConsecutivePeriods(periods) {
  if (periods.length === 0) return [];
  const sorted = [...periods].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });
  const groups = [];
  let rangeStart = sorted[0];
  let rangeEnd = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const prev = sorted[i - 1];
    const isConsecutive = current.year === prev.year && current.month === prev.month + 1 || current.year === prev.year + 1 && current.month === 1 && prev.month === 12;
    if (isConsecutive) {
      rangeEnd = current;
    } else {
      groups.push(rangeStart.label === rangeEnd.label ? rangeStart.label : `${rangeStart.label} - ${rangeEnd.label}`);
      rangeStart = current;
      rangeEnd = current;
    }
  }
  groups.push(rangeStart.label === rangeEnd.label ? rangeStart.label : `${rangeStart.label} - ${rangeEnd.label}`);
  return groups;
}
export {
  MONTHS as M,
  getYearRange as a,
  getMaxEndMonth as b,
  createStubPeriods as c,
  calculatePeriodCoverage as d,
  generateAnnualPeriods as e,
  formatPeriodRange as f,
  generatePeriods as g,
  generateFullPeriodMarker as h,
  calculateAnnualCoverage as i,
  calculatePointInTimeCoverage as j,
  calculateFullPeriodCoverage as k,
  groupConsecutivePeriods as l
};
