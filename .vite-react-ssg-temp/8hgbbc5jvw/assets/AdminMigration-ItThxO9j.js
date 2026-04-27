import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { u as useAdminCheck } from "./useAdminCheck-DEUH420T.js";
import { B as Button, C as Card, b as CardHeader, d as CardTitle, e as CardDescription, f as CardContent, s as supabase } from "../main.mjs";
import { P as Progress } from "./progress-DNO9VJ6D.js";
import { B as Badge } from "./badge-BbLwm7hH.js";
import { A as Alert, a as AlertTitle, b as AlertDescription } from "./alert-FolYmCWY.js";
import { Loader2, AlertTriangle, Download, Database, Users, HardDrive, CloudUpload, Wrench, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import "react-router-dom";
import "vite-react-ssg";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "@radix-ui/react-tooltip";
import "@tanstack/react-query";
import "@radix-ui/react-slot";
import "@supabase/supabase-js";
import "@radix-ui/react-accordion";
import "@radix-ui/react-progress";
const TABLES_FK_ORDER = [
  // Independent / lookup tables first
  "profiles",
  "user_roles",
  "promo_config",
  "contact_submissions",
  "demo_views",
  "nudge_log",
  "processed_webhook_events",
  "rag_chunks",
  "subscriptions",
  "tos_acceptances",
  "user_credits",
  "whitelisted_users",
  "admin_notes",
  "dfy_provider_agreements",
  "migration_runs",
  // Projects + direct dependents
  "projects",
  "project_shares",
  "project_payments",
  "company_info",
  "documents",
  "processed_data",
  "project_data_chunks",
  "qb_sync_requests",
  "workflows",
  "cpa_claims",
  "reclassification_jobs",
  "analysis_jobs",
  "chat_messages",
  "flagged_transactions",
  "adjustment_proofs",
  "docuclipper_jobs",
  "canonical_transactions",
  // Discovery chain
  "detector_runs",
  "observations",
  "tensions",
  "hypotheses",
  "findings",
  "adjustment_proposals",
  "proposal_evidence",
  "claim_ledger",
  "entity_nodes",
  "business_profiles",
  // Verification chain (depends on adjustment_proposals)
  "verification_attempts",
  "verification_transaction_snapshots"
];
const TABLE_CHUNK_SIZE = {
  canonical_transactions: 200,
  verification_transaction_snapshots: 500,
  project_data_chunks: 25,
  // 1536-dim embedding vectors — keep tiny
  processed_data: 1,
  // large jsonb payloads — migrate one row per request
  rag_chunks: 50
};
const RESUME_KEY = "migration:push-data:offsets";
const SKIP_KEY = "migration:push-data:skip";
const loadOffsets = () => {
  try {
    return JSON.parse(localStorage.getItem(RESUME_KEY) || "{}");
  } catch {
    return {};
  }
};
const saveOffsets = (o) => {
  try {
    localStorage.setItem(RESUME_KEY, JSON.stringify(o));
  } catch {
  }
};
const loadSkips = () => {
  try {
    return JSON.parse(localStorage.getItem(SKIP_KEY) || "[]");
  } catch {
    return [];
  }
};
const saveSkips = (s) => {
  try {
    localStorage.setItem(SKIP_KEY, JSON.stringify(s));
  } catch {
  }
};
function AdminMigration() {
  const { isLoading } = useAdminCheck();
  const [steps, setSteps] = useState({
    schema: { status: "idle" },
    auth: { status: "idle" },
    storage: { status: "idle" },
    "push-schema": { status: "idle" },
    "push-data": { status: "idle" },
    "patch-triggers": { status: "idle" },
    "push-auth": { status: "idle" },
    "push-storage": { status: "idle" },
    verify: { status: "idle" }
  });
  const [logs, setLogs] = useState([]);
  const [skipList, setSkipList] = useState(() => loadSkips());
  const SUGGESTED_SKIPS = ["canonical_transactions", "proposal_evidence", "verification_transaction_snapshots"];
  const log = (msg) => setLogs((l) => [...l.slice(-200), `[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] ${msg}`]);
  const setStep = (key, patch) => setSteps((s) => ({ ...s, [key]: { ...s[key], ...patch } }));
  const downloadText = (filename, text) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  const downloadJson = (filename, obj) => downloadText(filename, JSON.stringify(obj, null, 2));
  const extractError = (error, data) => {
    if (error) return error.message ?? String(error);
    if (data && data.ok === false) {
      return data.stage ? `[${data.stage}] ${data.error ?? "unknown"}` : data.error ?? "unknown";
    }
    return null;
  };
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
  const runDumpStorage = async () => {
    setStep("storage", { status: "running", message: "Walking documents bucket…" });
    const { data, error } = await supabase.functions.invoke("dump-storage-manifest");
    const errMsg = extractError(error, data);
    if (errMsg) {
      setStep("storage", { status: "error", message: errMsg });
      log(`Storage manifest failed: ${errMsg}`);
      return;
    }
    const totalMb = (data.files.reduce((s, f) => s + (f.size || 0), 0) / 1024 / 1024).toFixed(1);
    setStep("storage", { status: "success", message: `${data.count} files (${totalMb} MB)`, data });
    log(`Storage manifest OK (${data.count} files, ${totalMb} MB)`);
    toast.success(`${data.count} files indexed`);
  };
  const runPushSchema = async () => {
    setStep("push-schema", { status: "running", message: "Regenerating DDL & executing on target DB…" });
    log("Pushing schema to target DB (server-side regenerate)");
    const { data, error } = await supabase.functions.invoke("migrate-push-schema", {
      body: { mode: "regenerate" }
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
      message: `${data.tables_in_target} tables in target (${(data.ddl_bytes / 1024).toFixed(1)} KB DDL, ${data.elapsed_ms}ms)`
    });
    log(`Schema push OK — ${data.tables_in_target} tables, ${data.ddl_bytes} bytes, ${data.elapsed_ms}ms`);
    toast.success("Schema pushed");
  };
  const runPushData = async (opts = {}) => {
    const offsets = opts.resume ? loadOffsets() : {};
    const skips = new Set(loadSkips());
    if (!opts.resume) saveOffsets({});
    setStep("push-data", { status: "running", message: opts.resume ? "Resuming…" : "Starting…", progress: 0 });
    if (opts.resume) log(`↻ Resuming from saved offsets (${Object.keys(offsets).length} tables in progress)`);
    if (skips.size > 0) log(`⊘ Skipping ${skips.size} table(s): ${[...skips].join(", ")}`);
    let totalInserted = 0;
    const perTable = [];
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
        progress: Math.round(i / TABLES_FK_ORDER.length * 100)
      });
      log(`▶ ${table} (chunk=${limit}${startOffset ? `, resume@${startOffset}` : ""})`);
      let offset = startOffset;
      let truncate = isFresh;
      let tableInserted = 0;
      let tableErr;
      let safety = 0;
      while (safety++ < 2e4) {
        const { data, error } = await supabase.functions.invoke("migrate-push-data", {
          body: { table, offset, limit, truncate }
        });
        truncate = false;
        if (error || data && data.ok === false) {
          tableErr = extractError(error, data) ?? "unknown";
          log(`  ✗ ${table} @ offset=${offset}: ${tableErr}`);
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
          const saved = loadOffsets();
          delete saved[table];
          saveOffsets(saved);
          break;
        }
        offset = data.next_offset;
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
      data: { perTable }
    });
    if (errors.length === 0) toast.success("Data push complete");
    else toast.error(`${errors.length} table(s) failed — see activity log`);
  };
  const skipTable = () => {
    const t = window.prompt("Skip which table on next Step 5 run? (exact name)");
    if (!t) return;
    const next = Array.from(/* @__PURE__ */ new Set([...loadSkips(), t.trim()]));
    saveSkips(next);
    setSkipList(next);
    log(`⊘ Will skip table on next run: ${t.trim()}`);
    toast.success(`Will skip ${t.trim()}`);
  };
  const removeSkip = (table) => {
    const next = loadSkips().filter((t) => t !== table);
    saveSkips(next);
    setSkipList(next);
    log(`✓ Removed skip: ${table}`);
  };
  const addSuggestedSkips = () => {
    const next = Array.from(/* @__PURE__ */ new Set([...loadSkips(), ...SUGGESTED_SKIPS]));
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
  const retryMissingStorage = async () => {
    const verifyData = steps.verify.data;
    const missing = verifyData?.storage?.missingSample ?? verifyData?.storage?.missing ?? [];
    if (!missing.length) {
      toast.error("No missing storage paths in last verify report — run Step 8 first");
      return;
    }
    log(`Retrying ${missing.length} missing storage path(s)`);
    const { data, error } = await supabase.functions.invoke("migrate-push-storage", {
      body: { paths: missing.slice(0, 25) }
    });
    const errMsg = extractError(error, data);
    if (errMsg) {
      log(`Retry missing storage failed: ${errMsg}`);
      toast.error("Retry failed");
      return;
    }
    log(`Retry result: ${data.summary.uploaded} uploaded, ${data.summary.errors} errors`);
    if (Array.isArray(data.failed)) {
      data.failed.forEach((f) => log(`  ✗ ${f.path}: ${f.error}`));
    }
    toast.success(`Retried ${missing.length} file(s)`);
  };
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
    const names = (data.applied ?? []).map((a) => a.name).join(", ");
    setStep("patch-triggers", { status: "success", message: `Patched: ${names}`, data });
    log(`Patch triggers OK — ${names}`);
    toast.success("Target triggers patched");
  };
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
      data
    });
    log(`Auth push: ${s.created} created, ${s.exists} existing, ${s.errors} errors`);
    toast.success("Auth migration complete");
  };
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
      data
    });
    log(`Auth+hashes: source ${s.source_users} users → ${s.users_inserted} inserted, ${s.users_existing} existing, ${s.users_failed} failed`);
    log(`Auth+hashes: source ${s.source_identities} identities → ${s.identities_inserted} inserted, ${s.identities_existing} existing, ${s.identities_failed} failed`);
    if (Array.isArray(data.errors)) {
      data.errors.forEach((e) => log(`  ✗ ${e.kind} ${e.email ?? e.id}: ${e.error}`));
    }
    toast.success("Hash-preserving auth migration complete");
  };
  const runPushStorage = async () => {
    const manifest = steps.storage.data;
    if (!manifest?.files?.length) {
      toast.error("Run Step 3 first");
      return;
    }
    setStep("push-storage", { status: "running", message: "Uploading…", progress: 0 });
    const paths = manifest.files.map((f) => f.path);
    let uploaded = 0;
    let errors = 0;
    const failedPaths = [];
    const batchSize = 25;
    for (let i = 0; i < paths.length; i += batchSize) {
      const batch = paths.slice(i, i + batchSize);
      const { data, error } = await supabase.functions.invoke("migrate-push-storage", {
        body: { paths: batch }
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
          data.failed.forEach((f) => {
            failedPaths.push({ path: f.path, error: f.error ?? "unknown" });
            log(`  ✗ ${f.path}: ${f.error}`);
          });
        }
        log(`Storage batch @ ${i}: ${data.summary.uploaded} ok, ${data.summary.errors} err`);
      }
      setStep("push-storage", {
        status: "running",
        message: `${uploaded}/${paths.length} uploaded`,
        progress: Math.round((i + batch.length) / paths.length * 100)
      });
    }
    setStep("push-storage", {
      status: errors > 0 ? "error" : "success",
      message: `${uploaded} uploaded, ${errors} errors`,
      progress: 100,
      data: { failedPaths }
    });
    if (failedPaths.length > 0) {
      log(`
=== ${failedPaths.length} failed paths ===`);
      const byError = failedPaths.reduce((acc, f) => {
        acc[f.error] = (acc[f.error] ?? 0) + 1;
        return acc;
      }, {});
      Object.entries(byError).forEach(([err, count]) => log(`  ${count}x: ${err}`));
    }
    toast.success("Storage migration complete");
  };
  const downloadBundle = async () => {
    log("Building migration bundle…");
    if (!steps.schema.data) await runDumpSchema();
    if (!steps.auth.data) await runDumpAuth();
    if (!steps.storage.data) await runDumpStorage();
    if (steps.schema.data) downloadText("01-schema.sql", steps.schema.data);
    if (steps.auth.data) downloadJson("03-auth-users.json", steps.auth.data);
    if (steps.storage.data) downloadJson("04-storage-manifest.json", steps.storage.data);
    const readme = `# Migration Bundle

Generated: ${(/* @__PURE__ */ new Date()).toISOString()}

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
    const issues = (sum.rowDeltaTotal ?? 0) + (sum.usersMissing ?? 0) + (sum.functionsMissing ?? 0) + (sum.secretsMissing ?? 0);
    setStep("verify", {
      status: issues === 0 ? "success" : "error",
      message: issues === 0 ? "All checks passed — source and target are in parity." : `Issues found: rowDelta=${sum.rowDeltaTotal ?? 0}, usersMissing=${sum.usersMissing ?? 0}, fnsMissing=${sum.functionsMissing ?? 0}, secretsMissing=${sum.secretsMissing ?? 0}`,
      data
    });
    log(`Verify complete — ${issues === 0 ? "PASS" : `${issues} issues`}`);
  };
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center p-8", children: /* @__PURE__ */ jsx(Loader2, { className: "h-8 w-8 animate-spin" }) });
  }
  const StepCard = ({
    icon: Icon,
    title,
    description,
    stepKey,
    onRun,
    children,
    danger
  }) => {
    const s = steps[stepKey];
    return /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsx(Icon, { className: "h-5 w-5 mt-1 text-muted-foreground" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: title }),
            /* @__PURE__ */ jsx(CardDescription, { children: description })
          ] })
        ] }),
        /* @__PURE__ */ jsx(Badge, { variant: s.status === "success" ? "default" : s.status === "error" ? "destructive" : s.status === "running" ? "secondary" : "outline", children: s.status })
      ] }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
        s.message && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: s.message }),
        s.status === "running" && typeof s.progress === "number" && /* @__PURE__ */ jsx(Progress, { value: s.progress }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              size: "sm",
              variant: danger ? "destructive" : "default",
              onClick: onRun,
              disabled: s.status === "running",
              children: [
                s.status === "running" && /* @__PURE__ */ jsx(Loader2, { className: "h-3 w-3 mr-2 animate-spin" }),
                s.status === "success" ? "Re-run" : "Run"
              ]
            }
          ),
          children
        ] })
      ] })
    ] });
  };
  return /* @__PURE__ */ jsxs("div", { className: "container mx-auto p-6 max-w-5xl space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Database Migration" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-1", children: "Migrate schema, data, auth users, and storage to the target Supabase project." })
    ] }),
    /* @__PURE__ */ jsxs(Alert, { children: [
      /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx(AlertTitle, { children: "Before you start" }),
      /* @__PURE__ */ jsxs(AlertDescription, { className: "space-y-1 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          "Required secrets must be set: ",
          /* @__PURE__ */ jsx("code", { children: "MIGRATION_TARGET_DB_URL" }),
          ", ",
          /* @__PURE__ */ jsx("code", { children: "MIGRATION_TARGET_SERVICE_ROLE_KEY" }),
          ", ",
          /* @__PURE__ */ jsx("code", { children: "MIGRATION_TARGET_URL" }),
          "."
        ] }),
        /* @__PURE__ */ jsx("div", { children: "Run steps 1–3 (dump) before steps 4–7 (push). Push is destructive on the target — it truncates each table before re-inserting." }),
        /* @__PURE__ */ jsx("div", { children: "Email/password users must reset password on first login. Google users re-link by email automatically." })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: downloadBundle, children: [
      /* @__PURE__ */ jsx(Download, { className: "h-4 w-4 mr-2" }),
      "Download full migration bundle"
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-4", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold mt-2", children: "Track A — Dump from source" }),
      /* @__PURE__ */ jsx(
        StepCard,
        {
          icon: Database,
          title: "Step 1 — Dump schema DDL",
          description: "Tables, columns, indexes, FKs, RLS policies, functions, triggers, enums.",
          stepKey: "schema",
          onRun: runDumpSchema,
          children: steps.schema.data && /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: () => downloadText("01-schema.sql", steps.schema.data), children: [
            /* @__PURE__ */ jsx(Download, { className: "h-3 w-3 mr-2" }),
            " Download SQL"
          ] })
        }
      ),
      /* @__PURE__ */ jsx(
        StepCard,
        {
          icon: Users,
          title: "Step 2 — Dump auth users",
          description: "All users from auth.users with metadata, providers, identities.",
          stepKey: "auth",
          onRun: runDumpAuth,
          children: steps.auth.data && /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: () => downloadJson("03-auth-users.json", steps.auth.data), children: [
            /* @__PURE__ */ jsx(Download, { className: "h-3 w-3 mr-2" }),
            " Download JSON"
          ] })
        }
      ),
      /* @__PURE__ */ jsx(
        StepCard,
        {
          icon: HardDrive,
          title: "Step 3 — Dump storage manifest",
          description: "List all files in the `documents` bucket with sizes and 24h signed URLs.",
          stepKey: "storage",
          onRun: runDumpStorage,
          children: steps.storage.data && /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: () => downloadJson("04-storage-manifest.json", steps.storage.data), children: [
            /* @__PURE__ */ jsx(Download, { className: "h-3 w-3 mr-2" }),
            " Download JSON"
          ] })
        }
      ),
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold mt-4", children: "Track B — Push to target" }),
      /* @__PURE__ */ jsx(
        StepCard,
        {
          icon: CloudUpload,
          title: "Step 4 — Push schema to target DB",
          description: "Runs the dumped DDL against MIGRATION_TARGET_DB_URL inside a transaction.",
          stepKey: "push-schema",
          onRun: runPushSchema,
          danger: true
        }
      ),
      /* @__PURE__ */ jsxs(
        StepCard,
        {
          icon: CloudUpload,
          title: "Step 5 — Push table data",
          description: "Truncates each public table on target then re-inserts in FK-safe order. Resumable from last failed offset.",
          stepKey: "push-data",
          onRun: () => runPushData(),
          danger: true,
          children: [
            /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: () => runPushData({ resume: true }), children: "Resume Step 5" }),
            /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: skipTable, children: "Skip a table…" }),
            /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: addSuggestedSkips, children: "Skip suggested (canonical_txns + deps)" }),
            /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", onClick: clearSkips, children: "Clear resume state" }),
            (() => {
              const failed = (steps["push-data"].data?.perTable ?? []).filter((t) => t.status === "error");
              if (failed.length === 0) return null;
              return /* @__PURE__ */ jsxs("div", { className: "w-full mt-2 p-3 rounded border border-destructive/40 bg-destructive/5 space-y-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "text-xs font-semibold text-destructive", children: [
                  "Failed tables (",
                  failed.length,
                  "):"
                ] }),
                failed.map((t) => /* @__PURE__ */ jsxs("div", { className: "text-xs space-y-1", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(Badge, { variant: "destructive", className: "font-mono text-xs", children: t.table }),
                    /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
                      t.inserted.toLocaleString(),
                      " rows inserted before failure"
                    ] }),
                    /* @__PURE__ */ jsx(
                      Button,
                      {
                        size: "sm",
                        variant: "outline",
                        className: "h-6 text-xs ml-auto",
                        onClick: () => {
                          const next = Array.from(/* @__PURE__ */ new Set([...skipList, t.table]));
                          setSkipList(next);
                          saveSkips(next);
                          log(`⊘ Added ${t.table} to skip list`);
                        },
                        children: "Skip this table"
                      }
                    )
                  ] }),
                  t.error && /* @__PURE__ */ jsx("pre", { className: "text-[11px] font-mono bg-background/60 p-2 rounded border border-border overflow-x-auto whitespace-pre-wrap break-all", children: t.error })
                ] }, t.table))
              ] });
            })(),
            skipList.length > 0 && /* @__PURE__ */ jsxs("div", { className: "w-full mt-2 flex flex-wrap items-center gap-2 p-2 rounded border border-dashed border-border bg-muted/30", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
                "Skipping (",
                skipList.length,
                "):"
              ] }),
              skipList.map((t) => /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "font-mono text-xs", children: [
                t,
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => removeSkip(t),
                    className: "ml-1.5 text-muted-foreground hover:text-foreground",
                    "aria-label": `Remove skip ${t}`,
                    children: "×"
                  }
                )
              ] }, t))
            ] })
          ]
        }
      ),
      /* @__PURE__ */ jsx(
        StepCard,
        {
          icon: Wrench,
          title: "Step 5.5 — Patch target triggers",
          description: "Makes handle_new_user idempotent and teaches notify_new_signup to skip migration imports + tolerate notification failures. Run before Step 6.",
          stepKey: "patch-triggers",
          onRun: runPatchTriggers
        }
      ),
      /* @__PURE__ */ jsxs(
        StepCard,
        {
          icon: CloudUpload,
          title: "Step 6 — Push auth users",
          description: "Calls Auth Admin API on target preserving UUIDs. Existing users skipped.",
          stepKey: "push-auth",
          onRun: runPushAuth,
          children: [
            /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: runPushAuthHashes, children: "Push auth + password hashes (direct DB)" }),
            steps["push-auth"].data?.results && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs(
                Button,
                {
                  size: "sm",
                  variant: "outline",
                  onClick: () => downloadJson("06-auth-results.json", steps["push-auth"].data),
                  children: [
                    /* @__PURE__ */ jsx(Download, { className: "h-3 w-3 mr-2" }),
                    " Download report"
                  ]
                }
              ),
              (() => {
                const errs = steps["push-auth"].data.results.filter((r) => r.status === "error");
                if (!errs.length) return null;
                return /* @__PURE__ */ jsxs("details", { className: "mt-2 w-full", children: [
                  /* @__PURE__ */ jsxs("summary", { className: "cursor-pointer text-xs font-medium text-destructive", children: [
                    "Show ",
                    errs.length,
                    " error",
                    errs.length === 1 ? "" : "s",
                    " (first 10)"
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "mt-2 space-y-1 text-xs font-mono bg-muted p-2 rounded max-h-64 overflow-auto", children: errs.slice(0, 10).map((r, i) => /* @__PURE__ */ jsxs("div", { className: "border-b border-border/50 pb-1", children: [
                    /* @__PURE__ */ jsxs("div", { className: "text-foreground", children: [
                      r.email ?? "(no email)",
                      " ",
                      /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
                        "[",
                        r.id?.slice(0, 8),
                        "]"
                      ] }),
                      r.http_status ? ` ${r.http_status}` : "",
                      r.error_code ? ` ${r.error_code}` : ""
                    ] }),
                    /* @__PURE__ */ jsx("div", { className: "text-destructive break-all", children: r.error })
                  ] }, i)) })
                ] });
              })()
            ] })
          ]
        }
      ),
      /* @__PURE__ */ jsx(
        StepCard,
        {
          icon: CloudUpload,
          title: "Step 7 — Push storage files",
          description: "Downloads each file from source bucket and uploads to target bucket (upsert).",
          stepKey: "push-storage",
          onRun: runPushStorage
        }
      ),
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold mt-4", children: "Track C — Verify parity" }),
      /* @__PURE__ */ jsxs(
        StepCard,
        {
          icon: ShieldCheck,
          title: "Step 8 — Verify migration parity",
          description: "Read-only audit: schema, row counts, indexes/FKs/triggers/policies, enums, functions, auth users, storage objects, edge functions, and secret names.",
          stepKey: "verify",
          onRun: runVerify,
          children: [
            /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: retryMissingStorage, children: "Retry missing storage" }),
            steps.verify.data && /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: () => downloadJson("08-verify-report.json", steps.verify.data), children: [
              /* @__PURE__ */ jsx(Download, { className: "h-3 w-3 mr-2" }),
              " Download report"
            ] })
          ]
        }
      )
    ] }),
    steps.verify.data && /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Verification report" }),
        /* @__PURE__ */ jsx(CardDescription, { children: "Summary and per-section details from Step 8." })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3 text-sm", children: [
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-5 gap-2", children: Object.entries(steps.verify.data.summary ?? {}).map(([k, v]) => /* @__PURE__ */ jsxs("div", { className: "border rounded p-2", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: k }),
          /* @__PURE__ */ jsx("div", { className: "font-mono text-base", children: String(v) })
        ] }, k)) }),
        (() => {
          const tables = steps.verify.data?.schema?.tables ?? [];
          const drift = tables.filter((t) => (t.delta ?? 0) !== 0).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
          if (drift.length === 0) return null;
          return /* @__PURE__ */ jsxs("div", { className: "border rounded", children: [
            /* @__PURE__ */ jsxs("div", { className: "px-3 py-2 border-b bg-muted/40 font-medium text-sm", children: [
              "Tables with row drift (",
              drift.length,
              ")"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "max-h-96 overflow-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs", children: [
              /* @__PURE__ */ jsx("thead", { className: "bg-muted/20 sticky top-0", children: /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Table" }),
                /* @__PURE__ */ jsx("th", { className: "text-right p-2", children: "Source" }),
                /* @__PURE__ */ jsx("th", { className: "text-right p-2", children: "Target" }),
                /* @__PURE__ */ jsx("th", { className: "text-right p-2", children: "Delta" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { children: drift.map((t) => /* @__PURE__ */ jsxs("tr", { className: "border-t", children: [
                /* @__PURE__ */ jsx("td", { className: "p-2 font-mono", children: t.name }),
                /* @__PURE__ */ jsx("td", { className: "p-2 text-right font-mono", children: (t.sourceRows ?? 0).toLocaleString() }),
                /* @__PURE__ */ jsx("td", { className: "p-2 text-right font-mono", children: (t.targetRows ?? 0).toLocaleString() }),
                /* @__PURE__ */ jsxs("td", { className: `p-2 text-right font-mono ${t.delta > 0 ? "text-destructive" : "text-amber-600"}`, children: [
                  t.delta > 0 ? "+" : "",
                  (t.delta ?? 0).toLocaleString()
                ] })
              ] }, t.name)) })
            ] }) })
          ] });
        })(),
        /* @__PURE__ */ jsxs("details", { children: [
          /* @__PURE__ */ jsx("summary", { className: "cursor-pointer font-medium", children: "Full JSON" }),
          /* @__PURE__ */ jsx("pre", { className: "text-xs bg-muted p-3 rounded max-h-96 overflow-auto mt-2", children: JSON.stringify(steps.verify.data, null, 2) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Activity log" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("pre", { className: "text-xs bg-muted p-3 rounded max-h-80 overflow-auto whitespace-pre-wrap", children: logs.length === 0 ? "No activity yet." : logs.join("\n") }) })
    ] }),
    /* @__PURE__ */ jsxs(Alert, { children: [
      /* @__PURE__ */ jsx(AlertTitle, { children: "Post-migration checklist" }),
      /* @__PURE__ */ jsxs(AlertDescription, { className: "text-sm space-y-1", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          "1. On target DB run: ",
          /* @__PURE__ */ jsx("code", { children: "ALTER DATABASE postgres SET app.settings.service_role_key = '<new key>';" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          "2. Re-deploy edge functions to target with ",
          /* @__PURE__ */ jsx("code", { children: "supabase functions deploy --project-ref <new ref>" })
        ] }),
        /* @__PURE__ */ jsx("div", { children: "3. Re-set all secrets in the target project dashboard" }),
        /* @__PURE__ */ jsx("div", { children: "4. Update Stripe webhook URL to the new project" }),
        /* @__PURE__ */ jsxs("div", { children: [
          "5. Swap ",
          /* @__PURE__ */ jsx("code", { children: "src/integrations/supabase/client.ts" }),
          " + ",
          /* @__PURE__ */ jsx("code", { children: ".env" }),
          " to point at target (final cutover)"
        ] })
      ] })
    ] })
  ] });
}
export {
  AdminMigration as default
};
