/**
 * Supabase query helpers to avoid the default PostgREST 1,000-row limit.
 *
 * PostgREST caps every SELECT at 1,000 rows unless the client sends an
 * explicit `limit` header.  This module re-exports convenience wrappers
 * that apply a safe default of 1,000,000 rows so data is never silently
 * truncated.
 *
 * Usage:
 *   import { selectAll } from "@/lib/supabaseQuery";
 *   const { data, error } = await selectAll("processed_data")
 *     .eq("project_id", id)
 *     .eq("data_type", "trial_balance");
 */

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

const MAX_ROWS = 1_000_000;

type TableName = keyof Database["public"]["Tables"];

/**
 * Wrapper around `supabase.from(table).select(columns)` that applies
 * `.limit(1_000_000)` so the 1,000-row default is never hit.
 *
 * Returns the same PostgrestFilterBuilder you'd normally chain on.
 */
export function selectAll<T extends TableName>(
  table: T,
  columns: string = "*",
) {
  return supabase.from(table).select(columns).limit(MAX_ROWS);
}
