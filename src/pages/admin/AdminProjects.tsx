import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Eye, Download, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { exportProjectDataJson } from '@/lib/exportProjectData';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function AdminProjects() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  const handleExport = async (projectId: string, projectName: string) => {
    setExportingId(projectId);
    try {
      await exportProjectDataJson(projectId, projectName);
      toast.success('Project data exported');
    } catch (e: any) {
      toast.error('Export failed: ' + (e.message || 'Unknown error'));
    } finally {
      setExportingId(null);
    }
  };

  const handleDelete = async (projectId: string) => {
    setDeletingId(projectId);
    try {
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) throw error;
      toast.success('Project deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
    } catch (e: any) {
      toast.error('Delete failed: ' + (e.message || 'Unknown error'));
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const { data: projects, isLoading } = useQuery({
    queryKey: ['admin-projects'],
    queryFn: async () => {
      const { data: projectsData, error: projError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000000);

      if (projError) throw projError;

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, company')
        .limit(1000000);

      const profileMap = new Map(
        (profilesData || []).map((p) => [p.user_id, p])
      );

      return (projectsData || []).map((project) => ({
        ...project,
        profiles: profileMap.get(project.user_id) || null,
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
              <TableHead className="w-[120px]"></TableHead>
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
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/project/${project.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={exportingId === project.id}
                      onClick={() => handleExport(project.id, project.name)}
                    >
                      {exportingId === project.id ? (
                        <Spinner className="h-4 w-4" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={deletingId === project.id}
                      onClick={() => setConfirmDelete({ id: project.id, name: project.name })}
                    >
                      {deletingId === project.id ? (
                        <Spinner className="h-4 w-4" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{confirmDelete?.name}</strong>? This will permanently remove all project data including documents, analysis results, and adjustments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmDelete && handleDelete(confirmDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
