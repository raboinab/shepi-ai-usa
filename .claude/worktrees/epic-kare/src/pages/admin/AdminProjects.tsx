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
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminProjects() {
  const navigate = useNavigate();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['admin-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          profiles!projects_user_id_fkey(full_name, company)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        // Fallback without join if foreign key doesn't exist
        const { data: projectsOnly, error: projError } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });

        if (projError) throw projError;
        return projectsOnly.map((p) => ({ ...p, profiles: null }));
      }

      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const getStatusVariant = (status: string | null) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Projects</h1>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project Name</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects?.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell>{project.client_name || '-'}</TableCell>
                <TableCell>
                  {(project as any).profiles?.full_name || 'Unknown'}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(project.status)}>
                    {project.status || 'draft'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {project.created_at
                    ? format(new Date(project.created_at), 'MMM d, yyyy')
                    : '-'}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/project/${project.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
