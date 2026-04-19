import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SummaryCard } from "../shared/SummaryCard";
import { Plus, Trash2, ArrowRight, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import { FS_LINE_ITEMS, FS_LINE_ITEMS_BY_TYPE } from "@/lib/fsLineItems";
import { ReclassificationAIDiscoverySection } from "./ReclassificationAIDiscoverySection";

interface Reclassification {
  id: string;
  accountNumber?: string;
  accountDescription: string;
  fromFsLineItem: string;
  toFsLineItem: string;
  amount: number;
  description: string;
  sourceType?: 'manual' | 'ai-suggested';
}

interface ReclassificationsSectionProps {
  data: { reclassifications: Reclassification[] };
  updateData: (data: { reclassifications: Reclassification[] }) => void;
  projectId?: string;
  onGuideContextChange?: (patch: Partial<import("@/lib/adjustmentsGuideContent").GuideContext>) => void;
  onOpenGuide?: () => void;
  isDemo?: boolean;
  mockFlags?: import("@/hooks/useFlaggedTransactions").FlaggedTransaction[];
}

export const ReclassificationsSection = ({ data, updateData, projectId, onGuideContextChange, onOpenGuide, isDemo, mockFlags }: ReclassificationsSectionProps) => {
  const [activeTab, setActiveTab] = useState<"manual" | "ai-discovery">("manual");
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const reclassifications = data.reclassifications || [];

  const addReclassification = () => {
    const newEntry: Reclassification = {
      id: crypto.randomUUID(),
      accountNumber: "",
      accountDescription: "",
      fromFsLineItem: "",
      toFsLineItem: "",
      amount: 0,
      description: "",
      sourceType: "manual",
    };
    updateData({ reclassifications: [...reclassifications, newEntry] });
  };

  const updateReclassification = (id: string, field: keyof Reclassification, value: string | number) => {
    updateData({
      reclassifications: reclassifications.map((rec) =>
        rec.id === id ? { ...rec, [field]: value } : rec
      ),
    });
  };

  const deleteReclassification = (id: string) => {
    updateData({ reclassifications: reclassifications.filter((rec) => rec.id !== id) });
  };

  const totalAmount = reclassifications.reduce((sum, rec) => sum + (rec.amount || 0), 0);
  const manualCount = reclassifications.filter(r => r.sourceType !== 'ai-suggested').length;
  const aiCount = reclassifications.filter(r => r.sourceType === 'ai-suggested').length;

  const handleConvertToReclassification = (flagged: {
    account_name: string;
    description: string;
    amount: number;
    flag_reason: string;
    ai_analysis: Record<string, unknown>;
  }) => {
    const aiAnalysis = flagged.ai_analysis || {};
    const accountParts = (flagged.account_name || '').split(' ');
    const accountNumber = accountParts[0] || '';
    
    const newReclassification: Reclassification = {
      id: crypto.randomUUID(),
      accountNumber,
      accountDescription: flagged.description || flagged.account_name,
      fromFsLineItem: (aiAnalysis.suggested_from_line_item as string) || '',
      toFsLineItem: (aiAnalysis.suggested_to_line_item as string) || '',
      amount: Math.abs(flagged.amount || 0),
      description: flagged.flag_reason || 'AI-suggested reclassification',
      sourceType: 'ai-suggested',
    };
    
    updateData({ reclassifications: [...reclassifications, newReclassification] });
    
    toast({ title: "Reclassification added", description: flagged.account_name || flagged.description });
    setActiveTab("manual");
    setHighlightId(newReclassification.id);
    setTimeout(() => setHighlightId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Reclassification Adjustments</h2>
          <p className="text-muted-foreground">Reclassify accounts between Financial Statement Line Items</p>
        </div>
        <Badge variant={reclassifications.length > 0 ? "default" : "secondary"} className="gap-1">
          {reclassifications.length > 0 ? (
            <>
              <CheckCircle className="w-3 h-3" />
              {reclassifications.length} {reclassifications.length === 1 ? 'entry' : 'entries'}
            </>
          ) : (
            <>
              <AlertCircle className="w-3 h-3" />
              No entries
            </>
          )}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard title="Total Entries" value={reclassifications.length} subtitle="Reclassification entries" isCurrency={false} />
        <SummaryCard 
          title="Manual / AI" 
          value={`${manualCount} / ${aiCount}`} 
          subtitle="Entry sources"
        />
        <SummaryCard title="Total Amount" value={totalAmount} subtitle="Net reclassification" />
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as "manual" | "ai-discovery"); onGuideContextChange?.({ mode: v === "ai-discovery" ? "ai-discovery" : "ledger" }); }}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            Manual Reclassifications
            {reclassifications.length > 0 && (
              <Badge variant="secondary" className="ml-1">{reclassifications.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ai-discovery" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Discovery
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-6">
          <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Reclassification Entries</CardTitle>
          <Button onClick={addReclassification} className="gap-2">
            <Plus className="w-4 h-4" /> Add Entry
          </Button>
        </CardHeader>
        <CardContent>
          {reclassifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ArrowRight className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No reclassifications recorded</p>
              <p className="text-sm">Add entries to reclassify accounts between FS Line Items</p>
              {onOpenGuide && (
                <button
                  type="button"
                  className="text-sm text-primary hover:underline mt-2"
                  onClick={() => onOpenGuide()}
                >
                  Not sure what to do? Open the guide →
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {reclassifications.map((rec) => (
                <div key={rec.id} className={`p-4 border rounded-lg space-y-3 transition-all ${rec.id === highlightId ? 'ring-2 ring-primary animate-pulse' : ''}`}>
                  {/* Row 1: Account # and Description */}
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
                    <Input
                      placeholder="Account #"
                      value={rec.accountNumber || ""}
                      onChange={(e) => updateReclassification(rec.id, "accountNumber", e.target.value)}
                      className="md:col-span-1"
                    />
                    <Input
                      placeholder="Account Description"
                      value={rec.accountDescription}
                      onChange={(e) => updateReclassification(rec.id, "accountDescription", e.target.value)}
                      className="md:col-span-3"
                    />
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={rec.amount || ""}
                      onChange={(e) => updateReclassification(rec.id, "amount", parseFloat(e.target.value) || 0)}
                      className="md:col-span-2"
                    />
                  </div>

                  {/* Row 2: FS Line Item dropdowns */}
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-center">
                    <Select
                      value={rec.fromFsLineItem}
                      onValueChange={(value) => updateReclassification(rec.id, "fromFsLineItem", value)}
                    >
                      <SelectTrigger className="md:col-span-3">
                        <SelectValue placeholder="From FS Line Item" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(FS_LINE_ITEMS_BY_TYPE).map(([group, items]) => (
                          <div key={group}>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{group}</div>
                            {items.map((item) => (
                              <SelectItem key={item} value={item}>{item}</SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex justify-center">
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </div>

                    <Select
                      value={rec.toFsLineItem}
                      onValueChange={(value) => updateReclassification(rec.id, "toFsLineItem", value)}
                    >
                      <SelectTrigger className="md:col-span-3">
                        <SelectValue placeholder="To FS Line Item" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(FS_LINE_ITEMS_BY_TYPE).map(([group, items]) => (
                          <div key={group}>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{group}</div>
                            {items.map((item) => (
                              <SelectItem key={item} value={item}>{item}</SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Row 3: Description and delete */}
                  <div className="flex items-center gap-3">
                    <Input
                      placeholder="Description / Reason for reclassification"
                      value={rec.description}
                      onChange={(e) => updateReclassification(rec.id, "description", e.target.value)}
                      className="flex-1"
                    />
                    {rec.sourceType === 'ai-suggested' && (
                      <Badge variant="outline" className="shrink-0">AI Suggested</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteReclassification(rec.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-discovery" className="mt-6">
          {projectId ? (
            <ReclassificationAIDiscoverySection
              projectId={projectId}
              isDemo={isDemo}
              mockFlags={isDemo ? mockFlags : undefined}
              onConvertToReclassification={handleConvertToReclassification}
            />
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Project ID required for AI Discovery</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Total Entries</p>
              <p className="text-xl font-bold">{reclassifications.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Manual / AI</p>
              <p className="text-xl font-bold">{manualCount} / {aiCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-xl font-bold">${totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
