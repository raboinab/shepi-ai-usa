 import { useState, useMemo } from "react";
 import { Check, ChevronsUpDown, AlertCircle } from "lucide-react";
 import { cn } from "@/lib/utils";
 import { Button } from "@/components/ui/button";
 import {
   Command,
   CommandEmpty,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
 } from "@/components/ui/command";
 import {
   Popover,
   PopoverContent,
   PopoverTrigger,
 } from "@/components/ui/popover";
 import { Badge } from "@/components/ui/badge";
 
 export interface CoaAccount {
   accountId?: string;
   accountNumber?: string;
   accountName: string;
   fsType?: string;
   fsLineItem?: string;
 }
 
 interface AccountPickerProps {
   accounts: CoaAccount[];
   value: string;
   onChange: (accountNumber: string, accountName?: string) => void;
   placeholder?: string;
   filterFsType?: "IS" | "BS";
   disabled?: boolean;
   required?: boolean;
   showWarningIfNotFound?: boolean;
 }
 
 export function AccountPicker({
   accounts,
   value,
   onChange,
   placeholder = "Select account...",
   filterFsType,
   disabled = false,
   required = false,
   showWarningIfNotFound = true,
 }: AccountPickerProps) {
   const [open, setOpen] = useState(false);
 
   // Filter accounts by fsType if specified
   const filteredAccounts = useMemo(() => {
     if (!filterFsType) return accounts;
     return accounts.filter(acc => {
       const type = acc.fsType?.toUpperCase();
       if (filterFsType === "IS") {
         return type === "IS" || type === "INCOME" || type === "EXPENSE";
       }
       if (filterFsType === "BS") {
         return type === "BS" || type === "ASSET" || type === "LIABILITY" || type === "EQUITY";
       }
       return true;
     });
   }, [accounts, filterFsType]);
 
   // Group accounts by fsType for better UX
   const groupedAccounts = useMemo(() => {
     const groups: Record<string, CoaAccount[]> = {};
     for (const acc of filteredAccounts) {
       const group = acc.fsType || "Other";
       if (!groups[group]) groups[group] = [];
       groups[group].push(acc);
     }
     return groups;
   }, [filteredAccounts]);
 
   // Find selected account
   const selectedAccount = useMemo(() => {
     if (!value) return null;
     return accounts.find(
       acc => acc.accountNumber === value || acc.accountId === value
     );
   }, [accounts, value]);
 
   const displayValue = selectedAccount
     ? `${selectedAccount.accountNumber || selectedAccount.accountId} - ${selectedAccount.accountName}`
     : value || "";
 
   const isUnmapped = value && !selectedAccount && showWarningIfNotFound;
 
   return (
     <div className="flex items-center gap-2 w-full">
       <Popover open={open} onOpenChange={setOpen}>
         <PopoverTrigger asChild>
           <Button
             variant="outline"
             role="combobox"
             aria-expanded={open}
             disabled={disabled}
             className={cn(
               "w-full justify-between font-normal",
               !value && "text-muted-foreground",
               isUnmapped && "border-destructive",
               required && !value && "border-destructive/50"
             )}
           >
             <span className="truncate">
               {displayValue || placeholder}
             </span>
             <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
           </Button>
         </PopoverTrigger>
         <PopoverContent className="w-[400px] p-0" align="start">
           <Command>
             <CommandInput placeholder="Search accounts..." />
             <CommandList>
               <CommandEmpty>No account found.</CommandEmpty>
               {Object.entries(groupedAccounts).map(([group, accs]) => (
                 <CommandGroup key={group} heading={group}>
                   {accs.map((acc) => {
                     const accKey = acc.accountNumber || acc.accountId || acc.accountName;
                     return (
                       <CommandItem
                         key={accKey}
                         value={`${accKey} ${acc.accountName} ${acc.fsLineItem || ""}`}
                         onSelect={() => {
                           onChange(acc.accountNumber || acc.accountId || "", acc.accountName);
                           setOpen(false);
                         }}
                       >
                         <Check
                           className={cn(
                             "mr-2 h-4 w-4",
                             value === accKey ? "opacity-100" : "opacity-0"
                           )}
                         />
                         <div className="flex flex-col">
                           <span className="font-medium">
                             {acc.accountNumber || acc.accountId} - {acc.accountName}
                           </span>
                           {acc.fsLineItem && (
                             <span className="text-xs text-muted-foreground">
                               {acc.fsLineItem}
                             </span>
                           )}
                         </div>
                       </CommandItem>
                     );
                   })}
                 </CommandGroup>
               ))}
             </CommandList>
           </Command>
         </PopoverContent>
       </Popover>
       
       {isUnmapped && (
         <Badge variant="destructive" className="shrink-0 gap-1">
           <AlertCircle className="h-3 w-3" />
           Unmapped
         </Badge>
       )}
     </div>
   );
 }