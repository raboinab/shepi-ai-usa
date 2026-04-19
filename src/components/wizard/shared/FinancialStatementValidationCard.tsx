import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertTriangle, XCircle, Scale, Info, HelpCircle } from "lucide-react";

export interface ValidationLineItem {
  lineItem: string;
  uploadedValue: number | null;
  trialBalanceValue: number;
  variance: number | null;
  variancePercent: number | null;
  status: 'match' | 'minor' | 'significant' | 'extraction_failed';
}

export interface FinancialStatementValidationResult {
  documentType: 'balance_sheet' | 'income_statement';
  documentName: string;
  overallScore: number | null;
  lineItems: ValidationLineItem[];
  validatedAt: string;
  isBalanced?: boolean;
  tbIsBalanced?: boolean;
  extractionFailed?: boolean;
  summary?: string;
}

interface FinancialStatementValidationCardProps {
  result: FinancialStatementValidationResult;
  onDismiss?: () => void;
}

const formatCurrency = (value: number | null): string => {
  if (value === null || value === undefined) return 'N/A';
  if (value === 0) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value: number | null): string => {
  if (value === null || value === undefined) return '';
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
    case 'extraction_failed':
      return <HelpCircle className="w-4 h-4 text-muted-foreground" />;
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
    case 'extraction_failed':
      return <Badge variant="outline" className="text-muted-foreground">N/A</Badge>;
  }
};

const getOverallScoreColor = (score: number | null): string => {
  if (score === null) return 'text-muted-foreground';
  if (score >= 95) return 'text-green-600';
  if (score >= 80) return 'text-yellow-600';
  return 'text-destructive';
};

const getOverallScoreBg = (score: number | null): string => {
  if (score === null) return 'bg-muted';
  if (score >= 95) return 'bg-green-500/10';
  if (score >= 80) return 'bg-yellow-500/10';
  return 'bg-destructive/10';
};

function BalanceCheckAlert({ label, isBalanced }: { label: string; isBalanced: boolean }) {
  return (
    <Alert variant={isBalanced ? 'default' : 'destructive'}>
      {isBalanced ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4" />}
      <AlertDescription>
        {label}: {isBalanced ? 'Balanced (Assets = Liabilities + Equity)' : 'Not balanced. Please review the discrepancies.'}
      </AlertDescription>
    </Alert>
  );
}

export function FinancialStatementValidationCard({ result, onDismiss }: FinancialStatementValidationCardProps) {
  const documentTypeLabel = result.documentType === 'balance_sheet'
    ? 'Balance Sheet'
    : 'Income Statement (P&L)';

  // Extraction totally failed — show warning only
  if (result.extractionFailed) {
    return (
      <Card className="border-yellow-500/30 bg-yellow-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            {documentTypeLabel} Validation Failed
          </CardTitle>
          <CardDescription>
            Could not validate "{result.documentName}"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              We couldn't extract totals from this document. The file may not contain machine-readable financial data, or it may require manual review.
            </AlertDescription>
          </Alert>
          <p className="text-xs text-muted-foreground mt-3">
            Attempted at {new Date(result.validatedAt).toLocaleString()}.
          </p>
        </CardContent>
      </Card>
    );
  }

  const matchCount = result.lineItems.filter(l => l.status === 'match').length;
  const minorCount = result.lineItems.filter(l => l.status === 'minor').length;
  const significantCount = result.lineItems.filter(l => l.status === 'significant').length;
  const failedCount = result.lineItems.filter(l => l.status === 'extraction_failed').length;

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
              {result.overallScore !== null ? `${result.overallScore}%` : '—'}
            </span>
            <span className="text-xs text-muted-foreground">match</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="flex gap-4 text-sm flex-wrap">
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
          {failedCount > 0 && (
            <div className="flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-muted-foreground" />
              <span>{failedCount} not extracted</span>
            </div>
          )}
        </div>

        {/* Balance Sheet balance checks */}
        {result.documentType === 'balance_sheet' && (
          <div className="space-y-2">
            {result.isBalanced !== undefined && (
              <BalanceCheckAlert label="Uploaded Balance Sheet" isBalanced={result.isBalanced} />
            )}
            {result.tbIsBalanced !== undefined && (
              <BalanceCheckAlert label="Trial Balance-derived" isBalanced={result.tbIsBalanced} />
            )}
          </div>
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
                <TableRow key={idx} className={
                  item.status === 'significant' ? 'bg-destructive/5' :
                  item.status === 'extraction_failed' ? 'bg-muted/30' : ''
                }>
                  <TableCell className="font-medium">{item.lineItem}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(item.uploadedValue)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(item.trialBalanceValue)}
                  </TableCell>
                  <TableCell className={`text-right font-mono text-sm ${
                    item.status === 'match' ? '' :
                    item.status === 'minor' ? 'text-yellow-600' :
                    item.status === 'significant' ? 'text-destructive' : 'text-muted-foreground'
                  }`}>
                    {item.status === 'extraction_failed' ? (
                      <span className="text-muted-foreground">—</span>
                    ) : item.variance !== null && item.variance !== 0 ? (
                      <>
                        {formatCurrency(item.variance)}
                        <span className="text-xs ml-1 opacity-70">
                          ({formatPercent(item.variancePercent)})
                        </span>
                      </>
                    ) : null}
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
