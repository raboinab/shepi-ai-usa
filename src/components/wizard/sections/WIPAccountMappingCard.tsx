/**
 * WIP Account Mapping Card
 * Hybrid pattern matcher → manual override → "Suggest with AI" per slot.
 * Mirrors `FinancialCategoryLabelsCard` behavior. Renders only when `wipEnabled`.
 */
import { useMemo, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Sparkles, Loader2, X, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { ProjectData } from "@/pages/Project";
import { hasCoaData, getCoaAccounts } from "@/lib/financialLabelUtils";
import {
  extractWIPAccountsFromCOA,
  autoPopulateWIPMapping,
  resolveMappedAccount,
  WIP_SLOT_DEFINITIONS,
  type WIPAccountMapping,
  type WIPSlotKey,
} from "@/lib/wipAccountUtils";

interface WIPAccountMappingCardProps {
  project: ProjectData;
  dueDiligenceData: Record<string, unknown>;
  updateDueDiligenceData: (data: Record<string, unknown>) => void;
  onNavigate?: (phase: number, section: number) => void;
}

interface AISuggestion {
  accountId: string;
  accountName: string;
  confidence: "high" | "medium" | "low" | "none";
  reasoning: string;
}

export function WIPAccountMappingCard({
  project,
  dueDiligenceData,
  updateDueDiligenceData,
  onNavigate,
}: WIPAccountMappingCardProps) {
  const hasCoa = hasCoaData(project.wizard_data as Record<string, unknown>);
  const coaAccounts = getCoaAccounts(project.wizard_data as Record<string, unknown>);

  const candidates = useMemo(
    () => (hasCoa ? extractWIPAccountsFromCOA(coaAccounts) : null),
    [hasCoa, coaAccounts]
  );

  const mapping = (dueDiligenceData.wipAccountMapping as WIPAccountMapping) || {};

  const hasAutoPopulatedRef = useRef(false);
  const prevCoaLen = useRef(0);

  // Auto-populate when COA loads
  useEffect(() => {
    if (!hasCoa || !candidates) return;
    const justLoaded = coaAccounts.length > 0 && prevCoaLen.current === 0;
    prevCoaLen.current = coaAccounts.length;
    if (!justLoaded && hasAutoPopulatedRef.current) return;

    const { mapping: newMapping, autoPopulatedKeys } = autoPopulateWIPMapping(candidates, mapping);
    if (autoPopulatedKeys.length > 0) {
      updateDueDiligenceData({ ...dueDiligenceData, wipAccountMapping: newMapping });
      hasAutoPopulatedRef.current = true;
      toast({
        title: "WIP accounts mapped",
        description: `Auto-matched ${autoPopulatedKeys.length} WIP account${autoPopulatedKeys.length > 1 ? "s" : ""} from your Chart of Accounts.`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCoa, candidates, coaAccounts.length]);

  const updateMapping = (slot: WIPSlotKey, value: string) => {
    updateDueDiligenceData({
      ...dueDiligenceData,
      wipAccountMapping: { ...mapping, [slot]: value || undefined },
    });
  };

  // AI suggestion state — per slot
  const [loadingSlot, setLoadingSlot] = useState<WIPSlotKey | null>(null);
  const [suggestions, setSuggestions] = useState<Partial<Record<WIPSlotKey, AISuggestion>>>({});

  const requestSuggestion = async (slot: WIPSlotKey) => {
    if (!candidates) return;
    setLoadingSlot(slot);
    try {
      const def = WIP_SLOT_DEFINITIONS[slot];
      const { data, error } = await supabase.functions.invoke("suggest-wip-account", {
        body: {
          slotKey: slot,
          slotLabel: def.label,
          slotDescription: def.description,
          accounts: candidates.allBalanceSheetAccounts.map(a => ({
            accountId: a.accountNumber || a.accountName,
            name: a.accountName,
            category: a.category,
            fsType: a.fsType,
          })),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSuggestions(prev => ({ ...prev, [slot]: data as AISuggestion }));
    } catch (err) {
      toast({
        title: "AI suggestion failed",
        description: (err as Error).message || "Could not get suggestion.",
        variant: "destructive",
      });
    } finally {
      setLoadingSlot(null);
    }
  };

  const applySuggestion = (slot: WIPSlotKey) => {
    const s = suggestions[slot];
    if (!s) return;
    updateMapping(slot, s.accountId);
    setSuggestions(prev => {
      const next = { ...prev };
      delete next[slot];
      return next;
    });
    toast({ title: "Mapping applied", description: `${WIP_SLOT_DEFINITIONS[slot].label} → ${s.accountName}` });
  };

  const dismissSuggestion = (slot: WIPSlotKey) => {
    setSuggestions(prev => {
      const next = { ...prev };
      delete next[slot];
      return next;
    });
  };

  const renderSlot = (slot: WIPSlotKey) => {
    const def = WIP_SLOT_DEFINITIONS[slot];
    const value = mapping[slot] || "";
    const candList = candidates?.[slot] ?? [];
    const allBs = candidates?.allBalanceSheetAccounts ?? [];
    const isFallback = candList.length === 0 && allBs.length > 0;
    const optionList = candList.length > 0 ? candList : allBs;
    const mappedAccount = resolveMappedAccount(coaAccounts, value);
    const suggestion = suggestions[slot];
    const isLoading = loadingSlot === slot;

    return (
      <div key={slot} className="space-y-2 p-3 rounded-lg border bg-muted/20">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <Label htmlFor={`wip-${slot}`} className="text-sm font-medium">{def.label}</Label>
            <p className="text-xs text-muted-foreground mt-0.5">{def.description}</p>
          </div>
          {!value && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1 shrink-0"
              onClick={() => requestSuggestion(slot)}
              disabled={isLoading || allBs.length === 0}
            >
              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              Suggest with AI
            </Button>
          )}
        </div>

        <Select value={value} onValueChange={(v) => updateMapping(slot, v === "__none__" ? "" : v)}>
          <SelectTrigger id={`wip-${slot}`}>
            <SelectValue placeholder={isFallback ? "Select from all BS accounts..." : "Select account..."} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">— Not mapped —</SelectItem>
            {optionList.map(a => {
              const key = a.accountNumber || a.accountName;
              return (
                <SelectItem key={key} value={key}>
                  {a.accountNumber ? `${a.accountNumber} · ` : ""}{a.accountName}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {isFallback && (
          <p className="text-xs text-muted-foreground">
            No keyword match found. Showing all Balance Sheet accounts.
          </p>
        )}

        {mappedAccount && (
          <p className="text-xs text-primary flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Mapped to {mappedAccount.accountName}
          </p>
        )}

        {suggestion && (
          <Alert className="mt-2">
            <Sparkles className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <div>
                <span className="font-medium">{suggestion.accountName}</span>
                <Badge variant="outline" className="ml-2 text-xs">{suggestion.confidence} confidence</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{suggestion.reasoning}</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => applySuggestion(slot)} className="gap-1">
                  <Check className="w-3 h-3" /> Apply
                </Button>
                <Button size="sm" variant="ghost" onClick={() => dismissSuggestion(slot)} className="gap-1">
                  <X className="w-3 h-3" /> Dismiss
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>WIP Account Mapping</CardTitle>
            <CardDescription>
              {hasCoa
                ? "Map your Chart of Accounts to standard WIP slots. Used for Balance Sheet tie-out and over/under-billing analysis."
                : "Load Chart of Accounts to map WIP accounts."}
            </CardDescription>
          </div>
          {hasCoa && (
            <Badge variant="outline" className="text-primary border-primary">
              <CheckCircle2 className="w-3 h-3 mr-1" /> COA Loaded
            </Badge>
          )}
        </div>
      </CardHeader>

      {!hasCoa ? (
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex flex-col gap-3">
              <span>Load your Chart of Accounts before mapping WIP accounts.</span>
              <div>
                <Button size="sm" variant="outline" onClick={() => onNavigate?.(2, 1)}>
                  Go to Chart of Accounts
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      ) : (
        <CardContent className="space-y-3">
          {(Object.keys(WIP_SLOT_DEFINITIONS) as WIPSlotKey[]).map(renderSlot)}
        </CardContent>
      )}
    </Card>
  );
}
