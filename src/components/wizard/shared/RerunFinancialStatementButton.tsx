import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useRerunFinancialStatement,
  type FinancialStatementDocType,
} from "@/hooks/useRerunFinancialStatement";

interface RerunFinancialStatementButtonProps {
  projectId: string;
  docType: FinancialStatementDocType;
  onComplete?: () => void | Promise<void>;
}

export const RerunFinancialStatementButton = ({
  projectId,
  docType,
  onComplete,
}: RerunFinancialStatementButtonProps) => {
  const { rerun, running, hasDocument, checkHasDocument } =
    useRerunFinancialStatement({ projectId, docType, onComplete });

  useEffect(() => {
    if (projectId) checkHasDocument();
  }, [projectId, checkHasDocument]);

  const disabled = running || hasDocument === false;

  const button = (
    <Button
      variant="outline"
      size="sm"
      onClick={rerun}
      disabled={disabled}
    >
      <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${running ? "animate-spin" : ""}`} />
      {running ? "Re-running…" : "Re-run analysis"}
    </Button>
  );

  if (hasDocument === false) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>{button}</span>
          </TooltipTrigger>
          <TooltipContent>Upload a document for this statement first</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
};
