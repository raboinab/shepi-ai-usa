/**
 * Shared inline SVG illustrations for marketing pages.
 * All strokes/fills use design tokens so they adapt to light/dark mode.
 * Style: thin strokes (1.5), rounded ends, subtle secondary fills, serif labels.
 */
import { cn } from "@/lib/utils";

const stroke = "hsl(var(--primary))";
const strokeSoft = "hsl(var(--muted-foreground) / 0.5)";
const fillSoft = "hsl(var(--secondary))";
const fillCard = "hsl(var(--card))";
const accent = "hsl(var(--accent))";
const label = "hsl(var(--foreground))";

interface SvgProps {
  className?: string;
}

/* ============================================================
 * WorkflowDiagram — Upload → Extract → Balance → Report
 * Used on the homepage hero / how-it-works.
 * ============================================================ */
export function WorkflowDiagram({ className }: SvgProps) {
  const steps = [
    { label: "Upload", sub: "Financials" },
    { label: "Extract", sub: "AI parse" },
    { label: "Balance", sub: "TB reconcile" },
    { label: "Report", sub: "Lender-ready" },
  ];
  return (
    <svg
      viewBox="0 0 720 220"
      className={cn("w-full h-auto", className)}
      role="img"
      aria-label="Shepi workflow: upload, extract, balance, report"
    >
      {steps.map((s, i) => {
        const cx = 90 + i * 180;
        return (
          <g key={s.label}>
            {/* connector */}
            {i > 0 && (
              <line
                x1={cx - 180 + 55}
                y1={110}
                x2={cx - 55}
                y2={110}
                stroke={strokeSoft}
                strokeWidth={1.5}
                strokeDasharray="3 4"
              />
            )}
            {/* arrow head */}
            {i > 0 && (
              <path
                d={`M ${cx - 60} 105 L ${cx - 52} 110 L ${cx - 60} 115`}
                fill="none"
                stroke={stroke}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {/* node */}
            <circle cx={cx} cy={110} r={44} fill={fillCard} stroke={stroke} strokeWidth={1.5} />
            <circle cx={cx} cy={110} r={44} fill={fillSoft} opacity={0.35} />
            {/* icon glyph per step */}
            <StepGlyph step={i} cx={cx} cy={104} />
            {/* label */}
            <text
              x={cx}
              y={185}
              textAnchor="middle"
              fontFamily="Lora, Georgia, serif"
              fontSize={16}
              fontWeight={600}
              fill={label}
            >
              {s.label}
            </text>
            <text
              x={cx}
              y={202}
              textAnchor="middle"
              fontFamily="Inter, sans-serif"
              fontSize={11}
              fill="hsl(var(--muted-foreground))"
            >
              {s.sub}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function StepGlyph({ step, cx, cy }: { step: number; cx: number; cy: number }) {
  const s = { fill: "none", stroke, strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (step) {
    case 0: // upload arrow
      return (
        <g {...s}>
          <path d={`M ${cx} ${cy + 12} L ${cx} ${cy - 12}`} />
          <path d={`M ${cx - 8} ${cy - 4} L ${cx} ${cy - 12} L ${cx + 8} ${cy - 4}`} />
          <path d={`M ${cx - 14} ${cy + 14} L ${cx + 14} ${cy + 14}`} />
        </g>
      );
    case 1: // sheet with rows
      return (
        <g {...s}>
          <rect x={cx - 12} y={cy - 14} width={24} height={28} rx={2} />
          <line x1={cx - 7} y1={cy - 7} x2={cx + 7} y2={cy - 7} />
          <line x1={cx - 7} y1={cy - 1} x2={cx + 7} y2={cy - 1} />
          <line x1={cx - 7} y1={cy + 5} x2={cx + 3} y2={cy + 5} />
        </g>
      );
    case 2: // scale/balance
      return (
        <g {...s}>
          <path d={`M ${cx - 12} ${cy + 10} L ${cx + 12} ${cy + 10}`} />
          <path d={`M ${cx} ${cy + 10} L ${cx} ${cy - 12}`} />
          <path d={`M ${cx - 10} ${cy - 4} L ${cx + 10} ${cy - 4}`} />
          <circle cx={cx - 8} cy={cy + 1} r={4} fill={fillSoft} />
          <circle cx={cx + 8} cy={cy + 1} r={4} fill={fillSoft} />
        </g>
      );
    case 3: // doc with check
      return (
        <g {...s}>
          <path d={`M ${cx - 10} ${cy - 14} L ${cx + 6} ${cy - 14} L ${cx + 12} ${cy - 8} L ${cx + 12} ${cy + 14} L ${cx - 10} ${cy + 14} Z`} />
          <path d={`M ${cx - 4} ${cy + 2} L ${cx - 1} ${cy + 6} L ${cx + 6} ${cy - 3}`} stroke={accent} strokeWidth={2} />
        </g>
      );
  }
  return null;
}

/* ============================================================
 * ReconciliationChain — Tax Return → P&L → GL → TB
 * ============================================================ */
export function ReconciliationChain({ className }: SvgProps) {
  const nodes = ["Tax Return", "P&L + BS", "General Ledger", "Trial Balance"];
  return (
    <svg
      viewBox="0 0 720 180"
      className={cn("w-full h-auto", className)}
      role="img"
      aria-label="Reconciliation chain from tax return to trial balance"
    >
      {nodes.map((n, i) => {
        const x = 40 + i * 175;
        return (
          <g key={n}>
            <rect x={x} y={50} width={130} height={70} rx={6} fill={fillCard} stroke={stroke} strokeWidth={1.5} />
            <rect x={x} y={50} width={130} height={14} rx={6} fill={fillSoft} />
            <text
              x={x + 65}
              y={95}
              textAnchor="middle"
              fontFamily="Lora, serif"
              fontSize={14}
              fontWeight={600}
              fill={label}
            >
              {n}
            </text>
            <text
              x={x + 65}
              y={40}
              textAnchor="middle"
              fontFamily="Inter, sans-serif"
              fontSize={10}
              fill="hsl(var(--muted-foreground))"
              letterSpacing={1}
            >
              STEP {i + 1}
            </text>
            {i < nodes.length - 1 && (
              <g>
                <line
                  x1={x + 130}
                  y1={85}
                  x2={x + 175}
                  y2={85}
                  stroke={strokeSoft}
                  strokeWidth={1.5}
                  strokeDasharray="3 4"
                />
                <path
                  d={`M ${x + 168} 80 L ${x + 175} 85 L ${x + 168} 90`}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            )}
            {/* small checkmark ties */}
            <circle cx={x + 65} cy={135} r={8} fill={fillSoft} stroke={stroke} strokeWidth={1} />
            <path d={`M ${x + 61} 135 L ${x + 64} 138 L ${x + 69} 132`} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            <text x={x + 80} y={139} fontFamily="Inter, sans-serif" fontSize={10} fill="hsl(var(--muted-foreground))">tied</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ============================================================
 * TierLadder — DIY vs DFY comparison illustration
 * ============================================================ */
export function TierLadder({ className }: SvgProps) {
  const tiers = [
    { name: "Self-Service", price: "$1,000", dots: 3, highlight: false },
    { name: "Done-For-You", price: "$5,000+", dots: 5, highlight: true },
  ];
  return (
    <svg
      viewBox="0 0 600 260"
      className={cn("w-full h-auto", className)}
      role="img"
      aria-label="Tier comparison between Self-Service and Done-For-You"
    >
      {tiers.map((t, i) => {
        const x = 30 + i * 300;
        const h = 200;
        const y = 30;
        return (
          <g key={t.name}>
            <rect
              x={x}
              y={y}
              width={260}
              height={h}
              rx={10}
              fill={t.highlight ? fillSoft : fillCard}
              stroke={stroke}
              strokeWidth={t.highlight ? 2 : 1.5}
            />
            <text x={x + 20} y={y + 32} fontFamily="Inter, sans-serif" fontSize={10} letterSpacing={1.5} fill="hsl(var(--muted-foreground))">
              {t.highlight ? "RECOMMENDED" : "SELF-DIRECTED"}
            </text>
            <text x={x + 20} y={y + 60} fontFamily="Lora, serif" fontSize={22} fontWeight={700} fill={label}>
              {t.name}
            </text>
            <text x={x + 20} y={y + 92} fontFamily="Lora, serif" fontSize={28} fontWeight={700} fill={stroke}>
              {t.price}
            </text>
            {/* stack of feature bars */}
            {Array.from({ length: 5 }).map((_, k) => {
              const on = k < t.dots;
              return (
                <g key={k}>
                  <rect
                    x={x + 20}
                    y={y + 120 + k * 16}
                    width={220}
                    height={8}
                    rx={4}
                    fill={on ? (t.highlight ? stroke : "hsl(var(--primary) / 0.4)") : "hsl(var(--muted) / 0.3)"}
                  />
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

/* ============================================================
 * GuideThumbnail — per-category illustrated 16:9 tile
 * ============================================================ */

type Category =
  | "ebitda"
  | "working-capital"
  | "red-flags"
  | "ai"
  | "compare"
  | "checklist"
  | "cash"
  | "revenue"
  | "features"
  | "use-cases";

export function getCategoryFor(path: string): Category {
  const p = path.toLowerCase();
  if (p.includes("use-cases")) return "use-cases";
  if (p.includes("compare")) return "compare";
  if (p.includes("features")) return "features";
  if (p.includes("checklist") || p.includes("template") || p.includes("scope")) return "checklist";
  if (p.includes("red-flag") || p.includes("manipulation") || p.includes("personal-expense") || p.includes("concentration")) return "red-flags";
  if (p.includes("cash") || p.includes("proof")) return "cash";
  if (p.includes("working-capital") || p.includes("nwc")) return "working-capital";
  if (p.includes("revenue")) return "revenue";
  if (p.includes("ai") || p.includes("anomaly")) return "ai";
  if (p.includes("ebitda") || p.includes("bridge") || p.includes("run-rate") || p.includes("owner-comp") || p.includes("sde") || p.includes("discretionary")) return "ebitda";
  return "ebitda";
}

export function GuideThumbnail({ category, className }: { category: Category; className?: string }) {
  return (
    <div className={cn("w-full aspect-[16/9] rounded-t-lg overflow-hidden bg-secondary/40 border-b border-border", className)}>
      <svg viewBox="0 0 320 180" className="w-full h-full" role="img" aria-hidden="true">
        <rect width={320} height={180} fill={fillSoft} opacity={0.4} />
        <CategoryArt category={category} />
      </svg>
    </div>
  );
}

function CategoryArt({ category }: { category: Category }) {
  const s = { fill: "none", stroke, strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (category) {
    case "ebitda":
      // Bridge chart: waterfall bars
      return (
        <g>
          <line x1={30} y1={140} x2={290} y2={140} stroke={strokeSoft} strokeWidth={1} />
          {[
            { x: 40, y: 90, h: 50, tone: 1 },
            { x: 85, y: 75, h: 15, tone: 0 },
            { x: 130, y: 65, h: 10, tone: 0 },
            { x: 175, y: 80, h: -15, tone: 2 },
            { x: 220, y: 50, h: 30, tone: 0 },
            { x: 265, y: 40, h: 100, tone: 3 },
          ].map((b, i) => (
            <rect
              key={i}
              x={b.x}
              y={b.y}
              width={30}
              height={Math.abs(b.h)}
              fill={b.tone === 3 ? stroke : b.tone === 2 ? "hsl(var(--destructive) / 0.5)" : b.tone === 1 ? "hsl(var(--primary) / 0.6)" : accent}
              opacity={0.85}
            />
          ))}
        </g>
      );
    case "working-capital":
      // Cash conversion cycle
      return (
        <g>
          <circle cx={160} cy={90} r={55} {...s} strokeDasharray="4 5" />
          <path d="M 210 70 L 218 65 L 218 75 Z" fill={stroke} />
          {["AR", "INV", "AP"].map((t, i) => {
            const a = (i * 2 * Math.PI) / 3 - Math.PI / 2;
            const x = 160 + Math.cos(a) * 55;
            const y = 90 + Math.sin(a) * 55;
            return (
              <g key={t}>
                <circle cx={x} cy={y} r={16} fill={fillCard} stroke={stroke} strokeWidth={1.5} />
                <text x={x} y={y + 4} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize={11} fontWeight={600} fill={label}>{t}</text>
              </g>
            );
          })}
        </g>
      );
    case "red-flags":
      return (
        <g>
          {[70, 140, 210].map((x, i) => (
            <g key={x}>
              <line x1={x} y1={130} x2={x} y2={50} {...s} />
              <path d={`M ${x} 50 L ${x + 35} 60 L ${x} 75 Z`} fill={i === 1 ? "hsl(var(--destructive) / 0.75)" : "hsl(var(--primary) / 0.4)"} />
              <circle cx={x} cy={135} r={3} fill={stroke} />
            </g>
          ))}
        </g>
      );
    case "ai":
      return (
        <g>
          <circle cx={160} cy={90} r={26} fill={fillCard} stroke={stroke} strokeWidth={1.5} />
          <text x={160} y={95} textAnchor="middle" fontFamily="Lora, serif" fontSize={16} fontWeight={700} fill={stroke}>AI</text>
          {[0, 60, 120, 180, 240, 300].map((a) => {
            const rad = (a * Math.PI) / 180;
            const x1 = 160 + Math.cos(rad) * 34;
            const y1 = 90 + Math.sin(rad) * 34;
            const x2 = 160 + Math.cos(rad) * 68;
            const y2 = 90 + Math.sin(rad) * 68;
            return (
              <g key={a}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={strokeSoft} strokeWidth={1} />
                <circle cx={x2} cy={y2} r={5} fill={fillSoft} stroke={stroke} strokeWidth={1.5} />
              </g>
            );
          })}
        </g>
      );
    case "compare":
      return (
        <g>
          <rect x={40} y={40} width={100} height={100} rx={6} fill={fillCard} stroke={stroke} strokeWidth={1.5} />
          <rect x={180} y={40} width={100} height={100} rx={6} fill={stroke} opacity={0.15} stroke={stroke} strokeWidth={1.5} />
          {[60, 85, 110].map((y) => (
            <g key={y}>
              <line x1={55} y1={y} x2={125} y2={y} stroke={strokeSoft} strokeWidth={1.5} />
              <line x1={195} y1={y} x2={265} y2={y} stroke={stroke} strokeWidth={1.5} />
            </g>
          ))}
          <text x={90} y={162} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize={10} fill="hsl(var(--muted-foreground))">Option A</text>
          <text x={230} y={162} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize={10} fill={label} fontWeight={600}>Option B</text>
        </g>
      );
    case "checklist":
      return (
        <g>
          <rect x={70} y={35} width={180} height={120} rx={6} fill={fillCard} stroke={stroke} strokeWidth={1.5} />
          {[60, 82, 104, 126].map((y, i) => (
            <g key={y}>
              <rect x={85} y={y - 8} width={12} height={12} rx={2} fill={i < 3 ? stroke : "none"} stroke={stroke} strokeWidth={1.5} />
              {i < 3 && <path d={`M 88 ${y - 2} L 91 ${y + 1} L 95 ${y - 4}`} stroke="hsl(var(--primary-foreground))" strokeWidth={1.5} fill="none" strokeLinecap="round" />}
              <line x1={108} y1={y - 2} x2={i === 3 ? 200 : 235} y2={y - 2} stroke={strokeSoft} strokeWidth={1.5} />
            </g>
          ))}
        </g>
      );
    case "cash":
      return (
        <g>
          <path d="M 30 130 Q 90 90 160 110 T 290 80" fill="none" stroke={stroke} strokeWidth={2} />
          <path d="M 30 140 Q 90 100 160 120 T 290 90" fill="none" stroke={accent} strokeWidth={2} strokeDasharray="4 4" />
          {[
            [30, 130],
            [95, 100],
            [160, 110],
            [225, 92],
            [290, 80],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={4} fill={fillCard} stroke={stroke} strokeWidth={1.5} />
          ))}
        </g>
      );
    case "revenue":
      return (
        <g>
          {[
            [50, 120, 30],
            [95, 100, 50],
            [140, 80, 70],
            [185, 70, 80],
            [230, 55, 95],
          ].map(([x, y, h], i) => (
            <rect key={i} x={x} y={y} width={30} height={h} fill={stroke} opacity={0.5 + i * 0.1} />
          ))}
          <line x1={30} y1={150} x2={290} y2={150} stroke={strokeSoft} strokeWidth={1} />
        </g>
      );
    case "features":
      return (
        <g>
          {[
            [80, 60],
            [160, 60],
            [240, 60],
            [80, 130],
            [160, 130],
            [240, 130],
          ].map(([x, y], i) => (
            <g key={i}>
              <rect x={x - 25} y={y - 20} width={50} height={40} rx={4} fill={fillCard} stroke={stroke} strokeWidth={1.5} />
              <circle cx={x} cy={y - 4} r={5} fill={stroke} opacity={0.6} />
              <line x1={x - 14} y1={y + 8} x2={x + 14} y2={y + 8} stroke={strokeSoft} strokeWidth={1.5} />
            </g>
          ))}
        </g>
      );
    case "use-cases":
      return (
        <g>
          {[70, 130, 190, 250].map((x, i) => (
            <g key={x}>
              <circle cx={x} cy={80} r={16} fill={fillCard} stroke={stroke} strokeWidth={1.5} />
              <circle cx={x} cy={73} r={5} fill={stroke} opacity={0.6} />
              <path d={`M ${x - 10} 92 Q ${x} 85 ${x + 10} 92`} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
              <rect x={x - 20} y={110} width={40} height={6} rx={3} fill={strokeSoft} opacity={0.4} />
              {i < 3 && <line x1={x + 20} y1={80} x2={x + 40} y2={80} stroke={strokeSoft} strokeWidth={1} strokeDasharray="2 3" />}
            </g>
          ))}
        </g>
      );
  }
}
