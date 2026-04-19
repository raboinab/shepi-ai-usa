import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// QBO JE shape (real): line[].journalEntryLineDetail.{accountRef.name, postingType, taxAmount}
interface QBOJELineDetail {
  accountRef?: { name?: string; value?: string };
  postingType?: string; // "DEBIT" | "CREDIT" (uppercase)
  entity?: { name?: string; value?: string } | null;
}
interface QBOJELine {
  id?: string;
  amount?: number;
  description?: string | null;
  detailType?: string;
  journalEntryLineDetail?: QBOJELineDetail | null;
}
interface QBOJournalEntry {
  id?: string;
  txnDate?: string;
  docNumber?: string;
  privateNote?: string | null;
  line?: QBOJELine[];
  totalAmt?: number;
  metaData?: { createTime?: string; lastUpdatedTime?: string } | null;
  adjustment?: boolean;
}

interface RedFlag {
  id: string;
  date: string;
  description: string;
  amount: number;
  reason: string;
  category: "round" | "weekend" | "period_end" | "revenue_je" | "reversal" | "duplicate" | "one_sided" | "large" | "suspense";
  severity: "high" | "medium" | "low";
  accounts?: string[];
}

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { projectId } = await req.json() as { projectId: string };
    if (!projectId) {
      return new Response(JSON.stringify({ error: "projectId is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[ANALYZE-JE] Starting analysis for project: ${projectId}`);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // ─── Pull JE data ───
    const { data: jeRecords } = await supabase
      .from("processed_data")
      .select("data, period_start, period_end, created_at")
      .eq("project_id", projectId)
      .eq("data_type", "journal_entries")
      .order("created_at", { ascending: false })
      .limit(1);

    if (!jeRecords || jeRecords.length === 0) {
      return new Response(JSON.stringify({ error: "No journal entry data found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const raw = jeRecords[0].data as unknown;
    let entries: QBOJournalEntry[] = [];
    if (Array.isArray(raw)) entries = raw as QBOJournalEntry[];
    else if (raw && typeof raw === "object") {
      const obj = raw as Record<string, unknown>;
      entries = (obj.entries || obj.journalEntries || obj.rows || []) as QBOJournalEntry[];
      if (!Array.isArray(entries)) entries = [];
    }
    console.log(`[ANALYZE-JE] Found ${entries.length} journal entries`);

    // ─── Optional: COA classification map ───
    const { data: coaRecords } = await supabase
      .from("processed_data")
      .select("data")
      .eq("project_id", projectId)
      .eq("data_type", "chart_of_accounts")
      .order("created_at", { ascending: false })
      .limit(1);

    const coaClassByName = new Map<string, string>(); // name → ASSET/LIABILITY/EQUITY/INCOME/EXPENSE
    if (coaRecords && coaRecords.length > 0) {
      const coaArr = coaRecords[0].data as Array<Record<string, unknown>>;
      if (Array.isArray(coaArr)) {
        for (const a of coaArr) {
          const name = (a.fullyQualifiedName || a.name || "") as string;
          const cls = (a.classification || "") as string;
          if (name && cls) coaClassByName.set(name.toLowerCase(), cls.toUpperCase());
        }
      }
    }
    const classify = (acctName: string): string => {
      const cls = coaClassByName.get(acctName.toLowerCase());
      if (cls) return cls;
      const n = acctName.toLowerCase();
      if (n.match(/revenue|sales|income/)) return "INCOME";
      if (n.match(/cogs|cost of goods/)) return "EXPENSE";
      if (n.match(/expense|cost/)) return "EXPENSE";
      if (n.match(/payable|liabilit|loan|debt|accrued/)) return "LIABILITY";
      if (n.match(/equity|capital|retained/)) return "EQUITY";
      return "OTHER";
    };

    // ─── Compute counters ───
    const flags: RedFlag[] = [];
    const monthlyDistribution: Record<string, number> = {};
    const accountHits: Record<string, number> = {};
    let totalDebits = 0, totalCredits = 0;
    let adjustingCount = 0, regularCount = 0;
    let roundNumberCount = 0, weekendCount = 0, periodEndCount = 0;
    let largeEntryCount = 0, oneSidedCount = 0, balancedCount = 0, unbalancedCount = 0;

    // Threshold: top 5% of entries by amount, min $10k
    const allTotals = entries.map(e => Math.abs(e.totalAmt || 0)).filter(a => a > 0).sort((a, b) => b - a);
    const p95 = allTotals[Math.floor(allTotals.length * 0.05)] || 0;
    const largeThreshold = Math.max(p95, 10000);

    // For duplicate / reversal detection: index by date+|amount|+leadAccount
    const sigIndex = new Map<string, { entry: QBOJournalEntry; amount: number; sign: number; account: string }[]>();

    for (const entry of entries) {
      const date = (entry.txnDate || "").substring(0, 10);
      const memo = entry.privateNote || "";
      const docNum = entry.docNumber || entry.id || "";
      const total = Math.abs(entry.totalAmt || 0);
      const lines = entry.line || [];

      if (date) {
        const monthKey = date.substring(0, 7);
        monthlyDistribution[monthKey] = (monthlyDistribution[monthKey] || 0) + 1;
      }

      // Walk lines
      let entryDebit = 0, entryCredit = 0;
      const accountsTouched: string[] = [];
      let postingLineCount = 0;

      for (const line of lines) {
        const det = line.journalEntryLineDetail;
        if (!det) continue;
        postingLineCount++;
        const acctName = det.accountRef?.name || "Unknown";
        accountsTouched.push(acctName);
        accountHits[acctName] = (accountHits[acctName] || 0) + 1;

        const amt = Math.abs(line.amount || 0);
        const pt = (det.postingType || "").toUpperCase();
        if (pt === "DEBIT") { totalDebits += amt; entryDebit += amt; }
        else if (pt === "CREDIT") { totalCredits += amt; entryCredit += amt; }
      }

      // Balanced check
      if (postingLineCount > 0) {
        if (Math.abs(entryDebit - entryCredit) < 0.01) balancedCount++;
        else unbalancedCount++;
      }

      // Adjusting heuristic
      const memoLower = memo.toLowerCase();
      const isAdjusting = entry.adjustment === true ||
        /\b(adjust|reclass|correction|accru|revers|true.?up|year.?end|close|writeoff|write.off)\b/.test(memoLower);
      if (isAdjusting) adjustingCount++; else regularCount++;

      // ── Round-number large entries ──
      if (total >= 1000 && total % 1000 === 0) {
        roundNumberCount++;
        if (total >= largeThreshold) {
          flags.push({
            id: `round-${docNum}`, date, description: memo || `JE #${docNum}`,
            amount: total, reason: "Large round-number entry", category: "round",
            severity: "medium", accounts: accountsTouched.slice(0, 3),
          });
        }
      }

      // ── Weekend posting ──
      if (date) {
        const d = new Date(date + "T00:00:00Z");
        const day = d.getUTCDay();
        if (day === 0 || day === 6) {
          weekendCount++;
          if (total >= largeThreshold) {
            flags.push({
              id: `wknd-${docNum}`, date, description: memo || `JE #${docNum}`,
              amount: total, reason: "Posted on weekend", category: "weekend",
              severity: "medium", accounts: accountsTouched.slice(0, 3),
            });
          }
        }
      }

      // ── Period-end clustering: last 3 days of any month ──
      if (date) {
        const dayOfMonth = parseInt(date.substring(8, 10));
        const monthEndDay = new Date(parseInt(date.substring(0, 4)), parseInt(date.substring(5, 7)), 0).getDate();
        if (dayOfMonth >= monthEndDay - 2) {
          periodEndCount++;
          // Year-end specifically
          const month = parseInt(date.substring(5, 7));
          if (month === 12 && dayOfMonth >= 28 && total >= largeThreshold) {
            flags.push({
              id: `ye-${docNum}`, date, description: memo || `JE #${docNum}`,
              amount: total, reason: "Year-end entry (Dec 28-31)", category: "period_end",
              severity: "high", accounts: accountsTouched.slice(0, 3),
            });
          }
        }
      }

      // ── Large entries ──
      if (total >= largeThreshold) largeEntryCount++;

      // ── Manual entries hitting Revenue / COGS / Reserve accounts ──
      if (!isAdjusting) {
        for (const acct of accountsTouched) {
          const cls = classify(acct);
          if (cls === "INCOME" && total >= largeThreshold) {
            flags.push({
              id: `rev-${docNum}`, date, description: `${memo || "JE"} → ${acct}`,
              amount: total, reason: "Non-adjusting entry hitting Revenue account",
              category: "revenue_je", severity: "high", accounts: [acct],
            });
            break;
          }
        }
      }

      // ── Suspense / clearing accounts ──
      for (const acct of accountsTouched) {
        if (/suspense|ask my accountant|clearing|undeposited.*funds/i.test(acct) && total >= 1000) {
          flags.push({
            id: `susp-${docNum}-${acct}`, date, description: `${memo || "JE"} → ${acct}`,
            amount: total, reason: `Activity in suspense/clearing account: ${acct}`,
            category: "suspense", severity: "medium", accounts: [acct],
          });
          break;
        }
      }

      // ── One-sided (broken double-entry) ──
      if (postingLineCount === 1 && total > 0) {
        oneSidedCount++;
        flags.push({
          id: `one-${docNum}`, date, description: memo || `JE #${docNum}`,
          amount: total, reason: "One-sided journal entry (no balancing line)",
          category: "one_sided", severity: "high", accounts: accountsTouched,
        });
      }

      // Build duplicate / reversal index
      if (total > 0 && date) {
        const leadAcct = accountsTouched[0] || "";
        const sign = entryDebit >= entryCredit ? 1 : -1;
        const key = `${date}|${total.toFixed(2)}|${leadAcct.toLowerCase()}`;
        const arr = sigIndex.get(key) || [];
        arr.push({ entry, amount: total, sign, account: leadAcct });
        sigIndex.set(key, arr);
      }
    }

    // ── Duplicate detection: same date + amount + lead account + similar memo ──
    const seenDups = new Set<string>();
    for (const [key, arr] of sigIndex) {
      if (arr.length < 2) continue;
      // group by memo prefix
      const byMemo = new Map<string, typeof arr>();
      for (const item of arr) {
        const memoKey = (item.entry.privateNote || "").toLowerCase().substring(0, 20);
        byMemo.set(memoKey, [...(byMemo.get(memoKey) || []), item]);
      }
      for (const [, group] of byMemo) {
        if (group.length >= 2 && !seenDups.has(key)) {
          seenDups.add(key);
          const first = group[0].entry;
          flags.push({
            id: `dup-${first.id}`, date: first.txnDate?.substring(0, 10) || "",
            description: `${group.length} duplicate entries: ${first.privateNote || `#${first.docNumber}`}`,
            amount: group[0].amount,
            reason: `${group.length} entries with same date/amount/account`,
            category: "duplicate", severity: "high",
            accounts: [group[0].account],
          });
        }
      }
    }

    // ── Reversal detection: same |amount| + same account, opposite sign, within 7 days ──
    type SignedEntry = { entry: QBOJournalEntry; amount: number; sign: number; date: Date; account: string };
    const all: SignedEntry[] = [];
    for (const arr of sigIndex.values()) {
      for (const it of arr) {
        if (it.entry.txnDate) {
          all.push({ ...it, date: new Date(it.entry.txnDate) });
        }
      }
    }
    const byAmtAcct = new Map<string, SignedEntry[]>();
    for (const e of all) {
      const k = `${e.amount.toFixed(2)}|${e.account.toLowerCase()}`;
      byAmtAcct.set(k, [...(byAmtAcct.get(k) || []), e]);
    }
    let reversalCount = 0;
    const seenRev = new Set<string>();
    for (const [, group] of byAmtAcct) {
      if (group.length < 2) continue;
      group.sort((a, b) => a.date.getTime() - b.date.getTime());
      for (let i = 0; i < group.length - 1; i++) {
        const a = group[i], b = group[i + 1];
        const days = (b.date.getTime() - a.date.getTime()) / (1000 * 60 * 60 * 24);
        if (days <= 7 && a.sign !== b.sign && a.amount >= 1000) {
          const key = `${a.entry.id}-${b.entry.id}`;
          if (seenRev.has(key)) continue;
          seenRev.add(key);
          reversalCount++;
          if (a.amount >= largeThreshold) {
            flags.push({
              id: `rev-${a.entry.id}`, date: a.entry.txnDate?.substring(0, 10) || "",
              description: `Reversed within ${Math.round(days)}d: ${a.entry.privateNote || `#${a.entry.docNumber}`}`,
              amount: a.amount,
              reason: `Same-amount opposite-sign entry on ${b.entry.txnDate?.substring(0, 10)}`,
              category: "reversal", severity: "high", accounts: [a.account],
            });
          }
        }
      }
    }

    // Summary flags
    const summaryFlags: string[] = [];
    if (entries.length > 0) {
      const yePct = (periodEndCount / entries.length) * 100;
      if (yePct > 25 && periodEndCount > 20) {
        summaryFlags.push(`${periodEndCount} entries (${yePct.toFixed(0)}%) cluster near period-end — review for cutoff manipulation`);
      }
      if (roundNumberCount > entries.length * 0.3) {
        summaryFlags.push(`${roundNumberCount} round-number entries (${((roundNumberCount / entries.length) * 100).toFixed(0)}%) — may indicate estimates`);
      }
      if (weekendCount > 10) summaryFlags.push(`${weekendCount} weekend entries — verify legitimacy`);
      if (adjustingCount > entries.length * 0.25) {
        summaryFlags.push(`High adjusting-entry ratio: ${adjustingCount} of ${entries.length}`);
      }
      if (oneSidedCount > 0) {
        summaryFlags.push(`${oneSidedCount} one-sided entries — broken double-entry`);
      }
      if (unbalancedCount > 0) {
        summaryFlags.push(`${unbalancedCount} entries with unbalanced debits/credits`);
      }
      if (reversalCount > 5) {
        summaryFlags.push(`${reversalCount} reversal pairs detected — possible window-dressing`);
      }
    }

    // Sort & cap
    flags.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.severity] - order[b.severity] || b.amount - a.amount;
    });
    const dedupedFlags: RedFlag[] = [];
    const seenIds = new Set<string>();
    for (const f of flags) {
      if (seenIds.has(f.id)) continue;
      seenIds.add(f.id);
      dedupedFlags.push(f);
      if (dedupedFlags.length >= 50) break;
    }

    const topAccounts = Object.entries(accountHits)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([name, count]) => ({ name, count }));

    const allDates = entries.map(e => e.txnDate?.substring(0, 10)).filter(Boolean).sort() as string[];
    const periodStart = allDates[0] || jeRecords[0].period_start;
    const periodEnd = allDates[allDates.length - 1] || jeRecords[0].period_end;

    const analysisResult = {
      entryCount: entries.length,
      adjustingEntries: adjustingCount,
      regularEntries: regularCount,
      balancedEntries: balancedCount,
      unbalancedEntries: unbalancedCount,
      oneSidedEntries: oneSidedCount,
      totalDebits, totalCredits,
      netDifference: Math.abs(totalDebits - totalCredits),
      monthlyDistribution,
      topAccounts,
      redFlags: dedupedFlags,
      summaryFlags,
      periodEndCluster: periodEndCount,
      weekendEntries: weekendCount,
      roundNumberEntries: roundNumberCount,
      largeEntries: largeEntryCount,
      reversalPairs: reversalCount,
      duplicateGroups: seenDups.size,
      largeEntryThreshold: largeThreshold,
      periodStart, periodEnd,
      analyzedAt: new Date().toISOString(),
      sourceUpdatedAt: jeRecords[0].created_at,
    };

    const { data: projectData } = await supabase
      .from("projects").select("user_id").eq("id", projectId).single();

    const { error: insertError } = await supabase.from("processed_data").insert({
      project_id: projectId,
      user_id: projectData?.user_id || "",
      source_type: "je_analysis",
      data_type: "journal_entry_analysis",
      data: analysisResult,
      record_count: entries.length,
      validation_status: "validated",
    });
    if (insertError) console.error("[ANALYZE-JE] Failed to store:", insertError);

    console.log(`[ANALYZE-JE] Complete: ${entries.length} entries, ${dedupedFlags.length} red flags, ${summaryFlags.length} summary flags, ${reversalCount} reversals, ${seenDups.size} dup-groups`);

    return new Response(JSON.stringify({ success: true, ...analysisResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[ANALYZE-JE] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
