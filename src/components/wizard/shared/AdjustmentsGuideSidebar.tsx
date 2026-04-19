import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  adjustmentsGuideContent,
  contextualHints,
  getDefaultOpenItems,
  type GuideContext,
  type SectionKey,
  type AccordionKey,
} from "@/lib/adjustmentsGuideContent";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { HelpCircle, ArrowRight, X, PanelRightClose, MessageSquare, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

const GUIDE_WIDTH_KEY = "adjustments-guide-width";
const DEFAULT_WIDTH = 300;
const MIN_WIDTH = 220;
const MAX_WIDTH = 500;

interface AdjustmentsGuideSidebarProps {
  guideContext: GuideContext;
  onOpenAssistant?: (prompt?: string) => void;
  onNavigate: (phase: number, section: number) => void;
  onDismiss: () => void;
  visible: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

function mergeModeOverride(sectionKey: SectionKey, mode?: string) {
  const base = adjustmentsGuideContent[sectionKey];
  if (!mode) return base;
  const override = base.modeOverrides?.[mode as "ai-discovery" | "ledger"];
  if (!override) return base;
  return {
    ...base,
    ...override,
    howToUse: override.howToUse ?? base.howToUse,
    suggestedPrompts: override.suggestedPrompts ?? base.suggestedPrompts,
    examples: override.examples ?? base.examples,
    keyTerms: override.keyTerms ?? base.keyTerms,
  };
}

// ── Hint Banner ──────────────────────────────────────────────────────

function HintBanner({ ctx }: { ctx: GuideContext }) {
  if (!ctx.focusedControl) return null;
  const hint = contextualHints[ctx.focusedControl];
  if (!hint) return null;

  return (
    <div className="rounded-md border border-primary/30 bg-primary/5 p-3 mb-3">
      <p className="text-sm font-semibold">{hint.title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{hint.content}</p>
    </div>
  );
}

// ── Decision Tree ────────────────────────────────────────────────────

function DecisionTree({
  sectionKey,
  onNavigate,
}: {
  sectionKey: SectionKey;
  onNavigate: (phase: number, section: number) => void;
}) {
  const { decisionTree } = adjustmentsGuideContent[sectionKey];

  return (
    <div className="rounded-md border bg-muted/30 p-3 mb-3">
      <p className="text-xs font-semibold text-muted-foreground mb-2">Quick Decision</p>
      <div className="space-y-1.5">
        {decisionTree.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">{item.answer}</span>
            {item.navigateTo && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs text-primary"
                onClick={() => onNavigate(item.navigateTo!.phase, item.navigateTo!.section)}
              >
                Go <ArrowRight className="h-3 w-3 ml-0.5" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sidebar Body ─────────────────────────────────────────────────────

function SidebarBody({
  ctx,
  onNavigate,
  onOpenAssistant,
}: {
  ctx: GuideContext;
  onNavigate: (phase: number, section: number) => void;
  onOpenAssistant?: (prompt?: string) => void;
}) {
  const content = mergeModeOverride(ctx.sectionKey, ctx.mode);
  const defaultOpen = useMemo(() => getDefaultOpenItems(ctx), [ctx.mode, ctx.focusedControl, ctx.hasData]);

  const [openItems, setOpenItems] = useState<string[]>(defaultOpen);
  useEffect(() => {
    setOpenItems(defaultOpen);
  }, [defaultOpen.join(",")]);

  return (
    <div className="space-y-1 overflow-hidden break-words">
      <DecisionTree sectionKey={ctx.sectionKey} onNavigate={onNavigate} />
      <HintBanner ctx={ctx} />

      <Accordion type="multiple" value={openItems} onValueChange={v => setOpenItems(v)}>
        <AccordionItem value="what">
          <AccordionTrigger className="text-sm py-2.5">What is this?</AccordionTrigger>
          <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
            {content.what}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="how">
          <AccordionTrigger className="text-sm py-2.5">How to use this page</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              {content.howToUse.map((group, gi) => (
                <div key={gi}>
                  <p className="text-xs font-semibold mb-1">{group.title}</p>
                  <ol className="space-y-1 text-xs text-muted-foreground list-decimal list-inside">
                    {group.steps.map((s, si) => (
                      <li key={si}>{s}</li>
                    ))}
                  </ol>
                </div>
              ))}

              {content.intentTable && content.intentTable.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold mb-1">Intent Selector reference</p>
                  <div className="border rounded text-xs">
                    <div className="grid grid-cols-2 gap-px bg-muted font-medium p-1.5">
                      <span>Effect</span>
                      <span>EBITDA Impact</span>
                    </div>
                    {content.intentTable.map((row, i) => (
                      <div key={i} className="grid grid-cols-2 gap-px p-1.5 border-t text-muted-foreground">
                        <span>{row.intent}</span>
                        <span className={cn(
                          "font-medium",
                          row.ebitdaImpact.includes("+") ? "text-primary" : "text-destructive"
                        )}>
                          {row.ebitdaImpact}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!ctx.hasData && content.emptyStateHint && (
                <p className="text-xs text-primary mt-2">{content.emptyStateHint}</p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="terms">
          <AccordionTrigger className="text-sm py-2.5">Key Terms</AccordionTrigger>
          <AccordionContent>
            <dl className="space-y-2">
              {content.keyTerms.map((t) => (
                <div key={t.term}>
                  <dt className="text-xs font-semibold">{t.term}</dt>
                  <dd className="text-xs text-muted-foreground">{t.definition}</dd>
                </div>
              ))}
            </dl>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="examples">
          <AccordionTrigger className="text-sm py-2.5">Real-World Examples</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              {content.examples.map((ex) => (
                <div key={ex.title} className="border rounded p-2.5">
                  <p className="text-xs font-semibold">{ex.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{ex.scenario}</p>
                  <p className="text-xs mt-1">
                    <span className="font-medium">Action: </span>
                    <span className="text-muted-foreground">{ex.action}</span>
                  </p>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="ask">
          <AccordionTrigger className="text-sm py-2.5">Ask the AI Assistant</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-1.5">
              {content.suggestedPrompts.map((p) => (
                <Button
                  key={p}
                  variant="link"
                  size="sm"
                  className="w-full justify-start text-xs h-auto py-1.5 px-2 text-primary/70 hover:text-primary no-underline hover:underline"
                  onClick={() => onOpenAssistant?.(p)}
                >
                  <MessageSquare className="h-3 w-3 mr-1.5 shrink-0" />
                  {p}
                </Button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────

export function AdjustmentsGuideSidebar({
  guideContext,
  onOpenAssistant,
  onNavigate,
  onDismiss,
  visible,
  collapsed,
  onToggleCollapse,
}: AdjustmentsGuideSidebarProps) {
  const isMobile = useIsMobile();

  // Resizable width state
  const [width, setWidth] = useState(() => {
    try {
      const saved = localStorage.getItem(GUIDE_WIDTH_KEY);
      if (saved) return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Number(saved)));
    } catch {}
    return DEFAULT_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef<{ x: number; width: number } | null>(null);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartRef.current = { x: e.clientX, width };
  }, [width]);

  useEffect(() => {
    if (!isResizing) return;
    const onMove = (e: MouseEvent) => {
      if (!resizeStartRef.current) return;
      const delta = resizeStartRef.current.x - e.clientX; // dragging left = wider
      const newW = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, resizeStartRef.current.width + delta));
      setWidth(newW);
    };
    const onUp = () => {
      setIsResizing(false);
      resizeStartRef.current = null;
      localStorage.setItem(GUIDE_WIDTH_KEY, String(width));
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
  }, [isResizing, width]);

  if (!visible) return null;

  // Mobile: floating drawer
  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger asChild>
          <Button
            size="icon"
            className="fixed bottom-20 right-4 z-40 rounded-full h-10 w-10 shadow-lg"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-sm">
              {adjustmentsGuideContent[guideContext.sectionKey].title} Guide
            </DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="px-4 pb-4 h-[70vh]">
            <SidebarBody ctx={guideContext} onNavigate={onNavigate} onOpenAssistant={onOpenAssistant} />
            <Button variant="ghost" size="sm" className="w-full mt-3 text-muted-foreground" onClick={onDismiss}>
              Dismiss guide
            </Button>
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: collapsible aside
  if (collapsed) {
    return (
      <div className="shrink-0 w-10 flex flex-col items-center pt-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onToggleCollapse}
          title="Open learning guide"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <aside
      id="adjustments-guide-aside"
      className="shrink-0 border-l hidden lg:block relative overflow-hidden"
      style={{ width }}
    >
      {/* Resize handle on left edge */}
      <div
        className="absolute top-0 left-0 w-2 h-full cursor-col-resize z-10 group flex items-center justify-center hover:bg-primary/10 transition-colors"
        onMouseDown={handleResizeStart}
      >
        <GripVertical className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
      </div>

      <div className="pl-4 pr-2 overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">
            {adjustmentsGuideContent[guideContext.sectionKey].title} Guide
          </p>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggleCollapse} title="Collapse">
              <PanelRightClose className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={onDismiss} title="Dismiss">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-220px)]">
          <SidebarBody ctx={guideContext} onNavigate={onNavigate} onOpenAssistant={onOpenAssistant} />
        </ScrollArea>
      </div>
    </aside>
  );
}
