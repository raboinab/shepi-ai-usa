import { useState, useMemo } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { MetricsOverview } from "./MetricsOverview";
import { ChartPanel } from "./ChartPanel";
import { AdjustmentsSummary } from "./AdjustmentsSummary";
import { QuickInsights } from "./QuickInsights";
import { DataExplorer } from "./DataExplorer";
import { AIAnalyst } from "./AIAnalyst";
import { RiskIndicators } from "./RiskIndicators";
import { DebtSummary } from "./DebtSummary";
import { CompletenessTracker } from "./CompletenessTracker";

import { Bot } from "lucide-react";
import { projectToDealData } from "@/lib/projectToDealAdapter";
import { buildWizardReports } from "@/lib/wizardReportBuilder";
import type { ProjectData } from "@/pages/Project";

interface InsightsViewProps {
  project: ProjectData;
}

export const InsightsView = ({ project }: InsightsViewProps) => {
  const wizardData = project.wizard_data || {};
  const [isAIPanelCollapsed, setIsAIPanelCollapsed] = useState(false);

  const { dealData, wizardReports } = useMemo(() => {
    const data = projectToDealData(project as any);
    const reports = buildWizardReports(data);
    return { dealData: data, wizardReports: reports };
  }, [project.id, project.wizard_data, project.periods]);

  return (
    <div className="h-full flex overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={isAIPanelCollapsed ? 100 : 70} minSize={50}>
          <div className="h-full overflow-y-auto">
            <div className="p-4 space-y-4">
              <MetricsOverview dealData={dealData} wizardData={wizardData} />
              <RiskIndicators wizardData={wizardData} dealData={dealData} />
              
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2">
                  <ChartPanel dealData={dealData} wizardData={wizardData} wizardReports={wizardReports} />
                </div>
                <div className="xl:col-span-1">
                  <DebtSummary wizardData={wizardData} />
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <AdjustmentsSummary wizardData={wizardData} />
                <QuickInsights dealData={dealData} wizardData={wizardData} industry={project.industry || undefined} />
              </div>

              
              <DataExplorer wizardData={wizardData} wizardReports={wizardReports} />
              <CompletenessTracker wizardData={wizardData} computedReports={wizardReports} projectId={project.id} />
            </div>
          </div>
        </ResizablePanel>
        
        {!isAIPanelCollapsed && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={30} minSize={20}>
              <AIAnalyst project={project} onCollapse={() => setIsAIPanelCollapsed(true)} />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      {/* Collapsed AI toggle button */}
      {isAIPanelCollapsed && (
        <div className="w-12 border-l bg-card flex flex-col items-center py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsAIPanelCollapsed(false)}
            className="h-10 w-10"
            title="Open AI Analyst"
          >
            <Bot className="h-5 w-5" />
          </Button>
          <span className="text-xs text-muted-foreground mt-2 [writing-mode:vertical-rl] rotate-180">
            AI Analyst
          </span>
        </div>
      )}
    </div>
  );
};
