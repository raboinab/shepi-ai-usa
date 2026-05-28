import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  ShieldCheck,
  XCircle,
} from "lucide-react";

type CpaProfile = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  state_of_licensure: string;
  license_number: string;
  license_verified_at: string | null;
  years_experience: number | null;
  bio: string | null;
  industries: string[];
  w9_on_file: boolean;
  background_check_status: string;
  active: boolean;
  onboarding_completed_at: string | null;
  created_at: string;
};

type OnboardingDoc = {
  id: string;
  cpa_user_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  status: string;
  notes: string | null;
  reviewed_at: string | null;
  created_at: string;
};

type Agreement = {
  id: string;
  user_id: string;
  agreement_version: string;
  accepted_at: string;
  ip_address: string | null;
};

type Filter = "all" | "attention" | "active" | "inactive";

const needsAttention = (
  p: CpaProfile,
  docCount: number,
  hasAgreement: boolean,
) =>
  p.state_of_licensure === "PENDING" ||
  p.license_number === "PENDING" ||
  !p.license_verified_at ||
  !p.w9_on_file ||
  docCount === 0 ||
  !hasAgreement;

export default function AdminCpaRoster() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data: profiles, isLoading: loadingProfiles } = useQuery({
    queryKey: ["admin-cpa-roster"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cpa_profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CpaProfile[];
    },
  });

  // Aggregate counts for badges
  const { data: counts } = useQuery({
    queryKey: ["admin-cpa-roster-counts"],
    queryFn: async () => {
      const [docsRes, agreementsRes, claimsRes] = await Promise.all([
        supabase
          .from("cpa_onboarding_documents")
          .select("cpa_user_id, status"),
        supabase.from("dfy_provider_agreements").select("user_id"),
        supabase.from("cpa_claims").select("cpa_user_id"),
      ]);
      const docs = new Map<string, { total: number; approved: number }>();
      (docsRes.data ?? []).forEach((d: { cpa_user_id: string; status: string }) => {
        const cur = docs.get(d.cpa_user_id) ?? { total: 0, approved: 0 };
        cur.total += 1;
        if (d.status === "approved") cur.approved += 1;
        docs.set(d.cpa_user_id, cur);
      });
      const agreements = new Set<string>(
        (agreementsRes.data ?? []).map((a: { user_id: string }) => a.user_id),
      );
      const claims = new Map<string, number>();
      (claimsRes.data ?? []).forEach((c: { cpa_user_id: string }) => {
        claims.set(c.cpa_user_id, (claims.get(c.cpa_user_id) ?? 0) + 1);
      });
      return { docs, agreements, claims };
    },
  });

  const filtered = useMemo(() => {
    if (!profiles) return [];
    return profiles.filter((p) => {
      const docInfo = counts?.docs.get(p.user_id);
      const hasAgreement = counts?.agreements.has(p.user_id) ?? false;
      const attention = needsAttention(p, docInfo?.total ?? 0, hasAgreement);

      if (filter === "active" && !p.active) return false;
      if (filter === "inactive" && p.active) return false;
      if (filter === "attention" && !attention) return false;

      if (search) {
        const q = search.toLowerCase();
        if (
          !p.full_name.toLowerCase().includes(q) &&
          !p.email.toLowerCase().includes(q) &&
          !p.license_number.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [profiles, counts, filter, search]);

  const selected = profiles?.find((p) => p.user_id === selectedUserId) ?? null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">CPA Roster</h1>
        <p className="text-sm text-muted-foreground">
          Active CPAs, license verification, onboarding docs, and signed
          agreements.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All CPAs</SelectItem>
            <SelectItem value="attention">Needs attention</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Search name, email, license #"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        {profiles && (
          <span className="text-sm text-muted-foreground ml-auto">
            {filtered.length} of {profiles.length}
          </span>
        )}
      </div>

      {loadingProfiles ? (
        <div className="py-12 flex justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>License</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Engagements</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No CPAs match this filter.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => {
                  const docInfo = counts?.docs.get(p.user_id);
                  const hasAgreement = counts?.agreements.has(p.user_id) ?? false;
                  const claimCount = counts?.claims.get(p.user_id) ?? 0;
                  const attention = needsAttention(
                    p,
                    docInfo?.total ?? 0,
                    hasAgreement,
                  );
                  return (
                    <TableRow
                      key={p.user_id}
                      className={attention ? "bg-destructive/5" : undefined}
                    >
                      <TableCell>
                        <div className="font-medium">{p.full_name}</div>
                        <div className="text-xs text-muted-foreground">{p.email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {p.state_of_licensure} · {p.license_number}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {p.license_verified_at ? (
                            <span className="text-emerald-600 inline-flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Verified
                            </span>
                          ) : (
                            <span className="text-amber-600 inline-flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Unverified
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant={p.w9_on_file ? "outline" : "destructive"}>
                            W-9 {p.w9_on_file ? "✓" : "✗"}
                          </Badge>
                          <Badge variant={hasAgreement ? "outline" : "destructive"}>
                            Agreement {hasAgreement ? "✓" : "✗"}
                          </Badge>
                          <Badge variant={p.active ? "default" : "secondary"}>
                            {p.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{claimCount}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedUserId(p.user_id)}
                        >
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <CpaDetailSheet
        profile={selected}
        open={!!selectedUserId}
        onOpenChange={(open) => !open && setSelectedUserId(null)}
        onUpdated={() => {
          qc.invalidateQueries({ queryKey: ["admin-cpa-roster"] });
          qc.invalidateQueries({ queryKey: ["admin-cpa-roster-counts"] });
        }}
        toast={toast}
      />
    </div>
  );
}

function CpaDetailSheet({
  profile,
  open,
  onOpenChange,
  onUpdated,
  toast,
}: {
  profile: CpaProfile | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUpdated: () => void;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        {profile && (
          <>
            <SheetHeader>
              <SheetTitle>{profile.full_name}</SheetTitle>
              <SheetDescription>
                {profile.email} · joined {format(new Date(profile.created_at), "MMM d, yyyy")}
              </SheetDescription>
            </SheetHeader>

            <Tabs defaultValue="identity" className="mt-6">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="identity">Identity & License</TabsTrigger>
                <TabsTrigger value="docs">Onboarding Docs</TabsTrigger>
                <TabsTrigger value="agreements">Agreements</TabsTrigger>
              </TabsList>

              <TabsContent value="identity">
                <IdentityPanel profile={profile} onUpdated={onUpdated} toast={toast} />
              </TabsContent>
              <TabsContent value="docs">
                <DocsPanel
                  cpaUserId={profile.user_id}
                  w9OnFile={profile.w9_on_file}
                  onUpdated={onUpdated}
                  toast={toast}
                />
              </TabsContent>
              <TabsContent value="agreements">
                <AgreementsPanel cpaUserId={profile.user_id} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function IdentityPanel({
  profile,
  onUpdated,
  toast,
}: {
  profile: CpaProfile;
  onUpdated: () => void;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [form, setForm] = useState({
    full_name: profile.full_name,
    phone: profile.phone ?? "",
    state_of_licensure: profile.state_of_licensure,
    license_number: profile.license_number,
    years_experience: profile.years_experience?.toString() ?? "",
    bio: profile.bio ?? "",
    industries: profile.industries.join(", "),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("cpa_profiles")
        .update({
          full_name: form.full_name,
          phone: form.phone || null,
          state_of_licensure: form.state_of_licensure,
          license_number: form.license_number,
          years_experience: form.years_experience
            ? parseInt(form.years_experience, 10)
            : null,
          bio: form.bio || null,
          industries: form.industries
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        })
        .eq("id", profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Profile updated" });
      onUpdated();
    },
    onError: (e: Error) =>
      toast({ title: "Failed to update", description: e.message, variant: "destructive" }),
  });

  const verifyLicense = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("cpa_profiles")
        .update({ license_verified_at: new Date().toISOString() })
        .eq("id", profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "License verified" });
      onUpdated();
    },
  });

  const toggleActive = useMutation({
    mutationFn: async (active: boolean) => {
      const { error } = await supabase
        .from("cpa_profiles")
        .update({ active })
        .eq("id", profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Status updated" });
      onUpdated();
    },
  });

  return (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Full name</Label>
          <Input
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
        </div>
        <div>
          <Label>Phone</Label>
          <Input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div>
          <Label>State of licensure</Label>
          <Input
            value={form.state_of_licensure}
            onChange={(e) =>
              setForm({ ...form, state_of_licensure: e.target.value })
            }
          />
        </div>
        <div>
          <Label>License #</Label>
          <Input
            value={form.license_number}
            onChange={(e) => setForm({ ...form, license_number: e.target.value })}
          />
        </div>
        <div>
          <Label>Years experience</Label>
          <Input
            type="number"
            value={form.years_experience}
            onChange={(e) =>
              setForm({ ...form, years_experience: e.target.value })
            }
          />
        </div>
        <div>
          <Label>Industries (comma-separated)</Label>
          <Input
            value={form.industries}
            onChange={(e) => setForm({ ...form, industries: e.target.value })}
          />
        </div>
      </div>
      <div>
        <Label>Bio</Label>
        <Textarea
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          rows={4}
        />
      </div>

      <div className="rounded-md border p-3 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">License verification</div>
            <div className="text-xs text-muted-foreground">
              {profile.license_verified_at
                ? `Verified ${format(new Date(profile.license_verified_at), "MMM d, yyyy")}`
                : "Not yet verified"}
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={!!profile.license_verified_at || verifyLicense.isPending}
            onClick={() => verifyLicense.mutate()}
          >
            <ShieldCheck className="h-4 w-4 mr-1" />
            {profile.license_verified_at ? "Verified" : "Mark verified"}
          </Button>
        </div>
        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            <div className="font-medium">Active</div>
            <div className="text-xs text-muted-foreground">
              Inactive CPAs cannot claim new projects.
            </div>
          </div>
          <Switch
            checked={profile.active}
            onCheckedChange={(v) => toggleActive.mutate(v)}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}

function DocsPanel({
  cpaUserId,
  w9OnFile,
  onUpdated,
  toast,
}: {
  cpaUserId: string;
  w9OnFile: boolean;
  onUpdated: () => void;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const queryClient = useQueryClient();
  const { data: docs, isLoading } = useQuery({
    queryKey: ["admin-cpa-docs", cpaUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cpa_onboarding_documents")
        .select("*")
        .eq("cpa_user_id", cpaUserId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OnboardingDoc[];
    },
  });

  const updateDoc = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data: userRes } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("cpa_onboarding_documents")
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewer_user_id: userRes.user?.id,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Document updated" });
      queryClient.invalidateQueries({ queryKey: ["admin-cpa-docs", cpaUserId] });
      onUpdated();
    },
    onError: (e: any) => {
      toast({
        title: "Update failed",
        description: e?.message ?? "Unknown error",
        variant: "destructive",
      });
    },
  });

  const toggleW9 = useMutation({
    mutationFn: async (v: boolean) => {
      const { error } = await supabase
        .from("cpa_profiles")
        .update({ w9_on_file: v })
        .eq("user_id", cpaUserId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "W-9 status updated" });
      onUpdated();
    },
    onError: (e: any) => {
      toast({
        title: "Update failed",
        description: e?.message ?? "Unknown error",
        variant: "destructive",
      });
    },
  });

  const download = async (path: string) => {
    const { data, error } = await supabase.storage
      .from("cpa-onboarding")
      .createSignedUrl(path, 60);
    if (error || !data) {
      toast({ title: "Download failed", description: error?.message, variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center justify-between rounded-md border p-3">
        <div>
          <div className="font-medium text-sm">W-9 on file</div>
          <div className="text-xs text-muted-foreground">
            Toggle once you've verified the uploaded W-9 is correct.
          </div>
        </div>
        <Switch checked={w9OnFile} onCheckedChange={(v) => toggleW9.mutate(v)} />
      </div>

      {isLoading ? (
        <div className="py-6 flex justify-center"><Spinner /></div>
      ) : !docs || docs.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-8 border rounded-md">
          No onboarding documents uploaded.
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((d) => (
            <div key={d.id} className="border rounded-md p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="uppercase text-xs">
                      {d.document_type}
                    </Badge>
                    <Badge
                      variant={
                        d.status === "approved"
                          ? "default"
                          : d.status === "rejected"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {d.status}
                    </Badge>
                  </div>
                  <div className="text-sm font-medium mt-1 truncate">{d.file_name}</div>
                  <div className="text-xs text-muted-foreground">
                    Uploaded {format(new Date(d.created_at), "MMM d, yyyy")}
                    {d.reviewed_at &&
                      ` · reviewed ${format(new Date(d.reviewed_at), "MMM d, yyyy")}`}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => download(d.file_path)}
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
              {d.status !== "approved" && d.status !== "rejected" && (
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateDoc.mutate({ id: d.id, status: "approved" })}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateDoc.mutate({ id: d.id, status: "rejected" })}
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AgreementsPanel({ cpaUserId }: { cpaUserId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-cpa-agreements", cpaUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dfy_provider_agreements")
        .select("*")
        .eq("user_id", cpaUserId)
        .order("accepted_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Agreement[];
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["admin-cpa-profile-min", cpaUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cpa_profiles")
        .select("full_name, email")
        .eq("user_id", cpaUserId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const downloadAgreement = async (a: Agreement) => {
    const [{ renderToStaticMarkup }, { ProviderAgreementContent }] = await Promise.all([
      import("react-dom/server"),
      import("@/components/cpa/ProviderAgreementContent"),
    ]);
    const body = renderToStaticMarkup(<ProviderAgreementContent />);
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>DFY Provider Agreement — ${profile?.full_name ?? ""}</title>
<style>
  body { font-family: Georgia, serif; max-width: 780px; margin: 40px auto; padding: 0 24px; color: #111; line-height: 1.55; }
  h1,h2,h3 { font-family: Georgia, serif; }
  .meta { border:1px solid #ddd; padding:16px; margin-bottom:24px; background:#fafafa; font-family: -apple-system, sans-serif; font-size: 13px; }
  .meta div { margin: 2px 0; }
  hr { margin: 32px 0; border: none; border-top: 1px solid #ddd; }
</style></head><body>
<div class="meta">
  <div><strong>Signed by:</strong> ${profile?.full_name ?? "—"} (${profile?.email ?? "—"})</div>
  <div><strong>Agreement version:</strong> ${a.agreement_version}</div>
  <div><strong>Accepted at:</strong> ${new Date(a.accepted_at).toLocaleString()}</div>
  ${a.ip_address ? `<div><strong>IP address:</strong> ${a.ip_address}</div>` : ""}
  <div><strong>Record ID:</strong> ${a.id}</div>
</div>
<hr/>
${body}
</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `provider-agreement-${profile?.full_name?.replace(/\s+/g, "-") ?? "cpa"}-${a.agreement_version}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <div className="py-6 flex justify-center"><Spinner /></div>;
  if (!data || data.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8 border rounded-md mt-4">
        No provider agreements signed yet.
      </div>
    );
  }

  return (
    <div className="space-y-2 mt-4">
      {data.map((a) => (
        <div key={a.id} className="border rounded-md p-3">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="outline">{a.agreement_version}</Badge>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {format(new Date(a.accepted_at), "MMM d, yyyy 'at' h:mm a")}
              </span>
              <Button size="sm" variant="outline" onClick={() => downloadAgreement(a)}>
                <Download className="h-3.5 w-3.5 mr-1" /> Download
              </Button>
            </div>
          </div>
          {a.ip_address && (
            <div className="text-xs text-muted-foreground mt-1">
              IP: {a.ip_address}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
