import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { SummaryCard } from "../shared/SummaryCard";
import { MaterialContractsImportDialog, type ContractItem } from "../shared/MaterialContractsImportDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Scale, 
  Users, 
  Building2, 
  Home, 
  User, 
  FileText, 
  Download, 
  ShieldAlert,
  Calendar,
  Plus,
  Trash2,
  ChevronDown,
  Edit3,
  BookOpen,
  AlertTriangle
} from "lucide-react";

interface MaterialContractsData {
  contracts: ContractItem[];
}

interface MaterialContractsSectionProps {
  data: MaterialContractsData;
  updateData: (data: MaterialContractsData) => void;
  projectId: string;
}

const CONTRACT_TYPES = [
  { value: 'Customer', label: 'Customer', icon: Users },
  { value: 'Vendor/Supplier', label: 'Vendor/Supplier', icon: Building2 },
  { value: 'Lease', label: 'Lease', icon: Home },
  { value: 'Employment', label: 'Employment', icon: User },
  { value: 'Other', label: 'Other', icon: FileText },
];

const defaultData: MaterialContractsData = {
  contracts: [],
};

export const MaterialContractsSection = ({ 
  data, 
  updateData,
  projectId 
}: MaterialContractsSectionProps) => {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [showGuidance, setShowGuidance] = useState(false);
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  
  const contractData = { ...defaultData, ...data };
  const contracts = contractData.contracts || [];

  // Auto-show guidance when empty
  const shouldShowGuidance = showGuidance || contracts.length === 0;

  const formatCurrency = (value?: number) => {
    if (!value) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Calculate summaries
  const totalContracts = contracts.length;
  const totalValue = contracts.reduce((sum, c) => sum + (c.contractValue || c.annualValue || 0), 0);
  const cocRiskCount = contracts.filter(c => c.changeOfControl && c.changeOfControl.toLowerCase() !== 'none').length;
  
  const now = new Date();
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  const expiringCount = contracts.filter(c => {
    if (!c.expirationDate) return false;
    const expDate = new Date(c.expirationDate);
    return expDate >= now && expDate <= oneYearFromNow;
  }).length;

  const contractsByType = CONTRACT_TYPES.map(type => ({
    ...type,
    contracts: contracts.filter(c => c.contractType === type.value || 
      (type.value === 'Other' && !CONTRACT_TYPES.slice(0, -1).some(t => t.value === c.contractType))),
  }));

  const handleImport = (importedContracts: ContractItem[]) => {
    // Merge with existing, assigning new IDs
    const maxId = contracts.reduce((max, c) => Math.max(max, c.id || 0), 0);
    const newContracts = importedContracts.map((c, i) => ({
      ...c,
      id: maxId + i + 1,
    }));
    updateData({ contracts: [...contracts, ...newContracts] });
  };

  const addContract = (type: string) => {
    const maxId = contracts.reduce((max, c) => Math.max(max, c.id || 0), 0);
    const newContract: ContractItem = {
      id: maxId + 1,
      contractType: type,
      counterparty: '',
      description: '',
    };
    updateData({ contracts: [...contracts, newContract] });
    setShowGuidance(false);
  };

  const removeContract = (id: number) => {
    updateData({ contracts: contracts.filter(c => c.id !== id) });
  };

  const updateContract = (id: number, field: keyof ContractItem, value: string | number) => {
    const updated = contracts.map(c => {
      if (c.id === id) {
        if (field === 'contractValue' || field === 'annualValue') {
          return { ...c, [field]: parseFloat(value as string) || 0 };
        }
        return { ...c, [field]: value };
      }
      return c;
    });
    updateData({ contracts: updated });
  };

  const handleCellClick = (id: number, field: string) => {
    setEditingCell({ id, field });
  };

  const handleCellBlur = () => {
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const renderEditableCell = (contract: ContractItem, field: keyof ContractItem, displayValue: string, type: 'text' | 'number' | 'date' = 'text') => {
    const isEditing = editingCell?.id === contract.id && editingCell?.field === field;
    
    if (isEditing) {
      return (
        <Input
          type={type}
          defaultValue={contract[field]?.toString() || ''}
          className="h-8 w-full min-w-[100px]"
          autoFocus
          onBlur={(e) => {
            updateContract(contract.id!, field, e.target.value);
            handleCellBlur();
          }}
          onKeyDown={handleKeyDown}
        />
      );
    }

    return (
      <div 
        className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded -mx-2 -my-1 min-h-[28px] flex items-center"
        onClick={() => handleCellClick(contract.id!, field)}
      >
        {displayValue || <span className="text-muted-foreground italic">Click to edit</span>}
      </div>
    );
  };

  const renderContractsTable = (typeContracts: ContractItem[], type: string) => {
    if (typeContracts.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No {type.toLowerCase()} contracts yet</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => addContract(type)}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Contract
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Counterparty</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Expiration</TableHead>
              <TableHead>CoC Provision</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {typeContracts.map((contract) => (
              <TableRow key={contract.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {renderEditableCell(contract, 'counterparty', contract.counterparty || '')}
                    {contract.changeOfControl && contract.changeOfControl.toLowerCase() !== 'none' && (
                      <Badge variant="destructive" className="text-xs shrink-0">
                        <ShieldAlert className="h-3 w-3 mr-1" />
                        CoC
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="max-w-[200px]">
                  {renderEditableCell(contract, 'description', contract.description || '')}
                </TableCell>
                <TableCell>
                  {renderEditableCell(contract, 'contractValue', formatCurrency(contract.contractValue || contract.annualValue), 'number')}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                    {renderEditableCell(contract, 'expirationDate', formatDate(contract.expirationDate), 'date')}
                  </div>
                </TableCell>
                <TableCell className="max-w-[150px]">
                  {renderEditableCell(contract, 'changeOfControl', contract.changeOfControl || '')}
                </TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeContract(contract.id!)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => addContract(type)}
        >
          <Plus className="h-4 w-4 mr-1" /> Add Contract
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Material Contracts</h2>
          <p className="text-muted-foreground">Review key agreements and change of control provisions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Download className="h-4 w-4 mr-2" />
            Import from Document
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Edit3 className="h-4 w-4 mr-2" />
                Enter Manually
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              <DropdownMenuItem onClick={() => setShowGuidance(true)}>
                <BookOpen className="h-4 w-4 mr-2" />
                Show Entry Guide
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addContract('Customer')}>
                <Plus className="h-4 w-4 mr-2" />
                Quick Add Contract
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Manual Entry Guidance Card */}
      {shouldShowGuidance && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Manual Entry Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              No contract documents? Enter contract details manually:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Select a contract type tab (Customer, Vendor, etc.)</li>
              <li>Click "<strong>+ Add Contract</strong>" to add a new entry</li>
              <li>Click any cell in the table to edit values inline</li>
            </ul>
            <Alert className="mt-3 border-amber-500/50 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm">
                <strong>IMPORTANT:</strong> Always capture Change of Control provisions. These can terminate 
                contracts upon acquisition and should be flagged for legal review during due diligence.
              </AlertDescription>
            </Alert>
            {contracts.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setShowGuidance(false)} className="mt-2">
                Hide Guide
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="Total Contracts" value={totalContracts} icon={Scale} isCurrency={false} />
        <SummaryCard title="Total Value" value={totalValue} icon={FileText} />
        <SummaryCard 
          title="Expiring Soon" 
          value={expiringCount} 
          icon={Calendar} 
          isCurrency={false}
          className={expiringCount > 0 ? "border-amber-500/50" : ""}
        />
        <Card className={cocRiskCount > 0 ? "border-destructive" : ""}>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              Change of Control Risk
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${cocRiskCount > 0 ? 'text-destructive' : ''}`}>
              {cocRiskCount > 0 ? `${cocRiskCount} contract${cocRiskCount !== 1 ? 's' : ''}` : 'None'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CoC Alert */}
      {cocRiskCount > 0 && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            <strong>{cocRiskCount} contract{cocRiskCount !== 1 ? 's' : ''}</strong> ha{cocRiskCount !== 1 ? 've' : 's'} change of control provisions 
            that may impact the transaction. Review these carefully during due diligence.
          </AlertDescription>
        </Alert>
      )}

      {/* Contracts by Type */}
      <Tabs defaultValue="Customer" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          {CONTRACT_TYPES.map(type => (
            <TabsTrigger key={type.value} value={type.value} className="gap-2">
              <type.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{type.label}</span>
              {contractsByType.find(t => t.value === type.value)!.contracts.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {contractsByType.find(t => t.value === type.value)!.contracts.length}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {CONTRACT_TYPES.map(type => (
          <TabsContent key={type.value} value={type.value}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <type.icon className="h-5 w-5" />
                  {type.label} Contracts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderContractsTable(
                  contractsByType.find(t => t.value === type.value)!.contracts,
                  type.value
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <MaterialContractsImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        projectId={projectId}
        onImport={handleImport}
      />
    </div>
  );
};
