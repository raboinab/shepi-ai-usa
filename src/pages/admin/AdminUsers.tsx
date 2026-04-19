import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from '@/hooks/use-toast';
import { format, differenceInDays } from 'date-fns';
import {
  Users, UserPlus, FolderOpen, FileText, Link2,
  ChevronDown, Copy, Send, StickyNote, Filter, Shield,
} from 'lucide-react';
import { StatsCard } from '@/components/admin/StatsCard';

type EngagementStage = 'New' | 'Stalled' | 'Active' | 'Churned';

interface UserEngagement {
  user_id: string;
  email: string;
  full_name: string | null;
  company: string | null;
  signed_up_at: string;
  last_sign_in_at: string | null;
  project_count: number;
  document_count: number;
  has_qb_connection: boolean;
  has_completed_onboarding: boolean;
}

interface AdminNote {
  id: string;
  user_id: string;
  admin_id: string;
  note: string;
  created_at: string;
}

function getStage(user: UserEngagement): EngagementStage {
  const daysSinceSignup = differenceInDays(new Date(), new Date(user.signed_up_at));
  const daysSinceLastLogin = user.last_sign_in_at
    ? differenceInDays(new Date(), new Date(user.last_sign_in_at))
    : daysSinceSignup;

  if (user.has_completed_onboarding && user.document_count > 0) return 'Active';
  if (daysSinceLastLogin >= 14 && !user.has_completed_onboarding) return 'Churned';
  if (daysSinceSignup < 3) return 'New';
  return 'Stalled';
}

const stageBadgeVariant: Record<EngagementStage, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  New: 'outline',
  Stalled: 'secondary',
  Active: 'default',
  Churned: 'destructive',
};

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [stageFilter, setStageFilter] = useState<EngagementStage | 'All'>('All');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [sendingNudges, setSendingNudges] = useState(false);

  // Fetch CPA roles
  const { data: cpaRoles } = useQuery({
    queryKey: ['admin-cpa-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('role', 'cpa');
      if (error) throw error;
      return new Set((data || []).map(r => r.user_id));
    },
  });

  const toggleCpaRole = useMutation({
    mutationFn: async ({ userId, isCpa }: { userId: string; isCpa: boolean }) => {
      if (isCpa) {
        const { error } = await supabase.from('user_roles').delete()
          .eq('user_id', userId).eq('role', 'cpa');
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_roles').insert({
          user_id: userId, role: 'cpa',
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cpa-roles'] });
      toast({ title: 'CPA role updated' });
    },
    onError: (err) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  // Fetch engagement stats
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-engagement-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_engagement_stats');
      if (error) throw error;
      return (data as unknown as UserEngagement[]) || [];
    },
  });

  // Fetch admin notes
  const { data: notes } = useQuery({
    queryKey: ['admin-notes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_notes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000000);
      if (error) throw error;
      return (data as AdminNote[]) || [];
    },
  });

  // Fetch nudge logs
  const { data: nudgeLogs } = useQuery({
    queryKey: ['admin-nudge-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nudge_log')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(1000000);
      if (error) throw error;
      return data || [];
    },
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async ({ userId, note }: { userId: string; note: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('admin_notes').insert({
        user_id: userId,
        admin_id: user.id,
        note,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notes'] });
      setNewNote('');
      toast({ title: 'Note added' });
    },
    onError: (err) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast({ title: 'Email copied' });
  };

  const handleSendNudges = async () => {
    setSendingNudges(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-engagement-email');
      if (error) throw error;
      const sent = data?.sent_count || 0;
      toast({
        title: sent > 0 ? `${sent} nudge email${sent > 1 ? 's' : ''} sent` : 'No nudges needed',
        description: sent > 0 ? 'Check nudge logs for details' : 'All users have been nudged already or are active',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-nudge-logs'] });
    } catch (err) {
      toast({ title: 'Error sending nudges', description: err instanceof Error ? err.message : 'Unknown', variant: 'destructive' });
    } finally {
      setSendingNudges(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const usersWithStage = (users || []).map((u) => ({ ...u, stage: getStage(u) }));
  const filtered = stageFilter === 'All' ? usersWithStage : usersWithStage.filter((u) => u.stage === stageFilter);

  // Funnel stats
  const total = usersWithStage.length;
  const withProject = usersWithStage.filter((u) => u.project_count > 0).length;
  const withOnboarding = usersWithStage.filter((u) => u.has_completed_onboarding).length;
  const withDocs = usersWithStage.filter((u) => u.document_count > 0).length;
  const withQB = usersWithStage.filter((u) => u.has_qb_connection).length;

  const notesByUser = (notes || []).reduce<Record<string, AdminNote[]>>((acc, n) => {
    (acc[n.user_id] ||= []).push(n);
    return acc;
  }, {});

  const nudgesByUser = (nudgeLogs || []).reduce<Record<string, { nudge_type: string; sent_at: string }[]>>((acc, n) => {
    (acc[n.user_id] ||= []).push(n);
    return acc;
  }, {});

  const stages: (EngagementStage | 'All')[] = ['All', 'New', 'Stalled', 'Active', 'Churned'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">User Engagement</h1>
        <Button onClick={handleSendNudges} disabled={sendingNudges} className="gap-2">
          <Send className="h-4 w-4" />
          {sendingNudges ? 'Sending...' : 'Send Nudges'}
        </Button>
      </div>

      {/* Funnel Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatsCard title="Signed Up" value={total} icon={Users} />
        <StatsCard title="Created Project" value={withProject} icon={FolderOpen} description={`${total > 0 ? Math.round((withProject / total) * 100) : 0}%`} />
        <StatsCard title="Onboarded" value={withOnboarding} icon={UserPlus} description={`${total > 0 ? Math.round((withOnboarding / total) * 100) : 0}%`} />
        <StatsCard title="Uploaded Docs" value={withDocs} icon={FileText} description={`${total > 0 ? Math.round((withDocs / total) * 100) : 0}%`} />
        <StatsCard title="Connected QB" value={withQB} icon={Link2} description={`${total > 0 ? Math.round((withQB / total) * 100) : 0}%`} />
      </div>

      {/* Stage Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {stages.map((s) => (
          <Button
            key={s}
            variant={stageFilter === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStageFilter(s)}
          >
            {s}
            {s !== 'All' && (
              <span className="ml-1 text-xs">
                ({usersWithStage.filter((u) => u.stage === s).length})
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* User Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead className="text-right">Projects</TableHead>
              <TableHead className="text-right">Docs</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead>Signed Up</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((user) => {
              const userNotes = notesByUser[user.user_id] || [];
              const userNudges = nudgesByUser[user.user_id] || [];
              const isExpanded = expandedUser === user.user_id;

              return (
                <Collapsible key={user.user_id} open={isExpanded} onOpenChange={() => setExpandedUser(isExpanded ? null : user.user_id)} asChild>
                  <>
                    <TableRow className="cursor-pointer">
                      <TableCell className="font-medium">{user.full_name || 'No name'}</TableCell>
                      <TableCell>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCopyEmail(user.email); }}
                          className="text-sm hover:underline text-primary flex items-center gap-1"
                          title="Click to copy"
                        >
                          {user.email} <Copy className="h-3 w-3" />
                        </button>
                      </TableCell>
                      <TableCell>{user.company || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={stageBadgeVariant[user.stage]}>{user.stage}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{user.project_count}</TableCell>
                      <TableCell className="text-right">{user.document_count}</TableCell>
                      <TableCell>
                        {user.last_sign_in_at
                          ? format(new Date(user.last_sign_in_at), 'MMM d, yyyy')
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(user.signed_up_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="gap-1">
                            <StickyNote className="h-3 w-3" />
                            {userNotes.length > 0 && <span className="text-xs">{userNotes.length}</span>}
                            <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </Button>
                        </CollapsibleTrigger>
                      </TableCell>
                    </TableRow>
                    <CollapsibleContent asChild>
                      <tr>
                        <td colSpan={9} className="p-4 bg-muted/30">
                          <div className="space-y-3">
                            {/* CPA Role Toggle */}
                            <div className="flex items-center gap-2">
                              <Button
                                variant={cpaRoles?.has(user.user_id) ? 'default' : 'outline'}
                                size="sm"
                                className="gap-1"
                                onClick={() => toggleCpaRole.mutate({ userId: user.user_id, isCpa: !!cpaRoles?.has(user.user_id) })}
                                disabled={toggleCpaRole.isPending}
                              >
                                <Shield className="h-3 w-3" />
                                {cpaRoles?.has(user.user_id) ? 'CPA Role Active' : 'Grant CPA Role'}
                              </Button>
                            </div>
                            {/* Nudge history */}
                            {userNudges.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">Nudges sent:</p>
                                <div className="flex gap-2 flex-wrap">
                                  {userNudges.map((n, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {n.nudge_type} — {format(new Date(n.sent_at), 'MMM d')}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Existing notes */}
                            {userNotes.length > 0 && (
                              <div className="space-y-1">
                                {userNotes.map((n) => (
                                  <div key={n.id} className="text-sm border-l-2 border-primary/30 pl-2">
                                    <span className="text-muted-foreground text-xs">{format(new Date(n.created_at), 'MMM d, h:mm a')}</span>
                                    <p>{n.note}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add note */}
                            <div className="flex gap-2">
                              <Textarea
                                placeholder="Add a note (e.g., 'Emailed re: onboarding help')"
                                value={expandedUser === user.user_id ? newNote : ''}
                                onChange={(e) => setNewNote(e.target.value)}
                                className="min-h-[60px]"
                              />
                              <Button
                                size="sm"
                                disabled={!newNote.trim() || addNoteMutation.isPending}
                                onClick={() => addNoteMutation.mutate({ userId: user.user_id, note: newNote })}
                              >
                                Add
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
