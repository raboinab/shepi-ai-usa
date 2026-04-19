import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function AdminUsers() {
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get roles for each user
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const rolesMap = new Map<string, string[]>();
      roles?.forEach((r) => {
        const existing = rolesMap.get(r.user_id) || [];
        rolesMap.set(r.user_id, [...existing, r.role]);
      });

      return profiles.map((p) => ({
        ...p,
        roles: rolesMap.get(p.user_id) || [],
      }));
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
      <h1 className="text-3xl font-bold">Users</h1>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.full_name || 'No name'}
                </TableCell>
                <TableCell>{user.company || '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {user.roles.length > 0 ? (
                      user.roles.map((role) => (
                        <Badge key={role} variant="secondary">
                          {role}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-sm">user</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {user.created_at
                    ? format(new Date(user.created_at), 'MMM d, yyyy')
                    : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
