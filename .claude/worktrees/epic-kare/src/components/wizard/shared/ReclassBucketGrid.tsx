 import { useMemo } from "react";
 import { Input } from "@/components/ui/input";
 import { Badge } from "@/components/ui/badge";
 import { AlertCircle, CheckCircle } from "lucide-react";
 import { cn } from "@/lib/utils";
 
 interface ReclassBucketGridProps {
   bucket1Values: number[];
   bucket2Values: number[];
   onChange: (bucket1: number[], bucket2: number[]) => void;
   bucket1Labels?: string[];
   bucket2Labels?: string[];
   disabled?: boolean;
 }
 
 // Default labels for the 8 columns in each bucket
 const DEFAULT_BUCKET1_LABELS = ["Y1 Q1", "Y1 Q2", "Y1 Q3", "Y1 Q4", "Y2 Q1", "Y2 Q2", "Y2 Q3", "Y2 Q4"];
 const DEFAULT_BUCKET2_LABELS = ["Y3 Q1", "Y3 Q2", "Y3 Q3", "Y3 Q4", "Y4 Q1", "Y4 Q2", "Y4 Q3", "Y4 Q4"];
 
 export function ReclassBucketGrid({
   bucket1Values,
   bucket2Values,
   onChange,
   bucket1Labels = DEFAULT_BUCKET1_LABELS,
   bucket2Labels = DEFAULT_BUCKET2_LABELS,
   disabled = false,
 }: ReclassBucketGridProps) {
   // Ensure arrays are correct length
   const normalizedBucket1 = useMemo(() => {
     const arr = [...bucket1Values];
     while (arr.length < 8) arr.push(0);
     return arr.slice(0, 8);
   }, [bucket1Values]);
 
   const normalizedBucket2 = useMemo(() => {
     const arr = [...bucket2Values];
     while (arr.length < 8) arr.push(0);
     return arr.slice(0, 8);
   }, [bucket2Values]);
 
   // Calculate sums
   const bucket1Sum = useMemo(() => 
     normalizedBucket1.reduce((sum, val) => sum + (val || 0), 0), 
     [normalizedBucket1]
   );
   
   const bucket2Sum = useMemo(() => 
     normalizedBucket2.reduce((sum, val) => sum + (val || 0), 0), 
     [normalizedBucket2]
   );
 
   const isBucket1Balanced = Math.abs(bucket1Sum) < 0.01;
   const isBucket2Balanced = Math.abs(bucket2Sum) < 0.01;
   const isFullyBalanced = isBucket1Balanced && isBucket2Balanced;
 
   const handleBucket1Change = (index: number, value: string) => {
     const newBucket1 = [...normalizedBucket1];
     newBucket1[index] = parseFloat(value) || 0;
     onChange(newBucket1, normalizedBucket2);
   };
 
   const handleBucket2Change = (index: number, value: string) => {
     const newBucket2 = [...normalizedBucket2];
     newBucket2[index] = parseFloat(value) || 0;
     onChange(normalizedBucket1, newBucket2);
   };
 
   const formatNumber = (num: number) => {
     return new Intl.NumberFormat("en-US", {
       minimumFractionDigits: 0,
       maximumFractionDigits: 0,
       signDisplay: "exceptZero",
     }).format(num);
   };
 
   return (
     <div className="space-y-4">
       {/* Balance Status */}
       <div className="flex items-center gap-2">
         {isFullyBalanced ? (
           <Badge variant="default" className="gap-1 bg-green-600">
             <CheckCircle className="h-3 w-3" />
             Balanced
           </Badge>
         ) : (
           <Badge variant="destructive" className="gap-1">
             <AlertCircle className="h-3 w-3" />
             Unbalanced — must net to zero
           </Badge>
         )}
       </div>
 
       {/* Bucket 1 */}
       <div className="space-y-2">
         <div className="flex items-center justify-between">
           <span className="text-sm font-medium">Bucket 1 (Columns AT:BA)</span>
           <span className={cn(
             "text-sm font-mono",
             isBucket1Balanced ? "text-green-600" : "text-destructive"
           )}>
             Sum: {formatNumber(bucket1Sum)}
           </span>
         </div>
         <div className="grid grid-cols-8 gap-1">
           {normalizedBucket1.map((value, index) => (
             <div key={`b1-${index}`} className="flex flex-col items-center gap-1">
               <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                 {bucket1Labels[index]}
               </span>
               <Input
                 type="number"
                 value={value || ""}
                 onChange={(e) => handleBucket1Change(index, e.target.value)}
                 disabled={disabled}
                 className={cn(
                   "h-8 text-right text-xs px-1",
                   "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                 )}
                 placeholder="0"
               />
             </div>
           ))}
         </div>
       </div>
 
       {/* Bucket 2 */}
       <div className="space-y-2">
         <div className="flex items-center justify-between">
           <span className="text-sm font-medium">Bucket 2 (Columns BF:BM)</span>
           <span className={cn(
             "text-sm font-mono",
             isBucket2Balanced ? "text-green-600" : "text-destructive"
           )}>
             Sum: {formatNumber(bucket2Sum)}
           </span>
         </div>
         <div className="grid grid-cols-8 gap-1">
           {normalizedBucket2.map((value, index) => (
             <div key={`b2-${index}`} className="flex flex-col items-center gap-1">
               <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                 {bucket2Labels[index]}
               </span>
               <Input
                 type="number"
                 value={value || ""}
                 onChange={(e) => handleBucket2Change(index, e.target.value)}
                 disabled={disabled}
                 className={cn(
                   "h-8 text-right text-xs px-1",
                   "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                 )}
                 placeholder="0"
               />
             </div>
           ))}
         </div>
       </div>
 
       <p className="text-xs text-muted-foreground">
         Reclassifications move amounts between lines without affecting EBITDA. 
         Enter offsetting values (e.g., +1000 from, -1000 to) so each bucket sums to zero.
       </p>
     </div>
   );
 }