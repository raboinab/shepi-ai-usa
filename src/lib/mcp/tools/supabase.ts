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
