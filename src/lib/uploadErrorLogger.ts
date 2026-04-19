import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

type UploadErrorInput = {
  context: string;
  stage: string;
  error: unknown;
  projectId?: string | null;
  userId?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  fileType?: string | null;
  extra?: Record<string, unknown>;
};

type UploadTraceInput = {
  context: string;
  stage: string;
  projectId?: string | null;
  userId?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  fileType?: string | null;
  extra?: Record<string, unknown>;
};

type ErrorLike = {
  name?: string;
  message?: string;
  status?: number | string;
  statusCode?: number | string;
  code?: string;
  details?: unknown;
  hint?: string;
  stack?: string;
};

function toJsonValue(value: unknown): Json {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map(toJsonValue);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, toJsonValue(nested)]),
    );
  }

  return String(value);
}

export function normalizeUploadError(error: unknown, extra?: Record<string, unknown>): Json {
  const err = (error ?? {}) as ErrorLike;

  return {
    name: err.name ?? null,
    message: err.message ?? String(error ?? "Unknown error"),
    statusCode: err.statusCode ?? err.status ?? null,
    code: err.code ?? null,
    details: toJsonValue(err.details),
    hint: err.hint ?? null,
    stack: err.stack?.split("\n").slice(0, 5).join("\n") ?? null,
    extra: extra ? toJsonValue(extra) : null,
  };
}

export function getUploadErrorMessage(error: unknown, fallback = "Upload failed") {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null && "message" in error && typeof (error as { message?: unknown }).message === "string") {
    return (error as { message: string }).message;
  }

  return fallback;
}

export async function logUploadError(params: UploadErrorInput) {
  const errorPayload = normalizeUploadError(params.error, params.extra);

  try {
    console.error(`[${params.context}] ${params.stage} failed:`, errorPayload, params.error);

    await supabase.from("upload_errors").insert({
      context: params.context,
      stage: params.stage,
      project_id: params.projectId ?? null,
      user_id: params.userId ?? null,
      file_name: params.fileName ?? null,
      file_size: params.fileSize ?? null,
      file_type: params.fileType ?? null,
      error_code:
        typeof errorPayload === "object" && errorPayload && "statusCode" in errorPayload
          ? String((errorPayload as Record<string, Json>).statusCode ?? "") || null
          : null,
      error_message: getUploadErrorMessage(params.error),
      error_details: errorPayload,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
  } catch (logError) {
    console.error(`[${params.context}] Failed to log upload error:`, logError);
  }

  return errorPayload;
}

/**
 * Log a non-error trace milestone to upload_errors so we have full visibility
 * into where the upload pipeline stops (even when nothing throws).
 * Stage is prefixed with "trace:" and error_message is "TRACE" for filtering.
 */
export async function logUploadTrace(params: UploadTraceInput) {
  try {
    console.info(`[${params.context}] trace:${params.stage}`, params.extra ?? {});
    await supabase.from("upload_errors").insert({
      context: params.context,
      stage: `trace:${params.stage}`,
      project_id: params.projectId ?? null,
      user_id: params.userId ?? null,
      file_name: params.fileName ?? null,
      file_size: params.fileSize ?? null,
      file_type: params.fileType ?? null,
      error_code: null,
      error_message: "TRACE",
      error_details: params.extra ? toJsonValue(params.extra) : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
  } catch (logError) {
    console.error(`[${params.context}] Failed to log upload trace:`, logError);
  }
}
