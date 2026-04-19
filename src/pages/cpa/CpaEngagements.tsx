import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ExternalLink, MessageCircle } from 'lucide-react';
import { EngagementChat } from '@/components/EngagementChat';

const statusColors: Record<string, 'default' | 'secondary' | 'outline'> = {
  in_progress: 'default',
  review: 'secondary',
  delivered: 'outline',
};

export default function CpaEngagements() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [chatOpenFor, setChatOpenFor] = useState<string | null>(null);

  const { data: engagements, isLoading } = useQuery({
    queryKey: ['cpa-my-engagements'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: claims, error: claimsErr } = await supabase
        .from('cpa_claims')
        .select('id, project_id, status, claimed_at, notes, updated_at')
        .eq('cpa_user_id', user.id)
        .order('claimed_at', { ascending: false });
      if (claimsErr) throw claimsErr;
      if (!claims || claims.length === 0) return [];

      const projectIds = claims.map(c => c.project_id);
      const { data: projects, error: projErr } = await supabase
        .from('projects')
        .select('id, name, target_company, industry, transaction_type, client_name')
        .in('id', projectIds);
      if (projErr) throw projErr;

      const projectMap = new Map((projects || []).map(p => [p.id, p]));
      return claims.map(c => ({
        ...c,
        project: projectMap.get(c.project_id),
      }));
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ claimId, status }: { claimId: string; status: string }) => {
      const { error } = await supabase
        .from('cpa_claims')
        .update({ status })
        .eq('id', claimId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cpa-my-engagements'] });
      toast({ title: 'Status updated' });
    },
    onError: (err) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Briefcase className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">My Engagements</h1>
        <Badge variant="secondary">{(engagements || []).length}</Badge>
      </div>

      {!engagements || engagements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            You haven't claimed any projects yet. Check the queue for available engagements.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {engagements.map((eng) => (
            <Card key={eng.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {eng.project?.target_company || eng.project?.name || 'Project'}
                  </CardTitle>
                  <Badge variant={statusColors[eng.status] || 'outline'}>
                    {eng.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <CardDescription>
                  {eng.project?.client_name || 'Client'} • Claimed {format(new Date(eng.claimed_at), 'MMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 space-y-3">
                <div className="text-sm text-muted-foreground">
                  {eng.project?.industry && <span>{eng.project.industry}</span>}
                  {eng.project?.transaction_type && (
                    <span className="ml-2 capitalize">• {eng.project.transaction_type.replace(/_/g, ' ')}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Status:</span>
                  <Select
                    value={eng.status}
                    onValueChange={(value) => updateStatusMutation.mutate({ claimId: eng.id, status: value })}
                  >
                    <SelectTrigger className="h-7 text-xs w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="mt-auto pt-3 space-y-2">
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => setChatOpenFor(chatOpenFor === eng.project_id ? null : eng.project_id)}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Message Client
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => navigate(`/project/${eng.project_id}`)}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Project
                  </Button>
                </div>
                {chatOpenFor === eng.project_id && (
                  <div className="mt-3">
                    <EngagementChat
                      projectId={eng.project_id}
                      onClose={() => setChatOpenFor(null)}
                      selfLabel="Analyst"
                      otherLabel="Client"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
