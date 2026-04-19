import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SummaryCard } from "../shared/SummaryCard";
 import { SpreadsheetReportViewer } from "../shared/SpreadsheetReportViewer";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileSpreadsheet,
  CheckCircle,
   ArrowRight,
   Eye,
} from "lucide-react";

interface QoEAnalysisSectionProps {
  data: {
    rawData?: string[][];
    syncedAt?: string;
  };
   // Summary data from ddAdjustments - passed in for display only
   adjustmentsSummary?: {
     MA: { count: number; total: number };
     DD: { count: number; total: number };
     PF: { count: number; total: number };
     netTotal: number;
   };
   onNavigateToAdjustments?: () => void;
   onNavigateToReclassifications?: () => void;
}

export const QoEAnalysisSection = ({ 
  data, 
   adjustmentsSummary,
   onNavigateToAdjustments,
   onNavigateToReclassifications,
}: QoEAnalysisSectionProps) => {
   // Use summary data passed from parent (computed from ddAdjustments)
   const summary = adjustmentsSummary || {
     MA: { count: 0, total: 0 },
     DD: { count: 0, total: 0 },
     PF: { count: 0, total: 0 },
     netTotal: 0,
   };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      signDisplay: "exceptZero",
    }).format(num);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold">QoE Analysis</h2>
        <p className="text-muted-foreground">
           EBITDA bridge and adjustment summary
        </p>
      </div>

      <Alert>
         <Eye className="h-4 w-4" />
        <AlertDescription>
           This is a read-only report showing the EBITDA bridge calculated from your adjustments.
           To add or modify adjustments, use the DD Adjustments or Reclassifications sections.
        </AlertDescription>
      </Alert>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="MA Adjustments"
           value={summary.MA.count}
          icon={DollarSign}
           subtitle={formatCurrency(summary.MA.total)}
           isCurrency={false}
        />
        <SummaryCard
          title="DD Adjustments"
           value={summary.DD.count}
          icon={TrendingUp}
           subtitle={formatCurrency(summary.DD.total)}
           isCurrency={false}
        />
        <SummaryCard
          title="PF Adjustments"
           value={summary.PF.count}
          icon={TrendingDown}
           subtitle={formatCurrency(summary.PF.total)}
           isCurrency={false}
        />
        <SummaryCard
          title="Net Adjustment"
           value={formatCurrency(summary.netTotal)}
          icon={CheckCircle}
           subtitle={`${summary.MA.count + summary.DD.count + summary.PF.count} total adjustments`}
        />
      </div>
 
       {/* EBITDA Bridge from spreadsheet */}
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <FileSpreadsheet className="h-5 w-5" />
             EBITDA Bridge
           </CardTitle>
           <CardDescription>
             Calculated from spreadsheet formulas
             {data.syncedAt && (
               <span className="ml-2 text-xs">
                 Last synced: {new Date(data.syncedAt).toLocaleString()}
               </span>
             )}
           </CardDescription>
         </CardHeader>
         <CardContent>
           {data.rawData && data.rawData.length > 0 ? (
             <SpreadsheetReportViewer rawData={data.rawData} />
           ) : (
             <div className="py-12 text-center text-muted-foreground">
               <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
               <p>No EBITDA bridge data available yet</p>
               <p className="text-sm mt-1">
                 Add adjustments and sync to see the calculated bridge
               </p>
             </div>
           )}
         </CardContent>
       </Card>
 
       {/* Navigation CTAs */}
       <Card>
         <CardHeader>
           <CardTitle>Edit Adjustments</CardTitle>
           <CardDescription>
             Make changes to adjustments in the input sections
           </CardDescription>
         </CardHeader>
         <CardContent className="flex flex-wrap gap-3">
           <Button 
             variant="outline" 
             className="gap-2"
             onClick={onNavigateToAdjustments}
           >
             DD Adjustments
             <ArrowRight className="h-4 w-4" />
           </Button>
           <Button 
             variant="outline" 
             className="gap-2"
             onClick={onNavigateToReclassifications}
           >
             Reclassifications
             <ArrowRight className="h-4 w-4" />
           </Button>
         </CardContent>
       </Card>
    </div>
  );
};
