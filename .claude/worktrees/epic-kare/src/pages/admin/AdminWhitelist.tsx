import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, Plus, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

interface WhitelistedUser {
  id: string;
  email: string;
  notes: string | null;
  created_at: string;
}

export default function AdminWhitelist() {
  const queryClient = useQueryClient();
  const [newEmail, setNewEmail] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['whitelisted-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whitelisted_users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as WhitelistedUser[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async ({ email, notes }: { email: string; notes: string }) => {
      const { error } = await supabase
        .from('whitelisted_users')
        .insert({ email: email.toLowerCase().trim(), notes: notes || null });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whitelisted-users'] });
      setNewEmail('');
      setNewNotes('');
      toast.success('User added to whitelist');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.error('This email is already whitelisted');
      } else {
        toast.error('Failed to add user: ' + error.message);
      }
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('whitelisted_users')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whitelisted-users'] });
      toast.success('User removed from whitelist');
    },
    onError: (error: Error) => {
      toast.error('Failed to remove user: ' + error.message);
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    addMutation.mutate({ email: newEmail, notes: newNotes });
  };

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
        <ShieldCheck className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Whitelist Management</h1>
          <p className="text-muted-foreground">
            Whitelisted users bypass all subscription checks and have full access
          </p>
        </div>
      </div>

      {/* Add User Form */}
      <form onSubmit={handleAdd} className="flex gap-3 items-end">
        <div className="flex-1 max-w-xs">
          <label className="text-sm font-medium mb-1 block">Email</label>
          <Input
            type="email"
            placeholder="user@example.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
          />
        </div>
        <div className="flex-1 max-w-xs">
          <label className="text-sm font-medium mb-1 block">Notes (optional)</label>
          <Input
            type="text"
            placeholder="e.g. Team member, Client"
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={addMutation.isPending}>
          <Plus className="h-4 w-4 mr-2" />
          Add to Whitelist
        </Button>
      </form>

      {/* Users Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users && users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.notes || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(user.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove from whitelist?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove <strong>{user.email}</strong> from the whitelist. 
                            They will need an active subscription to access premium features.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => removeMutation.mutate(user.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No whitelisted users yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
