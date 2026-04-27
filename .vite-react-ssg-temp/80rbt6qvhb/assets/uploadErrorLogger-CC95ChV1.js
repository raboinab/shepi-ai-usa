import { s as supabase } from "../main.mjs";
function toJsonValue(value) {
  if (value === null || value === void 0) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map(toJsonValue);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, toJsonValue(nested)])
    );
  }
  return String(value);
}
function normalizeUploadError(error, extra) {
  const err = error ?? {};
  return {
    name: err.name ?? null,
    message: err.message ?? String(error ?? "Unknown error"),
    statusCode: err.statusCode ?? err.status ?? null,
    code: err.code ?? null,
    details: toJsonValue(err.details),
    hint: err.hint ?? null,
    stack: err.stack?.split("\n").slice(0, 5).join("\n") ?? null,
    extra: extra ? toJsonValue(extra) : null
  };
}
function getUploadErrorMessage(error, fallback = "Upload failed") {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return fallback;
}
async function logUploadError(params) {
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
      error_code: typeof errorPayload === "object" && errorPayload && "statusCode" in errorPayload ? String(errorPayload.statusCode ?? "") || null : null,
      error_message: getUploadErrorMessage(params.error),
      error_details: errorPayload,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null
    });
  } catch (logError) {
    console.error(`[${params.context}] Failed to log upload error:`, logError);
  }
  return errorPayload;
}
async function logUploadTrace(params) {
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
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null
    });
  } catch (logError) {
    console.error(`[${params.context}] Failed to log upload trace:`, logError);
  }
}
export {
  logUploadTrace as a,
  getUploadErrorMessage as g,
  logUploadError as l
};
