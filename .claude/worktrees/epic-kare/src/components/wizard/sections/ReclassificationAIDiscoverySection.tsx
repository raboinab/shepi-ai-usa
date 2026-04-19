 import { useState } from 'react';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { 
   AlertTriangle, 
   Check, 
   X, 
   RefreshCw, 
   Sparkles,
   ArrowRight,
   Eye,
   FileText
 } from 'lucide-react';
 import { useFlaggedTransactions, FlaggedTransaction, FlagStatus } from '@/hooks/useFlaggedTransactions';
 import { Spinner } from '@/components/ui/spinner';
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 import { ScrollArea } from '@/components/ui/scroll-area';
 
 interface ReclassificationAIDiscoverySectionProps {
   projectId: string;
   onConvertToReclassification: (transaction: FlaggedTransaction) => void;
 }
 
 const RECLASS_FLAG_TYPE_LABELS: Record<string, string> = {
   reclass_depreciation_in_opex: 'Depreciation in OpEx',
   reclass_amortization_mixed: 'Amortization Mixed',
   reclass_interest_in_opex: 'Interest in OpEx',
   reclass_rent_vs_lease: 'Rent vs Lease',
   reclass_gain_loss_in_revenue: 'Gain/Loss in Revenue',
   reclass_cogs_opex_boundary: 'COGS/OpEx Boundary',
   reclass_payroll_owner_comp: 'Owner Compensation',
   reclass_bad_debt_in_opex: 'Bad Debt in OpEx'
 };
 
 const RECLASS_FLAG_TYPE_COLORS: Record<string, string> = {
   reclass_depreciation_in_opex: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
   reclass_amortization_mixed: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
   reclass_interest_in_opex: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
   reclass_rent_vs_lease: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
   reclass_gain_loss_in_revenue: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
   reclass_cogs_opex_boundary: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
   reclass_payroll_owner_comp: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
   reclass_bad_debt_in_opex: 'bg-red-500/10 text-red-500 border-red-500/20'
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
 
 function ReclassCard({ 
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
   const flagColor = RECLASS_FLAG_TYPE_COLORS[transaction.flag_type] || 'bg-muted text-muted-foreground';
   const aiAnalysis = transaction.ai_analysis as Record<string, unknown> | null;
   const suggestedFrom = aiAnalysis?.suggested_from_line_item as string | undefined;
   const suggestedTo = aiAnalysis?.suggested_to_line_item as string | undefined;
   
   return (
     <Card className="group hover:shadow-md transition-shadow">
       <CardContent className="p-4">
         <div className="flex items-start justify-between gap-4">
           <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2 mb-2 flex-wrap">
               <Badge variant="outline" className={flagColor}>
                 {RECLASS_FLAG_TYPE_LABELS[transaction.flag_type] || transaction.flag_type}
               </Badge>
               <ConfidenceBadge score={transaction.confidence_score} />
             </div>
             
             <h4 className="font-medium text-sm truncate mb-1">
               {transaction.account_name}
             </h4>
             
             {suggestedFrom && suggestedTo && (
               <div className="flex items-center gap-2 text-sm mb-2">
                 <Badge variant="secondary" className="text-xs">{suggestedFrom}</Badge>
                 <ArrowRight className="h-3 w-3 text-muted-foreground" />
                 <Badge variant="secondary" className="text-xs">{suggestedTo}</Badge>
               </div>
             )}
             
             <p className="text-xs text-muted-foreground line-clamp-2">
               {transaction.flag_reason}
             </p>
           </div>
           
           <div className="text-right shrink-0">
             <p className="font-semibold text-lg">
               {formatCurrency(transaction.amount)}
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
           <Button 
             size="sm" 
             className="flex-1"
             onClick={onAccept}
             disabled={isUpdating}
           >
             <Check className="h-4 w-4 mr-1" />
             Convert
           </Button>
         </div>
       </CardContent>
     </Card>
   );
 }
 
 function ReclassDetailsDialog({ 
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
   onConvert: () => void;
 }) {
   if (!transaction) return null;
   
   const aiAnalysis = transaction.ai_analysis as Record<string, unknown>;
   const sourceData = transaction.source_data as Record<string, unknown>;
   const suggestedFrom = aiAnalysis?.suggested_from_line_item as string | undefined;
   const suggestedTo = aiAnalysis?.suggested_to_line_item as string | undefined;
   
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-2xl">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <ArrowRight className="h-5 w-5 text-primary" />
             Reclassification Suggestion
           </DialogTitle>
           <DialogDescription>
             Review the AI analysis and convert this to a reclassification entry
           </DialogDescription>
         </DialogHeader>
         
         <ScrollArea className="max-h-[60vh]">
           <div className="space-y-6 pr-4">
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <p className="text-sm text-muted-foreground">Account</p>
                 <p className="font-medium">{transaction.account_name}</p>
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Amount</p>
                 <p className="font-semibold text-lg">{formatCurrency(transaction.amount)}</p>
               </div>
             </div>
             
             {suggestedFrom && suggestedTo && (
               <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                 <h4 className="font-medium mb-3 flex items-center gap-2">
                   <ArrowRight className="h-4 w-4 text-primary" />
                   Suggested Reclassification
                 </h4>
                 <div className="flex items-center gap-3">
                   <div className="flex-1">
                     <p className="text-xs text-muted-foreground mb-1">From</p>
                     <Badge variant="outline" className="text-sm">{suggestedFrom}</Badge>
                   </div>
                   <ArrowRight className="h-5 w-5 text-muted-foreground" />
                   <div className="flex-1">
                     <p className="text-xs text-muted-foreground mb-1">To</p>
                     <Badge variant="outline" className="text-sm">{suggestedTo}</Badge>
                   </div>
                 </div>
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
                   <Badge variant="outline" className={RECLASS_FLAG_TYPE_COLORS[transaction.flag_type]}>
                     {RECLASS_FLAG_TYPE_LABELS[transaction.flag_type] || transaction.flag_type}
                   </Badge>
                 </div>
                 <div>
                   <p className="text-muted-foreground">Confidence Score</p>
                   <ConfidenceBadge score={transaction.confidence_score} />
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
           <Button onClick={onConvert} className="flex-1">
             <ArrowRight className="h-4 w-4 mr-1" />
             Convert to Reclassification
           </Button>
         </div>
       </DialogContent>
     </Dialog>
   );
 }
 
 export function ReclassificationAIDiscoverySection({ 
   projectId,
   onConvertToReclassification 
 }: ReclassificationAIDiscoverySectionProps) {
   const [selectedTransaction, setSelectedTransaction] = useState<FlaggedTransaction | null>(null);
   const [updatingId, setUpdatingId] = useState<string | null>(null);
   
   const { 
     transactions, 
     isLoading, 
     error, 
     refetch,
     updateStatus,
     runAnalysis,
     isAnalyzing,
     stats 
   } = useFlaggedTransactions({ 
     projectId, 
     status: 'pending',
     isReclassification: true
   });
 
   const handleUpdateStatus = async (id: string, status: FlagStatus) => {
     setUpdatingId(id);
     await updateStatus(id, status);
     setUpdatingId(null);
     setSelectedTransaction(null);
   };
 
   const handleConvert = (transaction: FlaggedTransaction) => {
     onConvertToReclassification(transaction);
     handleUpdateStatus(transaction.id, 'converted');
   };
 
   if (error) {
     return (
       <Card>
         <CardContent className="p-8 text-center">
           <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
           <p className="text-destructive">{error}</p>
           <Button variant="outline" onClick={refetch} className="mt-4">
             <RefreshCw className="h-4 w-4 mr-1" />
             Retry
           </Button>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <div className="space-y-6">
       <Card>
         <CardHeader>
           <div className="flex items-center justify-between">
             <div>
               <CardTitle className="flex items-center gap-2">
                 <Sparkles className="h-5 w-5 text-primary" />
                 AI-Detected Reclassifications
               </CardTitle>
               <CardDescription>
                 Automatically identified accounts that may need reclassification between FS Line Items
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
               <Button 
                 size="sm"
                 onClick={runAnalysis}
                 disabled={isAnalyzing}
               >
                 {isAnalyzing ? (
                   <>
                     <Spinner className="h-4 w-4 mr-1" />
                     Analyzing...
                   </>
                 ) : (
                   <>
                     <Sparkles className="h-4 w-4 mr-1" />
                     Run Analysis
                   </>
                 )}
               </Button>
             </div>
           </div>
         </CardHeader>
         <CardContent>
           {isLoading ? (
             <div className="flex items-center justify-center p-8">
               <Spinner className="h-8 w-8" />
             </div>
           ) : transactions.length === 0 ? (
             <div className="text-center py-12 text-muted-foreground">
               <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
               <p className="font-medium">No reclassification suggestions found</p>
               <p className="text-sm mt-1">
                 Run AI Analysis to detect accounts that may need reclassification
               </p>
             </div>
           ) : (
             <div className="grid gap-4 md:grid-cols-2">
               {transactions.map((tx) => (
                 <ReclassCard
                   key={tx.id}
                   transaction={tx}
                   onAccept={() => handleConvert(tx)}
                   onDismiss={() => handleUpdateStatus(tx.id, 'dismissed')}
                   onViewDetails={() => setSelectedTransaction(tx)}
                   isUpdating={updatingId === tx.id}
                 />
               ))}
             </div>
           )}
         </CardContent>
       </Card>
 
       <ReclassDetailsDialog
         transaction={selectedTransaction}
         open={!!selectedTransaction}
         onOpenChange={(open) => !open && setSelectedTransaction(null)}
         onAccept={() => selectedTransaction && handleConvert(selectedTransaction)}
         onDismiss={() => selectedTransaction && handleUpdateStatus(selectedTransaction.id, 'dismissed')}
         onConvert={() => selectedTransaction && handleConvert(selectedTransaction)}
       />
     </div>
   );
 }