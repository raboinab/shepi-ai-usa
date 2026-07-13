import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import JSZip from 'jszip';

export default function AdminDocuments() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState('');
  const [downloadingAll, setDownloadingAll] = useState(false);

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['admin-projects-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, client_name')
        .order('created_at', { ascending: false })
        .limit(1000000);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: documents, isLoading: docsLoading } = useQuery({
    queryKey: ['admin-project-documents', selectedProjectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', selectedProjectId)
        .order('created_at', { ascending: false })
        .limit(1000000);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedProjectId,
  });

  const triggerBlobDownload = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    setDownloading(filePath);
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);
      if (error) throw error;
      if (!data) throw new Error('No file returned');
      triggerBlobDownload(data, fileName);
    } catch (err: any) {
      console.error('Download failed', filePath, err);
      toast.error(`Download failed: ${err.message}`);
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadAll = async () => {
    if (!documents?.length) return;
    setDownloadingAll(true);
    const zip = new JSZip();
    const failures: string[] = [];
    let added = 0;
    let completed = 0;

    const CONCURRENCY = 5;
    const queue = [...documents];

    const worker = async () => {
      while (queue.length) {
        const doc = queue.shift();
        if (!doc) break;
        try {
          const { data, error } = await supabase.storage
            .from('documents')
            .download(doc.file_path);
          if (error || !data) {
            failures.push(doc.name);
          } else {
            // dedupe names inside zip
            let entryName = doc.name;
            let i = 1;
            while (zip.file(entryName)) {
              const dot = doc.name.lastIndexOf('.');
              entryName = dot > 0
                ? `${doc.name.slice(0, dot)} (${i})${doc.name.slice(dot)}`
                : `${doc.name} (${i})`;
              i++;
            }
            zip.file(entryName, data);
            added++;
          }
        } catch (err) {
          console.error('Zip fetch failed', doc.file_path, err);
          failures.push(doc.name);
        } finally {
          completed++;
          setDownloadProgress(`Fetching ${completed} / ${documents.length}…`);
        }
      }
    };

    try {
      await Promise.all(Array.from({ length: CONCURRENCY }, worker));

      if (added === 0) {
        toast.error('No files could be downloaded');
        return;
      }

      setDownloadProgress('Creating zip…');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const projectName = projects?.find(p => p.id === selectedProjectId)?.name || 'documents';
      triggerBlobDownload(zipBlob, `${projectName}-documents.zip`);

      if (failures.length) {
        toast.warning(`Zipped ${added} of ${documents.length}. Failed: ${failures.slice(0, 3).join(', ')}${failures.length > 3 ? '…' : ''}`);
      } else {
        toast.success(`Zipped ${added} files`);
      }
    } catch (err: any) {
      console.error('Download all failed', err);
      toast.error(`Download all failed: ${err.message}`);
    } finally {
      setDownloadingAll(false);
      setDownloadProgress('');
    }
  };

  const formatCategory = (doc: any) => {
    const raw = doc.category || doc.account_type || doc.document_type;
    if (!raw) return '—';
    return raw.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusVariant = (status: string | null): 'default' | 'secondary' | 'outline' | 'destructive' => {
    switch (status) {
      case 'completed': return 'default';
      case 'processing': return 'secondary';
      case 'healing': return 'secondary';
      case 'reprocessing': return 'secondary';
      case 'queued_for_healing': return 'outline';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Documents</h1>

      <div className="flex items-center gap-4">
        <div className="w-96">
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a project…" />
            </SelectTrigger>
            <SelectContent>
              {projectsLoading ? (
                <div className="flex justify-center p-2">
                  <Spinner className="h-4 w-4" />
                </div>
              ) : (
                projects?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}{p.client_name ? ` — ${p.client_name}` : ''}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {documents && documents.length > 0 && (
          <Button
            variant="outline"
            onClick={handleDownloadAll}
            disabled={downloadingAll}
          >
            <FileDown className="h-4 w-4 mr-2" />
            {downloadingAll ? downloadProgress || 'Preparing…' : `Download All (${documents.length})`}
          </Button>
        )}
      </div>

      {!selectedProjectId && (
        <p className="text-muted-foreground">Select a project to view its documents.</p>
      )}

      {selectedProjectId && docsLoading && (
        <div className="flex items-center justify-center h-32">
          <Spinner className="h-8 w-8" />
        </div>
      )}

      {selectedProjectId && !docsLoading && documents?.length === 0 && (
        <p className="text-muted-foreground">No documents found for this project.</p>
      )}

      {documents && documents.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium max-w-[250px] truncate">
                    {doc.name}
                  </TableCell>
                  <TableCell>{formatCategory(doc)}</TableCell>
                  <TableCell>
                    {doc.period_start && doc.period_end
                      ? `${doc.period_start} → ${doc.period_end}`
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(doc.processing_status)}>
                      {doc.processing_status || 'pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                  <TableCell>
                    {doc.created_at
                      ? format(new Date(doc.created_at), 'MMM d, yyyy')
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={downloading === doc.file_path}
                      onClick={() => handleDownload(doc.file_path, doc.name)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
