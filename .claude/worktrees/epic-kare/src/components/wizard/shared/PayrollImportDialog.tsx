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
import { Loader2, CheckCircle2, AlertTriangle, AlertCircle, FileText, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/trialBalanceUtils";
import { MultiPeriodAccount } from "./MultiPeriodFinancialTable";

interface PayrollExtractionData {
  success: boolean;
  confidence: 'high' | 'medium' | 'low';
  extractedData: {
    salaryWages: MultiPeriodAccount[];
    payrollTaxes: MultiPeriodAccount[];
    benefits: MultiPeriodAccount[];
    ownerCompensation: MultiPeriodAccount[];
  };
  warnings: string[];
  documentName: string;
  extractedAt: string;
}

interface ProcessedDataRecord {
  id: string;
  source_document_id: string | null;
  data: PayrollExtractionData;
  created_at: string;
  validation_status: string;
}

interface PayrollImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onImport: (data: {
    salaryWages: MultiPeriodAccount[];
    payrollTaxes: MultiPeriodAccount[];
    benefits: MultiPeriodAccount[];
    ownerCompensation: MultiPeriodAccount[];
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

export function PayrollImportDialog({ 
  open, 
  onOpenChange, 
  projectId, 
  onImport 
}: PayrollImportDialogProps) {
  const [loading, setLoading] = useState(true);
  const [payrollData, setPayrollData] = useState<ProcessedDataRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchPayrollData();
    }
  }, [open, projectId]);

  const fetchPayrollData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('processed_data')
        .select('*')
        .eq('project_id', projectId)
        .eq('data_type', 'payroll')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type assertion for the data
      const typedData = (data || []).map(record => ({
        ...record,
        data: record.data as unknown as PayrollExtractionData,
      })) as ProcessedDataRecord[];
      
      setPayrollData(typedData);
      
      if (typedData.length > 0) {
        setSelectedId(typedData[0].id);
      }
    } catch (error) {
      console.error('Error fetching payroll data:', error);
      toast.error('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  const selectedRecord = payrollData.find(d => d.id === selectedId);
  const selectedData = selectedRecord?.data;

  const handleImport = () => {
    if (!selectedData?.extractedData) {
      toast.error('No data to import');
      return;
    }

    onImport(selectedData.extractedData);
    onOpenChange(false);
    toast.success('Payroll data imported successfully');
  };

  const getTotalCount = (data: PayrollExtractionData | undefined) => {
    if (!data?.extractedData) return 0;
    return (
      (data.extractedData.salaryWages?.length || 0) +
      (data.extractedData.payrollTaxes?.length || 0) +
      (data.extractedData.benefits?.length || 0) +
      (data.extractedData.ownerCompensation?.length || 0)
    );
  };

  const calculateCategoryTotal = (accounts: MultiPeriodAccount[] | undefined) => {
    if (!accounts) return 0;
    return accounts.reduce((sum, acc) => {
      const values = Object.values(acc.monthlyValues || {});
      return sum + values.reduce((s, v) => s + (v || 0), 0);
    }, 0);
  };

  const renderCategoryPreview = (label: string, accounts: MultiPeriodAccount[] | undefined) => {
    if (!accounts || accounts.length === 0) return null;
    const total = calculateCategoryTotal(accounts);
    
    return (
      <div className="space-y-1">
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium">{label}</span>
          <span className="text-muted-foreground">{accounts.length} items · {formatCurrency(total)}</span>
        </div>
        <div className="pl-4 text-xs text-muted-foreground space-y-0.5">
          {accounts.slice(0, 3).map((acc, i) => (
            <div key={i} className="truncate">{acc.name}</div>
          ))}
          {accounts.length > 3 && (
            <div className="text-primary">+{accounts.length - 3} more</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Import Payroll Data
          </DialogTitle>
          <DialogDescription>
            Select extracted payroll data from uploaded documents to import into your analysis.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : payrollData.length === 0 ? (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                No payroll documents have been processed yet. Upload a payroll report in the Documents section first.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {/* Document Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Document</label>
                <div className="grid gap-2">
                  {payrollData.map((record) => {
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
                                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="font-medium text-sm truncate">
                                  {record.data.documentName || 'Payroll Document'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className={`${conf.bgColor} ${conf.color} border-0 text-xs`}>
                                  <ConfIcon className="h-3 w-3 mr-1" />
                                  {conf.label}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {getTotalCount(record.data)} items
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

                    {/* Category Breakdown */}
                    <div className="space-y-3 pt-2">
                      {renderCategoryPreview('Salary & Wages', selectedData.extractedData?.salaryWages)}
                      {renderCategoryPreview('Payroll Taxes', selectedData.extractedData?.payrollTaxes)}
                      {renderCategoryPreview('Benefits', selectedData.extractedData?.benefits)}
                      {renderCategoryPreview('Owner Compensation', selectedData.extractedData?.ownerCompensation)}
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
