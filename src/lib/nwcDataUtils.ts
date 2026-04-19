/**
 * Utilities for extracting NWC data from synced spreadsheet rawData
 */

export interface NWCExtractedMetrics {
  currentNWC: number;
  t3mAvg: number;
  t6mAvg: number;
  t12mAvg: number;
  ltmEBITDA: number;
  ltmCapEx: number;
  ltmFCF: number;
}

export interface DealParameters {
  pegMethod: 't3m' | 't6m' | 't12m' | 'custom';
  customPegAmount: number | null;
  estimatedNWCAtClose: number | null;
}

/**
 * Parse a currency string to a number
 */
const parseCurrencyValue = (value: string | undefined | null): number => {
  if (!value || value === '' || value === '-') return 0;
  
  // Remove currency symbols, commas, parentheses for negatives
  const cleanedValue = value
    .replace(/[$,]/g, '')
    .replace(/\(([^)]+)\)/, '-$1') // Convert (123) to -123
    .trim();
  
  const parsed = parseFloat(cleanedValue);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Find a row by label in rawData and extract the last numeric value (current period)
 */
const findRowValue = (rawData: string[][], labelPattern: string | RegExp): number => {
  for (const row of rawData) {
    if (!row || row.length === 0) continue;
    
    const label = row[0]?.toLowerCase() || '';
    const matches = typeof labelPattern === 'string' 
      ? label.includes(labelPattern.toLowerCase())
      : labelPattern.test(label);
    
    if (matches) {
      // Find the last non-empty value in the row
      for (let i = row.length - 1; i >= 1; i--) {
        const value = row[i];
        if (value && value !== '' && value !== '-') {
          return parseCurrencyValue(value);
        }
      }
    }
  }
  return 0;
};

/**
 * Extract NWC metrics from synced spreadsheet rawData
 * The spreadsheet "NWC Analysis" tab contains pre-calculated values
 */
export const extractNWCMetrics = (rawData: string[][] | undefined): NWCExtractedMetrics => {
  const defaults: NWCExtractedMetrics = {
    currentNWC: 0,
    t3mAvg: 0,
    t6mAvg: 0,
    t12mAvg: 0,
    ltmEBITDA: 0,
    ltmCapEx: 0,
    ltmFCF: 0,
  };

  if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
    return defaults;
  }

  // Look for specific rows in the NWC Analysis tab
  // These labels may vary based on spreadsheet template
  return {
    currentNWC: findRowValue(rawData, /net working capital|nwc$/i) || findRowValue(rawData, 'total nwc'),
    t3mAvg: findRowValue(rawData, /t3m|3.?month|trailing 3/i),
    t6mAvg: findRowValue(rawData, /t6m|6.?month|trailing 6/i),
    t12mAvg: findRowValue(rawData, /t12m|12.?month|trailing 12|ltm.*avg/i),
    ltmEBITDA: findRowValue(rawData, /ebitda/i),
    ltmCapEx: findRowValue(rawData, /capex|capital exp/i),
    ltmFCF: findRowValue(rawData, /free cash flow|fcf/i),
  };
};

/**
 * Extract metrics from the FCF Analysis tab for LTM values
 */
export const extractFCFMetrics = (rawData: string[][] | undefined): Pick<NWCExtractedMetrics, 'ltmEBITDA' | 'ltmCapEx' | 'ltmFCF'> => {
  const defaults = {
    ltmEBITDA: 0,
    ltmCapEx: 0,
    ltmFCF: 0,
  };

  if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
    return defaults;
  }

  return {
    ltmEBITDA: findRowValue(rawData, /ebitda/i),
    ltmCapEx: findRowValue(rawData, /capex|capital exp/i),
    ltmFCF: findRowValue(rawData, /free cash flow|fcf|total.*fcf/i),
  };
};

/**
 * Calculate the selected peg amount based on deal parameters
 */
export const calculatePegAmount = (
  metrics: NWCExtractedMetrics,
  dealParams: DealParameters
): number => {
  switch (dealParams.pegMethod) {
    case 't3m':
      return metrics.t3mAvg;
    case 't6m':
      return metrics.t6mAvg;
    case 't12m':
      return metrics.t12mAvg;
    case 'custom':
      return dealParams.customPegAmount || 0;
    default:
      return metrics.t12mAvg;
  }
};

/**
 * Calculate purchase price adjustment
 * Positive = buyer pays more (actual NWC > peg)
 * Negative = seller pays back (actual NWC < peg)
 */
export const calculatePriceAdjustment = (
  estimatedNWCAtClose: number | null,
  pegAmount: number
): number | null => {
  if (estimatedNWCAtClose === null || estimatedNWCAtClose === 0) return null;
  return estimatedNWCAtClose - pegAmount;
};

/**
 * Format currency for display
 */
export const formatCurrencyDisplay = (value: number | null): string => {
  if (value === null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};
