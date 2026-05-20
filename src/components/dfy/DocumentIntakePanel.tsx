import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger,
} from "@/components/ui/dialog";
import { CheckCircle2, AlertCircle, XCircle, Clock, Plus, Bell, MinusCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  projectId: string;
  viewerRole: "client" | "cpa";
}

type Requirement = {
  id: string;
  requirement_key: string;
  label: string;
  tier: "required" | "recommended" | "optional";
  is_custom: boolean;
  notes: string | null;
  marked_na: boolean;
  marked_na_reason: string | null;
};

type Review = {
  id: string;
  requirement_id: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  reviewed_at: string | null;
};

type DocRow = { id: string; account_type: string | null; name: string; created_at: string | null };

export function DocumentIntakePanel({ projectId, viewerRole }: Props) {
  const qc = useQueryClient();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [nudgeOpen, setNudgeOpen] = useState(false);
  const [nudgeMsg, setNudgeMsg] = useState("");
  const [naOpenFor, setNaOpenFor] = useState<string | null>(null);
  const [naReason, setNaReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["doc-intake", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const [reqs, revs, docs] = await Promise.all([
        supabase.from("project_document_requirements").select("*").eq("project_id", projectId).order("tier").order("label"),
        supabase.from("project_document_reviews").select("*").eq("project_id", projectId),
        supabase.from("documents").select("id, account_type, name, created_at").eq("project_id", projectId),
      ]);
      return {
        requirements: (reqs.data ?? []) as Requirement[],
        reviews: (revs.data ?? []) as Review[],
        docs: (docs.data ?? []) as DocRow[],
      };
    },
  });

  const { requirements, reviews, docs } = data ?? { requirements: [], reviews: [], docs: [] };

  const reviewByReqId = useMemo(() => {
    const m = new Map<string, Review>();
    for (const r of reviews) m.set(r.requirement_id, r);
    return m;
  }, [reviews]);

  const uploadedByType = useMemo(() => {
    const m = new Map<string, DocRow>();
    for (const d of docs) if (d.account_type && !m.has(d.account_type)) m.set(d.account_type, d);
    return m;
  }, [docs]);

  const statusOf = (r: Requirement): "approved" | "rejected" | "uploaded" | "not_uploaded" | "na" => {
    if (r.marked_na) return "na";
    const review = reviewByReqId.get(r.id);
    if (review?.status === "approved") return "approved";
    if (review?.status === "rejected") return "rejected";
    if (uploadedByType.has(r.requirement_key)) return "uploaded";
    return "not_uploaded";
  };

  const requiredReqs = requirements.filter(r => r.tier === "required" && !r.marked_na);
  const requiredDone = requiredReqs.filter(r => {
    const s = statusOf(r);
    return s === "uploaded" || s === "approved";
  }).length;
  const requiredApproved = requiredReqs.filter(r => statusOf(r) === "approved").length;
  const allRequiredUploaded = requiredReqs.length > 0 && requiredDone === requiredReqs.length;
  const allRequiredApproved = requiredReqs.length > 0 && requiredApproved === requiredReqs.length;

  const reviewMutation = useMutation({
    mutationFn: async (args: { requirement_id: string; status: "approved" | "rejected"; reason?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const docRow = uploadedByType.get(requirements.find(r => r.id === args.requirement_id)?.requirement_key || "");
      const existing = reviewByReqId.get(args.requirement_id);
      const payload = {
        requirement_id: args.requirement_id,
        project_id: projectId,
        document_id: docRow?.id ?? null,
        status: args.status,
        rejection_reason: args.status === "rejected" ? args.reason ?? null : null,
        reviewed_by_user_id: user.id,
        reviewed_at: new Date().toISOString(),
      };
      if (existing) {
        const { error } = await supabase.from("project_document_reviews").update(payload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("project_document_reviews").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doc-intake", projectId] });
      setRejectingId(null);
      setRejectReason("");
      toast({ title: "Review saved" });
    },
    onError: (e: any) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const addRequirement = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const key = `custom_${Date.now()}`;
      const { error } = await supabase.from("project_document_requirements").insert({
        project_id: projectId,
        requirement_key: key,
        label: newLabel.trim(),
        tier: "required",
        is_custom: true,
        requested_by_user_id: user.id,
        notes: newNotes.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doc-intake", projectId] });
      setAddOpen(false);
      setNewLabel("");
      setNewNotes("");
      toast({ title: "Document requested", description: "Client will be notified on next nudge." });
    },
    onError: (e: any) => toast({ title: "Could not add", description: e.message, variant: "destructive" }),
  });

  const removeRequirement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_document_requirements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doc-intake", projectId] }),
  });

  const setNa = useMutation({
    mutationFn: async (args: { id: string; reason: string }) => {
      const { error } = await supabase.from("project_document_requirements")
        .update({ marked_na: true, marked_na_reason: args.reason })
        .eq("id", args.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doc-intake", projectId] });
      setNaOpenFor(null);
      setNaReason("");
    },
  });

  const unsetNa = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_document_requirements")
        .update({ marked_na: false, marked_na_reason: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doc-intake", projectId] }),
  });

  const nudge = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("nudge-dfy-client", {
        body: { project_id: projectId, custom_message: nudgeMsg || undefined },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: () => {
      setNudgeOpen(false);
      setNudgeMsg("");
      toast({ title: "Nudge sent", description: "Client has been emailed and notified." });
    },
    onError: (e: any) => toast({ title: "Could not nudge", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return null;

  const grouped = {
    required: requirements.filter(r => r.tier === "required"),
    recommended: requirements.filter(r => r.tier === "recommended"),
    optional: requirements.filter(r => r.tier === "optional"),
  };

  const pct = requiredReqs.length > 0 ? Math.round((requiredDone / requiredReqs.length) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle>Document Intake</CardTitle>
            <CardDescription>
              {viewerRole === "client"
                ? "Upload these documents so your CPA reviewer can begin."
                : "Approve uploaded documents, request additional items, and nudge the client."}
            </CardDescription>
          </div>
          {viewerRole === "cpa" && (
            <div className="flex gap-2">
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline"><Plus className="h-3.5 w-3.5 mr-1" />Request document</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request additional document</DialogTitle>
                    <DialogDescription>Adds a required item to the client's checklist.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>Document name</Label>
                      <Input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="e.g. Q3 2024 inventory count" />
                    </div>
                    <div>
                      <Label>Notes (optional)</Label>
                      <Textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Why you need this, expected format, etc." />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => addRequirement.mutate()} disabled={!newLabel.trim() || addRequirement.isPending}>Add</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog open={nudgeOpen} onOpenChange={setNudgeOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" disabled={allRequiredUploaded}><Bell className="h-3.5 w-3.5 mr-1" />Nudge client</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nudge client</DialogTitle>
                    <DialogDescription>
                      Sends an email + in-app notification listing every required document still missing. Rate limited to once per 48h.
                    </DialogDescription>
                  </DialogHeader>
                  <Textarea value={nudgeMsg} onChange={e => setNudgeMsg(e.target.value)} placeholder="Optional personal note to include in the email" />
                  <DialogFooter>
                    <Button onClick={() => nudge.mutate()} disabled={nudge.isPending}>Send nudge</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">
              {requiredDone} of {requiredReqs.length} required documents uploaded
              {viewerRole === "cpa" && requiredReqs.length > 0 && ` · ${requiredApproved} approved`}
            </span>
            <span className="font-medium">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2" />
          {allRequiredApproved && (
            <p className="text-xs text-green-700 mt-2 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> All required documents approved — CPA can begin review.
            </p>
          )}
          {!allRequiredApproved && allRequiredUploaded && viewerRole === "client" && (
            <p className="text-xs text-blue-700 mt-2 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> All uploaded — awaiting CPA approval.
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {(["required", "recommended", "optional"] as const).map(tier => {
          const items = grouped[tier];
          if (items.length === 0) return null;
          return (
            <div key={tier}>
              <h4 className="text-sm font-semibold mb-2 capitalize text-muted-foreground">{tier}</h4>
              <div className="space-y-2">
                {items.map(r => {
                  const status = statusOf(r);
                  const doc = uploadedByType.get(r.requirement_key);
                  const review = reviewByReqId.get(r.id);
                  return (
                    <div key={r.id} className="flex items-start justify-between gap-3 p-3 rounded-md border bg-card">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <StatusIcon status={status} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-medium text-sm ${r.marked_na ? "line-through text-muted-foreground" : ""}`}>{r.label}</span>
                            {r.is_custom && <Badge variant="outline" className="text-[10px]">Custom</Badge>}
                            <StatusBadge status={status} />
                          </div>
                          {r.notes && <p className="text-xs text-muted-foreground mt-0.5">{r.notes}</p>}
                          {doc && <p className="text-xs text-muted-foreground mt-0.5">Uploaded: {doc.name}</p>}
                          {review?.status === "rejected" && review.rejection_reason && (
                            <p className="text-xs text-red-700 mt-1">CPA note: {review.rejection_reason}</p>
                          )}
                          {r.marked_na && r.marked_na_reason && (
                            <p className="text-xs text-muted-foreground mt-1">N/A: {r.marked_na_reason}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {viewerRole === "cpa" && status === "uploaded" && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => reviewMutation.mutate({ requirement_id: r.id, status: "approved" })}>
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setRejectingId(r.id)}>
                              Reject
                            </Button>
                          </>
                        )}
                        {viewerRole === "cpa" && status === "approved" && (
                          <Button size="sm" variant="ghost" onClick={() => setRejectingId(r.id)}>Reject</Button>
                        )}
                        {viewerRole === "cpa" && r.is_custom && (
                          <Button size="sm" variant="ghost" onClick={() => removeRequirement.mutate(r.id)}>Remove</Button>
                        )}
                        {viewerRole === "client" && !r.marked_na && status === "not_uploaded" && (
                          <Button size="sm" variant="ghost" onClick={() => setNaOpenFor(r.id)}>
                            <MinusCircle className="h-3.5 w-3.5 mr-1" />N/A
                          </Button>
                        )}
                        {viewerRole === "client" && r.marked_na && (
                          <Button size="sm" variant="ghost" onClick={() => unsetNa.mutate(r.id)}>Undo N/A</Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {viewerRole === "client" && (
          <p className="text-xs text-muted-foreground">
            Upload documents in the project wizard. Files are tagged automatically — if a required item still shows as missing, re-upload it with the correct category.
          </p>
        )}
      </CardContent>

      <Dialog open={!!rejectingId} onOpenChange={(o) => { if (!o) { setRejectingId(null); setRejectReason(""); }}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject document</DialogTitle>
            <DialogDescription>Tell the client what's wrong so they can re-upload.</DialogDescription>
          </DialogHeader>
          <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="e.g. This is the summary — please send the detailed monthly trial balance." />
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => rejectingId && reviewMutation.mutate({ requirement_id: rejectingId, status: "rejected", reason: rejectReason })}
              disabled={!rejectReason.trim()}
            >
              Reject & notify client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!naOpenFor} onOpenChange={(o) => { if (!o) { setNaOpenFor(null); setNaReason(""); }}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Not Applicable</DialogTitle>
            <DialogDescription>Explain why this doesn't apply. Your CPA may still ask for it.</DialogDescription>
          </DialogHeader>
          <Textarea value={naReason} onChange={e => setNaReason(e.target.value)} placeholder="e.g. We don't carry inventory." />
          <DialogFooter>
            <Button onClick={() => naOpenFor && setNa.mutate({ id: naOpenFor, reason: naReason })} disabled={!naReason.trim()}>
              Mark N/A
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "approved") return <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />;
  if (status === "rejected") return <XCircle className="h-4 w-4 text-red-600 mt-0.5" />;
  if (status === "uploaded") return <Clock className="h-4 w-4 text-blue-600 mt-0.5" />;
  if (status === "na") return <MinusCircle className="h-4 w-4 text-muted-foreground mt-0.5" />;
  return <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    approved: { label: "Approved", cls: "bg-green-100 text-green-800 border-green-200" },
    rejected: { label: "Rejected", cls: "bg-red-100 text-red-800 border-red-200" },
    uploaded: { label: "Awaiting review", cls: "bg-blue-100 text-blue-800 border-blue-200" },
    not_uploaded: { label: "Not uploaded", cls: "bg-amber-100 text-amber-800 border-amber-200" },
    na: { label: "N/A", cls: "bg-muted text-muted-foreground" },
  };
  const cfg = map[status] || map.not_uploaded;
  return <Badge variant="outline" className={`text-[10px] ${cfg.cls}`}>{cfg.label}</Badge>;
}
