import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, RefreshCw, Sparkles } from "lucide-react";
import { useAnalysisTrigger } from "@/hooks/useAnalysisTrigger";

interface AnalysisRunButtonProps {
  projectId: string;
  functionName: string;
  resultDataType: string;
  label: string;
  hasDocuments: boolean;
  hasAnalysis: boolean;
}

/**
 * Lightweight trigger UI rendered alongside JE/GL insight cards in the wizard.
 * - When no analysis exists yet: renders a primary "Run Analysis" CTA card.
 * - When analysis exists: renders a small "Re-run analysis" link button.
 */
export const AnalysisRunButton = ({
  projectId,
  functionName,
  resultDataType,
  label,
  hasDocuments,
  hasAnalysis,
}: AnalysisRunButtonProps) => {
  const { running, runAnalysis } = useAnalysisTrigger({
    projectId,
    functionName,
    resultDataType,
    projectIdKey: "projectId",
  });

  if (!hasDocuments) return null;

  if (!hasAnalysis) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <Sparkles className="w-6 h-6 text-primary" />
            <div>
              <p className="text-sm font-medium">Ready to analyze {label}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Run analysis to surface anomalies, reconciliation, and key insights.
              </p>
            </div>
            <Button size="sm" onClick={runAnalysis} disabled={running}>
              {running ? (
                <><RefreshCw className="w-4 h-4 mr-1 animate-spin" /> Running…</>
              ) : (
                <><Play className="w-4 h-4 mr-1" /> Run {label} Analysis</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex justify-end">
      <Button variant="ghost" size="sm" onClick={runAnalysis} disabled={running}>
        <RefreshCw className={`w-3.5 h-3.5 mr-1 ${running ? "animate-spin" : ""}`} />
        {running ? "Re-running…" : "Re-run analysis"}
      </Button>
    </div>
  );
};
