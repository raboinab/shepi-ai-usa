import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Loader2, ImageIcon, Trash2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ProjectData } from "@/pages/Project";

interface FirmBrandingCardProps {
  project: ProjectData;
  updateProject: (updates: Partial<ProjectData>) => void;
  onSave?: (overrides?: Partial<ProjectData>) => Promise<void>;
}

const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];

export function FirmBrandingCard({ project, updateProject, onSave }: FirmBrandingCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const acknowledged = Boolean(project.professional_use_acknowledged_at);
  const logoPath = project.firm_logo_path || null;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadPreview() {
      if (!logoPath) {
        setPreviewUrl(null);
        return;
      }
      const { data } = supabase.storage.from("firm-logos").getPublicUrl(logoPath);
      if (!cancelled) setPreviewUrl(data.publicUrl);
    }
    loadPreview();
    return () => {
      cancelled = true;
    };
  }, [logoPath]);

  const handleFile = async (file: File) => {
    if (!userId) {
      toast.error("You must be signed in to upload a logo.");
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Logo must be PNG, JPEG, SVG, or WebP.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error("Logo must be under 2 MB.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${userId}/${project.id}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("firm-logos")
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;

      // Best-effort cleanup of previous logo (only if under this user's folder)
      if (logoPath && logoPath.startsWith(`${userId}/`)) {
        await supabase.storage.from("firm-logos").remove([logoPath]).catch(() => {});
      }

      updateProject({ firm_logo_path: path });
      if (onSave) await onSave({ firm_logo_path: path });
      toast.success("Firm logo uploaded.");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Logo upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (!logoPath) return;
    if (userId && logoPath.startsWith(`${userId}/`)) {
      await supabase.storage.from("firm-logos").remove([logoPath]).catch(() => {});
    }
    updateProject({ firm_logo_path: null });
    if (onSave) await onSave({ firm_logo_path: null });
  };

  const handleAcknowledge = async (checked: boolean) => {
    const timestamp = checked ? new Date().toISOString() : null;
    updateProject({ professional_use_acknowledged_at: timestamp });
    if (onSave) await onSave({ professional_use_acknowledged_at: timestamp });
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Firm Branding (optional)</h3>
        <p className="text-xs text-muted-foreground">
          Adds your firm name and logo to this project's PDF cover page and XLSX Setup tab.
          A small "Powered by shepi" footer remains on every export.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firmName">Firm Name</Label>
          <Input
            id="firmName"
            placeholder="e.g. Brookline CPA Group"
            value={project.firm_name || ""}
            onChange={(e) => updateProject({ firm_name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="preparedBy">"Prepared by" line</Label>
          <Input
            id="preparedBy"
            placeholder="e.g. Prepared by J. Smith, CPA"
            value={project.prepared_by_line || ""}
            onChange={(e) => updateProject({ prepared_by_line: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Firm Logo</Label>
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-32 h-32 border border-border rounded-md flex items-center justify-center bg-secondary/30 overflow-hidden">
            {previewUrl ? (
              <img src={previewUrl} alt="Firm logo" className="max-w-full max-h-full object-contain" />
            ) : (
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_TYPES.join(",")}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading…</>
              ) : (
                <><Upload className="h-4 w-4 mr-2" /> {logoPath ? "Replace logo" : "Upload logo"}</>
              )}
            </Button>
            {logoPath && (
              <Button type="button" variant="ghost" size="sm" onClick={handleRemove} disabled={uploading}>
                <Trash2 className="h-4 w-4 mr-2" /> Remove
              </Button>
            )}
            <p className="text-xs text-muted-foreground max-w-xs">
              PNG, JPEG, SVG, or WebP. Up to 2 MB. Transparent PNG works best on the PDF cover.
            </p>
          </div>
        </div>
      </div>

      <Alert>
        <AlertDescription>
          <div className="flex items-start gap-2">
            <Checkbox
              id="proAck"
              className="mt-0.5"
              checked={acknowledged}
              onCheckedChange={(v) => handleAcknowledge(Boolean(v))}
            />
            <Label htmlFor="proAck" className="text-xs leading-relaxed font-normal cursor-pointer">
              I acknowledge the{" "}
              <Link
                to="/terms#professional-use"
                target="_blank"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Professional Use addendum <ExternalLink className="h-3 w-3" />
              </Link>{" "}
              to shepi's Terms of Service. shepi is analytical software, not a CPA
              firm — deliverables produced here are not attestation, audit opinion,
              or SSARS review reports, regardless of firm branding applied.
              {acknowledged && project.professional_use_acknowledged_at && (
                <span className="block mt-1 text-muted-foreground">
                  Acknowledged {new Date(project.professional_use_acknowledged_at).toLocaleString()}
                </span>
              )}
            </Label>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
