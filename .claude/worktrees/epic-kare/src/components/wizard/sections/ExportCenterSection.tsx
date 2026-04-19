import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, Download, FileSpreadsheet, Share2, ArrowRight, PartyPopper, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getExportReadiness } from "@/lib/dataCompleteness";
import { generateDiligenceReport } from "@/lib/pdf";
import { exportWorkbookXlsx } from "@/lib/exportWorkbookXlsx";
import type { WizardReportData } from "@/lib/wizardReportBuilder";
import type { DealData } from "@/lib/workbook-types";

interface ExportCenterData {
  completedSections: string[];
  notes: string;
}

interface ExportCenterSectionProps {
  data: ExportCenterData;
  updateData: (data: ExportCenterData) => void;
  wizardData: Record<string, unknown>;
  projectId?: string;
  projectName?: string;
  computedReports?: Record<string, WizardReportData>;
  dealData?: DealData;
  onNavigateToInsights?: () => void;
}

export const ExportCenterSection = ({ data, updateData, wizardData, projectId, projectName, computedReports, dealData, onNavigateToInsights }: ExportCenterSectionProps) => {
  const exportData = { completedSections: [], notes: "", ...data };
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, label: "" });

  // Use unified export readiness check with computed reports
  const { coreStatus, readyCount, totalCore, isReady } = getExportReadiness(wizardData, computedReports);
  const coreDataStatus = coreStatus as Record<string, boolean>;

  const handleExportPDF = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setProgress({ current: 0, total: 0, label: "Preparing..." });

    try {
      const now = new Date();
      const reportDate = `${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}.${now.getFullYear()}`;

      await generateDiligenceReport({
        metadata: {
          companyName: projectName || "Company",
          projectName: projectName || "Project",
          clientName: (wizardData?.projectSetup as Record<string, unknown>)?.clientName as string || "",
          industry: (wizardData?.projectSetup as Record<string, unknown>)?.industry as string || "",
          transactionType: (wizardData?.projectSetup as Record<string, unknown>)?.transactionType as string || "",
          reportDate,
          fiscalYearEnd: (wizardData?.projectSetup as Record<string, unknown>)?.fiscalYearEnd as string || "December",
        },
        computedReports,
        onProgress: (current, total, label) => {
          setProgress({ current, total, label });
        },
      });

      toast.success("PDF report generated successfully!");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF report", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsGenerating(false);
      setProgress({ current: 0, total: 0, label: "" });
    }
  };

  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [excelProgress, setExcelProgress] = useState({ current: 0, total: 0, label: "" });

  const handleExportExcel = async () => {
    if (!dealData) {
      toast.info("Excel export requires workbook data", { description: "No deal data available for export." });
      return;
    }
    if (isExportingExcel) return;
    setIsExportingExcel(true);
    setExcelProgress({ current: 0, total: 0, label: "Preparing..." });

    try {
      await exportWorkbookXlsx({
        dealData,
        onProgress: (current, total, label) => {
          setExcelProgress({ current, total, label });
        },
      });
      toast.success("Excel workbook exported successfully!");
    } catch (err) {
      console.error("Excel export failed:", err);
      toast.error("Failed to export Excel workbook", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsExportingExcel(false);
      setExcelProgress({ current: 0, total: 0, label: "" });
    }
  };


  const handleCopyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-serif font-bold">Export Center</h2>
        <p className="text-muted-foreground">Export your QoE deliverables</p>
      </div>

      {/* Completion Celebration */}
      {isReady && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <CheckCircle className="w-12 h-12 text-primary" />
                <PartyPopper className="w-6 h-6 text-amber-500 absolute -top-1 -right-1" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-primary mb-2">
              QoE Analysis Complete!
            </h3>
            <p className="text-muted-foreground">
              All core sections have data. Your Quality of Earnings analysis is ready for export.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Simple Readiness Check */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isReady ? (
                <div className="flex items-center gap-2 text-primary">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Ready to Export</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">{totalCore - readyCount} core sections missing data</span>
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" className="text-muted-foreground gap-1" onClick={onNavigateToInsights}>
              View full status in Insights
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Quick status indicators */}
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
            <Badge variant={coreDataStatus.incomeStatement ? "default" : "secondary"} className="gap-1">
              {coreDataStatus.incomeStatement ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              Income Statement
            </Badge>
            <Badge variant={coreDataStatus.balanceSheet ? "default" : "secondary"} className="gap-1">
              {coreDataStatus.balanceSheet ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              Balance Sheet
            </Badge>
            <Badge variant={coreDataStatus.qoeAnalysis ? "default" : "secondary"} className="gap-1">
              {coreDataStatus.qoeAnalysis ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              QoE Analysis
            </Badge>
            <Badge variant={coreDataStatus.ddAdjustments ? "default" : "secondary"} className="gap-1">
              {coreDataStatus.ddAdjustments ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              DD Adjustments
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Engagement Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={exportData.notes}
            onChange={(e) => updateData({ ...exportData, notes: e.target.value })}
            placeholder="Add any final notes, observations, or recommendations for this QoE engagement..."
            className="w-full h-32 p-3 border border-border rounded-lg resize-none bg-background"
          />
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              onClick={handleExportPDF}
              disabled={isGenerating}
              className="h-20 flex flex-col gap-2"
            >
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">
                {isGenerating ? `Page ${progress.current}/${progress.total}` : "PDF Report"}
              </span>
              {isGenerating && progress.total > 0 && (
                <Progress value={(progress.current / progress.total) * 100} className="h-1 w-full" />
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleExportExcel}
              disabled={isExportingExcel || !dealData}
              className="h-20 flex flex-col gap-2"
            >
              {isExportingExcel ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">
                {isExportingExcel ? `Tab ${excelProgress.current}/${excelProgress.total}` : "Excel Workbook"}
              </span>
              {isExportingExcel && excelProgress.total > 0 && (
                <Progress value={(excelProgress.current / excelProgress.total) * 100} className="h-1 w-full" />
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleCopyShareLink}
              className="h-20 flex flex-col gap-2"
            >
              <Share2 className="w-5 h-5" />
              <span className="text-sm font-medium">Copy Share Link</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
