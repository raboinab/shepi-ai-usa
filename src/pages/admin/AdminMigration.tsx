import { useState } from "react";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Download, Database, Users, HardDrive, CloudUpload, AlertTriangle, ShieldCheck, Wrench } from "lucide-react";
import { toast } from "sonner";

type StepKey = "schema" | "auth" | "storage" | "push-schema" | "push-data" | "patch-triggers" | "push-auth" | "push-storage" | "verify";

interface StepState {
  status: "idle" | "running" | "success" | "error";
  message?: string;
  progress?: number;
  data?: any;
}

const TABLES_FK_ORDER = [
  // Independent / lookup tables first
  "profiles", "user_roles", "promo_config", "contact_submissions",
  "demo_views", "nudge_log", "processed_webhook_events",
  "rag_chunks", "subscriptions",
  "tos_acceptances", "user_credits", "whitelisted_users",
  "admin_notes", "dfy_provider_agreements", "migration_runs",
  // Projects + direct dependents
  "projects",
  "project_shares", "project_payments", "company_info", "documents",
  "processed_data", "project_data_chunks", "qb_sync_requests",
  "workflows", "cpa_claims", "reclassification_jobs",
  "analysis_jobs", "chat_messages", "flagged_transactions",
  "adjustment_proofs", "docuclipper_jobs", "canonical_transactions",
  // Discovery chain
  "detector_runs", "observations", "tensions", "hypotheses", "findings",
  "adjustment_proposals", "proposal_evidence", "claim_ledger",
  "entity_nodes", "business_profiles",
  // Verification chain (depends on adjustment_proposals)
  "verification_attempts", "verification_transaction_snapshots",
];

// Per-table chunk size override. Defaults to 500.
const TABLE_CHUNK_SIZE: Record<string, number> = {
  canonical_transactions: 200,
  verification_transaction_snapshots: 500,
  project_data_chunks: 25,  // 1536-dim embedding vectors — keep tiny
  processed_data: 1,        // large jsonb payloads — migrate one row per request
  rag_chunks: 50,
};

const RESUME_KEY = "migration:push-data:offsets";
const SKIP_KEY = "migration:push-data:skip";
const loadOffsets = (): Record<string, number> => {
  try { return JSON.parse(localStorage.getItem(RESUME_KEY) || "{}"); } catch { return {}; }
};
const saveOffsets = (o: Record<string, number>) => {
  try { localStorage.setItem(RESUME_KEY, JSON.stringify(o)); } catch {}
};
const loadSkips = (): string[] => {
  try { return JSON.parse(localStorage.getItem(SKIP_KEY) || "[]"); } catch { return []; }
};
const saveSkips = (s: string[]) => {
  try { localStorage.setItem(SKIP_KEY, JSON.stringify(s)); } catch {}
};

export default function AdminMigration() {
  const { isLoading } = useAdminCheck();
  const [steps, setSteps] = useState<Record<StepKey, StepState>>({
    schema: { status: "idle" },
    auth: { status: "idle" },
    storage: { status: "idle" },
    "push-schema": { status: "idle" },
    "push-data": { status: "idle" },
    "patch-triggers": { status: "idle" },
    "push-auth": { status: "idle" },
    "push-storage": { status: "idle" },
    verify: { status: "idle" },
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [skipList, setSkipList] = useState<string[]>(() => loadSkips());

  const SUGGESTED_SKIPS = ["canonical_transactions", "proposal_evidence", "verification_transaction_snapshots"];

  const log = (msg: string) => setLogs((l) => [...l.slice(-200), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  const setStep = (key: StepKey, patch: Partial<StepState>) =>
    setSteps((s) => ({ ...s, [key]: { ...s[key], ...patch } }));

  const downloadText = (filename: string, text: string) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  const downloadJson = (filename: string, obj: unknown) =>
    downloadText(filename, JSON.stringify(obj, null, 2));

  // Helper to extract a useful error message from the new { ok, error, stage } envelope.
  const extractError = (error: any, data: any): string | null => {
    if (error) return error.message ?? String(error);
    if (data && data.ok === false) {
      return data.stage ? `[${data.stage}] ${data.error ?? "unknown"}` : (data.error ?? "unknown");
    }
    return null;
  };

  // ========== Step 1: Dump schema ==========
  const runDumpSchema = async () => {
    setStep("schema", { status: "running", message: "Querying pg_catalog…" });
    log("Dumping schema DDL from source DB");
    const { data, error } = await supabase.functions.invoke("dump-schema");
    const errMsg = extractError(error, data);
    if (errMsg) {
      setStep("schema", { status: "error", message: errMsg });
      log(`Schema dump failed: ${errMsg}`);
      toast.error("Schema dump failed");
      return;
    }
    setStep("schema", { status: "success", message: `${(data.size / 1024).toFixed(1)} KB`, data: data.schema_sql });
    log(`Schema dump OK (${data.size} bytes)`);
    toast.success("Schema dumped");
  };

  // ========== Step 2: Dump auth users ==========
  const runDumpAuth = async () => {
    setStep("auth", { status: "running", message: "Listing auth.users…" });
    const { data, error } = await supabase.functions.invoke("dump-auth-users");
    const errMsg = extractError(error, data);
    if (errMsg) {
      setStep("auth", { status: "error", message: errMsg });
      log(`Auth dump failed: ${errMsg}`);
      return;
    }
    setStep("auth", { status: "success", message: `${data.count} users`, data: data.users });
    log(`Auth dump OK (${data.count} users)`);
    toast.success(`${data.count} auth users dumped`);
  };

  // ========== Step 3: Dump storage manifest ==========
  const runDumpStorage = async () => {
    setStep("storage", { status: "running", message: "Walking documents bucket…" });
    const { data, error } = await supabase.functions.invoke("dump-storage-manifest");
    const errMsg = extractError(error, data);
    if (errMsg) {
      setStep("storage", { status: "error", message: errMsg });
      log(`Storage manifest failed: ${errMsg}`);
      return;
    }
    const totalMb = (data.files.reduce((s: number, f: any) => s + (f.size || 0), 0) / 1024 / 1024).toFixed(1);
    setStep("storage", { status: "success", message: `${data.count} files (${totalMb} MB)`, data });
    log(`Storage manifest OK (${data.count} files, ${totalMb} MB)`);
    toast.success(`${data.count} files indexed`);
  };

  // ========== Step 4: Push schema to target (regenerates DDL server-side) ==========
  const runPushSchema = async () => {
    setStep("push-schema", { status: "running", message: "Regenerating DDL & executing on target DB…" });
    log("Pushing schema to target DB (server-side regenerate)");
    const { data, error } = await supabase.functions.invoke("migrate-push-schema", {
      body: { mode: "regenerate" },
    });
    const errMsg = extractError(error, data);
    if (errMsg) {
      setStep("push-schema", { status: "error", message: errMsg });
      log(`Schema push failed: ${errMsg}`);
      toast.error("Schema push failed");
      return;
    }
    setStep("push-schema", {
      status: "success",
      message: `${data.tables_in_target} tables in target (${(data.ddl_bytes / 1024).toFixed(1)} KB DDL, ${data.elapsed_ms}ms)`,
    });
    log(`Schema push OK — ${data.tables_in_target} tables, ${data.ddl_bytes} bytes, ${data.elapsed_ms}ms`);
    toast.success("Schema pushed");
  };

  // ========== Step 5: Push data table by table (resumable) ==========
  const runPushData = async (opts: { resume?: boolean } = {}) => {
    const offsets = opts.resume ? loadOffsets() : {};
    const skips = new Set(loadSkips());
    if (!opts.resume) saveOffsets({});
    setStep("push-data", { status: "running", message: opts.resume ? "Resuming…" : "Starting…", progress: 0 });
    if (opts.resume) log(`↻ Resuming from saved offsets (${Object.keys(offsets).length} tables in progress)`);
    if (skips.size > 0) log(`⊘ Skipping ${skips.size} table(s): ${[...skips].join(", ")}`);

    let totalInserted = 0;
    const perTable: Array<{ table: string; inserted: number; status: "ok" | "error" | "skipped"; error?: string }> = [];

    for (let i = 0; i < TABLES_FK_ORDER.length; i++) {
      const table = TABLES_FK_ORDER[i];
      if (skips.has(table)) {
        log(`⊘ ${table}: skipped`);
        perTable.push({ table, inserted: 0, status: "skipped" });
        continue;
      }
      const limit = TABLE_CHUNK_SIZE[table] ?? 500;
      const startOffset = offsets[table] ?? 0;
      const isFresh = startOffset === 0;
      setStep("push-data", {
        status: "running",
        message: `${table} (${i + 1}/${TABLES_FK_ORDER.length})${startOffset ? ` resume@${startOffset}` : ""}`,
        progress: Math.round((i / TABLES_FK_ORDER.length) * 100),
      });
      log(`▶ ${table} (chunk=${limit}${startOffset ? `, resume@${startOffset}` : ""})`);
      let offset = startOffset;
      let truncate = isFresh; // only truncate on a true fresh start
      let tableInserted = 0;
      let tableErr: string | undefined;
      let safety = 0;
      while (safety++ < 20000) {
        const { data, error } = await supabase.functions.invoke("migrate-push-data", {
          body: { table, offset, limit, truncate },
        });
        truncate = false;
        if (error || (data && data.ok === false)) {
          tableErr = extractError(error, data) ?? "unknown";
          log(`  ✗ ${table} @ offset=${offset}: ${tableErr}`);
          // Persist where we stopped so user can resume.
          const saved = loadOffsets();
          saved[table] = offset;
          saveOffsets(saved);
          break;
        }
        const inserted = data.inserted ?? 0;
        const skipped = data.skipped ?? 0;
        tableInserted += inserted;
        totalInserted += inserted;
        const total = data.total != null ? `/${data.total}` : "";
        log(`  · ${table} offset=${offset} inserted=${inserted}${skipped ? ` skipped=${skipped}` : ""} next=${data.next_offset ?? "—"}${total}${data.errors?.length ? ` err=${data.errors[0].slice(0, 80)}` : ""}`);
        if (data.done) {
          // Clear persisted offset on full completion.
          const saved = loadOffsets();
          delete saved[table];
          saveOffsets(saved);
          break;
        }
        offset = data.next_offset;
        // Persist every 10 chunks for crash safety.
        if (safety % 10 === 0) {
          const saved = loadOffsets();
          saved[table] = offset;
          saveOffsets(saved);
        }
      }
      perTable.push({ table, inserted: tableInserted, status: tableErr ? "error" : "ok", error: tableErr });
      log(`  ${tableErr ? "✗" : "✓"} ${table}: ${tableInserted.toLocaleString()} rows${tableErr ? ` (ERROR: ${tableErr})` : ""}`);
    }
    const errors = perTable.filter((t) => t.status === "error");
    setStep("push-data", {
      status: errors.length > 0 ? "error" : "success",
      message: `${totalInserted.toLocaleString()} rows inserted across ${perTable.filter((t) => t.status === "ok").length}/${perTable.length} tables${errors.length ? ` — ${errors.length} failed` : ""}`,
      progress: 100,
      data: { perTable },
    });
    if (errors.length === 0) toast.success("Data push complete");
    else toast.error(`${errors.length} table(s) failed — see activity log`);
  };

  // Skip-table affordance
  const skipTable = () => {
    const t = window.prompt("Skip which table on next Step 5 run? (exact name)");
    if (!t) return;
    const next = Array.from(new Set([...loadSkips(), t.trim()]));
    saveSkips(next);
    setSkipList(next);
    log(`⊘ Will skip table on next run: ${t.trim()}`);
    toast.success(`Will skip ${t.trim()}`);
  };
  const removeSkip = (table: string) => {
    const next = loadSkips().filter((t) => t !== table);
    saveSkips(next);
    setSkipList(next);
    log(`✓ Removed skip: ${table}`);
  };
  const addSuggestedSkips = () => {
    const next = Array.from(new Set([...loadSkips(), ...SUGGESTED_SKIPS]));
    saveSkips(next);
    setSkipList(next);
    log(`⊘ Added suggested skips: ${SUGGESTED_SKIPS.join(", ")}`);
    toast.success("Added suggested skips");
  };
  const clearSkips = () => {
    saveSkips([]);
    saveOffsets({});
    setSkipList([]);
    log("✓ Cleared skip list and resume offsets");
    toast.success("Cleared resume state");
  };

  // ========== Retry missing storage paths from last verify report ==========
  const retryMissingStorage = async () => {
    const verifyData: any = steps.verify.data;
    const missing: string[] = verifyData?.storage?.missingSample ?? verifyData?.storage?.missing ?? [];
    if (!missing.length) {
      toast.error("No missing storage paths in last verify report — run Step 8 first");
      return;
    }
    log(`Retrying ${missing.length} missing storage path(s)`);
    const { data, error } = await supabase.functions.invoke("migrate-push-storage", {
      body: { paths: missing.slice(0, 25) },
    });
    const errMsg = extractError(error, data);
    if (errMsg) {
      log(`Retry missing storage failed: ${errMsg}`);
      toast.error("Retry failed");
      return;
    }
    log(`Retry result: ${data.summary.uploaded} uploaded, ${data.summary.errors} errors`);
    if (Array.isArray(data.failed)) {
      data.failed.forEach((f: any) => log(`  ✗ ${f.path}: ${f.error}`));
    }
    toast.success(`Retried ${missing.length} file(s)`);
  };

  // ========== Step 5.5: Patch target triggers (idempotent + import-aware) ==========
  const runPatchTriggers = async () => {
    setStep("patch-triggers", { status: "running", message: "Patching handle_new_user & notify_new_signup on target…" });
    log("Patching target triggers via direct DB connection");
    const { data, error } = await supabase.functions.invoke("migrate-patch-target-triggers");
    const errMsg = extractError(error, data);
    if (errMsg) {
      setStep("patch-triggers", { status: "error", message: errMsg });
      log(`Patch triggers failed: ${errMsg}`);
      toast.error("Trigger patch failed");
      return;
    }
    const names = (data.applied ?? []).map((a: any) => a.name).join(", ");
    setStep("patch-triggers", { status: "success", message: `Patched: ${names}`, data });
    log(`Patch triggers OK — ${names}`);
    toast.success("Target triggers patched");
  };

  // ========== Step 6: Push auth users ==========
  const runPushAuth = async () => {
    setStep("push-auth", { status: "running", message: "Creating users on target…" });
    const { data, error } = await supabase.functions.invoke("migrate-push-auth");
    const errMsg = extractError(error, data);
    if (errMsg) {
      setStep("push-auth", { status: "error", message: errMsg });
      log(`Auth push failed: ${errMsg}`);
      return;
    }
    const s = data.summary;
    setStep("push-auth", {
      status: "success",
      message: `${s.created} new, ${s.exists} existing, ${s.errors} errors`,
      data,
    });
    log(`Auth push: ${s.created} created, ${s.exists} existing, ${s.errors} errors`);
    toast.success("Auth migration complete");
  };

  // ========== Step 6b: Push auth users WITH password hashes ==========
  // Direct DB → DB copy of auth.users + auth.identities (preserves bcrypt hashes
  // so email/password users can sign in on the target without resetting).
  const runPushAuthHashes = async () => {
    setStep("push-auth", { status: "running", message: "Copying auth.users + auth.identities (with hashes)…" });
    const { data, error } = await supabase.functions.invoke("migrate-push-auth-hashes");
    const errMsg = extractError(error, data);
    if (errMsg) {
      setStep("push-auth", { status: "error", message: errMsg });
      log(`Hash-preserving auth push failed: ${errMsg}`);
      toast.error("Hash auth push failed");
      return;
    }
    const s = data.summary;
    setStep("push-auth", {
      status: s.users_failed || s.identities_failed ? "error" : "success",
      message: `users: ${s.users_inserted} new / ${s.users_existing} existing / ${s.users_failed} err — identities: ${s.identities_inserted} new / ${s.identities_existing} existing / ${s.identities_failed} err`,
      data,
    });
    log(`Auth+hashes: source ${s.source_users} users → ${s.users_inserted} inserted, ${s.users_existing} existing, ${s.users_failed} failed`);
    log(`Auth+hashes: source ${s.source_identities} identities → ${s.identities_inserted} inserted, ${s.identities_existing} existing, ${s.identities_failed} failed`);
    if (Array.isArray(data.errors)) {
      data.errors.forEach((e: any) => log(`  ✗ ${e.kind} ${e.email ?? e.id}: ${e.error}`));
    }
    toast.success("Hash-preserving auth migration complete");
  };

  // ========== Step 7: Push storage files ==========
  const runPushStorage = async () => {
    const manifest = steps.storage.data;
    if (!manifest?.files?.length) {
      toast.error("Run Step 3 first");
      return;
    }
    setStep("push-storage", { status: "running", message: "Uploading…", progress: 0 });
    const paths: string[] = manifest.files.map((f: any) => f.path);
    let uploaded = 0;
    let errors = 0;
    const failedPaths: Array<{ path: string; error: string }> = [];
    const batchSize = 25;
    for (let i = 0; i < paths.length; i += batchSize) {
      const batch = paths.slice(i, i + batchSize);
      const { data, error } = await supabase.functions.invoke("migrate-push-storage", {
        body: { paths: batch },
      });
      const errMsg = extractError(error, data);
      if (errMsg) {
        errors += batch.length;
        batch.forEach((p) => failedPaths.push({ path: p, error: errMsg }));
        log(`Storage batch @ ${i} failed: ${errMsg}`);
      } else {
        uploaded += data.summary.uploaded;
        errors += data.summary.errors;
        if (Array.isArray(data.failed) && data.failed.length > 0) {
          data.failed.forEach((f: any) => {
            failedPaths.push({ path: f.path, error: f.error ?? "unknown" });
            log(`  ✗ ${f.path}: ${f.error}`);
          });
        }
        log(`Storage batch @ ${i}: ${data.summary.uploaded} ok, ${data.summary.errors} err`);
      }
      setStep("push-storage", {
        status: "running",
        message: `${uploaded}/${paths.length} uploaded`,
        progress: Math.round(((i + batch.length) / paths.length) * 100),
      });
    }
    setStep("push-storage", {
      status: errors > 0 ? "error" : "success",
      message: `${uploaded} uploaded, ${errors} errors`,
      progress: 100,
      data: { failedPaths },
    });
    if (failedPaths.length > 0) {
      log(`\n=== ${failedPaths.length} failed paths ===`);
      const byError = failedPaths.reduce((acc: Record<string, number>, f) => {
        acc[f.error] = (acc[f.error] ?? 0) + 1;
        return acc;
      }, {});
      Object.entries(byError).forEach(([err, count]) => log(`  ${count}x: ${err}`));
    }
    toast.success("Storage migration complete");
  };

  // ========== Bundle download ==========
  const downloadBundle = async () => {
    log("Building migration bundle…");
    if (!steps.schema.data) await runDumpSchema();
    if (!steps.auth.data) await runDumpAuth();
    if (!steps.storage.data) await runDumpStorage();

    if (steps.schema.data) downloadText("01-schema.sql", steps.schema.data);
    if (steps.auth.data) downloadJson("03-auth-users.json", steps.auth.data);
    if (steps.storage.data) downloadJson("04-storage-manifest.json", steps.storage.data);

    const readme = `# Migration Bundle

Generated: ${new Date().toISOString()}

## Files
- 01-schema.sql — full DDL for public schema (run on target DB first)
- 03-auth-users.json — auth users (use Supabase Admin API to import, preserving UUIDs)
- 04-storage-manifest.json — list of documents bucket files with 24h signed URLs

## Notes
- Email/password users will need to reset password on first login on the new project (hashes don't transfer via Admin API).
- Google OAuth users re-link automatically by email match — UUID is preserved.
- Triggers \`notify_*\` use \`current_setting('app.settings.service_role_key')\`. After import on target DB, run:
  ALTER DATABASE postgres SET app.settings.service_role_key = '<new service role key>';
- Edge functions must be deployed separately via \`supabase functions deploy\` against the new project.
- Re-set all 22+ secrets in the new project's dashboard.
`;
    downloadText("README.md", readme);
    toast.success("Bundle downloaded");
  };

  // ========== Step 8: Verify parity ==========
  const runVerify = async () => {
    setStep("verify", { status: "running", message: "Cross-checking source vs target…" });
    log("Running migration parity verification");
    const { data, error } = await supabase.functions.invoke("migrate-verify");
    const errMsg = extractError(error, data);
    if (errMsg) {
      setStep("verify", { status: "error", message: errMsg });
      log(`Verify failed: ${errMsg}`);
      toast.error("Verification failed");
      return;
    }
    const sum = data.summary ?? {};
    const issues =
      (sum.rowDeltaTotal ?? 0) +
      (sum.usersMissing ?? 0) +
      (sum.functionsMissing ?? 0) +
      (sum.secretsMissing ?? 0);
    setStep("verify", {
      status: issues === 0 ? "success" : "error",
      message: issues === 0
        ? "All checks passed — source and target are in parity."
        : `Issues found: rowDelta=${sum.rowDeltaTotal ?? 0}, usersMissing=${sum.usersMissing ?? 0}, fnsMissing=${sum.functionsMissing ?? 0}, secretsMissing=${sum.secretsMissing ?? 0}`,
      data,
    });
    log(`Verify complete — ${issues === 0 ? "PASS" : `${issues} issues`}`);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const StepCard = ({
    icon: Icon,
    title,
    description,
    stepKey,
    onRun,
    children,
    danger,
  }: {
    icon: any;
    title: string;
    description: string;
    stepKey: StepKey;
    onRun: () => void | Promise<void>;
    children?: React.ReactNode;
    danger?: boolean;
  }) => {
    const s = steps[stepKey];
    return (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Icon className="h-5 w-5 mt-1 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
            </div>
            <Badge variant={
              s.status === "success" ? "default" :
              s.status === "error" ? "destructive" :
              s.status === "running" ? "secondary" : "outline"
            }>
              {s.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {s.message && <p className="text-sm text-muted-foreground">{s.message}</p>}
          {s.status === "running" && typeof s.progress === "number" && (
            <Progress value={s.progress} />
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={danger ? "destructive" : "default"}
              onClick={onRun}
              disabled={s.status === "running"}
            >
              {s.status === "running" && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
              {s.status === "success" ? "Re-run" : "Run"}
            </Button>
            {children}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Database Migration</h1>
        <p className="text-muted-foreground mt-1">
          Migrate schema, data, auth users, and storage to the target Supabase project.
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Before you start</AlertTitle>
        <AlertDescription className="space-y-1 text-sm">
          <div>Required secrets must be set: <code>MIGRATION_TARGET_DB_URL</code>, <code>MIGRATION_TARGET_SERVICE_ROLE_KEY</code>, <code>MIGRATION_TARGET_URL</code>.</div>
          <div>Run steps 1–3 (dump) before steps 4–7 (push). Push is destructive on the target — it truncates each table before re-inserting.</div>
          <div>Email/password users must reset password on first login. Google users re-link by email automatically.</div>
        </AlertDescription>
      </Alert>

      <div className="flex justify-end">
        <Button variant="outline" onClick={downloadBundle}>
          <Download className="h-4 w-4 mr-2" />
          Download full migration bundle
        </Button>
      </div>

      <div className="grid gap-4">
        <h2 className="text-xl font-semibold mt-2">Track A — Dump from source</h2>

        <StepCard
          icon={Database}
          title="Step 1 — Dump schema DDL"
          description="Tables, columns, indexes, FKs, RLS policies, functions, triggers, enums."
          stepKey="schema"
          onRun={runDumpSchema}
        >
          {steps.schema.data && (
            <Button size="sm" variant="outline" onClick={() => downloadText("01-schema.sql", steps.schema.data)}>
              <Download className="h-3 w-3 mr-2" /> Download SQL
            </Button>
          )}
        </StepCard>

        <StepCard
          icon={Users}
          title="Step 2 — Dump auth users"
          description="All users from auth.users with metadata, providers, identities."
          stepKey="auth"
          onRun={runDumpAuth}
        >
          {steps.auth.data && (
            <Button size="sm" variant="outline" onClick={() => downloadJson("03-auth-users.json", steps.auth.data)}>
              <Download className="h-3 w-3 mr-2" /> Download JSON
            </Button>
          )}
        </StepCard>

        <StepCard
          icon={HardDrive}
          title="Step 3 — Dump storage manifest"
          description="List all files in the `documents` bucket with sizes and 24h signed URLs."
          stepKey="storage"
          onRun={runDumpStorage}
        >
          {steps.storage.data && (
            <Button size="sm" variant="outline" onClick={() => downloadJson("04-storage-manifest.json", steps.storage.data)}>
              <Download className="h-3 w-3 mr-2" /> Download JSON
            </Button>
          )}
        </StepCard>

        <h2 className="text-xl font-semibold mt-4">Track B — Push to target</h2>

        <StepCard
          icon={CloudUpload}
          title="Step 4 — Push schema to target DB"
          description="Runs the dumped DDL against MIGRATION_TARGET_DB_URL inside a transaction."
          stepKey="push-schema"
          onRun={runPushSchema}
          danger
        />

        <StepCard
          icon={CloudUpload}
          title="Step 5 — Push table data"
          description="Truncates each public table on target then re-inserts in FK-safe order. Resumable from last failed offset."
          stepKey="push-data"
          onRun={() => runPushData()}
          danger
        >
          <Button size="sm" variant="outline" onClick={() => runPushData({ resume: true })}>
            Resume Step 5
          </Button>
          <Button size="sm" variant="outline" onClick={skipTable}>
            Skip a table…
          </Button>
          <Button size="sm" variant="outline" onClick={addSuggestedSkips}>
            Skip suggested (canonical_txns + deps)
          </Button>
          <Button size="sm" variant="ghost" onClick={clearSkips}>
            Clear resume state
          </Button>
          {(() => {
            const failed = (steps["push-data"].data?.perTable ?? []).filter((t: any) => t.status === "error");
            if (failed.length === 0) return null;
            return (
              <div className="w-full mt-2 p-3 rounded border border-destructive/40 bg-destructive/5 space-y-2">
                <div className="text-xs font-semibold text-destructive">Failed tables ({failed.length}):</div>
                {failed.map((t: any) => (
                  <div key={t.table} className="text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="font-mono text-xs">{t.table}</Badge>
                      <span className="text-muted-foreground">{t.inserted.toLocaleString()} rows inserted before failure</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs ml-auto"
                        onClick={() => {
                          const next = Array.from(new Set([...skipList, t.table]));
                          setSkipList(next);
                          saveSkips(next);
                          log(`⊘ Added ${t.table} to skip list`);
                        }}
                      >
                        Skip this table
                      </Button>
                    </div>
                    {t.error && (
                      <pre className="text-[11px] font-mono bg-background/60 p-2 rounded border border-border overflow-x-auto whitespace-pre-wrap break-all">
                        {t.error}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
          {skipList.length > 0 && (
            <div className="w-full mt-2 flex flex-wrap items-center gap-2 p-2 rounded border border-dashed border-border bg-muted/30">
              <span className="text-xs text-muted-foreground">Skipping ({skipList.length}):</span>
              {skipList.map((t) => (
                <Badge key={t} variant="secondary" className="font-mono text-xs">
                  {t}
                  <button
                    onClick={() => removeSkip(t)}
                    className="ml-1.5 text-muted-foreground hover:text-foreground"
                    aria-label={`Remove skip ${t}`}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </StepCard>

        <StepCard
          icon={Wrench}
          title="Step 5.5 — Patch target triggers"
          description="Makes handle_new_user idempotent and teaches notify_new_signup to skip migration imports + tolerate notification failures. Run before Step 6."
          stepKey="patch-triggers"
          onRun={runPatchTriggers}
        />

        <StepCard
          icon={CloudUpload}
          title="Step 6 — Push auth users"
          description="Calls Auth Admin API on target preserving UUIDs. Existing users skipped."
          stepKey="push-auth"
          onRun={runPushAuth}
        >
          <Button size="sm" variant="outline" onClick={runPushAuthHashes}>
            Push auth + password hashes (direct DB)
          </Button>
          {steps["push-auth"].data?.results && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadJson("06-auth-results.json", steps["push-auth"].data)}
              >
                <Download className="h-3 w-3 mr-2" /> Download report
              </Button>
              {(() => {
                const errs = (steps["push-auth"].data.results as any[]).filter((r) => r.status === "error");
                if (!errs.length) return null;
                return (
                  <details className="mt-2 w-full">
                    <summary className="cursor-pointer text-xs font-medium text-destructive">
                      Show {errs.length} error{errs.length === 1 ? "" : "s"} (first 10)
                    </summary>
                    <div className="mt-2 space-y-1 text-xs font-mono bg-muted p-2 rounded max-h-64 overflow-auto">
                      {errs.slice(0, 10).map((r: any, i: number) => (
                        <div key={i} className="border-b border-border/50 pb-1">
                          <div className="text-foreground">{r.email ?? "(no email)"} <span className="text-muted-foreground">[{r.id?.slice(0, 8)}]</span>{r.http_status ? ` ${r.http_status}` : ""}{r.error_code ? ` ${r.error_code}` : ""}</div>
                          <div className="text-destructive break-all">{r.error}</div>
                        </div>
                      ))}
                    </div>
                  </details>
                );
              })()}
            </>
          )}
        </StepCard>

        <StepCard
          icon={CloudUpload}
          title="Step 7 — Push storage files"
          description="Downloads each file from source bucket and uploads to target bucket (upsert)."
          stepKey="push-storage"
          onRun={runPushStorage}
        />

        <h2 className="text-xl font-semibold mt-4">Track C — Verify parity</h2>

        <StepCard
          icon={ShieldCheck}
          title="Step 8 — Verify migration parity"
          description="Read-only audit: schema, row counts, indexes/FKs/triggers/policies, enums, functions, auth users, storage objects, edge functions, and secret names."
          stepKey="verify"
          onRun={runVerify}
        >
          <Button size="sm" variant="outline" onClick={retryMissingStorage}>
            Retry missing storage
          </Button>
          {steps.verify.data && (
            <Button size="sm" variant="outline" onClick={() => downloadJson("08-verify-report.json", steps.verify.data)}>
              <Download className="h-3 w-3 mr-2" /> Download report
            </Button>
          )}
        </StepCard>
      </div>

      {steps.verify.data && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Verification report</CardTitle>
            <CardDescription>Summary and per-section details from Step 8.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {Object.entries(steps.verify.data.summary ?? {}).map(([k, v]) => (
                <div key={k} className="border rounded p-2">
                  <div className="text-xs text-muted-foreground">{k}</div>
                  <div className="font-mono text-base">{String(v)}</div>
                </div>
              ))}
            </div>
            {(() => {
              const tables = (steps.verify.data?.schema?.tables ?? []) as Array<{ name: string; sourceRows: number; targetRows: number; delta: number }>;
              const drift = tables.filter((t) => (t.delta ?? 0) !== 0).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
              if (drift.length === 0) return null;
              return (
                <div className="border rounded">
                  <div className="px-3 py-2 border-b bg-muted/40 font-medium text-sm">
                    Tables with row drift ({drift.length})
                  </div>
                  <div className="max-h-96 overflow-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/20 sticky top-0">
                        <tr>
                          <th className="text-left p-2">Table</th>
                          <th className="text-right p-2">Source</th>
                          <th className="text-right p-2">Target</th>
                          <th className="text-right p-2">Delta</th>
                        </tr>
                      </thead>
                      <tbody>
                        {drift.map((t) => (
                          <tr key={t.name} className="border-t">
                            <td className="p-2 font-mono">{t.name}</td>
                            <td className="p-2 text-right font-mono">{(t.sourceRows ?? 0).toLocaleString()}</td>
                            <td className="p-2 text-right font-mono">{(t.targetRows ?? 0).toLocaleString()}</td>
                            <td className={`p-2 text-right font-mono ${t.delta > 0 ? "text-destructive" : "text-amber-600"}`}>
                              {t.delta > 0 ? "+" : ""}{(t.delta ?? 0).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
            <details>
              <summary className="cursor-pointer font-medium">Full JSON</summary>
              <pre className="text-xs bg-muted p-3 rounded max-h-96 overflow-auto mt-2">
                {JSON.stringify(steps.verify.data, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity log</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-3 rounded max-h-80 overflow-auto whitespace-pre-wrap">
            {logs.length === 0 ? "No activity yet." : logs.join("\n")}
          </pre>
        </CardContent>
      </Card>

      <Alert>
        <AlertTitle>Post-migration checklist</AlertTitle>
        <AlertDescription className="text-sm space-y-1">
          <div>1. On target DB run: <code>ALTER DATABASE postgres SET app.settings.service_role_key = '&lt;new key&gt;';</code></div>
          <div>2. Re-deploy edge functions to target with <code>supabase functions deploy --project-ref &lt;new ref&gt;</code></div>
          <div>3. Re-set all secrets in the target project dashboard</div>
          <div>4. Update Stripe webhook URL to the new project</div>
          <div>5. Swap <code>src/integrations/supabase/client.ts</code> + <code>.env</code> to point at target (final cutover)</div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
