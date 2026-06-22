// Pure structural validator for trial balances. Lives in a separate file so
// the Deno test runner can import it without resolving the npm dependencies
// (Anthropic SDK, Supabase client) that index.ts pulls in.

export interface TBAccountLike {
  fsType: "BS" | "IS";
  accountName?: string;
  monthlyValues?: Record<string, number>;
}

export interface PeriodLike {
  id: string;
  label?: string;
}

export const BALANCE_TOLERANCE = 1;

export function balanceByPeriod(accounts: TBAccountLike[], periods: PeriodLike[]) {
  return periods.map((p) => {
    let bs = 0, is = 0;
    for (const a of accounts) {
      const v = a.monthlyValues?.[p.id] || 0;
      if (a.fsType === "BS") bs += v; else is += v;
    }
    return { periodId: p.id, label: p.label || p.id, bs, is, check: bs + is };
  });
}

export type TbStructureReason =
  | "no_is_accounts"
  | "no_bs_accounts"
  | "is_all_zero"
  | "imbalance_is_noise";

export interface TbStructureResult {
  status: "ok" | "degenerate";
  reason?: TbStructureReason;
  diagnostics: {
    bsAccounts: number;
    isAccounts: number;
    maxAbsImbalance: number;
    periodsChecked: number;
    maxAbsIsRowSum: number;
  };
  message?: string;
}

export function validateTbStructure(
  accounts: TBAccountLike[],
  periods: PeriodLike[],
  tolerance = BALANCE_TOLERANCE,
): TbStructureResult {
  const bsAccounts = accounts.filter((a) => a.fsType === "BS").length;
  const isAccounts = accounts.filter((a) => a.fsType === "IS").length;

  const balances = balanceByPeriod(accounts, periods);
  const maxAbsImbalance = balances.reduce((m, b) => Math.max(m, Math.abs(b.check)), 0);

  let maxAbsIsRowSum = 0;
  for (const a of accounts) {
    if (a.fsType !== "IS") continue;
    let s = 0;
    for (const p of periods) s += a.monthlyValues?.[p.id] || 0;
    const abs = Math.abs(s);
    if (abs > maxAbsIsRowSum) maxAbsIsRowSum = abs;
  }

  const diagnostics = {
    bsAccounts,
    isAccounts,
    maxAbsImbalance,
    periodsChecked: periods.length,
    maxAbsIsRowSum,
  };

  if (bsAccounts === 0) {
    return {
      status: "degenerate",
      reason: "no_bs_accounts",
      diagnostics,
      message:
        "Trial balance has no Balance Sheet accounts. Upload a Balance Sheet or rebuild the TB from the General Ledger before auto-balancing.",
    };
  }

  if (isAccounts === 0) {
    return {
      status: "degenerate",
      reason: "no_is_accounts",
      diagnostics,
      message:
        `Trial balance has ${bsAccounts} Balance Sheet accounts and 0 Income Statement accounts. The TB appears to have been derived from a Balance Sheet only — net income was folded into Retained Earnings instead of decomposed into revenue/expense rows. Rebuild the TB from the General Ledger before auto-balancing.`,
    };
  }

  if (maxAbsIsRowSum === 0) {
    return {
      status: "degenerate",
      reason: "is_all_zero",
      diagnostics,
      message:
        "Income Statement accounts exist but all values are zero across every period. Revenue and expense appear to be lumped into Retained Earnings. Rebuild the TB from the General Ledger before auto-balancing.",
    };
  }

  if (
    maxAbsImbalance > tolerance &&
    maxAbsIsRowSum > 0 &&
    maxAbsImbalance < 0.001 * maxAbsIsRowSum
  ) {
    return {
      status: "degenerate",
      reason: "imbalance_is_noise",
      diagnostics,
      message:
        "Trial balance is balanced within rounding tolerance relative to the underlying revenue/expense magnitudes. Any AI plug would just absorb rounding noise — no action needed.",
    };
  }

  return { status: "ok", diagnostics };
}
