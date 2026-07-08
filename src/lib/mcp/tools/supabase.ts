import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

// Deno is available at runtime inside the bundled Supabase edge function.
// TypeScript in this file is compiled as part of the Vite bundle, so we
// declare a minimal Deno shape to keep the editor happy.
declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
};

/** Create a Supabase client that acts as the authenticated MCP user. */
export function supabaseForUser(ctx: ToolContext) {
  if (!ctx.isAuthenticated()) {
    return { error: "Not authenticated" as const, client: null };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseKey) {
    return { error: "Server configuration error" as const, client: null };
  }

  const client = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return { error: null, client };
}

export type SupabaseForUserResult = ReturnType<typeof supabaseForUser>;

/**
 * Invoke another edge function as the authenticated MCP user, forwarding their
 * JWT so the target function's own getUser()/requireProjectAccess() checks pass.
 */
export async function invokeEdgeFunction(
  ctx: ToolContext,
  name: string,
  body: unknown,
): Promise<{ ok: boolean; status: number; data: unknown }> {
  if (!ctx.isAuthenticated()) {
    return { ok: false, status: 401, data: { error: "Not authenticated" } };
  }
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseKey) {
    return { ok: false, status: 500, data: { error: "Server configuration error" } };
  }
  const resp = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ctx.getToken()}`,
      apikey: supabaseKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body ?? {}),
  });
  let data: unknown = null;
  try {
    data = await resp.json();
  } catch {
    // non-JSON response
  }
  return { ok: resp.ok, status: resp.status, data };
}
