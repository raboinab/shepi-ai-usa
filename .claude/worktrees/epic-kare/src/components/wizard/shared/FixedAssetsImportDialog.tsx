import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertTriangle, AlertCircle, FileText, Download, Building } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/trialBalanceUtils";

interface FixedAsset {
  id: string;
  description: string;
  category: string;
  dateAcquired: string | null;
  cost: number;
  accumDepreciation: number;
  usefulLife: string | null;
  method: string | null;
}

interface FixedAssetsExtractionData {
  success: boolean;
  confidence: 'high' | 'medium' | 'low';
  extractedData: {
    assets: FixedAsset[];
    asOfDate: string | null;
    totalCost: number;
    totalAccumDepreciation: number;
    totalNBV: number;
  };
  warnings: string[];
  documentName: string;
  extractedAt: string;
}

interface ProcessedDataRecord {
  id: string;
  source_document_id: string | null;
  data: FixedAssetsExtractionData;
  created_at: string;
  validation_status: string;
}

interface FixedAssetsImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onImport: (data: {
    assets: Array<{
      id: number;
      description: string;
      cost: number;
      accumDepr: number;
      usefulLife: string;
    }>;
  }) => void;
}

const confidenceConfig = {
  high: { 
    icon: CheckCircle2, 
    color: 'text-green-600', 
    bgColor: 'bg-green-100', 
    label: 'High Confidence',
    description: 'Data extracted with high accuracy'
  },
  medium: { 
    icon: AlertTriangle, 
    color: 'text-amber-600', 
    bgColor: 'bg-amber-100', 
    label: 'Medium Confidence',
    description: 'Review recommended before applying'
  },
  low: { 
    icon: AlertCircle, 
    color: 'text-red-600', 
    bgColor: 'bg-red-100', 
    label: 'Low Confidence',
    description: 'Manual review required'
  },
};

export function FixedAssetsImportDialog({ 
  open, 
  onOpenChange, 
  projectId, 
  onImport 
}: FixedAssetsImportDialogProps) {
  const [loading, setLoading] = useState(true);
  const [fixedAssetsData, setFixedAssetsData] = useState<ProcessedDataRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchFixedAssetsData();
    }
  }, [open, projectId]);

  const fetchFixedAssetsData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('processed_data')
        .select('*')
        .eq('project_id', projectId)
        .eq('data_type', 'fixed_assets')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type assertion for the data
      const typedData = (data || []).map(record => ({
        ...record,
        data: record.data as unknown as FixedAssetsExtractionData,
      })) as ProcessedDataRecord[];
      
      setFixedAssetsData(typedData);
      
      if (typedData.length > 0) {
        setSelectedId(typedData[0].id);
      }
    } catch (error) {
      console.error('Error fetching fixed assets data:', error);
      toast.error('Failed to load fixed assets data');
    } finally {
      setLoading(false);
    }
  };

  const selectedRecord = fixedAssetsData.find(d => d.id === selectedId);
  const selectedData = selectedRecord?.data;

  const handleImport = () => {
    if (!selectedData?.extractedData?.assets) {
      toast.error('No data to import');
      return;
    }

    // Convert AI-extracted assets to the format expected by FixedAssetsSection
    const convertedAssets = selectedData.extractedData.assets.map((asset, index) => ({
      id: index + 1,
      description: asset.description,
      cost: asset.cost,
      accumDepr: asset.accumDepreciation,
      usefulLife: asset.usefulLife || 'N/A',
    }));

    onImport({ assets: convertedAssets });
    onOpenChange(false);
    toast.success('Fixed assets data imported successfully');
  };

  const renderAssetPreview = (assets: FixedAsset[] | undefined) => {
    if (!assets || assets.length === 0) return null;
    
    // Group by category
    const byCategory = assets.reduce((acc, asset) => {
      const cat = asset.category || 'Other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(asset);
      return acc;
    }, {} as Record<string, FixedAsset[]>);

    return (
      <div className="space-y-2">
        {Object.entries(byCategory).map(([category, categoryAssets]) => {
          const categoryTotal = categoryAssets.reduce((sum, a) => sum + a.cost, 0);
          return (
            <div key={category} className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">{category}</span>
                <span className="text-muted-foreground">
                  {categoryAssets.length} items · {formatCurrency(categoryTotal)}
                </span>
              </div>
              <div className="pl-4 text-xs text-muted-foreground space-y-0.5">
                {categoryAssets.slice(0, 2).map((asset, i) => (
                  <div key={i} className="truncate">{asset.description}</div>
                ))}
                {categoryAssets.length > 2 && (
                  <div className="text-primary">+{categoryAssets.length - 2} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Import Fixed Assets Data
          </DialogTitle>
          <DialogDescription>
            Select extracted fixed asset data from uploaded depreciation schedules.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : fixedAssetsData.length === 0 ? (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                No depreciation schedules have been processed yet. Upload a depreciation schedule or fixed asset register in the Documents section first.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {/* Document Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Document</label>
                <div className="grid gap-2">
                  {fixedAssetsData.map((record) => {
                    const conf = confidenceConfig[record.data.confidence || 'low'];
                    const ConfIcon = conf.icon;
                    const isSelected = selectedId === record.id;
                    const assetCount = record.data.extractedData?.assets?.length || 0;
                    
                    return (
                      <Card 
                        key={record.id}
                        className={`cursor-pointer transition-colors ${isSelected ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`}
                        onClick={() => setSelectedId(record.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="font-medium text-sm truncate">
                                  {record.data.documentName || 'Depreciation Schedule'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className={`${conf.bgColor} ${conf.color} border-0 text-xs`}>
                                  <ConfIcon className="h-3 w-3 mr-1" />
                                  {conf.label}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {assetCount} assets
                                </span>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground text-right">
                              {new Date(record.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Selected Document Preview */}
              {selectedData && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Data Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Confidence Alert */}
                    {selectedData.confidence !== 'high' && (
                      <Alert variant={selectedData.confidence === 'low' ? 'destructive' : 'default'}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          {confidenceConfig[selectedData.confidence].description}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* As of Date */}
                    {selectedData.extractedData?.asOfDate && (
                      <div className="text-xs text-muted-foreground">
                        As of: {new Date(selectedData.extractedData.asOfDate).toLocaleDateString()}
                      </div>
                    )}

                    {/* Warnings */}
                    {selectedData.warnings && selectedData.warnings.length > 0 && (
                      <div className="text-xs text-amber-600 space-y-1">
                        {selectedData.warnings.map((w, i) => (
                          <div key={i} className="flex items-start gap-1">
                            <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span>{w}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Asset Breakdown by Category */}
                    <div className="space-y-3 pt-2">
                      {renderAssetPreview(selectedData.extractedData?.assets)}
                    </div>

                    {/* Totals */}
                    {selectedData.extractedData && (
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Total Cost</p>
                          <p className="font-semibold text-sm">{formatCurrency(selectedData.extractedData.totalCost)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Accum. Depr.</p>
                          <p className="font-semibold text-sm">{formatCurrency(selectedData.extractedData.totalAccumDepreciation)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Net Book Value</p>
                          <p className="font-semibold text-sm text-primary">{formatCurrency(selectedData.extractedData.totalNBV)}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!selectedData || loading}
          >
            Import Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
