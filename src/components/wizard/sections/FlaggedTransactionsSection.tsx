import { useState } from 'react';
import { parseLocalDate } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  Check, 
  X, 
  RefreshCw, 
  Sparkles,
  TrendingUp,
  DollarSign,
  Eye,
  ArrowRight,
  Filter,
  FileText,
  CheckCircle,
  BookOpen
} from 'lucide-react';
import { useFlaggedTransactions, FlaggedTransaction, FlagStatus, AnalysisProgress } from '@/hooks/useFlaggedTransactions';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FlaggedTransactionsSectionProps {
  projectId: string;
  onConvertToAdjustment?: (transaction: FlaggedTransaction) => void;
}

const FLAG_TYPE_LABELS: Record<string, string> = {
  owner_compensation: 'Owner Compensation',
  related_party: 'Related Party',
  non_recurring: 'Non-recurring',
  discretionary: 'Discretionary',
  rent_adjustment: 'Rent',
  professional_fees: 'Professional Fees',
  insurance: 'Insurance',
  depreciation: 'Depreciation',
  interest: 'Interest',
  // GL-specific types
  journal_entry_review: 'Journal Entry',
  large_round_number: 'Round Number',
  memo_keyword_scan: 'Memo Keywords',
  unusual_timing: 'Unusual Timing',
  // Bank-correlated types
  personal_expense_atm: 'ATM/Cash',
  personal_expense_p2p: 'P2P Transfer',
  personal_expense_retail: 'Retail Purchase',
  personal_expense_dining: 'Dining',
  personal_expense_travel: 'Travel',
  // Bookkeeping gaps
  unrecorded_bank_item: 'Unrecorded Item'
};

const FLAG_TYPE_COLORS: Record<string, string> = {
  owner_compensation: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  related_party: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  non_recurring: 'bg-red-500/10 text-red-500 border-red-500/20',
  discretionary: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  rent_adjustment: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  professional_fees: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  insurance: 'bg-green-500/10 text-green-500 border-green-500/20',
  depreciation: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  interest: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  // GL-specific colors
  journal_entry_review: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  large_round_number: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  memo_keyword_scan: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  unusual_timing: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
  // Bank-correlated colors
  personal_expense_atm: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  personal_expense_p2p: 'bg-lime-500/10 text-lime-500 border-lime-500/20',
  personal_expense_retail: 'bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20',
  personal_expense_dining: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  personal_expense_travel: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
  // Bookkeeping gaps
  unrecorded_bank_item: 'bg-stone-500/10 text-stone-500 border-stone-500/20'
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  trial_balance: 'Trial Balance',
  general_ledger: 'General Ledger',
  income_statement: 'Income Statement',
  balance_sheet: 'Balance Sheet',
  bank_transactions: 'Bank Statement',
  credit_card_transactions: 'Credit Card'
};

const SOURCE_TYPE_COLORS: Record<string, string> = {
  trial_balance: 'bg-primary/10 text-primary border-primary/20',
  general_ledger: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  income_statement: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
  balance_sheet: 'bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20',
  bank_transactions: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
  credit_card_transactions: 'bg-orange-500/10 text-orange-500 border-orange-500/20'
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.abs(amount));
}

function ConfidenceBadge({ score }: { score: number }) {
  const percentage = Math.round(score * 100);
  let variant: 'default' | 'secondary' | 'outline' = 'outline';
  
  if (percentage >= 80) variant = 'default';
  else if (percentage >= 60) variant = 'secondary';
  
  return (
    <Badge variant={variant} className="text-xs">
      {percentage}% confidence
    </Badge>
  );
}

function TransactionCard({ 
  transaction, 
  onAccept, 
  onDismiss, 
  onViewDetails,
  isUpdating 
}: { 
  transaction: FlaggedTransaction;
  onAccept: () => void;
  onDismiss: () => void;
  onViewDetails: () => void;
  isUpdating: boolean;
}) {
  const flagColor = FLAG_TYPE_COLORS[transaction.flag_type] || 'bg-muted text-muted-foreground';
  
  const aiAnalysis = transaction.ai_analysis as Record<string, unknown> | null;
  const sourceType = aiAnalysis?.source_type as string | undefined;
  const transactionType = aiAnalysis?.transaction_type as string | undefined;
  const hasBankProof = aiAnalysis?.has_bank_proof === true;
  const isBookkeepingGap = (transaction as any).flag_category === 'bookkeeping_gap';
  
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline" className={flagColor}>
                {FLAG_TYPE_LABELS[transaction.flag_type] || transaction.flag_type}
              </Badge>
              <ConfidenceBadge score={transaction.confidence_score} />
              {hasBankProof && (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Bank Verified
                </Badge>
              )}
              {isBookkeepingGap && (
                <Badge variant="outline" className="bg-stone-500/10 text-stone-500 border-stone-500/20">
                  <BookOpen className="h-3 w-3 mr-1" />
                  Bookkeeping Gap
                </Badge>
              )}
              {sourceType && (
                <Badge variant="outline" className={SOURCE_TYPE_COLORS[sourceType] || 'bg-muted text-muted-foreground'}>
                  <FileText className="h-3 w-3 mr-1" />
                  {SOURCE_TYPE_LABELS[sourceType] || sourceType}
                </Badge>
              )}
            </div>
            
            <h4 className="font-medium text-sm truncate mb-1">
              {transaction.description}
              {transactionType && (
                <span className="text-muted-foreground font-normal ml-1">
                  ({transactionType})
                </span>
              )}
            </h4>
            
            <p className="text-xs text-muted-foreground mb-2">
              {transaction.account_name} • {parseLocalDate(transaction.transaction_date).toLocaleDateString()}
            </p>
            
            <p className="text-xs text-muted-foreground line-clamp-2">
              {transaction.flag_reason}
            </p>
          </div>
          
          <div className="text-right shrink-0">
            <p className="font-semibold text-lg">
              {formatCurrency(transaction.amount)}
            </p>
            <p className="text-xs text-muted-foreground">
              {transaction.suggested_adjustment_type}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-4 pt-3 border-t">
          <Button 
            size="sm" 
            variant="ghost" 
            className="flex-1"
            onClick={onViewDetails}
          >
            <Eye className="h-4 w-4 mr-1" />
            Details
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={onDismiss}
            disabled={isUpdating}
          >
            <X className="h-4 w-4 mr-1" />
            Dismiss
          </Button>
          {!isBookkeepingGap && (
            <Button 
              size="sm" 
              className="flex-1"
              onClick={onAccept}
              disabled={isUpdating}
            >
              <Check className="h-4 w-4 mr-1" />
              Accept
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TransactionDetailsDialog({ 
  transaction, 
  open, 
  onOpenChange,
  onAccept,
  onDismiss,
  onConvert
}: { 
  transaction: FlaggedTransaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
  onDismiss: () => void;
  onConvert?: () => void;
}) {
  if (!transaction) return null;
  
  const aiAnalysis = transaction.ai_analysis as Record<string, unknown>;
  const sourceData = transaction.source_data as Record<string, unknown>;
  const bankProofs = aiAnalysis?.bank_proofs as Array<Record<string, unknown>> | undefined;
  const bankEvidence = sourceData?.bank_evidence as Record<string, unknown> | undefined;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Flagged Transaction Details
          </DialogTitle>
          <DialogDescription>
            Review the AI analysis and decide whether to accept this as an adjustment
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 pr-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="font-medium">{transaction.description}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="font-semibold text-lg">{formatCurrency(transaction.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Account</p>
                <p className="font-medium">{transaction.account_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">
                  {parseLocalDate(transaction.transaction_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            {bankProofs && bankProofs.length > 0 && (
              <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Bank Statement Evidence
                </h4>
                {bankProofs.map((proof, i) => (
                  <div key={i} className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Source:</span> {proof.source_type === 'bank_transactions' ? 'Bank Statement' : 'Credit Card Statement'}</p>
                    <p><span className="text-muted-foreground">Date:</span> {proof.date as string}</p>
                    <p><span className="text-muted-foreground">Description:</span> {proof.description as string}</p>
                    <p><span className="text-muted-foreground">Amount:</span> {formatCurrency(proof.amount as number)}</p>
                    <p><span className="text-muted-foreground">Confidence:</span> <Badge variant="outline">{proof.match_confidence as string}</Badge></p>
                  </div>
                ))}
              </div>
            )}

            {bankEvidence && !bankProofs && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Bank Evidence</h4>
                <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
                  {JSON.stringify(bankEvidence, null, 2)}
                </pre>
              </div>
            )}

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Analysis
              </h4>
              <p className="text-sm text-muted-foreground mb-3">{transaction.flag_reason}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Flag Type</p>
                  <Badge variant="outline" className={FLAG_TYPE_COLORS[transaction.flag_type]}>
                    {FLAG_TYPE_LABELS[transaction.flag_type] || transaction.flag_type}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Confidence Score</p>
                  <ConfidenceBadge score={transaction.confidence_score} />
                </div>
                <div>
                  <p className="text-muted-foreground">Suggested Adjustment</p>
                  <p className="font-medium">{transaction.suggested_adjustment_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Matched Keywords</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(aiAnalysis?.matched_keywords as string[] || []).map((kw, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {sourceData?.original_transaction && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Source Data</h4>
                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                  {JSON.stringify(sourceData.original_transaction, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="flex items-center gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onDismiss} className="flex-1">
            <X className="h-4 w-4 mr-1" />
            Dismiss
          </Button>
          <Button onClick={onAccept} className="flex-1">
            <Check className="h-4 w-4 mr-1" />
            Accept
          </Button>
          {onConvert && (
            <Button variant="secondary" onClick={onConvert} className="flex-1">
              <ArrowRight className="h-4 w-4 mr-1" />
              Convert to Adjustment
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

type SourceFilter = 'all' | 'trial_balance' | 'general_ledger' | 'financial_statements';

export function FlaggedTransactionsSection({ 
  projectId,
  onConvertToAdjustment 
}: FlaggedTransactionsSectionProps) {
  const [activeTab, setActiveTab] = useState<FlagStatus | 'all'>('pending');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<FlaggedTransaction | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  const statusFilter = activeTab === 'all' ? undefined : activeTab;
  
   const { 
     transactions: allTransactions, 
     isLoading, 
     error, 
     refetch,
     updateStatus,
     runAnalysis,
     cancelAnalysis,
     isAnalyzing,
     analysisProgress,
     stats 
   } = useFlaggedTransactions({ 
     projectId, 
     status: statusFilter as FlagStatus | undefined,
     isReclassification: false
   });

  // Filter transactions by source type
  const transactions = allTransactions.filter(tx => {
    if (sourceFilter === 'all') return true;
    const aiAnalysis = tx.ai_analysis as Record<string, unknown> | null;
    const sourceType = aiAnalysis?.source_type as string | undefined;
    if (sourceFilter === 'financial_statements') {
      return sourceType === 'income_statement' || sourceType === 'balance_sheet';
    }
    return sourceType === sourceFilter;
  });

  const handleUpdateStatus = async (id: string, status: FlagStatus) => {
    setUpdatingId(id);
    await updateStatus(id, status);
    setUpdatingId(null);
    setSelectedTransaction(null);
  };

  const handleConvert = (transaction: FlaggedTransaction) => {
    if (onConvertToAdjustment) {
      onConvertToAdjustment(transaction);
      handleUpdateStatus(transaction.id, 'converted');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI-Detected Adjustments
              </CardTitle>
              <CardDescription>
                Automatically identified transactions that may require QoE adjustments
              </CardDescription>
            </div>
             <div className="flex items-center gap-2">
               <Button 
                 variant="outline" 
                 size="sm"
                 onClick={refetch}
                 disabled={isLoading}
               >
                 <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                 Refresh
               </Button>
               {isAnalyzing ? (
                 <Button 
                   size="sm"
                   variant="destructive"
                   onClick={cancelAnalysis}
                 >
                   <X className="h-4 w-4 mr-1" />
                   Cancel
                 </Button>
               ) : (
                 <Button 
                   size="sm"
                   onClick={runAnalysis}
                 >
                   <Sparkles className="h-4 w-4 mr-1" />
                   Run Analysis
                 </Button>
               )}
             </div>
          </div>
        </CardHeader>
         <CardContent>
           {/* Analysis Progress Bar */}
           {isAnalyzing && analysisProgress.isRunning && (
             <div className="mb-6 p-4 bg-muted/50 rounded-lg space-y-2">
               <div className="flex items-center justify-between text-sm">
                 <span className="text-muted-foreground flex items-center gap-2">
                   <Spinner className="h-4 w-4" />
                   Analyzing entries...
                 </span>
                 <span className="font-medium">
                   {analysisProgress.processedEntries.toLocaleString()} / {analysisProgress.totalEntries.toLocaleString()} entries
                 </span>
               </div>
               <Progress 
                 value={analysisProgress.totalEntries > 0 
                   ? (analysisProgress.processedEntries / analysisProgress.totalEntries) * 100 
                   : 0
                 } 
                 className="h-2"
               />
               <div className="flex items-center justify-between text-xs text-muted-foreground">
                 <span>Chunk {analysisProgress.currentChunk}</span>
                 <span>{analysisProgress.flaggedCount} adjustments found so far</span>
               </div>
             </div>
           )}

           {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-muted-foreground">Pending</span>
                </div>
                <p className="text-2xl font-bold mt-1">{stats.pending}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Accepted</span>
                </div>
                <p className="text-2xl font-bold mt-1">{stats.accepted}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Converted</span>
                </div>
                <p className="text-2xl font-bold mt-1">{stats.converted}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Total Value</span>
                </div>
                <p className="text-2xl font-bold mt-1">{formatCurrency(stats.totalAmount)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Source Filter */}
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Source:</span>
            <div className="flex gap-1">
              {([
                { value: 'all', label: 'All' },
                { value: 'trial_balance', label: 'Trial Balance' },
                { value: 'general_ledger', label: 'General Ledger' },
                { value: 'financial_statements', label: 'Financial Statements' }
              ] as const).map(({ value, label }) => (
                <Button
                  key={value}
                  size="sm"
                  variant={sourceFilter === value ? 'default' : 'outline'}
                  onClick={() => setSourceFilter(value)}
                  className="text-xs h-7"
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Status Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FlagStatus | 'all')}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending">
                Pending ({stats.pending})
              </TabsTrigger>
              <TabsTrigger value="accepted">
                Accepted ({stats.accepted})
              </TabsTrigger>
              <TabsTrigger value="dismissed">
                Dismissed ({stats.dismissed})
              </TabsTrigger>
              <TabsTrigger value="all">
                All ({stats.total})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner className="h-8 w-8" />
                </div>
              ) : error ? (
                <div className="text-center py-12 text-destructive">
                  <p>{error}</p>
                  <Button variant="outline" size="sm" onClick={refetch} className="mt-2">
                    Retry
                  </Button>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No flagged transactions</p>
                  <p className="text-sm">
                    {activeTab === 'pending' 
                      ? 'Run an analysis to detect potential adjustments'
                      : `No ${activeTab} transactions found`
                    }
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {transactions.map((tx) => (
                    <TransactionCard
                      key={tx.id}
                      transaction={tx}
                      onAccept={() => handleUpdateStatus(tx.id, 'accepted')}
                      onDismiss={() => handleUpdateStatus(tx.id, 'dismissed')}
                      onViewDetails={() => setSelectedTransaction(tx)}
                      isUpdating={updatingId === tx.id}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <TransactionDetailsDialog
        transaction={selectedTransaction}
        open={!!selectedTransaction}
        onOpenChange={(open) => !open && setSelectedTransaction(null)}
        onAccept={() => selectedTransaction && handleUpdateStatus(selectedTransaction.id, 'accepted')}
        onDismiss={() => selectedTransaction && handleUpdateStatus(selectedTransaction.id, 'dismissed')}
        onConvert={onConvertToAdjustment ? () => selectedTransaction && handleConvert(selectedTransaction) : undefined}
      />
    </div>
  );
}
