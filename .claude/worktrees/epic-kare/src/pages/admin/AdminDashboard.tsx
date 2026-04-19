import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StatsCard } from '@/components/admin/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, FolderKanban, CreditCard, Mail, Sparkles } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [newSpots, setNewSpots] = useState('');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [profiles, projects, subscriptions, contacts] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('contact_submissions').select('id', { count: 'exact', head: true }),
      ]);
      return {
        users: profiles.count ?? 0,
        projects: projects.count ?? 0,
        activeSubscriptions: subscriptions.count ?? 0,
        contacts: contacts.count ?? 0,
      };
    },
  });

  const { data: promoData } = useQuery({
    queryKey: ['admin-promo-spots'],
    queryFn: async () => {
      const { data } = await supabase
        .from('promo_config')
        .select('value')
        .eq('key', 'early_adopter_spots')
        .single();
      return data?.value ?? 0;
    },
  });

  const updateSpots = useMutation({
    mutationFn: async (value: number) => {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('update-promo-config', {
        body: { key: 'early_adopter_spots', value },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-promo-spots'] });
      toast({ title: 'Updated', description: `Spots set to ${data.value}` });
      setNewSpots('');
    },
    onError: (err: any) => {
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
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Users" value={stats?.users ?? 0} icon={Users} />
        <StatsCard title="Total Projects" value={stats?.projects ?? 0} icon={FolderKanban} />
        <StatsCard title="Active Subscriptions" value={stats?.activeSubscriptions ?? 0} icon={CreditCard} />
        <StatsCard title="Contact Submissions" value={stats?.contacts ?? 0} icon={Mail} />
      </div>

      {/* Promo Control Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">Early Adopter Promo Control</CardTitle>
          <Sparkles className="h-5 w-5 text-amber-500" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Current spots:</span>
            <span className="text-2xl font-bold">{promoData ?? '—'}</span>
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="spots-input">Set spots to</Label>
              <Input
                id="spots-input"
                type="number"
                min={0}
                max={100}
                placeholder="e.g. 35"
                value={newSpots}
                onChange={(e) => setNewSpots(e.target.value)}
              />
            </div>
            <Button
              onClick={() => updateSpots.mutate(Number(newSpots))}
              disabled={!newSpots || updateSpots.isPending}
            >
              Update
            </Button>
            <Button
              variant="outline"
              onClick={() => updateSpots.mutate(50)}
              disabled={updateSpots.isPending}
            >
              Reset to 50
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
