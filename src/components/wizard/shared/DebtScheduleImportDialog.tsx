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
import { Loader2, CheckCircle2, AlertTriangle, AlertCircle, FileText, Download, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DebtItem {
  lender: string;
  facilityType: string;
  originalAmount: number;
  currentBalance: number;
  interestRate: number;
  maturityDate: string;
  monthlyPayment?: number;
  collateral?: string;
  covenants?: string[];
}

interface DebtExtractionData {
  success: boolean;
  confidence: 'high' | 'medium' | 'low';
  debts: DebtItem[];
  asOfDate: string;
  totalOutstanding: number;
  warnings: string[];
  documentName: string;
  extractedAt: string;
}

interface ProcessedDataRecord {
  id: string;
  source_document_id: string | null;
  data: DebtExtractionData;
  created_at: string;
  validation_status: string;
}

interface DebtScheduleImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onImport: (data: Array<{
    id: number;
    lender: string;
    originalAmount: number;
    currentBalance: number;
    interestRate: number;
    maturityDate: string;
  }>) => void;
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

export function DebtScheduleImportDialog({ 
  open, 
  onOpenChange, 
  projectId, 
  onImport 
}: DebtScheduleImportDialogProps) {
  const [loading, setLoading] = useState(true);
  const [debtData, setDebtData] = useState<ProcessedDataRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchDebtData();
    }
  }, [open, projectId]);

  const fetchDebtData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('processed_data')
        .select('*')
        .eq('project_id', projectId)
        .eq('data_type', 'debt_schedule')
        .order('created_at', { ascending: false })
        .limit(1000000);

      if (error) throw error;
      
      const typedData = (data || []).map(record => ({
        ...record,
        data: record.data as unknown as DebtExtractionData,
      })) as ProcessedDataRecord[];
      
      setDebtData(typedData);
      
      if (typedData.length > 0) {
        setSelectedId(typedData[0].id);
      }
    } catch (error) {
      console.error('Error fetching debt data:', error);
      toast.error('Failed to load debt schedule data');
    } finally {
      setLoading(false);
    }
  };

  const selectedRecord = debtData.find(d => d.id === selectedId);
  const selectedData = selectedRecord?.data;

  const handleImport = () => {
    if (!selectedData?.debts) {
      toast.error('No data to import');
      return;
    }

    // Transform to match the SupplementarySection structure
    const transformed = selectedData.debts.map((debt, index) => ({
      id: index + 1,
      lender: `${debt.lender}${debt.facilityType ? ` - ${debt.facilityType}` : ''}`,
      originalAmount: debt.originalAmount || 0,
      currentBalance: debt.currentBalance || 0,
      interestRate: debt.interestRate || 0,
      maturityDate: debt.maturityDate || '',
    }));

    onImport(transformed);
    onOpenChange(false);
    toast.success(`Imported ${transformed.length} debt facilities`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Import Debt Schedule
          </DialogTitle>
          <DialogDescription>
            Select extracted debt data from uploaded documents to import into your analysis.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : debtData.length === 0 ? (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                No debt schedule documents have been processed yet. Upload a debt schedule in the Documents section first.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {/* Document Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Document</label>
                <div className="grid gap-2">
                  {debtData.map((record) => {
                    const conf = confidenceConfig[record.data.confidence || 'low'];
                    const ConfIcon = conf.icon;
                    const isSelected = selectedId === record.id;
                    
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
                                <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="font-medium text-sm truncate">
                                  {record.data.documentName || 'Debt Schedule'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className={`${conf.bgColor} ${conf.color} border-0 text-xs`}>
                                  <ConfIcon className="h-3 w-3 mr-1" />
                                  {conf.label}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {record.data.debts?.length || 0} facilities · {formatCurrency(record.data.totalOutstanding || 0)}
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
                    {selectedData.confidence !== 'high' && (
                      <Alert variant={selectedData.confidence === 'low' ? 'destructive' : 'default'}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          {confidenceConfig[selectedData.confidence].description}
                        </AlertDescription>
                      </Alert>
                    )}

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

                    {/* Debt Items Preview */}
                    <div className="space-y-2 pt-2">
                      {selectedData.debts?.map((debt, i) => (
                        <div key={i} className="text-sm p-2 bg-muted/50 rounded">
                          <div className="flex justify-between">
                            <span className="font-medium">{debt.lender}</span>
                            <span className="text-muted-foreground">{debt.facilityType}</span>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>Balance: {formatCurrency(debt.currentBalance)}</span>
                            <span>{debt.interestRate}% · {debt.maturityDate}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t text-sm">
                      <div className="flex justify-between font-medium">
                        <span>Total Outstanding</span>
                        <span>{formatCurrency(selectedData.totalOutstanding)}</span>
                      </div>
                      {selectedData.asOfDate && (
                        <div className="text-xs text-muted-foreground mt-1">
                          As of: {selectedData.asOfDate}
                        </div>
                      )}
                    </div>
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
