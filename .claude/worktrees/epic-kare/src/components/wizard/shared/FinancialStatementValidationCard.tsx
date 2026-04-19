import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertTriangle, XCircle, Scale, Info } from "lucide-react";

export interface ValidationLineItem {
  lineItem: string;
  uploadedValue: number;
  trialBalanceValue: number;
  variance: number;
  variancePercent: number;
  status: 'match' | 'minor' | 'significant';
}

export interface FinancialStatementValidationResult {
  documentType: 'balance_sheet' | 'income_statement';
  documentName: string;
  overallScore: number;
  lineItems: ValidationLineItem[];
  validatedAt: string;
  isBalanced?: boolean;
  summary?: string;
}

interface FinancialStatementValidationCardProps {
  result: FinancialStatementValidationResult;
  onDismiss?: () => void;
}

const formatCurrency = (value: number): string => {
  if (value === 0) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value: number): string => {
  if (value === 0) return '0%';
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
};

const getStatusIcon = (status: ValidationLineItem['status']) => {
  switch (status) {
    case 'match':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case 'minor':
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    case 'significant':
      return <XCircle className="w-4 h-4 text-destructive" />;
  }
};

const getStatusBadge = (status: ValidationLineItem['status']) => {
  switch (status) {
    case 'match':
      return <Badge variant="default" className="bg-green-500/10 text-green-700 border-green-500/20">Match</Badge>;
    case 'minor':
      return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">Minor Variance</Badge>;
    case 'significant':
      return <Badge variant="destructive">Significant Variance</Badge>;
  }
};

const getOverallScoreColor = (score: number): string => {
  if (score >= 95) return 'text-green-600';
  if (score >= 80) return 'text-yellow-600';
  return 'text-destructive';
};

const getOverallScoreBg = (score: number): string => {
  if (score >= 95) return 'bg-green-500/10';
  if (score >= 80) return 'bg-yellow-500/10';
  return 'bg-destructive/10';
};

export function FinancialStatementValidationCard({ result, onDismiss }: FinancialStatementValidationCardProps) {
  const matchCount = result.lineItems.filter(l => l.status === 'match').length;
  const minorCount = result.lineItems.filter(l => l.status === 'minor').length;
  const significantCount = result.lineItems.filter(l => l.status === 'significant').length;

  const documentTypeLabel = result.documentType === 'balance_sheet' 
    ? 'Balance Sheet' 
    : 'Income Statement (P&L)';

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Scale className="w-5 h-5 text-primary" />
              {documentTypeLabel} Validation Results
            </CardTitle>
            <CardDescription>
              Comparing "{result.documentName}" against Trial Balance-derived values
            </CardDescription>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${getOverallScoreBg(result.overallScore)}`}>
            <span className={`text-lg font-bold ${getOverallScoreColor(result.overallScore)}`}>
              {result.overallScore}%
            </span>
            <span className="text-xs text-muted-foreground">match</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>{matchCount} matches</span>
          </div>
          {minorCount > 0 && (
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <span>{minorCount} minor</span>
            </div>
          )}
          {significantCount > 0 && (
            <div className="flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-destructive" />
              <span>{significantCount} significant</span>
            </div>
          )}
        </div>

        {/* Balance Sheet balance check */}
        {result.documentType === 'balance_sheet' && result.isBalanced !== undefined && (
          <Alert variant={result.isBalanced ? 'default' : 'destructive'}>
            {result.isBalanced ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {result.isBalanced 
                ? 'Balance Sheet is balanced (Assets = Liabilities + Equity)'
                : 'Balance Sheet is not balanced. Please review the discrepancies below.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Summary message */}
        {result.summary && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>{result.summary}</AlertDescription>
          </Alert>
        )}

        {/* Line item comparison table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Line Item</TableHead>
                <TableHead className="text-right">Uploaded</TableHead>
                <TableHead className="text-right">Trial Balance</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.lineItems.map((item, idx) => (
                <TableRow key={idx} className={item.status === 'significant' ? 'bg-destructive/5' : ''}>
                  <TableCell className="font-medium">{item.lineItem}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(item.uploadedValue)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(item.trialBalanceValue)}
                  </TableCell>
                  <TableCell className={`text-right font-mono text-sm ${
                    item.status === 'match' ? '' : 
                    item.status === 'minor' ? 'text-yellow-600' : 'text-destructive'
                  }`}>
                    {item.variance !== 0 && (
                      <>
                        {formatCurrency(item.variance)}
                        <span className="text-xs ml-1 opacity-70">
                          ({formatPercent(item.variancePercent)})
                        </span>
                      </>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusIcon(item.status)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <p className="text-xs text-muted-foreground">
          Validated at {new Date(result.validatedAt).toLocaleString()}. 
          Minor variance: within 1%. Significant: greater than 1%.
        </p>
      </CardContent>
    </Card>
  );
}
