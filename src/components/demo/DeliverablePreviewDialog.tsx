/**
 * DeliverablePreviewDialog — view-only preview of sample PDF / XLSX in demo.
 * No download path through the UI. Static, watermarked sample assets.
 */
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

export type PreviewMode = "pdf" | "xlsx" | null;

interface Props {
  mode: PreviewMode;
  onClose: () => void;
}

const PDF_URL = "/demo/acme-sample-qoe.pdf";
const XLSX_URL = "/demo/acme-sample-workbook.xlsx";

export function DeliverablePreviewDialog({ mode, onClose }: Props) {
  const open = mode !== null;
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[92vh] p-0 flex flex-col gap-0 overflow-hidden">
        <DialogHeader className="px-5 py-3 border-b border-border shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-base">
                {mode === "pdf" ? "Sample QoE Report (PDF preview)" : "Sample QoE Workbook (Excel preview)"}
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Acme Industrial Supply Co. · synthetic demo data · view only — sign up to generate your own
              </DialogDescription>
            </div>
            <Button
              size="sm"
              onClick={() => {
                onClose();
                navigate("/auth?mode=signup");
              }}
            >
              Sign up to export
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 relative bg-muted/30">
          {/* CSS watermark overlay — pointer-events:none so it never blocks scroll */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none z-10 select-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(-30deg, transparent 0 140px, hsl(var(--muted-foreground) / 0.08) 140px 142px)",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none z-10 select-none flex items-center justify-center overflow-hidden"
          >
            <div
              className="text-foreground/[0.04] font-bold whitespace-nowrap"
              style={{ fontSize: "min(10vw, 140px)", transform: "rotate(-30deg)" }}
            >
              DEMO PREVIEW
            </div>
          </div>

          {mode === "pdf" && <PdfPreview />}
          {mode === "xlsx" && <XlsxPreview />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PdfPreview() {
  return (
    <iframe
      title="Sample QoE Report"
      src={`${PDF_URL}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
      className="w-full h-full border-0 relative z-0"
    />
  );
}

interface SheetData {
  name: string;
  rows: (string | number)[][];
}

function XlsxPreview() {
  const [sheets, setSheets] = useState<SheetData[] | null>(null);
  const [activeTab, setActiveTab] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(XLSX_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load workbook (${r.status})`);
        return r.arrayBuffer();
      })
      .then((buf) => {
        if (cancelled) return;
        const wb = XLSX.read(buf, { type: "array" });
        const parsed: SheetData[] = wb.SheetNames.map((name) => {
          const ws = wb.Sheets[name];
          const rows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, {
            header: 1,
            defval: "",
            raw: false,
          });
          return { name, rows: rows as (string | number)[][] };
        });
        setSheets(parsed);
        if (parsed.length > 0) setActiveTab(parsed[0].name);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load workbook");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!sheets) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-0 flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-4 mt-3 self-start shrink-0">
          {sheets.map((s) => (
            <TabsTrigger key={s.name} value={s.name} className="text-xs">
              {s.name}
            </TabsTrigger>
          ))}
        </TabsList>
        {sheets.map((s) => (
          <TabsContent key={s.name} value={s.name} className="flex-1 min-h-0 mt-2 mx-4 mb-4">
            <div className="h-full overflow-auto bg-card border border-border rounded-md">
              <table className="text-xs w-max border-collapse">
                <tbody>
                  {s.rows.map((row, ri) => (
                    <tr key={ri} className={ri === 0 ? "bg-[hsl(220_14%_96%)] font-semibold" : ""}>
                      {row.length === 0 ? (
                        <td className="px-3 py-1.5 border border-[hsl(220_13%_91%)] h-6">&nbsp;</td>
                      ) : (
                        row.map((cell, ci) => (
                          <td
                            key={ci}
                            className={`px-3 py-1.5 border border-[hsl(220_13%_91%)] whitespace-nowrap ${
                              ci === 0 ? "text-left" : "text-right font-mono"
                            }`}
                          >
                            {cell === "" ? "\u00A0" : String(cell)}
                          </td>
                        ))
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
