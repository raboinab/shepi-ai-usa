import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Upload, FileText, Trash2 } from "lucide-react";

const INDUSTRIES = [
  "SaaS / Software",
  "E-commerce / Retail",
  "Professional Services",
  "Manufacturing",
  "Healthcare",
  "Construction",
  "Restaurants / Hospitality",
  "Logistics / Transportation",
  "Financial Services",
  "Real Estate",
  "Media / Marketing",
  "Other",
];

const DOC_TYPES = [
  { value: "w9", label: "W-9" },
  { value: "license_verification", label: "License Verification" },
  { value: "other", label: "Other" },
];

interface CpaProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  state_of_licensure: string;
  license_number: string;
  industries: string[];
  bio: string | null;
  years_experience: number | null;
  w9_on_file: boolean;
  background_check_status: string;
  max_concurrent_engagements: number;
  onboarding_completed_at: string | null;
}

interface OnboardingDoc {
  id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  status: string;
  created_at: string;
}

export default function CpaOnboarding() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [industries, setIndustries] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [maxEngagements, setMaxEngagements] = useState(3);
  const [uploadType, setUploadType] = useState("w9");
  const [uploading, setUploading] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["cpa-profile-self"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("cpa_profiles" as any)
        .select("*")
        .eq("user_id", u.user.id)
        .maybeSingle();
      if (error) throw error;
      if (data) return data as unknown as CpaProfile;

      // Defensive fallback: user has cpa role but no profile row (e.g.
      // role was granted manually). Create a stub so onboarding works.
      const fullName =
        (u.user.user_metadata as Record<string, unknown> | null)?.full_name as
          | string
          | undefined;
      const { data: created, error: insErr } = await supabase
        .from("cpa_profiles" as any)
        .insert({
          user_id: u.user.id,
          full_name: fullName ?? u.user.email ?? "CPA",
          email: u.user.email ?? "",
          license_number: "",
          state_of_licensure: "",
          industries: [],
          active: true,
        })
        .select("*")
        .single();
      if (insErr) {
        console.warn("[cpa-onboarding] stub create failed", insErr);
        return null;
      }
      return created as unknown as CpaProfile;
    },
  });


  const { data: docs } = useQuery({
    queryKey: ["cpa-onboarding-docs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cpa_onboarding_documents" as any)
        .select("id, document_type, file_name, file_path, status, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as OnboardingDoc[];
    },
  });

  useEffect(() => {
    if (profile) {
      setIndustries(profile.industries ?? []);
      setBio(profile.bio ?? "");
      setPhone(profile.phone ?? "");
      setMaxEngagements(profile.max_concurrent_engagements ?? 3);
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: async (markComplete: boolean) => {
      if (!profile) throw new Error("Profile not found");
      const patch: Record<string, unknown> = {
        industries,
        bio: bio.trim() || null,
        phone: phone.trim() || null,
        max_concurrent_engagements: maxEngagements,
      };
      if (markComplete) patch.onboarding_completed_at = new Date().toISOString();
      const { error } = await supabase
        .from("cpa_profiles" as any)
        .update(patch)
        .eq("id", profile.id);
      if (error) throw error;
    },
    onSuccess: (_, markComplete) => {
      qc.invalidateQueries({ queryKey: ["cpa-profile-self"] });
      toast({
        title: markComplete ? "Onboarding submitted" : "Profile saved",
      });
    },
    onError: (e: any) =>
      toast({ title: "Save failed", description: e?.message, variant: "destructive" }),
  });

  async function handleUpload(file: File) {
    if (!profile) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${profile.user_id}/${uploadType}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("cpa-onboarding")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from("cpa_onboarding_documents" as any).insert({
        cpa_user_id: profile.user_id,
        document_type: uploadType,
        file_path: path,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      });
      if (insErr) throw insErr;

      if (uploadType === "w9") {
        await supabase
          .from("cpa_profiles" as any)
          .update({ w9_on_file: true })
          .eq("id", profile.id);
      }

      qc.invalidateQueries({ queryKey: ["cpa-onboarding-docs"] });
      qc.invalidateQueries({ queryKey: ["cpa-profile-self"] });
      toast({ title: "File uploaded" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e?.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(doc: OnboardingDoc) {
    if (!confirm(`Delete ${doc.file_name}?`)) return;
    await supabase.storage.from("cpa-onboarding").remove([doc.file_path]);
    await supabase.from("cpa_onboarding_documents" as any).delete().eq("id", doc.id);
    qc.invalidateQueries({ queryKey: ["cpa-onboarding-docs"] });
  }

  const checklist = useMemo(() => {
    if (!profile) return [];
    return [
      { label: "Confirm contact info", done: !!profile.phone || phone.trim().length > 0 },
      { label: "Add at least one industry", done: industries.length > 0 },
      { label: "Short professional bio", done: (profile.bio ?? bio).trim().length >= 80 },
      { label: "W-9 on file", done: profile.w9_on_file },
    ];
  }, [profile, phone, industries, bio]);

  const completion = checklist.length
    ? Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>Profile not ready yet</CardTitle>
            <CardDescription>
              We haven't created your CPA profile. An admin will activate your account shortly
              after approving your application. If you think this is a mistake, email
              hello@shepi.ai.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  function toggle<T>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {profile.full_name.split(" ")[0]}</h1>
          <p className="text-muted-foreground mt-1">
            Complete the steps below so we can route engagements to you.
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">{completion}%</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">complete</div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {checklist.map((c) => (
              <li key={c.label} className="flex items-center gap-2">
                <CheckCircle2
                  className={`h-4 w-4 ${c.done ? "text-primary" : "text-muted-foreground/40"}`}
                />
                <span className={c.done ? "" : "text-muted-foreground"}>{c.label}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact & profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input value={profile.email} disabled />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <Label>License</Label>
              <Input
                value={`${profile.state_of_licensure} · ${profile.license_number}`}
                disabled
              />
            </div>
            <div>
              <Label>Max concurrent engagements</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={maxEngagements}
                onChange={(e) => setMaxEngagements(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
          </div>
          <div>
            <Label>Professional bio</Label>
            <Textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="2–4 sentences. Industry focus, years in QoE, notable deal sizes."
            />
            <p className="text-xs text-muted-foreground mt-1">{bio.length} characters</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Industries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {INDUSTRIES.map((i) => {
              const active = industries.includes(i);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndustries((prev) => toggle(prev, i))}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted border-border"
                  }`}
                >
                  {i}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            W-9 is required for payouts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Label>Document type</Label>
              <select
                className="block h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
              >
                {DOC_TYPES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <label className="inline-flex">
              <input
                type="file"
                className="sr-only"
                accept=".pdf,.png,.jpg,.jpeg"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                  e.target.value = "";
                }}
              />
              <Button type="button" disabled={uploading} asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Uploading…" : "Upload file"}
                </span>
              </Button>
            </label>
          </div>

          {!docs?.length ? (
            <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {docs.map((d) => (
                <li key={d.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{d.file_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {DOC_TYPES.find((t) => t.value === d.document_type)?.label ??
                        d.document_type}
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {d.status}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(d)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => save.mutate(false)} disabled={save.isPending}>
          Save draft
        </Button>
        <Button
          onClick={() => save.mutate(true)}
          disabled={save.isPending || completion < 100}
        >
          {profile.onboarding_completed_at ? "Update onboarding" : "Submit onboarding"}
        </Button>
      </div>
    </div>
  );
}
