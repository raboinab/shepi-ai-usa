import { supabase } from "@/integrations/supabase/client";

export interface ProcessingInvokeResult {
  success: boolean;
  error?: string;
}

/**
 * Invoke the `process-quickbooks-file` edge function for a document and AWAIT
 * the result, guaranteeing that failures are terminal and visible.
 *
 * The wizard upload sections historically fired this invoke and-forget
 * (`.catch(() => {})`), so if the call never reached the function — a network
 * blip, a cold-start timeout, the tab navigating away — the document was left
 * orphaned at `processing_status = 'pending'` with no signal and no way to
 * retry (the Retry button only shows for `failed`/stuck docs).
 *
 * This helper awaits the invoke and, on any error, marks the document `failed`
 * with a reason so the existing Retry affordance surfaces. Callers should
 * surface `result.error` via their own toast system.
 */
export async function invokeQuickbooksProcessing(
  documentId: string,
): Promise<ProcessingInvokeResult> {
  try {
    const { data, error } = await supabase.functions.invoke("process-quickbooks-file", {
      body: { documentId },
    });

    if (error) throw error;

    // The function ran but reported a handled failure (it already set the
    // document status); surface the reason without overwriting it.
    if (data && data.success === false) {
      return { success: false, error: data.error || "Processing failed" };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[invokeQuickbooksProcessing] invoke failed:", message);

    // The invoke never completed inside the function — without this the document
    // would sit at 'pending' forever. Mark it failed so the UI can offer Retry.
    try {
      await supabase
        .from("documents")
        .update({
          processing_status: "failed",
          parsed_summary: { note: `Processing could not be started: ${message}` },
        })
        .eq("id", documentId);
    } catch (updateErr) {
      console.error(
        "[invokeQuickbooksProcessing] failed to mark document failed:",
        updateErr,
      );
    }

    return { success: false, error: message };
  }
}
