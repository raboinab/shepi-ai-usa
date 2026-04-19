import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, CheckCircle2, Circle, Loader2, AlertCircle, SkipForward } from 'lucide-react';
import type { Workflow, WorkflowStep } from '@/types/workflow';
import { cn } from '@/lib/utils';

interface WorkflowProgressProps {
  workflow: Workflow;
  onCancel?: () => void;
  showSteps?: boolean;
  compact?: boolean;
}

const WORKFLOW_LABELS: Record<string, string> = {
  IMPORT_QUICKBOOKS_DATA: 'Importing QuickBooks Data',
  PROCESS_DOCUMENT: 'Processing Document',
  SYNC_TO_SHEET: 'Syncing to Spreadsheet',
  FULL_DATA_SYNC: 'Full Data Sync',
  GENERATE_QOE_REPORT: 'Generating QoE Report',
  VALIDATE_ADJUSTMENTS: 'Validating Adjustments',
  REFRESH_QB_TOKEN: 'Refreshing QuickBooks Connection',
};

function StepIcon({ status }: { status: WorkflowStep['status'] }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-primary" />;
    case 'running':
      return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
    case 'failed':
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    case 'skipped':
      return <SkipForward className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />;
  }
}

export function WorkflowProgress({
  workflow,
  onCancel,
  showSteps = true,
  compact = false,
}: WorkflowProgressProps) {
  const isRunning = workflow.status === 'running' || workflow.status === 'pending';
  const label = WORKFLOW_LABELS[workflow.workflow_type] || workflow.workflow_type;

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium truncate">{label}</span>
            <span className="text-xs text-muted-foreground">{workflow.progress_percent}%</span>
          </div>
          <Progress value={workflow.progress_percent} className="h-2" />
        </div>
        {isRunning && onCancel && (
          <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{label}</CardTitle>
          {isRunning && onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {workflow.current_step || 'Initializing...'}
            </span>
            <span className="text-sm font-medium">{workflow.progress_percent}%</span>
          </div>
          <Progress value={workflow.progress_percent} />
        </div>

        {showSteps && workflow.steps.length > 0 && (
          <div className="space-y-2">
            {workflow.steps.map((step) => (
              <div
                key={step.id}
                className={cn(
                  'flex items-center gap-2 text-sm',
                  step.status === 'pending' && 'text-muted-foreground'
                )}
              >
                <StepIcon status={step.status} />
                <span className="flex-1">{step.name}</span>
                {step.status === 'failed' && step.error_message && (
                  <span className="text-xs text-destructive truncate max-w-[200px]">
                    {step.error_message}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
