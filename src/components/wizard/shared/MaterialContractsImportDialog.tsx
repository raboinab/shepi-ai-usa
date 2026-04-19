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
import { Loader2, CheckCircle2, AlertTriangle, AlertCircle, FileText, Download, Scale, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ContractItem {
  id?: number;
  contractType: string;
  counterparty: string;
  description: string;
  effectiveDate?: string;
  expirationDate?: string;
  contractValue?: number;
  annualValue?: number;
  renewalTerms?: string;
  terminationTerms?: string;
  changeOfControl?: string;
  keyObligations?: string[];
  concerns?: string[];
}

interface ContractSummary {
  totalContracts: number;
  byType: Record<string, number>;
  upcomingExpirations: number;
  hasChangeOfControlRisk: boolean;
}

interface ContractExtractionData {
  success: boolean;
  confidence: 'high' | 'medium' | 'low';
  contracts: ContractItem[];
  summary: ContractSummary;
  warnings: string[];
  documentName: string;
  extractedAt: string;
}

interface ProcessedDataRecord {
  id: string;
  source_document_id: string | null;
  data: ContractExtractionData;
  created_at: string;
  validation_status: string;
}

interface MaterialContractsImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onImport: (contracts: ContractItem[]) => void;
}

const confidenceConfig = {
  high: { 
    icon: CheckCircle2, 
    color: 'text-green-600', 
    bgColor: 'bg-green-100', 
    label: 'High Confidence',
    description: 'Contract terms extracted with high accuracy'
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

export function MaterialContractsImportDialog({ 
  open, 
  onOpenChange, 
  projectId, 
  onImport 
}: MaterialContractsImportDialogProps) {
  const [loading, setLoading] = useState(true);
  const [contractData, setContractData] = useState<ProcessedDataRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      fetchContractData();
    }
  }, [open, projectId]);

  const fetchContractData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('processed_data')
        .select('*')
        .eq('project_id', projectId)
        .eq('data_type', 'material_contract')
        .order('created_at', { ascending: false })
        .limit(1000000);

      if (error) throw error;
      
      const typedData = (data || []).map(record => ({
        ...record,
        data: record.data as unknown as ContractExtractionData,
      })) as ProcessedDataRecord[];
      
      setContractData(typedData);
      
      // Select all by default
      setSelectedIds(new Set(typedData.map(d => d.id)));
    } catch (error) {
      console.error('Error fetching contract data:', error);
      toast.error('Failed to load contract data');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const handleImport = () => {
    const selectedRecords = contractData.filter(d => selectedIds.has(d.id));
    const allContracts: ContractItem[] = [];
    
    selectedRecords.forEach((record, recordIndex) => {
      record.data.contracts.forEach((contract, contractIndex) => {
        allContracts.push({
          ...contract,
          id: recordIndex * 100 + contractIndex + 1,
        });
      });
    });

    if (allContracts.length === 0) {
      toast.error('No contracts selected');
      return;
    }

    onImport(allContracts);
    onOpenChange(false);
    toast.success(`Imported ${allContracts.length} contract(s)`);
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  const totalSelected = contractData
    .filter(d => selectedIds.has(d.id))
    .reduce((sum, d) => sum + (d.data.contracts?.length || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Import Material Contracts
          </DialogTitle>
          <DialogDescription>
            Select extracted contracts from uploaded documents. You can select multiple documents.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : contractData.length === 0 ? (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                No contract documents have been processed yet. Upload material contracts in the Documents section first.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Select Documents</label>
                <span className="text-xs text-muted-foreground">
                  {selectedIds.size} selected · {totalSelected} contracts
                </span>
              </div>
              
              <div className="grid gap-2">
                {contractData.map((record) => {
                  const conf = confidenceConfig[record.data.confidence || 'low'];
                  const ConfIcon = conf.icon;
                  const isSelected = selectedIds.has(record.id);
                  const hasCoC = record.data.summary?.hasChangeOfControlRisk;
                  
                  return (
                    <Card 
                      key={record.id}
                      className={`cursor-pointer transition-colors ${isSelected ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`}
                      onClick={() => toggleSelection(record.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Scale className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="font-medium text-sm truncate">
                                {record.data.documentName || 'Contract Document'}
                              </span>
                              {hasCoC && (
                                <Badge variant="destructive" className="text-xs gap-1">
                                  <ShieldAlert className="h-3 w-3" />
                                  CoC Risk
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge variant="outline" className={`${conf.bgColor} ${conf.color} border-0 text-xs`}>
                                <ConfIcon className="h-3 w-3 mr-1" />
                                {conf.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {record.data.contracts?.length || 0} contract(s)
                              </span>
                              {record.data.contracts?.[0]?.counterparty && (
                                <span className="text-xs text-muted-foreground">
                                  · {record.data.contracts[0].counterparty}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-xs text-muted-foreground text-right">
                              {new Date(record.created_at).toLocaleDateString()}
                            </div>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelection(record.id)}
                              className="h-4 w-4 rounded border-input"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>

                        {/* Contract Preview */}
                        {isSelected && record.data.contracts && record.data.contracts.length > 0 && (
                          <div className="mt-3 pt-3 border-t space-y-2">
                            {record.data.contracts.slice(0, 2).map((contract, i) => (
                              <div key={i} className="text-xs p-2 bg-muted/50 rounded">
                                <div className="flex justify-between">
                                  <span className="font-medium">{contract.counterparty}</span>
                                  <Badge variant="secondary" className="text-xs">{contract.contractType}</Badge>
                                </div>
                                <p className="text-muted-foreground mt-1 line-clamp-2">{contract.description}</p>
                                {contract.changeOfControl && contract.changeOfControl.toLowerCase() !== 'none' && (
                                  <div className="mt-1 p-1.5 bg-destructive/10 rounded text-destructive text-xs">
                                    <strong>CoC:</strong> {contract.changeOfControl}
                                  </div>
                                )}
                              </div>
                            ))}
                            {record.data.contracts.length > 2 && (
                              <p className="text-xs text-primary">+{record.data.contracts.length - 2} more</p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={selectedIds.size === 0 || loading}
          >
            Import {totalSelected} Contract{totalSelected !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
