import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ClipboardList, Building2, Calendar, ArrowRight } from 'lucide-react';
import { useProviderAgreement } from '@/hooks/useProviderAgreement';
import { ProviderAgreementModal } from '@/components/cpa/ProviderAgreementModal';

export default function CpaQueue() {
  const queryClient = useQueryClient();
  const { hasAccepted, loading: agreementLoading } = useProviderAgreement();
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [pendingProjectId, setPendingProjectId] = useState<string | null>(null);

  // Fetch all DFY projects
  const { data: dfyProjects, isLoading: projectsLoading } = useQuery({
    queryKey: ['cpa-dfy-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, target_company, industry, transaction_type, created_at, client_name')
        .eq('service_tier', 'done_for_you')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch existing claims
  const { data: claims, isLoading: claimsLoading } = useQuery({
    queryKey: ['cpa-claims-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cpa_claims')
        .select('project_id, cpa_user_id, status');
      if (error) throw error;
      return data || [];
    },
  });

  const claimMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('cpa_claims').insert({
        project_id: projectId,
        cpa_user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cpa-dfy-projects'] });
      queryClient.invalidateQueries({ queryKey: ['cpa-claims-all'] });
      toast({ title: 'Project claimed', description: 'You now have editor access to this project.' });
    },
    onError: (err) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const handleClaimClick = (projectId: string) => {
    if (hasAccepted) {
      claimMutation.mutate(projectId);
    } else {
      setPendingProjectId(projectId);
      setAgreementOpen(true);
    }
  };

  const handleAgreementAccepted = () => {
    if (pendingProjectId) {
      claimMutation.mutate(pendingProjectId);
      setPendingProjectId(null);
    }
  };

  const isLoading = projectsLoading || claimsLoading || agreementLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const claimedProjectIds = new Set((claims || []).map(c => c.project_id));
  const unclaimed = (dfyProjects || []).filter(p => !claimedProjectIds.has(p.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardList className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Available Engagements</h1>
        <Badge variant="secondary" className="ml-2">{unclaimed.length} unclaimed</Badge>
      </div>

      {unclaimed.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No unclaimed Done-For-You projects at the moment. Check back soon.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {unclaimed.map((project) => (
            <Card key={project.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">{project.target_company || project.name}</CardTitle>
                <CardDescription>{project.client_name || 'Client'}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 space-y-3">
                <div className="space-y-1 text-sm text-muted-foreground">
                  {project.industry && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5" />
                      <span>{project.industry}</span>
                    </div>
                  )}
                  {project.transaction_type && (
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-3.5 w-3.5" />
                      <span className="capitalize">{project.transaction_type.replace(/_/g, ' ')}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Created {format(new Date(project.created_at!), 'MMM d, yyyy')}</span>
                  </div>
                </div>
                <div className="mt-auto pt-3">
                  <Button
                    className="w-full"
                    onClick={() => handleClaimClick(project.id)}
                    disabled={claimMutation.isPending}
                  >
                    Claim Project
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ProviderAgreementModal
        open={agreementOpen}
        onOpenChange={(open) => {
          setAgreementOpen(open);
          if (!open) setPendingProjectId(null);
        }}
        onAccepted={handleAgreementAccepted}
      />
    </div>
  );
}
