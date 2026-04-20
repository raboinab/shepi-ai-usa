/**
 * DD Adjustments slide — ranked-card list with amount badges.
 * Replaces the dense 6-column table with scannable, deal-commentary cards.
 */
import { PDF_COLORS, PDF_FONTS } from "@/lib/pdf/theme";
import type { SlideProps } from "@/lib/pdf/reportTypes";
import { SlideLayout } from "./SlideLayout";
import { normalizeAdjustments, formatCompactCurrency, type RawAdjustmentInput } from "@/lib/pdf/exportNormalize";

const BLOCK_TONE: Record<string, string> = {
  MA: PDF_COLORS.gold,
  DD: PDF_COLORS.teal,
  PF: PDF_COLORS.midBlue,
};

const VERIFICATION_TONE: Record<string, string> = {
  validated: "#27ae60",
  supported: "#27ae60",
  partial: "#e67e22",
  insufficient: "#c0392b",
  contradictory: "#c0392b",
  pending: PDF_COLORS.midGray,
};

export function DDAdjustmentsSlide({ metadata, pageNumber, totalPages, data }: SlideProps) {
  const raw = (data?.adjustments as RawAdjustmentInput[]) || [];
  const all = normalizeAdjustments(raw);
  const display = all.slice(0, 9);
  const remaining = all.length - display.length;

  const totalAmount = all.reduce((s, a) => s + (a.amount || 0), 0);
  const verifiedCount = all.filter(a => a.verificationStatus && a.verificationStatus !== "pending").length;

  return (
    <SlideLayout metadata={metadata} pageNumber={pageNumber} totalPages={totalPages} sectionTitle="DD Adjustments">
      <div style={{ fontFamily: PDF_FONTS.body }}>
        {/* Heading */}
        <div style={{ fontSize: 32, fontWeight: 700, color: PDF_COLORS.darkBlue, marginBottom: 6 }}>
          Due Diligence Adjustments
        </div>
        <div style={{ width: 60, height: 4, backgroundColor: PDF_COLORS.teal, marginBottom: 14 }} />

        {/* Summary band */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 22,
            padding: "14px 20px",
            backgroundColor: PDF_COLORS.darkBlue,
            color: PDF_COLORS.white,
            borderRadius: 6,
          }}
        >
          <SummaryStat label="Adjustments" value={String(all.length)} />
          <Divider />
          <SummaryStat label="Net Impact" value={formatCompactCurrency(totalAmount)} />
          <Divider />
          <SummaryStat label="Verified" value={`${verifiedCount} / ${all.length}`} />
        </div>

        {all.length === 0 ? (
          <div style={{ fontSize: 16, color: PDF_COLORS.midGray, marginTop: 30 }}>
            No adjustments have been recorded for this engagement.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {display.map((adj, idx) => {
              const tone = BLOCK_TONE[adj.block] || PDF_COLORS.teal;
              const isNeg = adj.amount < 0;
              const vTone = adj.verificationStatus ? VERIFICATION_TONE[adj.verificationStatus] : null;
              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    backgroundColor: "#FAFAF7",
                    border: `1px solid ${PDF_COLORS.lightGray}`,
                    borderRadius: 6,
                    overflow: "hidden",
                  }}
                >
                  {/* Block tone stripe */}
                  <div style={{ width: 6, backgroundColor: tone, flexShrink: 0 }} />

                  {/* Body */}
                  <div style={{ flex: 1, padding: "12px 18px", display: "flex", alignItems: "center", gap: 16 }}>
                    {/* Left: title + reason */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: adj.reason ? 4 : 0 }}>
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: PDF_COLORS.darkBlue,
                            lineHeight: 1.25,
                          }}
                        >
                          {adj.title}
                        </div>
                        <Tag color={tone}>{adj.blockLabel}</Tag>
                        {adj.category && adj.category !== "—" && (
                          <Tag color={PDF_COLORS.midGray} subtle>{adj.category}</Tag>
                        )}
                        {vTone && adj.verificationLabel && (
                          <Tag color={vTone} subtle>{adj.verificationLabel}</Tag>
                        )}
                      </div>
                      {adj.reason && (
                        <div style={{ fontSize: 12, color: PDF_COLORS.midGray, lineHeight: 1.4 }}>
                          {adj.reason}
                        </div>
                      )}
                    </div>

                    {/* Right: amount badge */}
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: isNeg ? "#c0392b" : PDF_COLORS.darkBlue,
                        whiteSpace: "nowrap",
                        textAlign: "right",
                        minWidth: 110,
                      }}
                    >
                      {formatCompactCurrency(adj.amount)}
                    </div>
                  </div>
                </div>
              );
            })}

            {remaining > 0 && (
              <div
                style={{
                  fontSize: 12,
                  color: PDF_COLORS.midGray,
                  fontStyle: "italic",
                  textAlign: "center",
                  paddingTop: 4,
                }}
              >
                … and {remaining} additional adjustment{remaining !== 1 ? "s" : ""} detailed in the workbook.
              </div>
            )}
          </div>
        )}
      </div>
    </SlideLayout>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, color: PDF_COLORS.lightGray, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: PDF_COLORS.white }}>{value}</div>
    </div>
  );
}

function Divider() {
  return <div style={{ width: 1, backgroundColor: "rgba(255,255,255,0.2)" }} />;
}

function Tag({ children, color, subtle }: { children: React.ReactNode; color: string; subtle?: boolean }) {
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        padding: "2px 7px",
        borderRadius: 3,
        color: subtle ? color : PDF_COLORS.white,
        backgroundColor: subtle ? "transparent" : color,
        border: subtle ? `1px solid ${color}` : "none",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}
