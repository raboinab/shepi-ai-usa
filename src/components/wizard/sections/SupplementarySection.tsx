import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FinancialTable } from "../shared/FinancialTable";
import { SummaryCard } from "../shared/SummaryCard";
import { CreditCard, FileText, AlertCircle, Upload, PenLine, ChevronDown, Info, ArrowDownToLine, Home, Scale } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DebtScheduleImportDialog } from "../shared/DebtScheduleImportDialog";
import { LeaseImportDialog, type LeaseObligation } from "../shared/LeaseImportDialog";
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { type ContractItem } from "../shared/MaterialContractsImportDialog";

interface SupplementaryData {
  debtSchedule: Record<string, unknown>[];
  leaseObligations: Record<string, unknown>[];
  contingentLiabilities: Record<string, unknown>[];
}

interface SupplementarySectionProps {
  data: SupplementaryData;
  updateData: (data: SupplementaryData) => void;
  projectId: string;
  balanceSheetData?: Record<string, unknown>[];
  materialContracts?: ContractItem[];
}

const defaultData: SupplementaryData = {
  debtSchedule: [
    { id: 1, lender: "Bank Term Loan", originalAmount: 0, currentBalance: 0, interestRate: 0, maturityDate: "" },
  ],
  leaseObligations: [
    { id: 1, description: "Office Lease", type: "Operating", annualPayment: 0, remainingTerm: 0 },
  ],
  contingentLiabilities: [
    { id: 1, description: "", estimatedAmount: 0, likelihood: "Possible", notes: "" },
  ],
};

// Common debt-related line item patterns from Balance Sheet
const DEBT_LINE_PATTERNS = [
  { pattern: /line of credit/i, facilityType: "Line of Credit" },
  { pattern: /notes payable/i, facilityType: "Notes Payable" },
  { pattern: /long.?term debt/i, facilityType: "Long-term Debt" },
  { pattern: /current portion.*(debt|loan)/i, facilityType: "Current Portion of LT Debt" },
  { pattern: /term loan/i, facilityType: "Term Loan" },
  { pattern: /mortgage/i, facilityType: "Mortgage" },
  { pattern: /loan payable/i, facilityType: "Loan Payable" },
  { pattern: /debt/i, facilityType: "Debt" },
];

// Contingent liability patterns from Balance Sheet
const CONTINGENT_LINE_PATTERNS = [
  { pattern: /warranty/i, category: "Warranty Reserve" },
  { pattern: /litigation/i, category: "Litigation Reserve" },
  { pattern: /legal.?reserve/i, category: "Legal Reserve" },
  { pattern: /contingent/i, category: "Contingent Liability" },
  { pattern: /self.?insurance/i, category: "Self-Insurance Reserve" },
  { pattern: /environmental/i, category: "Environmental Reserve" },
  { pattern: /restructuring/i, category: "Restructuring Reserve" },
];

export const SupplementarySection = ({ 
  data, 
  updateData, 
  projectId,
  balanceSheetData,
  materialContracts = []
}: SupplementarySectionProps) => {
  const [showDebtImport, setShowDebtImport] = useState(false);
  const [showLeaseImport, setShowLeaseImport] = useState(false);
  const [showManualGuide, setShowManualGuide] = useState(false);
  const [showContingentGuide, setShowContingentGuide] = useState(false);
  const suppData = { ...defaultData, ...data };

  const debtColumns = [
    { key: "lender", label: "Lender/Facility", type: "text" as const },
    { key: "originalAmount", label: "Original Amount", type: "currency" as const },
    { key: "currentBalance", label: "Current Balance", type: "currency" as const },
    { key: "interestRate", label: "Interest Rate %", type: "number" as const },
    { key: "maturityDate", label: "Maturity", type: "text" as const },
  ];

  const leaseColumns = [
    { key: "description", label: "Description", type: "text" as const },
    { key: "type", label: "Type", type: "text" as const },
    { key: "annualPayment", label: "Annual Payment", type: "currency" as const },
    { key: "remainingTerm", label: "Remaining Years", type: "number" as const },
  ];

  const contingentColumns = [
    { key: "description", label: "Description", type: "text" as const },
    { key: "estimatedAmount", label: "Estimated Amount", type: "currency" as const },
    { key: "likelihood", label: "Likelihood", type: "text" as const },
    { key: "notes", label: "Notes", type: "text" as const },
  ];

  const totalDebt = suppData.debtSchedule.reduce((sum, d) => sum + ((d.currentBalance as number) || 0), 0);
  const totalLeasePayments = suppData.leaseObligations.reduce((sum, l) => sum + ((l.annualPayment as number) || 0), 0);
  const totalContingent = suppData.contingentLiabilities.reduce((sum, c) => sum + ((c.estimatedAmount as number) || 0), 0);

  // Check if debt data is essentially empty (only has default placeholder)
  const isDebtEmpty = useMemo(() => {
    if (suppData.debtSchedule.length === 0) return true;
    if (suppData.debtSchedule.length === 1) {
      const first = suppData.debtSchedule[0];
      return (
        first.lender === "Bank Term Loan" &&
        ((first.currentBalance as number) || 0) === 0 &&
        ((first.originalAmount as number) || 0) === 0
      );
    }
    return false;
  }, [suppData.debtSchedule]);

  // Check if Balance Sheet has debt-related data we can pull
  const hasBalanceSheetDebtData = useMemo(() => {
    if (!balanceSheetData || balanceSheetData.length === 0) return false;
    return balanceSheetData.some(row => {
      const account = String(row.account || row.Account || row.description || "").toLowerCase();
      return DEBT_LINE_PATTERNS.some(p => p.pattern.test(account));
    });
  }, [balanceSheetData]);

  // Check if Balance Sheet has contingent liability data we can pull
  const hasBalanceSheetContingentData = useMemo(() => {
    if (!balanceSheetData || balanceSheetData.length === 0) return false;
    return balanceSheetData.some(row => {
      const account = String(row.account || row.Account || row.description || "").toLowerCase();
      return CONTINGENT_LINE_PATTERNS.some(p => p.pattern.test(account));
    });
  }, [balanceSheetData]);

  // Check if Material Contracts has lease-type contracts
  const hasMaterialContractLeases = useMemo(() => {
    return materialContracts.some(c => c.contractType?.toLowerCase() === "lease");
  }, [materialContracts]);

  // Check if lease data is essentially empty
  const isLeaseEmpty = useMemo(() => {
    if (suppData.leaseObligations.length === 0) return true;
    if (suppData.leaseObligations.length === 1) {
      const first = suppData.leaseObligations[0];
      return (
        first.description === "Office Lease" &&
        ((first.annualPayment as number) || 0) === 0
      );
    }
    return false;
  }, [suppData.leaseObligations]);

  // Check if contingent data is essentially empty
  const isContingentEmpty = useMemo(() => {
    if (suppData.contingentLiabilities.length === 0) return true;
    if (suppData.contingentLiabilities.length === 1) {
      const first = suppData.contingentLiabilities[0];
      return (
        !first.description &&
        ((first.estimatedAmount as number) || 0) === 0
      );
    }
    return false;
  }, [suppData.contingentLiabilities]);

  const handleDebtImport = (debts: Record<string, unknown>[]) => {
    // Merge imported debts with existing, assigning new IDs
    const maxId = Math.max(0, ...suppData.debtSchedule.map(d => (d.id as number) || 0));
    const newDebts = debts.map((debt, idx) => ({
      ...debt,
      id: maxId + idx + 1,
    }));
    updateData({
      ...suppData,
      debtSchedule: [...suppData.debtSchedule.filter(d => d.lender !== "Bank Term Loan" || (d.currentBalance as number) > 0), ...newDebts],
    });
    setShowManualGuide(false);
  };

  const handleLeaseImport = (leases: LeaseObligation[]) => {
    // Replace default placeholder if present
    const filteredExisting = suppData.leaseObligations.filter(
      l => l.description !== "Office Lease" || ((l.annualPayment as number) || 0) > 0
    );
    const maxId = Math.max(0, ...filteredExisting.map(l => (l.id as number) || 0));
    const newLeases = leases.map((lease, idx) => ({
      ...lease,
      id: maxId + idx + 1,
    }));
    updateData({
      ...suppData,
      leaseObligations: [...filteredExisting, ...newLeases],
    });
  };

  const handlePullFromBalanceSheet = () => {
    if (!balanceSheetData) return;

    const extractedDebts: Record<string, unknown>[] = [];
    let idCounter = 1;

    balanceSheetData.forEach(row => {
      const account = String(row.account || row.Account || row.description || "");
      const amount = Math.abs(Number(row.balance || row.Balance || row.amount || row.Amount || 0));
      
      if (amount === 0) return;

      const matchedPattern = DEBT_LINE_PATTERNS.find(p => p.pattern.test(account));
      if (matchedPattern) {
        extractedDebts.push({
          id: idCounter++,
          lender: account.trim(),
          facilityType: matchedPattern.facilityType,
          originalAmount: amount,
          currentBalance: amount,
          interestRate: 0,
          maturityDate: "",
        });
      }
    });

    if (extractedDebts.length > 0) {
      updateData({
        ...suppData,
        debtSchedule: extractedDebts,
      });
      setShowManualGuide(false);
    }
  };

  const handlePullContingentFromBalanceSheet = () => {
    if (!balanceSheetData) return;

    const extractedContingent: Record<string, unknown>[] = [];
    let idCounter = 1;

    balanceSheetData.forEach(row => {
      const account = String(row.account || row.Account || row.description || "");
      const amount = Math.abs(Number(row.balance || row.Balance || row.amount || row.Amount || 0));
      
      if (amount === 0) return;

      const matchedPattern = CONTINGENT_LINE_PATTERNS.find(p => p.pattern.test(account));
      if (matchedPattern) {
        extractedContingent.push({
          id: idCounter++,
          description: account.trim(),
          estimatedAmount: amount,
          likelihood: "Probable", // Already accrued = probable
          notes: `Pulled from Balance Sheet - ${matchedPattern.category}`,
        });
      }
    });

    if (extractedContingent.length > 0) {
      updateData({
        ...suppData,
        contingentLiabilities: extractedContingent,
      });
      setShowContingentGuide(false);
    }
  };

  // Show guide automatically if debt is empty
  const shouldShowGuide = showManualGuide || isDebtEmpty;
  const shouldShowContingentGuide = showContingentGuide || isContingentEmpty;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold">Supplementary Schedules</h2>
        <p className="text-muted-foreground">Debt, leases, and contingent liabilities analysis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard title="Total Debt" value={totalDebt} icon={CreditCard} />
        <SummaryCard title="Annual Lease Payments" value={totalLeasePayments} icon={FileText} />
        <SummaryCard title="Contingent Liabilities" value={totalContingent} icon={AlertCircle} />
      </div>

      <Tabs defaultValue="debt" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="debt">Debt Schedule</TabsTrigger>
          <TabsTrigger value="leases">Lease Obligations</TabsTrigger>
          <TabsTrigger value="contingent">Contingent Liabilities</TabsTrigger>
        </TabsList>

        <TabsContent value="debt">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Debt Schedule</CardTitle>
              <ButtonGroup>
                <Button variant="outline" size="sm" onClick={() => setShowDebtImport(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import from Document
                </Button>
                <ButtonGroupSeparator />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <PenLine className="w-4 h-4 mr-2" />
                      Enter Manually
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover">
                    <DropdownMenuItem onClick={() => setShowManualGuide(prev => !prev)}>
                      <Info className="w-4 h-4 mr-2" />
                      {showManualGuide ? "Hide Entry Guide" : "Show Entry Guide"}
                    </DropdownMenuItem>
                    {hasBalanceSheetDebtData && (
                      <DropdownMenuItem onClick={handlePullFromBalanceSheet}>
                        <ArrowDownToLine className="w-4 h-4 mr-2" />
                        Pull from Balance Sheet
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </ButtonGroup>
            </CardHeader>
            <CardContent className="space-y-4">
              {shouldShowGuide && (
                <Alert>
                  <PenLine className="h-4 w-4" />
                  <AlertTitle>Manual Entry Mode</AlertTitle>
                  <AlertDescription className="mt-2">
                    <p className="mb-3">No debt schedule document? You can:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Edit values directly in the table below</li>
                      <li>Add new facilities with the <strong>+ Add Row</strong> button</li>
                      <li>Total Outstanding calculates automatically</li>
                    </ul>
                    {hasBalanceSheetDebtData && (
                      <div className="mt-3">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={handlePullFromBalanceSheet}
                        >
                          <ArrowDownToLine className="w-4 h-4 mr-2" />
                          Pull Totals from Balance Sheet
                        </Button>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
              
              <FinancialTable
                columns={debtColumns}
                data={suppData.debtSchedule}
                onDataChange={(debtSchedule) => updateData({ ...suppData, debtSchedule })}
                newRowTemplate={{ lender: "New Facility", originalAmount: 0, currentBalance: 0, interestRate: 0, maturityDate: "" }}
              />
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Outstanding Debt</p>
                <p className="text-xl font-bold">${totalDebt.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leases">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Lease Obligations
              </CardTitle>
              <ButtonGroup>
                {hasMaterialContractLeases && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setShowLeaseImport(true)}>
                      <Scale className="w-4 h-4 mr-2" />
                      Pull from Material Contracts
                    </Button>
                    <ButtonGroupSeparator />
                  </>
                )}
                <Button variant="outline" size="sm" onClick={() => {}}>
                  <PenLine className="w-4 h-4 mr-2" />
                  Manual Entry
                </Button>
              </ButtonGroup>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLeaseEmpty && (
                <Alert>
                  <Home className="h-4 w-4" />
                  <AlertTitle>Lease Obligations</AlertTitle>
                  <AlertDescription className="mt-2">
                    <p className="mb-3">Enter lease data to analyze operating vs. finance lease impact:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Edit values directly in the table below</li>
                      <li>Add leases with the <strong>+ Add Row</strong> button</li>
                      {hasMaterialContractLeases && (
                        <li className="text-primary font-medium">
                          Or pull from Material Contracts (lease contracts already captured)
                        </li>
                      )}
                    </ul>
                    {hasMaterialContractLeases && (
                      <div className="mt-3">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => setShowLeaseImport(true)}
                        >
                          <Scale className="w-4 h-4 mr-2" />
                          Import from Material Contracts
                        </Button>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <FinancialTable
                columns={leaseColumns}
                data={suppData.leaseObligations}
                onDataChange={(leaseObligations) => updateData({ ...suppData, leaseObligations })}
                newRowTemplate={{ description: "New Lease", type: "Operating", annualPayment: 0, remainingTerm: 0 }}
              />
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Annual Lease Payments</p>
                <p className="text-xl font-bold">${totalLeasePayments.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contingent">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Contingent Liabilities
              </CardTitle>
              <ButtonGroup>
                {hasBalanceSheetContingentData && (
                  <>
                    <Button variant="outline" size="sm" onClick={handlePullContingentFromBalanceSheet}>
                      <ArrowDownToLine className="w-4 h-4 mr-2" />
                      Pull from Balance Sheet
                    </Button>
                    <ButtonGroupSeparator />
                  </>
                )}
                <Button variant="outline" size="sm" onClick={() => setShowContingentGuide(prev => !prev)}>
                  <PenLine className="w-4 h-4 mr-2" />
                  Manual Entry
                </Button>
              </ButtonGroup>
            </CardHeader>
            <CardContent className="space-y-4">
              {shouldShowContingentGuide && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Contingent Liabilities</AlertTitle>
                  <AlertDescription className="mt-2">
                    <p className="mb-3">Enter known or potential contingent items for due diligence:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Pending litigation or legal claims</li>
                      <li>Warranty obligations and reserves</li>
                      <li>Environmental liabilities</li>
                      <li>Guarantees and indemnifications</li>
                    </ul>
                    {hasBalanceSheetContingentData && (
                      <div className="mt-3">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={handlePullContingentFromBalanceSheet}
                        >
                          <ArrowDownToLine className="w-4 h-4 mr-2" />
                          Pull Accrued Items from Balance Sheet
                        </Button>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <FinancialTable
                columns={contingentColumns}
                data={suppData.contingentLiabilities}
                onDataChange={(contingentLiabilities) => updateData({ ...suppData, contingentLiabilities })}
                newRowTemplate={{ description: "New Item", estimatedAmount: 0, likelihood: "Possible", notes: "" }}
              />
              <div className="mt-4 p-4 bg-destructive/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Estimated Contingent Liabilities</p>
                <p className="text-xl font-bold">${totalContingent.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  These amounts may require disclosure or accrual depending on likelihood
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DebtScheduleImportDialog
        open={showDebtImport}
        onOpenChange={setShowDebtImport}
        projectId={projectId}
        onImport={handleDebtImport}
      />

      <LeaseImportDialog
        open={showLeaseImport}
        onOpenChange={setShowLeaseImport}
        materialContracts={materialContracts}
        onImport={handleLeaseImport}
      />
    </div>
  );
};
