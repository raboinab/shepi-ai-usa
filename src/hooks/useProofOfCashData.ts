import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface BankStatementSummary {
  openingBalance?: number;
  closingBalance?: number;
  totalCredits?: number;
  totalDebits?: number;
  transactionCount?: number;
}

interface BankStatementData {
  id: string;
  documentId: string | null;
  documentName?: string;
  accountNumber?: string;
  bankName?: string;
  periodStart: string | null;
  periodEnd: string | null;
  summary: BankStatementSummary;
  createdAt: string;
}

interface CashAnalysisRow {
  account: string;
  values: Record<string, number>; // periodId -> value
}

export interface ParsedCashAnalysis {
  accounts: CashAnalysisRow[];
  periodLabels: string[];
}

export function useProofOfCashData(projectId: string | undefined) {
  // Fetch bank statement extractions from processed_data
  const bankStatementsQuery = useQuery({
    queryKey: ["proof-of-cash-bank-statements", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      // Get bank statement extractions
      const { data: processedData, error } = await supabase
        .from("processed_data")
        .select(`
          id,
          source_document_id,
          period_start,
          period_end,
          data,
          created_at,
          documents:source_document_id (
            id,
            name,
            institution,
            account_label
          )
        `)
        .eq("project_id", projectId)
        .eq("data_type", "bank_transactions")
        .order("period_start", { ascending: true })
        .limit(1000000);

      if (error) {
        console.error("Error fetching bank statements:", error);
        throw error;
      }

      // Transform to BankStatementData format
      const statements: BankStatementData[] = (processedData || []).map((item) => {
        const data = item.data as Record<string, unknown> || {};
        const summary = (data.summary as BankStatementSummary) || {};
        const doc = item.documents as { id: string; name: string; institution?: string; account_label?: string } | null;
        
        return {
          id: item.id,
          documentId: item.source_document_id,
          documentName: doc?.name || "Unknown Document",
          accountNumber: (data.accountNumber as string) || doc?.account_label || undefined,
          bankName: (data.bankName as string) || doc?.institution || undefined,
          periodStart: item.period_start,
          periodEnd: item.period_end,
          summary: {
            openingBalance: summary.openingBalance ?? 0,
            closingBalance: summary.closingBalance ?? 0,
            totalCredits: summary.totalCredits ?? 0,
            totalDebits: summary.totalDebits ?? 0,
            transactionCount: summary.transactionCount ?? 0,
          },
          createdAt: item.created_at,
        };
      });

      return statements;
    },
    enabled: !!projectId,
  });

  return {
    bankStatements: bankStatementsQuery.data || [],
    isLoading: bankStatementsQuery.isLoading,
    error: bankStatementsQuery.error,
    refetch: bankStatementsQuery.refetch,
  };
}

// Helper to parse cash analysis rawData from spreadsheet
export function parseCashAnalysis(rawData: string[][] | undefined): ParsedCashAnalysis | null {
  if (!rawData || rawData.length < 2) return null;

  // First row is typically headers with period labels
  const headerRow = rawData[0] || [];
  const periodLabels = headerRow.slice(1).filter(Boolean); // Skip first column (account name)

  const accounts: CashAnalysisRow[] = [];
  
  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || !row[0]) continue;
    
    const account = row[0].toString().trim();
    if (!account) continue;
    
    const values: Record<string, number> = {};
    for (let j = 1; j < row.length && j <= periodLabels.length; j++) {
      const cellValue = row[j];
      const numValue = typeof cellValue === "number" 
        ? cellValue 
        : parseFloat(String(cellValue || "0").replace(/[$,]/g, "")) || 0;
      values[periodLabels[j - 1]] = numValue;
    }
    
    accounts.push({ account, values });
  }

  return { accounts, periodLabels };
}

// Helper to match bank statement periods to analysis periods
export function matchPeriodToStatement(
  periodStart: string | undefined,
  periodEnd: string | undefined,
  statements: BankStatementData[]
): BankStatementData | null {
  if (!periodStart || !periodEnd || statements.length === 0) return null;

  const targetStart = new Date(periodStart);
  const targetEnd = new Date(periodEnd);

  // Find statement that overlaps with the period
  for (const stmt of statements) {
    if (!stmt.periodStart || !stmt.periodEnd) continue;
    
    const stmtStart = new Date(stmt.periodStart);
    const stmtEnd = new Date(stmt.periodEnd);

    // Check for overlap
    if (stmtStart <= targetEnd && stmtEnd >= targetStart) {
      return stmt;
    }
  }

  return null;
}
