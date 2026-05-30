import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle2, Pencil, XCircle, Send, AlertCircle } from 'lucide-react';
import { DocumentIntakePanel } from '@/components/dfy/DocumentIntakePanel';

type Decision = 'confirmed' | 'modified' | 'rejected';

export default function CpaEngagement() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [completeOpen, setCompleteOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [editing, setEditing] = useState<Record<string, { note: string; amount: string }>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['cpa-engagement', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: claim, error: claimErr } = await supabase
        .from('cpa_claims')
        .select('id, status, claimed_at, accepted_at, completed_at, completion_summary, cpa_user_id')
        .eq('project_id', projectId!)
        .eq('cpa_user_id', user.id)
        .order('claimed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (claimErr) throw claimErr;
      if (!claim) throw new Error('Claim not found');

      const { data: project } = await supabase
        .from('projects')
        .select('id, name, target_company, client_name, industry, transaction_type')
        .eq('id', projectId!)
        .maybeSingle();

      const { data: proposals } = await supabase
        .from('adjustment_proposals')
        .select('id, title, description, proposed_amount, ai_rationale, evidence_strength, block, adjustment_class')
        .eq('project_id', projectId!)
        .order('internal_score', { ascending: false });

      const { data: reviews } = await supabase
        .from('cpa_adjustment_reviews')
        .select('*')
        .eq('claim_id', claim.id);

      return { claim, project, proposals: proposals || [], reviews: reviews || [] };
    },
  });

  const upsertReview = useMutation({
    mutationFn: async (args: { proposalId: string; decision: Decision; note: string; amount?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !data?.claim) throw new Error('Not ready');
      const payload: any = {
        claim_id: data.claim.id,
        proposal_id: args.proposalId,
        project_id: projectId!,
        cpa_user_id: user.id,
        decision: args.decision,
        cpa_note: args.note || null,
        modified_amount: args.amount ? Number(args.amount) : null,
        reviewed_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from('cpa_adjustment_reviews')
        .upsert(payload, { onConflict: 'claim_id,proposal_id' });
      if (error) throw error;

      // Auto-advance claim to in_review on first review submitted
      if (data.claim.status === 'accepted' || data.claim.status === 'proposed') {
        await supabase
          .from('cpa_claims')
          .update({ status: 'in_review' })
          .eq('id', data.claim.id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cpa-engagement', projectId] });
      toast({ title: 'Review saved' });
    },
    onError: (e: any) => toast({ title: 'Save failed', description: e.message, variant: 'destructive' }),
  });

  const completeEngagement = useMutation({
    mutationFn: async () => {
      if (!data?.claim) throw new Error('No claim');
      const { error } = await supabase
        .from('cpa_claims')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completion_summary: summary,
        })
        .eq('id', data.claim.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setCompleteOpen(false);
      qc.invalidateQueries({ queryKey: ['cpa-engagement', projectId] });
      toast({ title: 'Engagement completed', description: 'The client has been notified.' });
    },
    onError: (e: any) => toast({ title: 'Could not complete', description: e.message, variant: 'destructive' }),
  });

  const withdraw = useMutation({
    mutationFn: async () => {
      if (!data?.claim) throw new Error('No claim');
      const reason = prompt('Reason for withdrawing (visible to admin):') || '';
      const { error } = await supabase
        .from('cpa_claims')
        .update({
          status: 'withdrawn',
          withdrawn_at: new Date().toISOString(),
          withdrawn_reason: reason,
        })
        .eq('id', data.claim.id);
      if (error) throw error;
    },
    onSuccess: () => {
      navigate('/cpa/engagements');
      toast({ title: 'Withdrew from engagement' });
    },
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Spinner className="h-8 w-8" /></div>;
  if (!data) return <div className="p-6">Engagement not found.</div>;

  const { claim, project, proposals, reviews } = data;
  const reviewMap = new Map(reviews.map((r: any) => [r.proposal_id, r]));
  const reviewedCount = reviews.length;
  const total = proposals.length;
  const allReviewed = total > 0 && reviewedCount >= total;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/cpa/engagements')} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to engagements
      </Button>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">{project?.target_company || project?.name}</h1>
          <p className="text-muted-foreground">
            Client: {project?.client_name || '—'} • {project?.industry || ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">{claim.status.replace(/_/g, ' ')}</Badge>
          {claim.status !== 'completed' && claim.status !== 'withdrawn' && (
            <Button variant="outline" size="sm" onClick={() => withdraw.mutate()}>
              Withdraw
            </Button>
          )}
          <Button
            size="sm"
            disabled={!allReviewed || claim.status === 'completed'}
            onClick={() => setCompleteOpen(true)}
          >
            <Send className="h-4 w-4 mr-2" />
            Complete engagement
          </Button>
        </div>
      </div>

      <DocumentIntakePanel projectId={projectId!} viewerRole="cpa" />

      <Card>
        <CardHeader>
          <CardTitle>Adjustment review</CardTitle>
          <CardDescription>
            Reviewed {reviewedCount} of {total}. Confirm, modify, or reject each AI-flagged adjustment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {total === 0 ? (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              No adjustment proposals have been generated yet for this project.
            </div>
          ) : (
            <div className="space-y-4">
              {proposals.map((p: any) => {
                const r: any = reviewMap.get(p.id);
                const edit = editing[p.id] || { note: r?.cpa_note || '', amount: r?.modified_amount?.toString() || '' };
                const setEdit = (next: { note: string; amount: string }) =>
                  setEditing((s) => ({ ...s, [p.id]: next }));
                return (
                  <Card key={p.id} className="border-border">
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{p.title}</h3>
                            {p.evidence_strength && (
                              <Badge variant="secondary" className="text-xs capitalize">
                                {p.evidence_strength} evidence
                              </Badge>
                            )}
                          </div>
                          {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                          {p.proposed_amount != null && (
                            <p className="text-sm mt-1">
                              <span className="text-muted-foreground">Proposed: </span>
                              <span className="font-mono">${Number(p.proposed_amount).toLocaleString()}</span>
                            </p>
                          )}
                          {p.ai_rationale && (
                            <details className="mt-2">
                              <summary className="text-xs text-muted-foreground cursor-pointer">AI rationale</summary>
                              <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{p.ai_rationale}</p>
                            </details>
                          )}
                        </div>
                        {r && (
                          <Badge
                            variant={r.decision === 'confirmed' ? 'default' : r.decision === 'rejected' ? 'destructive' : 'secondary'}
                            className="capitalize shrink-0"
                          >
                            {r.decision}
                          </Badge>
                        )}
                      </div>

                      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                        <Textarea
                          placeholder="Note (required for modify/reject; optional for confirm)"
                          value={edit.note}
                          onChange={(e) => setEdit({ ...edit, note: e.target.value })}
                          rows={2}
                        />
                        <div className="space-y-1">
                          <Label className="text-xs">Modified amount</Label>
                          <Input
                            type="number"
                            placeholder="optional"
                            value={edit.amount}
                            onChange={(e) => setEdit({ ...edit, amount: e.target.value })}
                            className="w-32"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => upsertReview.mutate({ proposalId: p.id, decision: 'confirmed', note: edit.note })}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={!edit.note.trim()}
                          onClick={() => upsertReview.mutate({ proposalId: p.id, decision: 'modified', note: edit.note, amount: edit.amount })}
                        >
                          <Pencil className="h-4 w-4 mr-1" /> Modify
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={!edit.note.trim()}
                          onClick={() => upsertReview.mutate({ proposalId: p.id, decision: 'rejected', note: edit.note })}
                        >
                          <XCircle className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete engagement</DialogTitle>
            <DialogDescription>
              Send a short summary to the client. They'll be notified the review is complete.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Summary of review (key findings, anything the client should know)…"
            rows={6}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteOpen(false)}>Cancel</Button>
            <Button onClick={() => completeEngagement.mutate()} disabled={!summary.trim() || completeEngagement.isPending}>
              {completeEngagement.isPending ? 'Submitting…' : 'Submit & notify client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
