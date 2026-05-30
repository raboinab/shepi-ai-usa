import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

// Mock the supabase client BEFORE importing the hook.
const headMock = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => headMock(),
        }),
      }),
    }),
  },
}));

import { useCoaReadiness } from "./useCoaReadiness";

describe("useCoaReadiness", () => {
  beforeEach(() => {
    headMock.mockReset();
  });

  it("is ready when wizardData has local accounts (no DB call needed)", async () => {
    const { result } = renderHook(() =>
      useCoaReadiness("p1", { chartOfAccounts: { accounts: [{ id: "a" }] } }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.ready).toBe(true);
    expect(result.current.hasLocalAccounts).toBe(true);
    expect(headMock).not.toHaveBeenCalled();
  });

  it("is NOT ready when wizardData claims QB sync but no accounts and DB has none", async () => {
    headMock.mockResolvedValue({ count: 0, error: null });
    const { result } = renderHook(() =>
      useCoaReadiness("p1", {
        chartOfAccounts: { accounts: [], syncSource: "quickbooks" },
      }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.ready).toBe(false);
  });

  it("is ready when processed_data has COA rows even without local accounts", async () => {
    headMock.mockResolvedValue({ count: 12, error: null });
    const { result } = renderHook(() => useCoaReadiness("p1", {}));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.ready).toBe(true);
    expect(result.current.hasProcessedRows).toBe(true);
  });
});
