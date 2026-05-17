import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { format, differenceInHours } from 'date-fns';
import { Briefcase, AlertTriangle, Trash2, Filter, UserCog } from 'lucide-react';
import { useMemo, useState } from 'react';

type StatusFilter =
  | 'all' | 'unclaimed' | 'proposed' | 'accepted'
  | 'in_review' | 'completed' | 'withdrawn'
  // legacy
  | 'in_progress' | 'review' | 'delivered';

const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Unclaimed', value: 'unclaimed' },
  { label: 'Proposed', value: 'proposed' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'In Review', value: 'in_review' },
  { label: 'Completed', value: 'completed' },
  { label: 'Withdrawn', value: 'withdrawn' },
];

interface ReassignTarget {
  claimId: string;
  projectLabel: string;
  currentCpaUserId: string;
}

export default function AdminDFYEngagements() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [reassignTarget, setReassignTarget] = useState<ReassignTarget | null>(null);
  const [newCpaId, setNewCpaId] = useState<string>('');
  const [reassignReason, setReassignReason] = useState<string>('');

  const { data: projects, isLoading: projLoading } = useQuery({
    queryKey: ['admin-dfy-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, target_company, industry, created_at, client_name, user_id')
        .eq('service_tier', 'done_for_you')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: claims, isLoading: claimsLoading } = useQuery({
    queryKey: ['admin-dfy-claims'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cpa_claims')
        .select('*')
        .is('withdrawn_at', null);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: payments } = useQuery({
    queryKey: ['admin-dfy-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_payments')
        .select('project_id, paid_at, amount')
        .eq('status', 'paid');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ['admin-profiles-cpa'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name');
      if (error) throw error;
      return data || [];
    },
  });

  // CPAs available to be reassigned (active + capacity awareness)
  const { data: cpas } = useQuery({
    queryKey: ['admin-active-cpas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cpa_profiles')
        .select('user_id, full_name, state_of_licensure, max_concurrent_engagements, active')
        .eq('active', true)
        .order('full_name');
      if (error) throw error;
      return data || [];
    },
  });

  const removeClaim = useMutation({
    mutationFn: async (claimId: string) => {
      const { error } = await supabase.from('cpa_claims').delete().eq('id', claimId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dfy-claims'] });
      toast({ title: 'Claim removed — project returned to queue' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const reassignClaim = useMutation({
    mutationFn: async ({
      claim, newCpa, reason, projectId,
    }: { claim: any; newCpa: string; reason: string; projectId: string }) => {
      // 1. Withdraw old claim
      const { error: e1 } = await supabase
        .from('cpa_claims')
        .update({
          status: 'withdrawn',
          withdrawn_at: new Date().toISOString(),
          withdrawn_reason: reason,
        })
        .eq('id', claim.id);
      if (e1) throw e1;

      // 2. Insert new claim (admin INSERT policy permits this)
      const { error: e2 } = await supabase.from('cpa_claims').insert({
        project_id: projectId,
        cpa_user_id: newCpa,
        status: 'proposed',
      });
      if (e2) throw e2;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dfy-claims'] });
      toast({ title: 'CPA reassigned', description: 'New reviewer notified.' });
      setReassignTarget(null);
      setNewCpaId('');
      setReassignReason('');
    },
    onError: (err: any) => {
      toast({ title: 'Reassign failed', description: err.message, variant: 'destructive' });
    },
  });

  const claimMap = useMemo(
    () => new Map((claims || []).map((c) => [c.project_id, c])),
    [claims],
  );
  const paymentMap = useMemo(
    () => new Map((payments || []).map((p) => [p.project_id, p])),
    [payments],
  );
  const profileMap = useMemo(
    () => new Map((profiles || []).map((p) => [p.user_id, p.full_name])),
    [profiles],
  );

  // Open-engagement counts per CPA for capacity hints in the dialog.
  const cpaOpenCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of claims || []) {
      if (['proposed', 'accepted', 'in_review', 'in_progress', 'review'].includes(c.status)) {
        counts.set(c.cpa_user_id, (counts.get(c.cpa_user_id) || 0) + 1);
      }
    }
    return counts;
  }, [claims]);

  const isLoading = projLoading || claimsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const rows = (projects || []).map((p) => {
    const claim = claimMap.get(p.id);
    const payment = paymentMap.get(p.id);
    const status = (claim ? claim.status : 'unclaimed') as StatusFilter;
    const cpaName = claim ? (profileMap.get(claim.cpa_user_id) || 'Unknown CPA') : null;
    const hoursSinceCreation = differenceInHours(new Date(), new Date(p.created_at!));
    const isStale = !claim && hoursSinceCreation > 24;
    return { ...p, claim, payment, status, cpaName, hoursSinceCreation, isStale };
  });

  const filtered = filter === 'all' ? rows : rows.filter((r) => r.status === filter);

  const counts = STATUS_OPTIONS.reduce<Record<string, number>>((acc, opt) => {
    acc[opt.value] = opt.value === 'all'
      ? rows.length
      : rows.filter((r) => r.status === opt.value).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Briefcase className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">DFY Engagements</h1>
        <Badge variant="secondary">{rows.length} total</Badge>
        {counts.unclaimed > 0 && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            {counts.unclaimed} unclaimed
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {STATUS_OPTIONS.map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f.value)}
          >
            {f.label}
            <span className="ml-1 text-xs">({counts[f.value] ?? 0})</span>
          </Button>
        ))}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>CPA Assigned</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row.id} className={row.isStale ? 'bg-destructive/5' : ''}>
                <TableCell className="font-medium">
                  {row.target_company || row.name}
                </TableCell>
                <TableCell>{row.client_name || '-'}</TableCell>
                <TableCell>
                  {row.payment?.paid_at
                    ? format(new Date(row.payment.paid_at), 'MMM d, yyyy')
                    : '-'}
                </TableCell>
                <TableCell>
                  {row.cpaName || (
                    <span className="text-destructive font-medium flex items-center gap-1">
                      {row.isStale && <AlertTriangle className="h-3 w-3" />}
                      Unclaimed
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      row.status === 'unclaimed' ? 'destructive'
                      : row.status === 'completed' || row.status === 'delivered' ? 'outline'
                      : row.status === 'in_review' || row.status === 'review' ? 'secondary'
                      : 'default'
                    }
                  >
                    {String(row.status).replace(/_/g, ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  {row.hoursSinceCreation < 24
                    ? `${row.hoursSinceCreation}h`
                    : `${Math.floor(row.hoursSinceCreation / 24)}d`}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/project/${row.id}`, '_blank')}
                    >
                      View
                    </Button>
                    {row.claim && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setReassignTarget({
                              claimId: row.claim!.id,
                              projectLabel: row.target_company || row.name,
                              currentCpaUserId: row.claim!.cpa_user_id,
                            });
                            setNewCpaId('');
                            setReassignReason('');
                          }}
                        >
                          <UserCog className="h-3.5 w-3.5 mr-1" />
                          Reassign
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => removeClaim.mutate(row.claim!.id)}
                          disabled={removeClaim.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No DFY engagements found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Reassign dialog */}
      <Dialog
        open={!!reassignTarget}
        onOpenChange={(open) => !open && setReassignTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign CPA reviewer</DialogTitle>
            <DialogDescription>
              {reassignTarget?.projectLabel}. The current CPA will be marked
              withdrawn and the new CPA will be sent a proposal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-cpa">New CPA</Label>
              <Select value={newCpaId} onValueChange={setNewCpaId}>
                <SelectTrigger id="new-cpa">
                  <SelectValue placeholder="Select a CPA…" />
                </SelectTrigger>
                <SelectContent>
                  {(cpas || [])
                    .filter((c) => c.user_id !== reassignTarget?.currentCpaUserId)
                    .map((c) => {
                      const open = cpaOpenCounts.get(c.user_id) || 0;
                      const atCap = open >= (c.max_concurrent_engagements ?? 3);
                      return (
                        <SelectItem
                          key={c.user_id}
                          value={c.user_id}
                          disabled={atCap}
                        >
                          {c.full_name} ({c.state_of_licensure}) —
                          {' '}
                          {open}/{c.max_concurrent_engagements ?? 3}
                          {atCap ? ' • at capacity' : ''}
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                placeholder="Why is this CPA being replaced? (e.g. unresponsive, conflict, client requested change)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReassignTarget(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!reassignTarget || !newCpaId || !reassignReason.trim()) {
                  toast({
                    title: 'Missing info',
                    description: 'Pick a CPA and provide a reason.',
                    variant: 'destructive',
                  });
                  return;
                }
                const claim = (claims || []).find((c) => c.id === reassignTarget.claimId);
                if (!claim) return;
                reassignClaim.mutate({
                  claim,
                  newCpa: newCpaId,
                  reason: reassignReason.trim(),
                  projectId: claim.project_id,
                });
              }}
              disabled={reassignClaim.isPending}
            >
              {reassignClaim.isPending ? 'Reassigning…' : 'Reassign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
