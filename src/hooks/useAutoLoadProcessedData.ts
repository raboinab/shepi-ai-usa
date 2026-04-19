/**
 * Hook for auto-loading data from processed_data table into wizard sections
 * Used to implement "self-healing" pattern across all wizard sections
 */

import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  flattenQBReportToRawData,
  transformQBArAgingToWizard,
  transformQBApAgingToWizard,
  transformQBCustomersToWizard,
  transformQBVendorsToWizard,
  transformQBJournalEntriesToWizard,
  ARAgingData,
  APAgingData,
  TopCustomersData,
  TopVendorsData,
  JournalEntriesData,
} from '@/lib/processedDataTransforms';

type DataType = 
  | 'balance_sheet' 
  | 'income_statement' 
  | 'ar_aging' 
  | 'ap_aging' 
  | 'customer_concentration' 
  | 'vendor_concentration'
  | 'journal_entries';

interface ProcessedDataRecord {
  id: string;
  data: unknown;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
}

interface UseAutoLoadOptions {
  projectId: string;
  dataType: DataType;
  hasExistingData: boolean;
  updateData: (data: unknown) => void;
}

/**
 * Hook that auto-loads data from processed_data if wizard_data is empty
 */
function mapDataTypeToDbType(dataType: DataType): string {
  const mapping: Partial<Record<DataType, string>> = {
    ar_aging: 'accounts_receivable',
    ap_aging: 'accounts_payable',
  };
  return mapping[dataType] ?? dataType;
}

export function useAutoLoadProcessedData({
  projectId,
  dataType,
  hasExistingData,
  updateData,
}: UseAutoLoadOptions): void {
  const hasAttemptedLoad = useRef(false);

  useEffect(() => {
    // Skip if we already have data or already attempted load
    if (hasExistingData || hasAttemptedLoad.current || !projectId) {
      return;
    }

    const autoLoad = async () => {
      hasAttemptedLoad.current = true;

      try {
        const { data: records, error } = await supabase
          .from('processed_data')
          .select('id, data, period_start, period_end, created_at')
          .eq('project_id', projectId)
          .eq('data_type', mapDataTypeToDbType(dataType))
          .order('period_end', { ascending: false })
          .limit(1);

        if (error) {
          console.error(`Auto-load ${dataType} error:`, error);
          return;
        }

        if (!records || records.length === 0) {
          return;
        }

        const record = records[0] as ProcessedDataRecord;
        const transformed = transformRecord(dataType, record);

        if (transformed) {
          updateData(transformed);
          
          const typeLabels: Record<DataType, string> = {
            balance_sheet: 'Balance Sheet',
            income_statement: 'Income Statement',
            ar_aging: 'AR Aging',
            ap_aging: 'AP Aging',
            customer_concentration: 'Top Customers',
            vendor_concentration: 'Top Vendors',
            journal_entries: 'Journal Entries',
          };
          
          toast({
            title: `${typeLabels[dataType]} loaded`,
            description: 'Data loaded from synced QuickBooks data.',
          });
        }
      } catch (err) {
        console.error(`Auto-load ${dataType} exception:`, err);
      }
    };

    autoLoad();
  }, [projectId, dataType, hasExistingData, updateData]);
}

/**
 * Transform a processed_data record based on its type
 */
function transformRecord(
  dataType: DataType, 
  record: ProcessedDataRecord
): unknown {
  const { data, period_start, period_end, created_at } = record;

  switch (dataType) {
    case 'balance_sheet':
    case 'income_statement': {
      const rawData = flattenQBReportToRawData(data);
      if (rawData.length === 0) return null;
      return {
        rawData,
        syncedAt: created_at,
        source: 'processed_data',
      };
    }

    case 'ar_aging': {
      return transformQBArAgingToWizard(data, period_end || undefined);
    }

    case 'ap_aging': {
      return transformQBApAgingToWizard(data, period_end || undefined);
    }

    case 'customer_concentration': {
      return transformQBCustomersToWizard(data, period_start || undefined, period_end || undefined);
    }

    case 'vendor_concentration': {
      return transformQBVendorsToWizard(data, period_start || undefined, period_end || undefined);
    }

    case 'journal_entries': {
      return transformQBJournalEntriesToWizard(data);
    }

    default:
      return null;
  }
}

/**
 * Hook for loading financial statement data (Balance Sheet, Income Statement)
 */
export function useAutoLoadFinancialStatement({
  projectId,
  dataType,
  data,
  updateData,
}: {
  projectId: string;
  dataType: 'balance_sheet' | 'income_statement';
  data: { rawData?: string[][]; syncedAt?: string; source?: string };
  updateData: (data: { rawData: string[][]; syncedAt: string; source: string }) => void;
}): void {
  const hasExistingData = !!(data?.rawData && data.rawData.length > 0);
  
  useAutoLoadProcessedData({
    projectId,
    dataType,
    hasExistingData,
    updateData: updateData as (data: unknown) => void,
  });
}

/**
 * Hook for loading AR Aging data
 */
export function useAutoLoadArAging({
  projectId,
  data,
  updateData,
}: {
  projectId: string;
  data: ARAgingData;
  updateData: (data: ARAgingData) => void;
}): void {
  const hasExistingData = !!(data?.periodData && data.periodData.length > 0 && 
    data.periodData.some(p => p.entries && p.entries.length > 0 && p.entries.some(e => e.customer)));
  
  useAutoLoadProcessedData({
    projectId,
    dataType: 'ar_aging',
    hasExistingData,
    updateData: updateData as (data: unknown) => void,
  });
}

/**
 * Hook for loading AP Aging data
 */
export function useAutoLoadApAging({
  projectId,
  data,
  updateData,
}: {
  projectId: string;
  data: APAgingData;
  updateData: (data: APAgingData) => void;
}): void {
  const hasExistingData = !!(data?.periodData && data.periodData.length > 0 && 
    data.periodData.some(p => p.entries && p.entries.length > 0 && p.entries.some(e => e.vendor)));
  
  useAutoLoadProcessedData({
    projectId,
    dataType: 'ap_aging',
    hasExistingData,
    updateData: updateData as (data: unknown) => void,
  });
}

/**
 * Hook for loading Top Customers data
 */
export function useAutoLoadCustomers({
  projectId,
  data,
  updateData,
}: {
  projectId: string;
  data: TopCustomersData;
  updateData: (data: TopCustomersData) => void;
}): void {
  const hasExistingData = !!(data?.customers && data.customers.length > 0 && 
    data.customers.some(c => c.name));
  
  useAutoLoadProcessedData({
    projectId,
    dataType: 'customer_concentration',
    hasExistingData,
    updateData: updateData as (data: unknown) => void,
  });
}

/**
 * Hook for loading Top Vendors data
 */
export function useAutoLoadVendors({
  projectId,
  data,
  updateData,
}: {
  projectId: string;
  data: TopVendorsData;
  updateData: (data: TopVendorsData) => void;
}): void {
  const hasExistingData = !!(data?.vendors && data.vendors.length > 0 && 
    data.vendors.some(v => v.name));
  
  useAutoLoadProcessedData({
    projectId,
    dataType: 'vendor_concentration',
    hasExistingData,
    updateData: updateData as (data: unknown) => void,
  });
}

/**
 * Hook for loading Journal Entries data
 */
export function useAutoLoadJournalEntries({
  projectId,
  data,
  updateData,
}: {
  projectId: string;
  data: JournalEntriesData;
  updateData: (data: JournalEntriesData) => void;
}): void {
  const hasExistingData = !!(data?.entries && data.entries.length > 0);
  
  useAutoLoadProcessedData({
    projectId,
    dataType: 'journal_entries',
    hasExistingData,
    updateData: updateData as (data: unknown) => void,
  });
}
