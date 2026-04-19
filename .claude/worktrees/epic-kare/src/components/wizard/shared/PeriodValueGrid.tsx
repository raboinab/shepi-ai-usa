 import { useMemo, useCallback } from "react";
 import { Input } from "@/components/ui/input";
 import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
 import { cn } from "@/lib/utils";
 import type { Period } from "@/lib/periodUtils";
 
 interface PeriodValueGridProps {
   periods: Period[];
   values: Record<string, number>;
   onChange: (values: Record<string, number>) => void;
   disabled?: boolean;
   showTotal?: boolean;
 }
 
 export function PeriodValueGrid({
   periods,
   values,
   onChange,
   disabled = false,
   showTotal = true,
 }: PeriodValueGridProps) {
   // Format period label for display
   const formatPeriodLabel = useCallback((period: Period) => {
     if (period.label) return period.label;
     // Format "2024-01" as "Jan 24"
     const [year, month] = period.id.split("-");
     const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
     const monthIndex = parseInt(month) - 1;
     return `${monthNames[monthIndex] || month} ${year?.slice(2)}`;
   }, []);
 
   // Calculate total
   const total = useMemo(() => {
     return Object.values(values).reduce((sum, val) => sum + (val || 0), 0);
   }, [values]);
 
   // Handle value change
   const handleValueChange = useCallback((periodId: string, rawValue: string) => {
     const numValue = parseFloat(rawValue) || 0;
     const newValues = { ...values };
     
     if (numValue === 0) {
       delete newValues[periodId];
     } else {
       newValues[periodId] = numValue;
     }
     
     onChange(newValues);
   }, [values, onChange]);
 
   // Format number for display
   const formatNumber = (num: number) => {
     return new Intl.NumberFormat("en-US", {
       minimumFractionDigits: 0,
       maximumFractionDigits: 0,
     }).format(num);
   };
 
   if (periods.length === 0) {
     return (
       <div className="text-sm text-muted-foreground p-4 text-center border rounded-lg">
         No periods configured. Set up project periods first.
       </div>
     );
   }
 
   return (
     <div className="space-y-2">
       <ScrollArea className="w-full whitespace-nowrap rounded-md border">
         <div className="flex p-2 gap-1">
           {periods.map((period) => (
             <div
               key={period.id}
               className="flex flex-col items-center gap-1 min-w-[80px]"
             >
               <span className="text-xs font-medium text-muted-foreground">
                 {formatPeriodLabel(period)}
               </span>
               <Input
                 type="number"
                 value={values[period.id] || ""}
                 onChange={(e) => handleValueChange(period.id, e.target.value)}
                 disabled={disabled}
                 className={cn(
                   "w-[75px] h-8 text-right text-sm",
                   "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                 )}
                 placeholder="0"
               />
             </div>
           ))}
           
           {showTotal && (
             <div className="flex flex-col items-center gap-1 min-w-[90px] pl-2 border-l">
               <span className="text-xs font-semibold">Total</span>
               <div className={cn(
                 "w-[85px] h-8 flex items-center justify-end px-2 rounded-md text-sm font-medium",
                 "bg-muted"
               )}>
                 {formatNumber(total)}
               </div>
             </div>
           )}
         </div>
         <ScrollBar orientation="horizontal" />
       </ScrollArea>
       
       <p className="text-xs text-muted-foreground">
         Enter absolute values. Sign will be applied based on adjustment intent.
       </p>
     </div>
   );
 }