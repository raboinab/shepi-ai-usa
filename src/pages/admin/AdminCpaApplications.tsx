import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, differenceInBusinessDays } from "date-fns";
import { Eye } from "lucide-react";

type Status = "submitted" | "in_review" | "approved" | "rejected" | "withdrawn";

interface CpaApplication {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string | null;
  state_of_licensure: string;
  license_number: string;
  years_experience: number | null;
  qoe_background: string | null;
  firm_affiliation: string | null;
  side_work_permitted: boolean | null;
  conflicts_disclosure: string | null;
  
  referral_source: string | null;
  status: Status;
  reviewed_at: string | null;
  decision_notes: string | null;
}

const STATUS_LABELS: Record<Status, string> = {
  submitted: "Submitted",
  in_review: "In review",
  approved: "Approved",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const STATUS_VARIANTS: Record<Status, "default" | "secondary" | "destructive" | "outline"> = {
  submitted: "default",
  in_review: "secondary",
  approved: "outline",
  rejected: "destructive",
  withdrawn: "outline",
};

export default function AdminCpaApplications() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Status | "all">("all");
  const [selected, setSelected] = useState<CpaApplication | null>(null);
  const [notes, setNotes] = useState("");

  const { data: applications, isLoading } = useQuery({
    queryKey: ["admin-cpa-applications", filter],
    queryFn: async () => {
      let q = supabase
        .from("cpa_applications" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as CpaApplication[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({
      id,
      status,
      decision_notes,
    }: {
      id: string;
      status: Status;
      decision_notes?: string;
    }) => {
      const { data: userResp } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("cpa_applications" as any)
        .update({
          status,
          decision_notes: decision_notes ?? null,
          reviewer_user_id: userResp.user?.id ?? null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-cpa-applications"] });
      toast({ title: "Application updated" });
      setSelected(null);
    },
    onError: (err: any) =>
      toast({ title: "Update failed", description: err?.message, variant: "destructive" }),
  });

  const promote = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke("promote-cpa-application", {
        body: { application_id: id },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as { ok: boolean; cpa_user_id: string; invited: boolean };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin-cpa-applications"] });
      toast({
        title: "Promoted to CPA",
        description: data.invited
          ? "Invite email sent. They'll land on onboarding after setting their password."
          : "User already had an account. They can sign in and complete onboarding now.",
      });
      setSelected(null);
    },
    onError: (err: any) =>
      toast({ title: "Promote failed", description: err?.message, variant: "destructive" }),
  });

  function openDetail(a: CpaApplication) {
    setSelected(a);
    setNotes(a.decision_notes ?? "");
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">CPA Network Applications</h1>
        <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="in_review">In review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="withdrawn">Withdrawn</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>State · License</TableHead>
              <TableHead>Experience</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Age</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!applications?.length ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No applications yet
                </TableCell>
              </TableRow>
            ) : (
              applications.map((a) => {
                const ageDays = differenceInBusinessDays(new Date(), new Date(a.created_at));
                const stale = a.status === "submitted" && ageDays >= 3;
                return (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="font-medium">{a.full_name}</div>
                      <div className="text-xs text-muted-foreground">{a.email}</div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{a.state_of_licensure}</span>
                      <span className="text-muted-foreground"> · {a.license_number}</span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {a.years_experience != null ? `${a.years_experience} yrs` : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[a.status]}>{STATUS_LABELS[a.status]}</Badge>
                    </TableCell>
                    <TableCell className={stale ? "text-destructive font-medium" : "text-muted-foreground text-sm"}>
                      {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => openDetail(a)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.full_name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <Detail label="Email" value={selected.email} />
                <Detail label="Phone" value={selected.phone} />
                <Detail
                  label="State · License"
                  value={`${selected.state_of_licensure} · ${selected.license_number}`}
                />
                <Detail
                  label="Years experience"
                  value={selected.years_experience?.toString() ?? "—"}
                />
                <Detail label="Firm affiliation" value={selected.firm_affiliation} />
                <Detail
                  label="Side work permitted"
                  value={
                    selected.side_work_permitted == null
                      ? "—"
                      : selected.side_work_permitted
                      ? "Yes"
                      : "No"
                  }
                />
                
                <Detail label="Referral source" value={selected.referral_source} />
                <Detail label="QoE background" value={selected.qoe_background} multiline />
                <Detail
                  label="Conflicts disclosure"
                  value={selected.conflicts_disclosure}
                  multiline
                />

                <div className="space-y-2 pt-2">
                  <Label>Decision notes</Label>
                  <Textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Why approved / rejected, follow-up needed, etc."
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    variant="secondary"
                    onClick={() =>
                      updateStatus.mutate({
                        id: selected.id,
                        status: "in_review",
                        decision_notes: notes,
                      })
                    }
                    disabled={updateStatus.isPending}
                  >
                    Mark in review
                  </Button>
                  <Button
                    onClick={() =>
                      updateStatus.mutate({
                        id: selected.id,
                        status: "approved",
                        decision_notes: notes,
                      })
                    }
                    disabled={updateStatus.isPending}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => promote.mutate(selected.id)}
                    disabled={promote.isPending}
                  >
                    {promote.isPending ? "Promoting…" : "Approve & promote to CPA"}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() =>
                      updateStatus.mutate({
                        id: selected.id,
                        status: "rejected",
                        decision_notes: notes,
                      })
                    }
                    disabled={updateStatus.isPending}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({
  label,
  value,
  multiline,
  link,
}: {
  label: string;
  value: string | null | undefined;
  multiline?: boolean;
  link?: boolean;
}) {
  if (!value) {
    return (
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-muted-foreground">—</div>
      </div>
    );
  }
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      {link ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
          {value}
        </a>
      ) : multiline ? (
        <div className="whitespace-pre-wrap">{value}</div>
      ) : (
        <div>{value}</div>
      )}
    </div>
  );
}
