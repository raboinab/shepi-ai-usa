import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Upload, Check, Loader2, Plus, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Document {
  id: string;
  name: string;
  file_type: string | null;
  category: string | null;
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
  onValidationComplete: (result: {
    score: number;
    status: 'validated' | 'supported' | 'partial' | 'insufficient' | 'contradictory';
    keyFindings: string[];
    redFlags: string[];
  }) => void;
}

export const AttachProofDialog = ({
  open,
  onOpenChange,
  projectId,
  adjustmentId,
  adjustment,
  onValidationComplete
}: AttachProofDialogProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && projectId) {
      fetchDocuments();
    }
  }, [open, projectId]);

  // Poll for document processing status updates - only when dialog is open and files are processing
  useEffect(() => {
    if (!open || extracting.length === 0) return;

    // Increased polling interval from 2s to 5s to reduce UI disruption
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
          
          if (completed.length > 0) {
            toast.success(`${completed.length} document(s) processed`);
          }
          if (failed.length > 0) {
            toast.error(`${failed.length} document(s) failed to process`);
          }
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
        .select('id, name, file_type, category, created_at, processing_status, parsed_summary')
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

  const extractDocumentText = async (documentId: string) => {
    try {
      console.log(`Starting text extraction for document: ${documentId}`);
      
      const response = await supabase.functions.invoke('extract-document-text', {
        body: { documentId }
      });

      if (response.error) {
        console.error('Extraction error:', response.error);
        throw new Error(response.error.message || 'Extraction failed');
      }

      console.log('Extraction response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to extract document text:', error);
      throw error;
    }
  };

  const handleUpload = async (files: FileList) => {
    if (files.length === 0) return;

    setUploading(true);
    const uploadedDocIds: string[] = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      for (const file of Array.from(files)) {
        const fileExt = file.name.split(".").pop();
        const filePath = `${user.id}/${projectId}/${Date.now()}_${file.name}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Create document record with "proof" category
        const { data: docData, error: insertError } = await supabase
          .from("documents")
          .insert({
            project_id: projectId,
            user_id: user.id,
            name: file.name,
            file_path: filePath,
            file_type: fileExt || null,
            file_size: file.size,
            category: "proof",
            processing_status: "pending",
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        
        if (docData) {
          uploadedDocIds.push(docData.id);
        }
      }

      toast.success(`${files.length} file(s) uploaded, extracting text...`);
      
      // Refresh documents list and auto-select newly uploaded docs
      await fetchDocuments();
      setSelectedDocs(prev => [...prev, ...uploadedDocIds]);
      
      // Start text extraction for each uploaded document
      setExtracting(prev => [...prev, ...uploadedDocIds]);
      
      for (const docId of uploadedDocIds) {
        extractDocumentText(docId).catch(err => {
          console.error(`Extraction failed for ${docId}:`, err);
        });
      }
      
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files);
      e.target.value = ''; // Reset input
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  };

  const toggleDocument = (docId: string) => {
    setSelectedDocs(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const handleValidate = async () => {
    if (selectedDocs.length === 0) {
      toast.error('Please select at least one document');
      return;
    }

    // Check if any selected docs are still processing
    const processingDocs = documents.filter(
      d => selectedDocs.includes(d.id) && d.processing_status === 'processing'
    );
    
    if (processingDocs.length > 0) {
      toast.error('Please wait for document processing to complete');
      return;
    }

    setValidating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to validate adjustments');
        return;
      }

      const response = await supabase.functions.invoke('validate-adjustment-proof', {
        body: {
          adjustmentId,
          adjustment,
          documentIds: selectedDocs,
          projectId
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Validation failed');
      }

      const result = response.data;
      
      if (result.error) {
        throw new Error(result.error);
      }

      onValidationComplete({
        score: result.score,
        status: result.status,
        keyFindings: result.keyFindings || [],
        redFlags: result.redFlags || []
      });

      toast.success(`Validation complete: ${result.status} (${result.score}/100)`);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Validation error:', error);
      toast.error(error.message || 'Failed to validate adjustment');
    } finally {
      setValidating(false);
    }
  };

  const getCategoryColor = (category: string | null) => {
    switch (category?.toLowerCase()) {
      case 'bank_statement': return 'bg-blue-500/10 text-blue-600';
      case 'invoice': return 'bg-green-500/10 text-green-600';
      case 'contract': return 'bg-purple-500/10 text-purple-600';
      case 'financial_statement': return 'bg-amber-500/10 text-amber-600';
      case 'proof': return 'bg-primary/10 text-primary';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getProcessingStatusBadge = (doc: Document) => {
    const isExtracting = extracting.includes(doc.id);
    
    if (isExtracting || doc.processing_status === 'processing') {
      return (
        <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 animate-pulse">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Processing
        </Badge>
      );
    }
    
    if (doc.processing_status === 'failed') {
      return (
        <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive">
          <AlertCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>
      );
    }
    
    if (doc.processing_status === 'completed' && doc.parsed_summary) {
      return (
        <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600">
          <Check className="w-3 h-3 mr-1" />
          Ready
        </Badge>
      );
    }
    
    if (doc.processing_status === 'pending' || !doc.parsed_summary) {
      return (
        <Badge variant="outline" className="text-xs bg-muted text-muted-foreground">
          Pending
        </Badge>
      );
    }
    
    return null;
  };

  const hasProcessingDocs = extracting.length > 0 || 
    documents.some(d => selectedDocs.includes(d.id) && d.processing_status === 'processing');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Attach Proof Documents</DialogTitle>
          <DialogDescription>
            Upload or select documents that support this adjustment
          </DialogDescription>
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

          {/* Upload Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
              isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.csv,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
              onChange={handleFileInputChange}
              className="hidden"
            />
            {uploading ? (
              <div className="flex items-center justify-center gap-2 py-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Uploading...</span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center gap-2 text-primary mb-1">
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">Upload Documents</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Drop files here or click to browse (OCR extraction included)
                </p>
              </>
            )}
          </div>

          {/* Separator when there are existing documents */}
          {documents.length > 0 && (
            <div className="flex items-center gap-2">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">or select existing</span>
              <Separator className="flex-1" />
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
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedDocs.includes(doc.id) 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => toggleDocument(doc.id)}
                  >
                    <Checkbox 
                      checked={selectedDocs.includes(doc.id)}
                      onCheckedChange={() => toggleDocument(doc.id)}
                    />
                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{doc.name}</div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {doc.category && (
                          <Badge variant="outline" className={`text-xs ${getCategoryColor(doc.category)}`}>
                            {doc.category.replace('_', ' ')}
                          </Badge>
                        )}
                        {getProcessingStatusBadge(doc)}
                        {doc.file_type && (
                          <span className="text-xs text-muted-foreground">{doc.file_type.toUpperCase()}</span>
                        )}
                      </div>
                    </div>
                    {selectedDocs.includes(doc.id) && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {selectedDocs.length} document{selectedDocs.length !== 1 ? 's' : ''} selected
              {hasProcessingDocs && (
                <span className="text-amber-600 ml-2">(processing...)</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleValidate} 
                disabled={selectedDocs.length === 0 || validating || uploading || hasProcessingDocs}
              >
                {validating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Validate
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
