import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, FileSpreadsheet, Wallet } from "lucide-react";
import { SpreadsheetReportViewer } from "../shared/SpreadsheetReportViewer";

interface RawDataReport {
  rawData?: string[][];
  syncedAt?: string;
}

interface FinancialReportsSectionProps {
  incomeStatementData: RawDataReport;
  balanceSheetData: RawDataReport;
  cashFlowData: RawDataReport;
}

export const FinancialReportsSection = ({
  incomeStatementData,
  balanceSheetData,
  cashFlowData,
}: FinancialReportsSectionProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold">Financial Reports</h2>
        <p className="text-muted-foreground">Detailed financial statements from your QoE analysis</p>
      </div>

      <Tabs defaultValue="pl" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pl" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            P&L Detail
          </TabsTrigger>
          <TabsTrigger value="bs" className="gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Balance Sheet Detail
          </TabsTrigger>
          <TabsTrigger value="cf" className="gap-2">
            <Wallet className="w-4 h-4" />
            Cash Flow Detail
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pl" className="mt-6">
          <SpreadsheetReportViewer
            rawData={incomeStatementData?.rawData || []}
            title="Income Statement"
            syncedAt={incomeStatementData?.syncedAt}
            skipEmptyRows
          />
        </TabsContent>

        <TabsContent value="bs" className="mt-6">
          <SpreadsheetReportViewer
            rawData={balanceSheetData?.rawData || []}
            title="Balance Sheet"
            syncedAt={balanceSheetData?.syncedAt}
            skipEmptyRows
          />
        </TabsContent>

        <TabsContent value="cf" className="mt-6">
          <SpreadsheetReportViewer
            rawData={cashFlowData?.rawData || []}
            title="Free Cash Flow"
            syncedAt={cashFlowData?.syncedAt}
            skipEmptyRows
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
