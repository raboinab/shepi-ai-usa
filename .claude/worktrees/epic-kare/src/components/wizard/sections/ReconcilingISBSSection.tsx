import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SummaryCard } from "../shared/SummaryCard";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Scale, FileText, TrendingUp, Calculator } from "lucide-react";

interface ReconcilingISBSData {
  incomeStatementNetIncome: number;
  balanceSheetRetainedEarnings: number;
  priorRetainedEarnings: number;
  dividends: number;
  otherAdjustments: number;
  notes: string;
}

interface ReconcilingISBSSectionProps {
  data: ReconcilingISBSData;
  wizardData?: Record<string, unknown>;
}

const defaultData: ReconcilingISBSData = {
  incomeStatementNetIncome: 0,
  balanceSheetRetainedEarnings: 0,
  priorRetainedEarnings: 0,
  dividends: 0,
  otherAdjustments: 0,
  notes: "",
};

export const ReconcilingISBSSection = ({ data, wizardData }: ReconcilingISBSSectionProps) => {
  const reconcData = { ...defaultData, ...data };

  // Try to pull values from other wizard sections if available
  const incomeStatementData = wizardData?.incomeStatement as Record<string, unknown> | undefined;
  const balanceSheetData = wizardData?.balanceSheet as Record<string, unknown> | undefined;

  // Calculate expected retained earnings
  const expectedRetainedEarnings =
    reconcData.priorRetainedEarnings +
    reconcData.incomeStatementNetIncome -
    reconcData.dividends +
    reconcData.otherAdjustments;

  const variance = reconcData.balanceSheetRetainedEarnings - expectedRetainedEarnings;
  const isReconciled = Math.abs(variance) < 0.01;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Reconciling IS & BS</h2>
          <p className="text-muted-foreground">
            Verify that Income Statement net income flows correctly to Balance Sheet retained earnings
          </p>
        </div>
        <Badge variant={isReconciled ? "default" : "destructive"} className="gap-1">
          {isReconciled ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
          {isReconciled ? "Reconciled" : `Variance: $${Math.abs(variance).toLocaleString()}`}
        </Badge>
      </div>

      <div className="bg-muted/30 border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <FileText className="w-4 h-4" />
          <span className="text-sm">
            This is a <strong>read-only report</strong> section. Values are computed from your Trial Balance and other input sections.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="IS Net Income"
          value={reconcData.incomeStatementNetIncome}
          icon={TrendingUp}
        />
        <SummaryCard
          title="Prior RE"
          value={reconcData.priorRetainedEarnings}
          icon={Scale}
        />
        <SummaryCard
          title="Expected RE"
          value={expectedRetainedEarnings}
          icon={Calculator}
        />
        <SummaryCard
          title="BS Retained Earnings"
          value={reconcData.balanceSheetRetainedEarnings}
          icon={FileText}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Retained Earnings Rollforward</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Beginning Retained Earnings</p>
                <p className="text-xl font-bold">${reconcData.priorRetainedEarnings.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">+ Net Income (from IS)</p>
                <p className="text-xl font-bold text-primary">
                  ${reconcData.incomeStatementNetIncome.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">- Dividends Declared</p>
                <p className="text-xl font-bold text-destructive">
                  ${reconcData.dividends.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">+/- Other Adjustments</p>
                <p className="text-xl font-bold">${reconcData.otherAdjustments.toLocaleString()}</p>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Expected Ending RE</p>
                  <p className="text-2xl font-bold">${expectedRetainedEarnings.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Actual BS RE</p>
                  <p className="text-2xl font-bold">
                    ${reconcData.balanceSheetRetainedEarnings.toLocaleString()}
                  </p>
                </div>
                <div
                  className={`p-4 rounded-lg ${
                    isReconciled ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"
                  }`}
                >
                  <p className="text-sm text-muted-foreground">Variance</p>
                  <p
                    className={`text-2xl font-bold ${
                      isReconciled ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    ${Math.abs(variance).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reconciliation Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded">
              {isReconciled ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span>Net Income flows to Retained Earnings correctly</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded">
              <CheckCircle className="w-5 h-5 text-muted-foreground" />
              <span className="text-muted-foreground">
                Prior period retained earnings carried forward
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded">
              <CheckCircle className="w-5 h-5 text-muted-foreground" />
              <span className="text-muted-foreground">Dividends and distributions accounted for</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded">
              <CheckCircle className="w-5 h-5 text-muted-foreground" />
              <span className="text-muted-foreground">
                Other comprehensive income adjustments reviewed
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {reconcData.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{reconcData.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
