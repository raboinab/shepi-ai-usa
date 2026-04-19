import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, FileCheck, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  detectedType: string;
  suggestedType: string | null;
  reason: string;
}

interface DocumentValidationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  selectedType: string;
  selectedTypeLabel: string;
  validationResult: ValidationResult;
  suggestedTypeLabel: string | null;
  onChangeType: () => void;
  onUploadAnyway: () => void;
  onCancel: () => void;
}

export function DocumentValidationDialog({
  open,
  onOpenChange,
  fileName,
  selectedType,
  selectedTypeLabel,
  validationResult,
  suggestedTypeLabel,
  onChangeType,
  onUploadAnyway,
  onCancel,
}: DocumentValidationDialogProps) {
  const confidencePercent = Math.round(validationResult.confidence * 100);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Document Type Mismatch
          </DialogTitle>
          <DialogDescription>
            The uploaded document might not match your selection
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <FileCheck className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium truncate">{fileName}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="text-muted-foreground">
                Selected: {selectedTypeLabel}
              </Badge>
              {suggestedTypeLabel && (
                <>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                    Detected: {suggestedTypeLabel}
                  </Badge>
                </>
              )}
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {validationResult.reason}
          </p>
          
          {confidencePercent > 0 && (
            <p className="text-xs text-muted-foreground">
              Confidence: {confidencePercent}%
            </p>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={onUploadAnyway}
            className="w-full sm:w-auto"
          >
            Upload Anyway
          </Button>
          {suggestedTypeLabel && (
            <Button
              onClick={onChangeType}
              className="w-full sm:w-auto"
            >
              Change to {suggestedTypeLabel}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
