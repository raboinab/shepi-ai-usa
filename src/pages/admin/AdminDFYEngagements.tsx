import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { format, differenceInHours } from 'date-fns';
import { Briefcase, AlertTriangle, Trash2, Filter } from 'lucide-react';
import { useState } from 'react';

type StatusFilter = 'all' | 'unclaimed' | 'in_progress' | 'review' | 'delivered';

export default function AdminDFYEngagements() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<StatusFilter>('all');

  // All DFY projects
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

  // All claims
  const { data: claims, isLoading: claimsLoading } = useQuery({
    queryKey: ['admin-dfy-claims'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cpa_claims')
        .select('*');
      if (error) throw error;
      return data || [];
    },
  });

  // Payments for DFY projects
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

  // Profiles for CPA names
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

  const removeClaim = useMutation({
    mutationFn: async (claimId: string) => {
      const { error } = await supabase.from('cpa_claims').delete().eq('id', claimId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dfy-claims'] });
      toast({ title: 'Claim removed — project returned to queue' });
    },
    onError: (err) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const isLoading = projLoading || claimsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const claimMap = new Map((claims || []).map(c => [c.project_id, c]));
  const paymentMap = new Map((payments || []).map(p => [p.project_id, p]));
  const profileMap = new Map((profiles || []).map(p => [p.user_id, p.full_name]));

  const rows = (projects || []).map(p => {
    const claim = claimMap.get(p.id);
    const payment = paymentMap.get(p.id);
    const status = claim ? claim.status : 'unclaimed';
    const cpaName = claim ? (profileMap.get(claim.cpa_user_id) || 'Unknown CPA') : null;
    const hoursSinceCreation = differenceInHours(new Date(), new Date(p.created_at!));
    const isStale = !claim && hoursSinceCreation > 24;

    return { ...p, claim, payment, status, cpaName, hoursSinceCreation, isStale };
  });

  const filtered = filter === 'all' ? rows : rows.filter(r => r.status === filter);

  const counts = {
    all: rows.length,
    unclaimed: rows.filter(r => r.status === 'unclaimed').length,
    in_progress: rows.filter(r => r.status === 'in_progress').length,
    review: rows.filter(r => r.status === 'review').length,
    delivered: rows.filter(r => r.status === 'delivered').length,
  };

  const filters: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Unclaimed', value: 'unclaimed' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Review', value: 'review' },
    { label: 'Delivered', value: 'delivered' },
  ];

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

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {filters.map(f => (
          <Button
            key={f.value}
            variant={filter === f.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f.value)}
          >
            {f.label}
            <span className="ml-1 text-xs">({counts[f.value]})</span>
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
            {filtered.map(row => (
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
                  <Badge variant={
                    row.status === 'unclaimed' ? 'destructive' :
                    row.status === 'delivered' ? 'outline' :
                    row.status === 'review' ? 'secondary' : 'default'
                  }>
                    {row.status.replace(/_/g, ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  {row.hoursSinceCreation < 24
                    ? `${row.hoursSinceCreation}h`
                    : `${Math.floor(row.hoursSinceCreation / 24)}d`
                  }
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => removeClaim.mutate(row.claim!.id)}
                        disabled={removeClaim.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
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
    </div>
  );
}
