import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, FileSpreadsheet, Wallet } from "lucide-react";
import type { DealData } from "@/lib/workbook-types";
import { WorkbookTabView } from "@/components/workbook/WorkbookTabView";
import { RerunFinancialStatementButton } from "../shared/RerunFinancialStatementButton";

interface FinancialReportsSectionProps {
  dealData: DealData | null;
  projectId?: string;
}

export const FinancialReportsSection = ({ dealData, projectId }: FinancialReportsSectionProps) => {
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

        <TabsContent value="pl" className="mt-6 space-y-4">
          {projectId && (
            <div className="flex justify-end">
              <RerunFinancialStatementButton projectId={projectId} docType="income_statement" />
            </div>
          )}
          <WorkbookTabView tabId="income-statement" dealData={dealData} />
        </TabsContent>

        <TabsContent value="bs" className="mt-6 space-y-4">
          {projectId && (
            <div className="flex justify-end">
              <RerunFinancialStatementButton projectId={projectId} docType="balance_sheet" />
            </div>
          )}
          <WorkbookTabView tabId="balance-sheet" dealData={dealData} />
        </TabsContent>

        <TabsContent value="cf" className="mt-6 space-y-4">
          {projectId && (
            <div className="flex justify-end">
              <RerunFinancialStatementButton projectId={projectId} docType="cash_flow" />
            </div>
          )}
          <WorkbookTabView tabId="free-cash-flow" dealData={dealData} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
