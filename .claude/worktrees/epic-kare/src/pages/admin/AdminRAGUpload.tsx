import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Database, BookOpen, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useRAGStats } from '@/hooks/useRAGStats';

interface Chunk {
  content: string;
  chapter?: string;
  section?: string;
  page_number?: number;
  chunk_index: number;
  token_count?: number;
  topic_tags?: string[];
}

interface UploadStats {
  total: number;
  successful: number;
  errors: number;
  source: string;
}

const SOURCE_OPTIONS = [
  { value: 'oglove', label: "O'Glove (Quality of Earnings)", title: 'Quality of Earnings by Thornton L. O\'Glove' },
  { value: 'edwards', label: 'Edwards', title: 'Financial Statement Analysis (Edwards)' },
  { value: 'openstax', label: 'OpenStax', title: 'OpenStax Accounting Textbook' },
  { value: 'custom', label: 'Custom Source', title: '' },
];

const LICENSE_OPTIONS = [
  { value: 'proprietary', label: 'Proprietary' },
  { value: 'cc-by', label: 'CC BY' },
  { value: 'cc-by-sa', label: 'CC BY-SA' },
  { value: 'cc-by-nc', label: 'CC BY-NC' },
  { value: 'public-domain', label: 'Public Domain' },
];

export default function AdminRAGUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStats, setUploadStats] = useState<UploadStats | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  // Source configuration
  const [selectedSource, setSelectedSource] = useState('oglove');
  const [customSourceTitle, setCustomSourceTitle] = useState('');
  const [selectedLicense, setSelectedLicense] = useState('proprietary');
  const [authorityWeight, setAuthorityWeight] = useState('1.0');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { totalChunks, sourceStats, isLoading: statsLoading, refetch: refetchStats } = useRAGStats();

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.json') && !selectedFile.name.endsWith('.jsonl')) {
      toast.error('Please select a .json or .jsonl file');
      return;
    }

    setFile(selectedFile);
    parseFile(selectedFile);
  }

  async function parseFile(file: File) {
    try {
      const text = await file.text();
      
      let parsedChunks: Chunk[];
      
      if (file.name.endsWith('.jsonl')) {
        // Parse JSONL (one JSON object per line)
        parsedChunks = text
          .split('\n')
          .filter(line => line.trim())
          .map(line => JSON.parse(line));
      } else {
        // Parse JSON (expecting { chunks: [...] } or direct array)
        const parsed = JSON.parse(text);
        parsedChunks = Array.isArray(parsed) ? parsed : parsed.chunks;
      }

      if (!Array.isArray(parsedChunks) || parsedChunks.length === 0) {
        throw new Error('No valid chunks found in file');
      }

      // Validate chunk structure
      const isValid = parsedChunks.every(chunk => 
        typeof chunk.content === 'string' &&
        typeof chunk.chunk_index === 'number'
      );

      if (!isValid) {
        throw new Error('Invalid chunk structure. Each chunk needs at least "content" and "chunk_index"');
      }

      setChunks(parsedChunks);
      toast.success(`Loaded ${parsedChunks.length} chunks`);
    } catch (error) {
      console.error('Parse error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to parse file');
      setChunks([]);
    }
  }

  function getSourceTitle(): string {
    if (selectedSource === 'custom') {
      return customSourceTitle || 'Custom Source';
    }
    return SOURCE_OPTIONS.find(s => s.value === selectedSource)?.title || '';
  }

  async function uploadChunks() {
    if (chunks.length === 0) return;

    setIsUploading(true);
    setProgress(0);
    setUploadStats(null);

    const batchSize = 20;
    const totalBatches = Math.ceil(chunks.length / batchSize);
    let totalSuccessful = 0;
    let totalErrors = 0;

    try {
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        const currentBatch = Math.floor(i / batchSize) + 1;

        const { data, error } = await supabase.functions.invoke('embed-rag-chunks', {
          body: { 
            chunks: batch,
            source: selectedSource,
            source_title: getSourceTitle(),
            source_license: selectedLicense,
            authority_weight: parseFloat(authorityWeight) || 1.0,
          }
        });

        if (error) {
          console.error(`Batch ${currentBatch} error:`, error);
          totalErrors += batch.length;
        } else if (data) {
          totalSuccessful += data.successful || 0;
          totalErrors += data.errors || 0;
        }

        setProgress(Math.round((currentBatch / totalBatches) * 100));

        // Small delay between batches to respect rate limits
        if (i + batchSize < chunks.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      setUploadStats({
        total: chunks.length,
        successful: totalSuccessful,
        errors: totalErrors,
        source: selectedSource,
      });

      if (totalErrors === 0) {
        toast.success(`Successfully embedded ${totalSuccessful} chunks for ${selectedSource}!`);
      } else {
        toast.warning(`Completed with ${totalErrors} errors`);
      }

      // Refresh stats
      refetchStats();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  }

  async function clearSourceChunks(source: string) {
    if (!confirm(`Are you sure you want to delete all chunks for "${source}"? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(source);

    try {
      const { error } = await supabase
        .from('rag_chunks')
        .delete()
        .eq('source', source);

      if (error) throw error;

      toast.success(`All ${source} chunks deleted`);
      refetchStats();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete chunks');
    } finally {
      setIsDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">RAG Knowledge Base</h1>
        <p className="text-muted-foreground">Multi-source embeddings for the AI analyst</p>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Knowledge Base Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading stats...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Total chunks:</span>
                <Badge variant={totalChunks > 0 ? "default" : "secondary"}>
                  {totalChunks}
                </Badge>
              </div>
              
              {sourceStats.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Sources:</p>
                  <div className="grid gap-2">
                    {sourceStats.map((stat) => (
                      <div 
                        key={stat.source} 
                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium capitalize">{stat.source}</p>
                            {stat.source_title && (
                              <p className="text-xs text-muted-foreground">{stat.source_title}</p>
                            )}
                          </div>
                          <Badge variant="outline">{stat.count} chunks</Badge>
                          <Badge variant="secondary">
                            Authority: {stat.authority_weight}
                          </Badge>
                          {stat.source_license && (
                            <Badge variant="outline" className="text-xs">
                              {stat.source_license}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => clearSourceChunks(stat.source)}
                          disabled={isDeleting === stat.source}
                          className="text-destructive hover:text-destructive"
                        >
                          {isDeleting === stat.source ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No sources loaded yet</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload New Source
          </CardTitle>
          <CardDescription>
            Upload a JSON or JSONL file containing processed book chunks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Source Configuration */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSource === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="customTitle">Source Title</Label>
                <Input
                  id="customTitle"
                  value={customSourceTitle}
                  onChange={(e) => setCustomSourceTitle(e.target.value)}
                  placeholder="e.g., My Custom Book"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="license">License</Label>
              <Select value={selectedLicense} onValueChange={setSelectedLicense}>
                <SelectTrigger>
                  <SelectValue placeholder="Select license" />
                </SelectTrigger>
                <SelectContent>
                  {LICENSE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="authority">Authority Weight</Label>
              <Select value={authorityWeight} onValueChange={setAuthorityWeight}>
                <SelectTrigger>
                  <SelectValue placeholder="Select weight" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1.0">1.0 (Primary)</SelectItem>
                  <SelectItem value="0.8">0.8 (High)</SelectItem>
                  <SelectItem value="0.5">0.5 (Secondary)</SelectItem>
                  <SelectItem value="0.3">0.3 (Supplementary)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Higher = more influential in retrieval</p>
            </div>
          </div>

          {/* File Input */}
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.jsonl"
              onChange={handleFileSelect}
              className="hidden"
            />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="font-medium">{file.name}</span>
                <Badge>{chunks.length} chunks</Badge>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to select chunks.json or chunks.jsonl
                </p>
              </div>
            )}
          </div>

          {/* Chunks Preview */}
          {chunks.length > 0 && (
            <div className="text-sm space-y-2">
              <p className="font-medium">Preview:</p>
              <div className="bg-muted rounded-lg p-3 max-h-32 overflow-auto text-xs font-mono">
                {chunks.slice(0, 3).map((chunk, i) => (
                  <div key={i} className="mb-2">
                    <span className="text-primary">Chunk {chunk.chunk_index}:</span>{' '}
                    {chunk.chapter && <span className="text-muted-foreground">[{chunk.chapter}] </span>}
                    {chunk.content.slice(0, 100)}...
                  </div>
                ))}
                {chunks.length > 3 && (
                  <div className="text-muted-foreground">
                    ... and {chunks.length - 3} more chunks
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Embedding chunks for {selectedSource}...
                </span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Results */}
          {uploadStats && (
            <Alert variant={uploadStats.errors === 0 ? "default" : "destructive"}>
              {uploadStats.errors === 0 ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                Processed {uploadStats.total} chunks for {uploadStats.source}: {uploadStats.successful} successful, {uploadStats.errors} errors
              </AlertDescription>
            </Alert>
          )}

          {/* Upload Button */}
          <Button
            onClick={uploadChunks}
            disabled={chunks.length === 0 || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload & Embed {chunks.length > 0 ? `${chunks.length} Chunks to ${selectedSource}` : 'Chunks'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Expected File Format</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted rounded-lg p-3 text-xs overflow-auto">
{`// JSON format:
{
  "chunks": [
    {
      "content": "chunk text...",
      "chapter": "Chapter 1",
      "section": "Section 1.1",  // Optional
      "page_number": 1,
      "chunk_index": 0,
      "token_count": 600,
      "topic_tags": ["ebitda", "adjustments"]  // Optional
    }
  ]
}

// Or JSONL format (one per line):
{"content": "chunk 1...", "chunk_index": 0, "chapter": "Ch1", ...}
{"content": "chunk 2...", "chunk_index": 1, "chapter": "Ch1", ...}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
