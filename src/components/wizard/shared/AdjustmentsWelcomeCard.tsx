import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles, ClipboardList, Search } from "lucide-react";
import type { GuideContext } from "@/lib/adjustmentsGuideContent";

interface AdjustmentsWelcomeCardProps {
  guideContext: GuideContext;
  onGotIt: () => void;
  onHideForNow: () => void;
  onDontShowAgain: () => void;
}

function getRecommendation(ctx: GuideContext): { text: string; icon: React.ReactNode } {
  if (ctx.sectionKey === "3-1") {
    if (ctx.hasAIFlags) {
      return {
        text: "Switch to AI Discovery to review automatically flagged items.",
        icon: <Sparkles className="h-4 w-4 text-primary shrink-0" />,
      };
    }
    return {
      text: 'Start with a template — pick from common adjustment types in "From template...".',
      icon: <ClipboardList className="h-4 w-4 text-primary shrink-0" />,
    };
  }
  if (ctx.sectionKey === "3-2") {
    return {
      text: "Add an entry, or ask the AI what might need reclassifying (COGS vs OpEx is a great first pass).",
      icon: <ClipboardList className="h-4 w-4 text-primary shrink-0" />,
    };
  }
  // 3-3
  if (!ctx.hasData) {
    return {
      text: "Journal entries will appear after your QuickBooks sync completes.",
      icon: <BookOpen className="h-4 w-4 text-primary shrink-0" />,
    };
  }
  return {
    text: "Search for unusual entries near period-end (large amounts, round numbers, or 'Adj' memos).",
    icon: <Search className="h-4 w-4 text-primary shrink-0" />,
  };
}

export function AdjustmentsWelcomeCard({
  guideContext,
  onGotIt,
  onHideForNow,
  onDontShowAgain,
}: AdjustmentsWelcomeCardProps) {
  const rec = getRecommendation(guideContext);

  return (
    <Card className="mb-4 border-primary/20 bg-primary/5">
      <CardContent className="pt-5 pb-4 space-y-3">
        <div className="flex items-start gap-3">
          <BookOpen className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold text-sm">Welcome to Phase 3</p>
            <p className="text-sm text-muted-foreground">
              This is where you clean up earnings and presentation so stakeholders see the true profit potential.
              The Learning Guide on the right will walk you through each step.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-md bg-background/80 p-2.5 border">
          {rec.icon}
          <div>
            <p className="text-xs font-medium text-muted-foreground">Recommended first step</p>
            <p className="text-sm">{rec.text}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" onClick={onGotIt}>
            Got it, show me the guide
          </Button>
          <Button variant="outline" size="sm" onClick={onHideForNow}>
            Hide for now
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onDontShowAgain}>
            Don't show again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
