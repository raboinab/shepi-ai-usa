 import { Label } from "@/components/ui/label";
 import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
 import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
 } from "@/components/ui/tooltip";
 import { TrendingUp, TrendingDown, HelpCircle } from "lucide-react";
 import { cn } from "@/lib/utils";
 import {
   type LedgerIntent,
   INTENT_LABELS,
   INTENT_TO_SIGN,
 } from "@/lib/qoeAdjustmentTaxonomy";
 
 interface IntentSelectorProps {
   value: LedgerIntent;
   onChange: (intent: LedgerIntent) => void;
   disabled?: boolean;
   compact?: boolean;
 }
 
 // Common intents for quick selection
 const COMMON_INTENTS: LedgerIntent[] = [
   "remove_expense",
   "remove_revenue",
   "add_expense",
   "add_revenue",
   "normalize_up_expense",
   "normalize_down_expense",
 ];
 
 export function IntentSelector({
   value,
   onChange,
   disabled = false,
   compact = false,
 }: IntentSelectorProps) {
   const getSignIcon = (intent: LedgerIntent) => {
     const sign = INTENT_TO_SIGN[intent];
     if (sign === 1) return <TrendingUp className="h-3 w-3 text-green-600" />;
     if (sign === -1) return <TrendingDown className="h-3 w-3 text-red-600" />;
     return <HelpCircle className="h-3 w-3 text-muted-foreground" />;
   };
 
   const getSignLabel = (intent: LedgerIntent) => {
     const sign = INTENT_TO_SIGN[intent];
     if (sign === 1) return "+EBITDA";
     if (sign === -1) return "−EBITDA";
     return "Manual";
   };
 
   if (compact) {
     return (
       <TooltipProvider>
         <div className="flex flex-wrap gap-2">
           {COMMON_INTENTS.map((intent) => {
             const info = INTENT_LABELS[intent];
             const isSelected = value === intent;
             
             return (
               <Tooltip key={intent}>
                 <TooltipTrigger asChild>
                   <button
                     type="button"
                     disabled={disabled}
                     onClick={() => onChange(intent)}
                     className={cn(
                       "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                       "border",
                       isSelected
                         ? "bg-primary text-primary-foreground border-primary"
                         : "bg-background hover:bg-muted border-border",
                       disabled && "opacity-50 cursor-not-allowed"
                     )}
                   >
                     {getSignIcon(intent)}
                     <span className="truncate max-w-[120px]">{info.label}</span>
                   </button>
                 </TooltipTrigger>
                 <TooltipContent side="bottom" className="max-w-xs">
                   <p className="font-medium">{info.label}</p>
                   <p className="text-xs text-muted-foreground">{info.description}</p>
                   <p className="text-xs font-medium mt-1">{getSignLabel(intent)}</p>
                 </TooltipContent>
               </Tooltip>
             );
           })}
         </div>
       </TooltipProvider>
     );
   }
 
   return (
     <RadioGroup
       value={value}
       onValueChange={(v) => onChange(v as LedgerIntent)}
       disabled={disabled}
       className="space-y-2"
     >
       {COMMON_INTENTS.map((intent) => {
         const info = INTENT_LABELS[intent];
         
         return (
           <div
             key={intent}
             className={cn(
               "flex items-start gap-3 p-3 rounded-lg border transition-colors",
               value === intent
                 ? "bg-primary/5 border-primary"
                 : "hover:bg-muted/50 border-border"
             )}
           >
             <RadioGroupItem value={intent} id={intent} className="mt-0.5" />
             <Label
               htmlFor={intent}
               className="flex-1 cursor-pointer space-y-1"
             >
               <div className="flex items-center gap-2">
                 {getSignIcon(intent)}
                 <span className="font-medium">{info.label}</span>
                 <span className={cn(
                   "text-xs px-1.5 py-0.5 rounded",
                   INTENT_TO_SIGN[intent] === 1 
                     ? "bg-green-100 text-green-700" 
                     : "bg-red-100 text-red-700"
                 )}>
                   {getSignLabel(intent)}
                 </span>
               </div>
               <p className="text-sm text-muted-foreground">{info.description}</p>
             </Label>
           </div>
         );
       })}
     </RadioGroup>
   );
 }