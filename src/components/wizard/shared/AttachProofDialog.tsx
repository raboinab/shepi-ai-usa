import { useState, useEffect, useRef, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FileText, Upload, Check, Loader2, Plus, AlertCircle, Search, ChevronRight, Paperclip } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getUploadErrorMessage, logUploadError, logUploadTrace } from "@/lib/uploadErrorLogger";
import { toast } from "sonner";

interface Document {
  id: string;
  name: string;
  file_type: string | null;
  category: string | null;
  account_type: string | null;
  created_at: string | null;
  processing_status: string | null;
  parsed_summary: unknown;
}

interface AttachProofDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  adjustmentId: string;
  adjustment: {
    description: string;
    category: string;
    amount: number;
    status: string;
    notes: string;
  };
  /** Called after documents are attached to refresh proof data */
  onProofInvalidate?: () => void;
}

type GroupKey = 'bank_statement' | 'tax_return' | 'financial_report' | 'proof' | 'other';

const GROUP_LABELS: Record<GroupKey, string> = {
  bank_statement: 'Bank Statements',
  tax_return: 'Tax Returns',
  financial_report: 'Financial Reports',
  proof: 'Proof Documents',
  other: 'Other Documents',
};

const GROUP_ORDER: GroupKey[] = ['proof', 'financial_report', 'bank_statement', 'tax_return', 'other'];

function categorizeDoc(doc: Document): GroupKey {
  const cat = doc.category?.toLowerCase();
  const accountType = doc.account_type?.toLowerCase();
  if (cat === 'proof' || cat === 'supporting_documents' || accountType === 'supporting_documents') return 'proof';
  if (cat === 'bank_statement') return 'bank_statement';
  if (cat === 'financial_statement' || ['trial_balance', 'balance_sheet', 'income_statement', 'cash_flow', 'general_ledger'].includes(accountType || '')) return 'financial_report';
  if (accountType === 'tax_return') return 'tax_return';
  if (accountType === 'bank_statement') return 'bank_statement';

  const name = doc.name.toLowerCase();
  if (name.includes('tax return') || name.includes('1120') || name.includes('1040')) return 'tax_return';
  if (name.includes('general ledger') || name.includes('trial balance') || name.includes('balance sheet') || name.includes('profit and loss') || name.includes('cash flow') || name.includes('account list')) return 'financial_report';
  if (name.includes('bank') || name.includes('savings') || name.includes('checking') || /clearwater.*\d{4}/.test(name)) return 'bank_statement';
  if (name.includes('payroll') || name.includes('invoice') || name.includes('vendor') || name.includes('aging') || name.includes('sales') || name.includes('journal') || name.includes('cim')) return 'other';

  return 'other';
}

export const AttachProofDialog = ({
  open,
  onOpenChange,
  projectId,
  adjustmentId,
  adjustment,
  onProofInvalidate
}: AttachProofDialogProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [search, setSearch] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<GroupKey>>(new Set());
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && projectId) {
      fetchDocuments();
      setSearch("");
      setSelectedDocs([]);
      setPendingFiles([]);
      logUploadTrace({ context: 'attach_proof_dialog', stage: 'dialog_open', projectId, extra: { adjustmentId } });
    }
  }, [open, projectId, adjustmentId]);

  useEffect(() => {
    if (!open || extracting.length === 0) return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('documents')
        .select('id, processing_status')
        .in('id', extracting);
      if (data) {
        const stillProcessing = data.filter(d => d.processing_status === 'processing').map(d => d.id);
        const completed = data.filter(d => d.processing_status === 'completed').map(d => d.id);
        const failed = data.filter(d => d.processing_status === 'failed').map(d => d.id);
        if (completed.length > 0 || failed.length > 0) {
          setExtracting(stillProcessing);
          fetchDocuments();
          if (completed.length > 0) toast.success(`${completed.length} document(s) processed`);
          if (failed.length > 0) toast.error(`${failed.length} document(s) failed to process`);
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [open, extracting]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, name, file_type, category, account_type, created_at, processing_status, parsed_summary')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const processSupportingDocument = async (documentId: string, file: File, description?: string) => {
    const fileBase64: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const response = await supabase.functions.invoke('process-supporting-document', {
      body: {
        documentId,
        fileBase64,
        fileName: file.name,
        fileType: file.type || null,
        projectId,
        description,
      },
    });

    if (response.error) throw response.error;
    // Surface structured failures (function returns 4xx/5xx with JSON body)
    if (response.data && response.data.success === false) {
      const err: any = new Error(response.data.error || 'Extraction failed');
      err.stage = response.data.stage;
      err.details = response.data;
      throw err;
    }
    return response.data;
  };

  const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB (platform limit)

  const runDiagnosticProbe = async () => {
    try {
      const probeText = `Shepi proof-upload diagnostic\nProject: ${projectId}\nAdjustment: ${adjustmentId}\nTime: ${new Date().toISOString()}\nAmount: $100.00 (synthetic test)\n`;
      const file = new File([probeText], `proof-diagnostic-${Date.now()}.txt`, { type: 'text/plain' });
      const dt = new DataTransfer();
      dt.items.add(file);
      toast.info('Running upload diagnostic...');
      await handleUpload(dt.files);
    } catch (err: any) {
      toast.error(`Diagnostic failed: ${getUploadErrorMessage(err)}`);
    }
  };


  const handleUpload = async (files: FileList) => {
    await logUploadTrace({ context: 'attach_proof_dialog', stage: 'file_selected', projectId, extra: { count: files.length, names: Array.from(files).map(f => f.name) } });
    if (files.length === 0) return;
    setUploading(true);
    const uploadedDocIds: string[] = [];
    const failures: { name: string; reason: string }[] = [];
    let userId: string | null = null;
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        const msg = authError?.message || 'Not authenticated — please sign in again.';
        await logUploadError({ context: 'attach_proof_dialog', projectId, userId: null, fileName: '(auth)', fileSize: 0, fileType: null, stage: 'auth', error: authError || new Error(msg) });
        toast.error(msg);
        setUploading(false);
        return;
      }
      userId = user.id;

      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop() || null;
        await logUploadTrace({ context: 'attach_proof_dialog', stage: 'upload_started', projectId, userId, fileName: file.name, fileSize: file.size, fileType: fileExt });
        try {
          if (file.size > MAX_FILE_BYTES) {
            const reason = `File exceeds 20 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB)`;
            failures.push({ name: file.name, reason });
            await logUploadError({ context: 'attach_proof_dialog', projectId, userId, fileName: file.name, fileSize: file.size, fileType: fileExt, stage: 'preflight_size', error: new Error(reason) });
            continue;
          }

          const filePath = `${user.id}/${projectId}/${Date.now()}_${file.name}`;
          const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file);
          if (uploadError) {
            failures.push({ name: file.name, reason: uploadError.message });
            await logUploadError({ context: 'attach_proof_dialog', projectId, userId, fileName: file.name, fileSize: file.size, fileType: fileExt, stage: 'storage_upload', error: uploadError });
            continue;
          }
          await logUploadTrace({ context: 'attach_proof_dialog', stage: 'storage_uploaded', projectId, userId, fileName: file.name, fileSize: file.size, fileType: fileExt, extra: { filePath } });

          const { data: docData, error: insertError } = await supabase
            .from('documents')
            .insert({
              project_id: projectId,
              user_id: user.id,
              name: file.name,
              file_path: filePath,
              file_type: fileExt,
              file_size: file.size,
              category: 'supporting_documents',
              account_type: 'supporting_documents',
              description: adjustment.description,
              processing_status: 'processing'
            })
            .select('id')
            .single();
          if (insertError) {
            failures.push({ name: file.name, reason: insertError.message });
            await logUploadError({ context: 'attach_proof_dialog', projectId, userId, fileName: file.name, fileSize: file.size, fileType: fileExt, stage: 'db_insert', error: insertError });
            continue;
          }

          if (docData) {
            uploadedDocIds.push(docData.id);
            await logUploadTrace({ context: 'attach_proof_dialog', stage: 'document_inserted', projectId, userId, fileName: file.name, fileSize: file.size, fileType: fileExt, extra: { documentId: docData.id } });
            logUploadTrace({ context: 'attach_proof_dialog', stage: 'edge_invoked', projectId, userId, fileName: file.name, fileSize: file.size, fileType: fileExt, extra: { documentId: docData.id } });
            processSupportingDocument(docData.id, file, adjustment.description).catch(async (processingError: any) => {
              await logUploadError({
                context: 'attach_proof_dialog',
                projectId,
                userId,
                fileName: file.name,
                fileSize: file.size,
                fileType: fileExt,
                stage: processingError?.stage ? `edge_function:${processingError.stage}` : 'edge_function',
                error: processingError,
                extra: processingError?.details ?? undefined,
              });
              await supabase.from('documents').update({ processing_status: 'failed' }).eq('id', docData.id);
              const reason = processingError?.message || 'Extraction failed';
              toast.error(`${file.name}: ${reason}`, { duration: 12000 });
            });
          }
        } catch (perFileErr: any) {
          failures.push({ name: file.name, reason: getUploadErrorMessage(perFileErr) });
          await logUploadError({ context: 'attach_proof_dialog', projectId, userId, fileName: file.name, fileSize: file.size, fileType: fileExt, stage: 'unexpected', error: perFileErr });
        }
      }

      const succeeded = uploadedDocIds.length;
      const total = files.length;
      if (succeeded > 0) {
        toast.success(`${succeeded} of ${total} file(s) uploaded${failures.length ? `. ${failures.length} failed.` : ', extracting text...'}`);
        await fetchDocuments();
        setSelectedDocs(prev => [...prev, ...uploadedDocIds]);
        setExtracting(prev => [...prev, ...uploadedDocIds]);
      }
      if (failures.length > 0) {
        const first = failures[0];
        toast.error(`${failures.length} file(s) failed. ${first.name}: ${first.reason}`, { duration: 10000 });
      }
    } catch (error: any) {
      console.error('Upload error (outer):', error);
      await logUploadError({ context: 'attach_proof_dialog', projectId, userId, fileName: '(batch)', fileSize: 0, fileType: null, stage: 'batch', error });
      toast.error(getUploadErrorMessage(error, 'Failed to upload files'));
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    logUploadTrace({ context: 'attach_proof_dialog', stage: 'picker_change_received', projectId, extra: { fileCount: e.target.files?.length ?? 0 } });
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setPendingFiles(prev => [...prev, ...files]);
      logUploadTrace({ context: 'attach_proof_dialog', stage: 'pending_files_set', projectId, extra: { names: files.map(f => f.name) } });
      toast.success(`${files.length} file(s) selected — click "Upload" to proceed`);
    } else {
      logUploadTrace({ context: 'attach_proof_dialog', stage: 'picker_empty', projectId });
      toast.warning('No files were selected');
    }
    e.target.value = '';
  };

  const handleStartUpload = async () => {
    if (pendingFiles.length === 0) return;
    logUploadTrace({ context: 'attach_proof_dialog', stage: 'manual_upload_clicked', projectId, extra: { count: pendingFiles.length } });
    const dt = new DataTransfer();
    pendingFiles.forEach(f => dt.items.add(f));
    setPendingFiles([]);
    await handleUpload(dt.files);
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      setPendingFiles(prev => [...prev, ...files]);
      logUploadTrace({ context: 'attach_proof_dialog', stage: 'drop_received', projectId, extra: { names: files.map(f => f.name) } });
      toast.success(`${files.length} file(s) selected — click "Upload" to proceed`);
    }
  };

  const toggleDocument = (docId: string) => {
    setSelectedDocs(prev => prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]);
  };

  const handleAttach = async () => {
    if (selectedDocs.length === 0) { toast.error('Please select at least one document'); return; }
    const processingDocs = documents.filter(d => selectedDocs.includes(d.id) && d.processing_status === 'processing');
    if (processingDocs.length > 0) { toast.error('Please wait for document processing to complete'); return; }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('Please sign in'); return; }

      // Check which documents are already attached to avoid duplicates
      const { data: existing } = await supabase
        .from('adjustment_proofs')
        .select('document_id')
        .eq('adjustment_id', adjustmentId)
        .eq('verification_type', 'document_attachment');
      const existingDocIds = new Set((existing || []).map(e => e.document_id));
      const newDocs = selectedDocs.filter(id => !existingDocIds.has(id));

      if (newDocs.length === 0 && selectedDocs.length > 0) {
        toast.info('All selected documents are already attached');
        onOpenChange(false);
        return;
      }

      // Insert document links into adjustment_proofs (save only, no validation)
      for (const docId of newDocs) {
        await supabase.from('adjustment_proofs').insert({
          adjustment_id: adjustmentId,
          project_id: projectId,
          document_id: docId,
          user_id: user.id,
          verification_type: 'document_attachment',
          validation_status: 'pending',
        }).throwOnError();
      }

      onOpenChange(false);
      toast.success('Documents attached');
      onProofInvalidate?.();
    } catch (error: any) {
      console.error('Attach error:', error);
      toast.error(error.message || 'Failed to attach documents');
    }
  };

  // Filtered + grouped documents
  const filteredDocs = useMemo(() => {
    if (!search.trim()) return documents;
    const q = search.toLowerCase();
    return documents.filter(d => d.name.toLowerCase().includes(q));
  }, [documents, search]);

  const groupedDocs = useMemo(() => {
    const groups: Record<GroupKey, Document[]> = { proof: [], financial_report: [], bank_statement: [], tax_return: [], other: [] };
    for (const doc of filteredDocs) {
      groups[categorizeDoc(doc)].push(doc);
    }
    return groups;
  }, [filteredDocs]);

  const toggleGroup = (key: GroupKey) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const toggleGroupSelection = (key: GroupKey) => {
    const groupDocIds = groupedDocs[key].map(d => d.id);
    const allSelected = groupDocIds.every(id => selectedDocs.includes(id));
    if (allSelected) {
      setSelectedDocs(prev => prev.filter(id => !groupDocIds.includes(id)));
    } else {
      setSelectedDocs(prev => [...new Set([...prev, ...groupDocIds])]);
    }
  };

  const getCategoryColor = (category: string | null) => {
    switch (category?.toLowerCase()) {
      case 'bank_statement': return 'bg-blue-500/10 text-blue-600';
      case 'invoice': return 'bg-green-500/10 text-green-600';
      case 'contract': return 'bg-purple-500/10 text-purple-600';
      case 'financial_statement': return 'bg-amber-500/10 text-amber-600';
      case 'supporting_documents':
      case 'proof': return 'bg-primary/10 text-primary';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getProcessingStatusBadge = (doc: Document) => {
    const isExtracting = extracting.includes(doc.id);
    if (isExtracting || doc.processing_status === 'processing') {
      return (<Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 animate-pulse"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Processing</Badge>);
    }
    if (doc.processing_status === 'failed') {
      return (<Badge variant="outline" className="text-xs bg-destructive/10 text-destructive"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>);
    }
    if (doc.processing_status === 'completed' && doc.parsed_summary) {
      return (<Badge variant="outline" className="text-xs bg-green-500/10 text-green-600"><Check className="w-3 h-3 mr-1" />Ready</Badge>);
    }
    if (doc.processing_status === 'pending' || !doc.parsed_summary) {
      return (<Badge variant="outline" className="text-xs bg-muted text-muted-foreground">Pending</Badge>);
    }
    return null;
  };

  const hasProcessingDocs = extracting.length > 0 ||
    documents.some(d => selectedDocs.includes(d.id) && d.processing_status === 'processing');

  const renderDocItem = (doc: Document) => (
    <div
      key={doc.id}
      className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
        selectedDocs.includes(doc.id) ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
      }`}
      onClick={() => toggleDocument(doc.id)}
    >
      <Checkbox checked={selectedDocs.includes(doc.id)} />
      <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{doc.name}</div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {getProcessingStatusBadge(doc)}
          {doc.file_type && <span className="text-xs text-muted-foreground">{doc.file_type.toUpperCase()}</span>}
        </div>
      </div>
      {selectedDocs.includes(doc.id) && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Attach Proof Documents</DialogTitle>
          <DialogDescription>Upload or select documents that support this adjustment</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Adjustment Details */}
          <div className="rounded-lg border p-3 bg-muted/50">
            <div className="text-sm font-medium mb-1">"{adjustment.description}"</div>
            <div className="text-sm space-y-1">
              <div><span className="text-muted-foreground">Amount:</span> ${adjustment.amount?.toLocaleString()}</div>
              <div><span className="text-muted-foreground">Category:</span> {adjustment.category}</div>
            </div>
          </div>

          {/* Upload Zone — browse only, no auto-upload */}
          <div
            className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
              isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.csv,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="flex items-center justify-center gap-2 text-primary mb-1">
              <Plus className="w-4 h-4" />
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="text-sm font-medium text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  logUploadTrace({ context: 'attach_proof_dialog', stage: 'picker_open_requested', projectId });
                  fileInputRef.current?.click();
                }}
              >
                Browse Files
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">or drop files here (PDF, images, CSV, Excel, Word)</p>
          </div>

          {/* Pending files preview */}
          {pendingFiles.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Selected files ({pendingFiles.length})</div>
              <div className="space-y-1">
                {pendingFiles.map((f, i) => (
                  <div key={`${f.name}-${i}`} className="flex items-center gap-2 p-2 rounded border bg-muted/30">
                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm flex-1 truncate">{f.name}</span>
                    <span className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removePendingFile(i)}>
                      <AlertCircle className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button onClick={handleStartUpload} disabled={uploading} size="sm" className="w-full">
                {uploading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</>
                ) : (
                  <><Upload className="w-4 h-4 mr-2" />Upload {pendingFiles.length} file(s)</>
                )}
              </Button>
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={runDiagnosticProbe} disabled={uploading} className="text-xs h-7">
              Run upload diagnostic
            </Button>
          </div>

          {/* Separator when there are existing documents */}
          {documents.length > 0 && (
            <div className="flex items-center gap-2">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">or select existing</span>
              <Separator className="flex-1" />
            </div>
          )}

          {/* Search */}
          {documents.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          )}

          {/* Document List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No existing documents</p>
              <p className="text-xs">Upload files above to attach as proof</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] max-h-[60vh] pr-4">
              <div className="space-y-2">
                {GROUP_ORDER.map(groupKey => {
                  const docs = groupedDocs[groupKey];
                  if (docs.length === 0) return null;
                  const isCollapsed = collapsedGroups.has(groupKey);
                  const groupDocIds = docs.map(d => d.id);
                  const allSelected = groupDocIds.every(id => selectedDocs.includes(id));
                  const someSelected = groupDocIds.some(id => selectedDocs.includes(id));

                  return (
                    <Collapsible key={groupKey} open={!isCollapsed} onOpenChange={() => toggleGroup(groupKey)}>
                      <div className="flex items-center gap-2 py-1.5 px-1">
                        <Checkbox
                          checked={allSelected}
                          className={someSelected && !allSelected ? 'opacity-50' : ''}
                          onCheckedChange={(e) => {
                            e; // prevent propagation handled by stopPropagation below
                            toggleGroupSelection(groupKey);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <CollapsibleTrigger className="flex items-center gap-2 flex-1 hover:text-foreground text-muted-foreground transition-colors">
                          <ChevronRight className={`w-4 h-4 transition-transform ${!isCollapsed ? 'rotate-90' : ''}`} />
                          <span className="text-sm font-medium">{GROUP_LABELS[groupKey]}</span>
                          <Badge variant="secondary" className="text-xs ml-auto">{docs.length}</Badge>
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent>
                        <div className="space-y-1 pl-2">
                          {docs.map(renderDocItem)}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
                {filteredDocs.length === 0 && search.trim() && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No documents match "{search}"
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {selectedDocs.length} document{selectedDocs.length !== 1 ? 's' : ''} selected
              {hasProcessingDocs && <span className="text-amber-600 ml-2">(processing...)</span>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleAttach} disabled={selectedDocs.length === 0 || uploading || hasProcessingDocs}>
                <><Paperclip className="w-4 h-4 mr-2" />Attach</>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
