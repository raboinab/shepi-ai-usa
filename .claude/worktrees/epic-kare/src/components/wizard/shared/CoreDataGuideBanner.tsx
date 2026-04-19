import { CheckCircle2, ArrowRight, X, Zap } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface CoreDataGuideBannerProps {
  currentStep: 1 | 2 | 3;
  onNavigate: (phase: number, section: number) => void;
  onDismiss: () => void;
  isQBUser: boolean;
  hasCOA: boolean;
  hasTB: boolean;
  visible: boolean;
}

const STEPS = [
  { step: 1, label: "Chart of Accounts", phase: 2, section: 1 },
  { step: 2, label: "Trial Balance", phase: 2, section: 2 },
  { step: 3, label: "Document Upload", phase: 2, section: 3 },
];

export function CoreDataGuideBanner({
  currentStep,
  onNavigate,
  onDismiss,
  isQBUser,
  hasCOA,
  hasTB,
  visible,
}: CoreDataGuideBannerProps) {
  if (!visible) return null;

  const stepStatuses = STEPS.map((s) => {
    if (s.step === 1) return hasCOA || isQBUser;
    if (s.step === 2) return hasTB || isQBUser;
    return false; // Doc upload is "done" when they reach it
  });

  const completedCount = stepStatuses.filter(Boolean).length;
  const progressPercent = (completedCount / 3) * 100;

  // For QB users, skip directly to doc upload
  const nextStep = isQBUser
    ? STEPS[2]
    : STEPS.find((s) => s.step > currentStep) || null;

  const currentStepInfo = STEPS.find((s) => s.step === currentStep);

  if (isQBUser) {
    return (
      <Alert className="bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
        <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertTitle className="text-green-800 dark:text-green-200 flex items-center justify-between">
          <span>QuickBooks Data Synced</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDismiss}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-300">
          <p className="mb-2">
            Chart of Accounts and Trial Balance have been synced from QuickBooks. 
            Upload your remaining documents (bank statements, tax returns, etc.) to complete your data set.
          </p>
          {currentStep !== 3 && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/30"
              onClick={() => onNavigate(2, 3)}
            >
              Go to Document Upload <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="bg-primary/5 border-primary/20">
      <div className="flex items-start justify-between w-full">
        <div className="flex-1">
          <AlertTitle className="text-primary flex items-center gap-2 mb-1">
            Step {currentStep} of 3: {currentStepInfo?.label}
          </AlertTitle>
          <div className="mb-2">
            <Progress value={progressPercent} className="h-1.5" />
          </div>
          <AlertDescription className="text-sm flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {STEPS.map((s) => (
                <span
                  key={s.step}
                  className={cn(
                    "flex items-center gap-1",
                    s.step === currentStep && "text-primary font-medium"
                  )}
                >
                  {stepStatuses[s.step - 1] ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                  ) : (
                    <span className="h-3 w-3 rounded-full border border-muted-foreground/40 inline-block" />
                  )}
                  {s.label}
                </span>
              ))}
            </div>
            {nextStep && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 ml-auto"
                onClick={() => onNavigate(nextStep.phase, nextStep.section)}
              >
                Continue to {nextStep.label} <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </AlertDescription>
        </div>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground ml-2 -mt-1" onClick={onDismiss}>
          Skip guide
        </Button>
      </div>
    </Alert>
  );
}
