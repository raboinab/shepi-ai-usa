import { AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Workflow } from '@/types/workflow';

interface WorkflowErrorProps {
  workflow: Workflow;
  onRetry?: () => void;
  isRetrying?: boolean;
}

const ERROR_HELP_LINKS: Record<string, string> = {
  QB_AUTH_EXPIRED: '/help/quickbooks-connection',
  QB_RATE_LIMITED: '/help/quickbooks-rate-limits',
  SHEET_NOT_FOUND: '/help/spreadsheet-setup',
  SHEET_PERMISSION_DENIED: '/help/spreadsheet-permissions',
  DOCUMENT_PARSE_FAILED: '/help/document-upload',
};

export function WorkflowError({ workflow, onRetry, isRetrying = false }: WorkflowErrorProps) {
  const errorDetails = workflow.error_details;
  const isRecoverable = errorDetails?.recoverable ?? true;
  const errorCode = errorDetails?.code;
  const helpLink = errorCode ? ERROR_HELP_LINKS[errorCode] : undefined;

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Workflow Failed</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{workflow.error_message || 'An unexpected error occurred.'}</p>
        
        {errorDetails?.suggested_action && (
          <p className="text-sm opacity-90">{errorDetails.suggested_action}</p>
        )}

        <div className="flex items-center gap-2 pt-1">
          {isRecoverable && onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
              disabled={isRetrying}
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry
                </>
              )}
            </Button>
          )}
          
          {helpLink && (
            <Button variant="ghost" size="sm" asChild>
              <a href={helpLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                Get Help
              </a>
            </Button>
          )}
        </div>

        {workflow.retry_count > 0 && (
          <p className="text-xs opacity-75">
            Retry attempts: {workflow.retry_count}
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
}
