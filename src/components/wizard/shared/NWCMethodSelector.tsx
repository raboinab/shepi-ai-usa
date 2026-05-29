import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import type { NWCMethod } from "@/lib/workbook-types";

interface MethodDef {
  value: NWCMethod;
  label: string;
  short: string;
  description: string;
  recommended?: boolean;
  placeholder?: boolean;
}

const METHODS: MethodDef[] = [
  {
    value: "reported",
    label: "Reported",
    short: "CA − CL",
    description:
      "Book balance sheet view: total current assets minus total current liabilities. Ties to GAAP financials but includes cash and debt, so it is not what a buyer typically prices.",
  },
  {
    value: "operating",
    label: "Operating",
    short: "ex-cash, ex-debt",
    recommended: true,
    description:
      "QoE / M&A diligence convention: operating current assets minus operating current liabilities. Excludes cash, short-term debt, and income taxes payable. Recommended default for setting a working capital peg.",
  },
  {
    value: "transaction",
    label: "Transaction",
    short: "LOI-defined",
    description:
      "Operating NWC with explicit per-bucket exclusions set by the purchase agreement (e.g. owner balances, transaction expenses). Drives the closing adjustment.",
  },
  {
    value: "normalized",
    label: "Normalized",
    short: "+ overlays",
    description:
      "Transaction NWC adjusted for seasonality, stretched payables, delayed collections, or other one-time items. This is the version used to set the actual peg target.",
  },
  {
    value: "component",
    label: "Component",
    short: "AR + Inv + Prep − AP − Accr − DR",
    placeholder: true,
    description:
      "Built from AR + Inventory + Prepaids − AP − Accrued Expenses − Deferred Revenue. Useful for explaining what is driving working capital. Requires finer Chart-of-Accounts tagging — currently computes the same as Operating until sub-line-items are added.",
  },
];

export interface NWCMethodSelectorProps {
  method: NWCMethod;
  onChange: (m: NWCMethod) => void;
}

export const NWCMethodSelector = ({ method, onChange }: NWCMethodSelectorProps) => {
  const active = METHODS.find((m) => m.value === method) ?? METHODS[1];

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              NWC Method
              <Badge variant="secondary" className="font-normal">{active.label}</Badge>
            </CardTitle>
            <CardDescription>
              Choose how Net Working Capital is calculated everywhere in this section, including the
              peg, change-in-NWC, and the PDF / XLSX export.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={method}
          onValueChange={(v) => onChange(v as NWCMethod)}
          className="grid grid-cols-1 md:grid-cols-5 gap-2"
        >
          {METHODS.map((m) => {
            const selected = m.value === method;
            return (
              <label
                key={m.value}
                htmlFor={`nwc-method-${m.value}`}
                className={`flex items-start gap-2 rounded-lg border p-3 cursor-pointer transition-colors ${
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem
                  value={m.value}
                  id={`nwc-method-${m.value}`}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-sm">{m.label}</span>
                    {m.recommended && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1">
                        Default
                      </Badge>
                    )}
                    {m.placeholder && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1">
                        Beta
                      </Badge>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                    {m.short}
                  </div>
                </div>
              </label>
            );
          })}
        </RadioGroup>

        <div className="flex gap-2 rounded-md border border-border bg-muted/30 p-3 text-sm">
          <Info className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <div className="space-y-1">
            <div>
              <span className="font-medium">{active.label}:</span>{" "}
              <span className="text-muted-foreground">{active.description}</span>
            </div>
            {active.placeholder && (
              <div className="text-xs text-muted-foreground">
                Sub-line-item classification (Inventory, Prepaids, AP, Accrued Expenses,
                Deferred Revenue) will land in a follow-up release.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
