import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  ChevronDown, 
  ChevronUp,
  DollarSign,
  Scale,
  Info,
  Building2,
  Calculator,
  BarChart3,
  Users,
  Landmark
} from "lucide-react";

// Enhanced interfaces matching the backend
interface ScheduleK {
  ordinaryBusinessIncome: number | null;
  netRentalRealEstateIncome: number | null;
  otherNetRentalIncome: number | null;
  interestIncome: number | null;
  ordinaryDividends: number | null;
  qualifiedDividends: number | null;
  royalties: number | null;
  netShortTermCapitalGain: number | null;
  netLongTermCapitalGain: number | null;
  netSection1231Gain: number | null;
  otherIncomeLoss: number | null;
  section179Deduction: number | null;
  charitableContributions: number | null;
  investmentInterestExpense: number | null;
  taxExemptInterestIncome: number | null;
  otherTaxExemptIncome: number | null;
  nondeductibleExpenses: number | null;
  distributions: number | null;
  foreignTaxesPaid: number | null;
}

interface BalanceSheetPeriod {
  cash: number | null;
  accountsReceivable: number | null;
  inventories: number | null;
  loansToShareholders: number | null;
  otherCurrentAssets: number | null;
  buildings: number | null;
  depreciableAssets: number | null;
  accumulatedDepreciation: number | null;
  land: number | null;
  otherAssets: number | null;
  totalAssets: number | null;
  accountsPayable: number | null;
  mortgagesPayable: number | null;
  loansFromShareholders: number | null;
  otherLiabilities: number | null;
  totalLiabilities: number | null;
  capitalStock: number | null;
  retainedEarnings: number | null;
  adjustmentsToShareholderEquity: number | null;
  totalEquity: number | null;
}

interface ScheduleL {
  beginningOfYear: BalanceSheetPeriod;
  endOfYear: BalanceSheetPeriod;
}

interface ScheduleM1 {
  netIncomePerBooks: number | null;
  incomeOnBooksNotOnReturn: number | null;
  expensesOnBooksNotDeducted: number | null;
  incomeOnReturnNotOnBooks: number | null;
  deductionsNotChargedToBooks: number | null;
  incomePerScheduleK: number | null;
}

interface ScheduleM2 {
  beginningAAA: number | null;
  ordinaryIncome: number | null;
  otherAdditions: number | null;
  lossDeductions: number | null;
  otherReductions: number | null;
  distributionsCash: number | null;
  distributionsProperty: number | null;
  endingAAA: number | null;
  otherAdjustmentsAccount: number | null;
  shareholdersUndistributedTaxableIncome: number | null;
  accumulatedEP: number | null;
}

interface COGSDetails {
  beginningInventory: number | null;
  purchases: number | null;
  costOfLabor: number | null;
  additionalSection263ACosts: number | null;
  otherCosts: number | null;
  endingInventory: number | null;
  inventoryMethod?: string;
}

interface TaxReturnData {
  formType: string;
  taxYear: number;
  filingStatus?: string;
  taxpayerName: string;
  ein?: string;
  naicsCode?: string;
  accountingMethod?: string;
  numberOfShareholders?: number;
  
  // Income
  grossReceipts: number | null;
  returnsAndAllowances: number | null;
  netReceipts: number | null;
  costOfGoodsSold: number | null;
  grossProfit: number | null;
  netGainForm4797: number | null;
  otherIncome: number | null;
  totalIncome: number | null;
  
  // Deductions
  officerCompensation: number | null;
  salariesWages: number | null;
  repairs: number | null;
  badDebts: number | null;
  rent: number | null;
  taxes: number | null;
  interestExpense: number | null;
  depreciation: number | null;
  depletion: number | null;
  advertising: number | null;
  pension: number | null;
  employeeBenefit: number | null;
  otherDeductions: number | null;
  totalDeductions: number | null;
  
  // Bottom line
  ordinaryBusinessIncome: number | null;
  taxableIncome: number | null;
  totalTax: number | null;
  estimatedTaxPayments: number | null;
  overpayment: number | null;
  amountOwed: number | null;
  
  // Legacy
  businessIncome: number | null;
  
  // Schedules
  scheduleK?: ScheduleK;
  scheduleL?: ScheduleL;
  scheduleM1?: ScheduleM1;
  scheduleM2?: ScheduleM2;
  cogsDetails?: COGSDetails;
}

interface ComparisonResult {
  field: string;
  taxReturnValue: number | null;
  comparisonValue: number | null;
  source: string;
  variance: number | null;
  variancePercent: number | null;
  status: 'match' | 'minor_variance' | 'significant_variance' | 'missing_data';
  category?: string;
}

export interface TaxReturnAnalysis {
  extractedData: TaxReturnData;
  comparisons: ComparisonResult[];
  overallScore: number;
  flags: string[];
  summary: string;
  analyzedAt: string;
  documentId: string;
}

interface TaxReturnInsightsCardProps {
  analysis: TaxReturnAnalysis;
  className?: string;
}

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const getStatusIcon = (status: ComparisonResult['status']) => {
  switch (status) {
    case 'match':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case 'minor_variance':
      return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    case 'significant_variance':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'missing_data':
      return <Info className="w-4 h-4 text-muted-foreground" />;
  }
};

const getScoreColor = (score: number): string => {
  if (score >= 90) return "bg-green-500";
  if (score >= 70) return "bg-amber-500";
  return "bg-red-500";
};

export const TaxReturnInsightsCard = ({ analysis, className }: TaxReturnInsightsCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { extractedData, comparisons, overallScore, flags, summary } = analysis;

  const formTypeLabel = {
    "1040": "Form 1040 (Individual)",
    "1120": "Form 1120 (C-Corp)",
    "1065": "Form 1065 (Partnership)",
    "1120S": "Form 1120-S (S-Corp)",
  }[extractedData.formType] || `Form ${extractedData.formType}`;

  const hasScheduleK = !!extractedData.scheduleK;
  const hasScheduleL = !!extractedData.scheduleL;
  const hasScheduleM1 = !!extractedData.scheduleM1;
  const hasScheduleM2 = !!extractedData.scheduleM2;
  const hasCOGS = !!extractedData.cogsDetails;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Tax Return Analysis</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {extractedData.taxYear}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {formTypeLabel}
            </Badge>
          </div>
        </div>
        <CardDescription>
          AI-powered extraction and comparison of tax return data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Overview */}
        <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Consistency Score</span>
              <span className={`text-lg font-bold ${overallScore >= 70 ? 'text-green-600' : 'text-amber-600'}`}>
                {overallScore}%
              </span>
            </div>
            <Progress value={overallScore} className={`h-2 ${getScoreColor(overallScore)}`} />
          </div>
        </div>

        {/* Summary */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {summary}
        </p>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Gross Receipts</span>
            <span className="text-sm font-medium">{formatCurrency(extractedData.grossReceipts)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Ordinary Income</span>
            <span className="text-sm font-medium">{formatCurrency(extractedData.ordinaryBusinessIncome)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Total Deductions</span>
            <span className="text-sm font-medium">{formatCurrency(extractedData.totalDeductions)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Total Tax</span>
            <span className="text-sm font-medium">{formatCurrency(extractedData.totalTax)}</span>
          </div>
        </div>

        {/* Flags/Alerts */}
        {flags.length > 0 && (
          <div className="space-y-2">
            {flags.slice(0, 3).map((flag, i) => (
              <Alert key={i} variant="destructive" className="py-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs ml-2">{flag}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Comparison Table - Always visible */}
        {comparisons.length > 0 && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field</TableHead>
                  <TableHead className="text-right">Tax Return</TableHead>
                  <TableHead className="text-right">Records</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisons.map((comp, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-sm">{comp.field}</TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(comp.taxReturnValue)}</TableCell>
                    <TableCell className="text-right text-sm">
                      <div className="flex flex-col items-end">
                        <span>{formatCurrency(comp.comparisonValue)}</span>
                        <span className="text-xs text-muted-foreground">{comp.source}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {comp.variancePercent !== null ? (
                        <span className={comp.variancePercent > 5 ? 'text-red-500' : comp.variancePercent < -5 ? 'text-amber-500' : 'text-green-500'}>
                          {comp.variancePercent > 0 ? '+' : ''}{comp.variancePercent.toFixed(1)}%
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusIcon(comp.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Expandable Details with Tabs */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              {isExpanded ? "Show Less" : "View Full Tax Return Data"}
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <Tabs defaultValue="page1" className="w-full">
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto">
                <TabsTrigger value="page1" className="text-xs py-1.5">
                  <FileText className="w-3 h-3 mr-1" />
                  Page 1
                </TabsTrigger>
                {hasScheduleK && (
                  <TabsTrigger value="scheduleK" className="text-xs py-1.5">
                    <Users className="w-3 h-3 mr-1" />
                    Sch K
                  </TabsTrigger>
                )}
                {hasScheduleL && (
                  <TabsTrigger value="scheduleL" className="text-xs py-1.5">
                    <Landmark className="w-3 h-3 mr-1" />
                    Sch L
                  </TabsTrigger>
                )}
                {(hasScheduleM1 || hasScheduleM2) && (
                  <TabsTrigger value="scheduleM" className="text-xs py-1.5">
                    <Calculator className="w-3 h-3 mr-1" />
                    M-1/M-2
                  </TabsTrigger>
                )}
                {hasCOGS && (
                  <TabsTrigger value="cogs" className="text-xs py-1.5">
                    <BarChart3 className="w-3 h-3 mr-1" />
                    COGS
                  </TabsTrigger>
                )}
                <TabsTrigger value="entity" className="text-xs py-1.5">
                  <Building2 className="w-3 h-3 mr-1" />
                  Entity
                </TabsTrigger>
              </TabsList>

              {/* Page 1 - Income & Deductions */}
              <TabsContent value="page1" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    Income
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    <DataRow label="Gross Receipts (1a)" value={extractedData.grossReceipts} />
                    <DataRow label="Returns & Allowances (1b)" value={extractedData.returnsAndAllowances} />
                    <DataRow label="Net Receipts (1c)" value={extractedData.netReceipts} />
                    <DataRow label="COGS (2)" value={extractedData.costOfGoodsSold} />
                    <DataRow label="Gross Profit (3)" value={extractedData.grossProfit} />
                    <DataRow label="Net Gain Form 4797 (4)" value={extractedData.netGainForm4797} />
                    <DataRow label="Other Income (5)" value={extractedData.otherIncome} />
                    <DataRow label="Total Income (6)" value={extractedData.totalIncome} highlight />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="text-sm font-medium">Deductions</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    <DataRow label="Officer Compensation (7)" value={extractedData.officerCompensation} />
                    <DataRow label="Salaries & Wages (8)" value={extractedData.salariesWages} />
                    <DataRow label="Repairs (9)" value={extractedData.repairs} />
                    <DataRow label="Bad Debts (10)" value={extractedData.badDebts} />
                    <DataRow label="Rents (11)" value={extractedData.rent} />
                    <DataRow label="Taxes & Licenses (12)" value={extractedData.taxes} />
                    <DataRow label="Interest (13)" value={extractedData.interestExpense} />
                    <DataRow label="Depreciation (14)" value={extractedData.depreciation} />
                    <DataRow label="Depletion (15)" value={extractedData.depletion} />
                    <DataRow label="Advertising (16)" value={extractedData.advertising} />
                    <DataRow label="Pension (17)" value={extractedData.pension} />
                    <DataRow label="Employee Benefits (18)" value={extractedData.employeeBenefit} />
                    <DataRow label="Other Deductions (19)" value={extractedData.otherDeductions} />
                    <DataRow label="Total Deductions (20)" value={extractedData.totalDeductions} highlight />
                  </div>
                </div>

                <Separator />

                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <DataRow label="Ordinary Business Income (21)" value={extractedData.ordinaryBusinessIncome} highlight />
                    <DataRow label="Taxable Income" value={extractedData.taxableIncome} />
                    <DataRow label="Total Tax" value={extractedData.totalTax} highlight />
                    <DataRow label="Estimated Payments" value={extractedData.estimatedTaxPayments} />
                    <DataRow label="Overpayment" value={extractedData.overpayment} />
                    <DataRow label="Amount Owed" value={extractedData.amountOwed} />
                  </div>
                </div>
              </TabsContent>

              {/* Schedule K - Shareholders' Items */}
              {hasScheduleK && (
                <TabsContent value="scheduleK" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Income/Loss Items</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <DataRow label="Ordinary Business Income (1)" value={extractedData.scheduleK?.ordinaryBusinessIncome} />
                      <DataRow label="Net Rental Real Estate (2)" value={extractedData.scheduleK?.netRentalRealEstateIncome} />
                      <DataRow label="Other Rental Income (3)" value={extractedData.scheduleK?.otherNetRentalIncome} />
                      <DataRow label="Interest Income (4)" value={extractedData.scheduleK?.interestIncome} />
                      <DataRow label="Ordinary Dividends (5a)" value={extractedData.scheduleK?.ordinaryDividends} />
                      <DataRow label="Qualified Dividends (5b)" value={extractedData.scheduleK?.qualifiedDividends} />
                      <DataRow label="Royalties (6)" value={extractedData.scheduleK?.royalties} />
                      <DataRow label="Net ST Capital Gain (7)" value={extractedData.scheduleK?.netShortTermCapitalGain} />
                      <DataRow label="Net LT Capital Gain (8a)" value={extractedData.scheduleK?.netLongTermCapitalGain} />
                      <DataRow label="Net Sec 1231 Gain (9)" value={extractedData.scheduleK?.netSection1231Gain} />
                      <DataRow label="Other Income/Loss (10)" value={extractedData.scheduleK?.otherIncomeLoss} />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="text-sm font-medium">Deductions & Other</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <DataRow label="Section 179 Deduction (11)" value={extractedData.scheduleK?.section179Deduction} />
                      <DataRow label="Charitable Contributions (12a)" value={extractedData.scheduleK?.charitableContributions} />
                      <DataRow label="Investment Interest (13a)" value={extractedData.scheduleK?.investmentInterestExpense} />
                      <DataRow label="Tax-Exempt Interest (16a)" value={extractedData.scheduleK?.taxExemptInterestIncome} />
                      <DataRow label="Other Tax-Exempt (16b)" value={extractedData.scheduleK?.otherTaxExemptIncome} />
                      <DataRow label="Nondeductible Expenses (16c)" value={extractedData.scheduleK?.nondeductibleExpenses} />
                      <DataRow label="Distributions (16d)" value={extractedData.scheduleK?.distributions} highlight />
                      <DataRow label="Foreign Taxes Paid (17f)" value={extractedData.scheduleK?.foreignTaxesPaid} />
                    </div>
                  </div>
                </TabsContent>
              )}

              {/* Schedule L - Balance Sheet */}
              {hasScheduleL && (
                <TabsContent value="scheduleL" className="space-y-4 mt-4">
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40%]">Account</TableHead>
                          <TableHead className="text-right">Beginning</TableHead>
                          <TableHead className="text-right">End of Year</TableHead>
                          <TableHead className="text-right">Change</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <BalanceSheetRow 
                          label="Cash" 
                          beginning={extractedData.scheduleL?.beginningOfYear?.cash}
                          ending={extractedData.scheduleL?.endOfYear?.cash}
                        />
                        <BalanceSheetRow 
                          label="Accounts Receivable" 
                          beginning={extractedData.scheduleL?.beginningOfYear?.accountsReceivable}
                          ending={extractedData.scheduleL?.endOfYear?.accountsReceivable}
                        />
                        <BalanceSheetRow 
                          label="Inventories" 
                          beginning={extractedData.scheduleL?.beginningOfYear?.inventories}
                          ending={extractedData.scheduleL?.endOfYear?.inventories}
                        />
                        <BalanceSheetRow 
                          label="Loans to Shareholders" 
                          beginning={extractedData.scheduleL?.beginningOfYear?.loansToShareholders}
                          ending={extractedData.scheduleL?.endOfYear?.loansToShareholders}
                          flagIfNonZero
                        />
                        <BalanceSheetRow 
                          label="Buildings/Depreciable Assets" 
                          beginning={extractedData.scheduleL?.beginningOfYear?.depreciableAssets}
                          ending={extractedData.scheduleL?.endOfYear?.depreciableAssets}
                        />
                        <BalanceSheetRow 
                          label="Less: Accum. Depreciation" 
                          beginning={extractedData.scheduleL?.beginningOfYear?.accumulatedDepreciation}
                          ending={extractedData.scheduleL?.endOfYear?.accumulatedDepreciation}
                          negative
                        />
                        <BalanceSheetRow 
                          label="Total Assets" 
                          beginning={extractedData.scheduleL?.beginningOfYear?.totalAssets}
                          ending={extractedData.scheduleL?.endOfYear?.totalAssets}
                          highlight
                        />
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={4} className="text-xs text-muted-foreground font-medium">Liabilities & Equity</TableCell>
                        </TableRow>
                        <BalanceSheetRow 
                          label="Accounts Payable" 
                          beginning={extractedData.scheduleL?.beginningOfYear?.accountsPayable}
                          ending={extractedData.scheduleL?.endOfYear?.accountsPayable}
                        />
                        <BalanceSheetRow 
                          label="Loans from Shareholders" 
                          beginning={extractedData.scheduleL?.beginningOfYear?.loansFromShareholders}
                          ending={extractedData.scheduleL?.endOfYear?.loansFromShareholders}
                          flagIfNonZero
                        />
                        <BalanceSheetRow 
                          label="Total Liabilities" 
                          beginning={extractedData.scheduleL?.beginningOfYear?.totalLiabilities}
                          ending={extractedData.scheduleL?.endOfYear?.totalLiabilities}
                        />
                        <BalanceSheetRow 
                          label="Capital Stock" 
                          beginning={extractedData.scheduleL?.beginningOfYear?.capitalStock}
                          ending={extractedData.scheduleL?.endOfYear?.capitalStock}
                        />
                        <BalanceSheetRow 
                          label="Retained Earnings" 
                          beginning={extractedData.scheduleL?.beginningOfYear?.retainedEarnings}
                          ending={extractedData.scheduleL?.endOfYear?.retainedEarnings}
                        />
                        <BalanceSheetRow 
                          label="Total Equity" 
                          beginning={extractedData.scheduleL?.beginningOfYear?.totalEquity}
                          ending={extractedData.scheduleL?.endOfYear?.totalEquity}
                          highlight
                        />
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              )}

              {/* Schedule M-1/M-2 */}
              {(hasScheduleM1 || hasScheduleM2) && (
                <TabsContent value="scheduleM" className="space-y-4 mt-4">
                  {hasScheduleM1 && (
                    <div className="space-y-3">
                      <div className="text-sm font-medium">Schedule M-1: Reconciliation of Income</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <DataRow label="Net Income per Books (1)" value={extractedData.scheduleM1?.netIncomePerBooks} highlight />
                        <DataRow label="Income on Books Not on Return (2)" value={extractedData.scheduleM1?.incomeOnBooksNotOnReturn} />
                        <DataRow label="Expenses on Books Not Deducted (3)" value={extractedData.scheduleM1?.expensesOnBooksNotDeducted} />
                        <DataRow label="Income on Return Not on Books (5)" value={extractedData.scheduleM1?.incomeOnReturnNotOnBooks} />
                        <DataRow label="Deductions Not Charged to Books (6)" value={extractedData.scheduleM1?.deductionsNotChargedToBooks} />
                        <DataRow label="Income per Schedule K (8)" value={extractedData.scheduleM1?.incomePerScheduleK} highlight />
                      </div>
                    </div>
                  )}

                  {hasScheduleM1 && hasScheduleM2 && <Separator />}

                  {hasScheduleM2 && (
                    <div className="space-y-3">
                      <div className="text-sm font-medium">Schedule M-2: Analysis of AAA</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <DataRow label="Beginning AAA (1)" value={extractedData.scheduleM2?.beginningAAA} />
                        <DataRow label="Ordinary Income (2)" value={extractedData.scheduleM2?.ordinaryIncome} />
                        <DataRow label="Other Additions (3)" value={extractedData.scheduleM2?.otherAdditions} />
                        <DataRow label="Loss/Deductions (4)" value={extractedData.scheduleM2?.lossDeductions} />
                        <DataRow label="Other Reductions (5)" value={extractedData.scheduleM2?.otherReductions} />
                        <DataRow label="Cash Distributions (7a)" value={extractedData.scheduleM2?.distributionsCash} highlight />
                        <DataRow label="Property Distributions (7b)" value={extractedData.scheduleM2?.distributionsProperty} />
                        <DataRow label="Ending AAA (8)" value={extractedData.scheduleM2?.endingAAA} highlight />
                        <DataRow label="Accumulated E&P" value={extractedData.scheduleM2?.accumulatedEP} />
                      </div>
                    </div>
                  )}
                </TabsContent>
              )}

              {/* COGS Details */}
              {hasCOGS && (
                <TabsContent value="cogs" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Form 1125-A: Cost of Goods Sold</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <DataRow label="Beginning Inventory (1)" value={extractedData.cogsDetails?.beginningInventory} />
                      <DataRow label="Purchases (2)" value={extractedData.cogsDetails?.purchases} />
                      <DataRow label="Cost of Labor (3)" value={extractedData.cogsDetails?.costOfLabor} />
                      <DataRow label="Section 263A Costs (4)" value={extractedData.cogsDetails?.additionalSection263ACosts} />
                      <DataRow label="Other Costs (5)" value={extractedData.cogsDetails?.otherCosts} />
                      <DataRow label="Ending Inventory (7)" value={extractedData.cogsDetails?.endingInventory} />
                    </div>
                    {extractedData.cogsDetails?.inventoryMethod && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Inventory Method:</span>
                        <span className="ml-2">{extractedData.cogsDetails.inventoryMethod}</span>
                      </div>
                    )}
                    <div className="p-2 bg-muted/30 rounded">
                      <div className="flex justify-between text-sm font-medium">
                        <span>Cost of Goods Sold (Line 8)</span>
                        <span>{formatCurrency(extractedData.costOfGoodsSold)}</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}

              {/* Entity Info */}
              <TabsContent value="entity" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    Entity Information
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Taxpayer Name:</span>
                      <span className="ml-2 font-medium">{extractedData.taxpayerName || '-'}</span>
                    </div>
                    {extractedData.ein && (
                      <div>
                        <span className="text-muted-foreground">EIN:</span>
                        <span className="ml-2">{extractedData.ein}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Form Type:</span>
                      <span className="ml-2">{formTypeLabel}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tax Year:</span>
                      <span className="ml-2">{extractedData.taxYear}</span>
                    </div>
                    {extractedData.naicsCode && (
                      <div>
                        <span className="text-muted-foreground">NAICS Code:</span>
                        <span className="ml-2">{extractedData.naicsCode}</span>
                      </div>
                    )}
                    {extractedData.accountingMethod && (
                      <div>
                        <span className="text-muted-foreground">Accounting Method:</span>
                        <span className="ml-2 capitalize">{extractedData.accountingMethod}</span>
                      </div>
                    )}
                    {extractedData.numberOfShareholders !== undefined && (
                      <div>
                        <span className="text-muted-foreground">Shareholders:</span>
                        <span className="ml-2">{extractedData.numberOfShareholders}</span>
                      </div>
                    )}
                    {extractedData.filingStatus && (
                      <div>
                        <span className="text-muted-foreground">Filing Status:</span>
                        <span className="ml-2">{extractedData.filingStatus}</span>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CollapsibleContent>
        </Collapsible>

        {/* Timestamp */}
        <p className="text-xs text-muted-foreground text-right">
          Analyzed: {new Date(analysis.analyzedAt).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
};

// Helper component for data rows
const DataRow = ({ 
  label, 
  value, 
  highlight = false 
}: { 
  label: string; 
  value: number | null | undefined; 
  highlight?: boolean 
}) => (
  <div className={`flex justify-between ${highlight ? 'font-medium bg-muted/30 p-1 rounded' : ''}`}>
    <span className="text-muted-foreground truncate mr-2">{label}:</span>
    <span className="whitespace-nowrap">{formatCurrency(value)}</span>
  </div>
);

// Helper component for balance sheet rows
const BalanceSheetRow = ({ 
  label, 
  beginning, 
  ending,
  highlight = false,
  negative = false,
  flagIfNonZero = false
}: { 
  label: string; 
  beginning: number | null | undefined; 
  ending: number | null | undefined;
  highlight?: boolean;
  negative?: boolean;
  flagIfNonZero?: boolean;
}) => {
  const change = (ending ?? 0) - (beginning ?? 0);
  const hasFlag = flagIfNonZero && ((beginning ?? 0) !== 0 || (ending ?? 0) !== 0);
  
  return (
    <TableRow className={highlight ? 'bg-muted/50 font-medium' : ''}>
      <TableCell className="text-sm">
        {label}
        {hasFlag && <AlertTriangle className="w-3 h-3 text-amber-500 inline ml-1" />}
      </TableCell>
      <TableCell className={`text-right text-sm ${negative ? 'text-muted-foreground' : ''}`}>
        {negative && beginning ? `(${formatCurrency(Math.abs(beginning))})` : formatCurrency(beginning)}
      </TableCell>
      <TableCell className={`text-right text-sm ${negative ? 'text-muted-foreground' : ''}`}>
        {negative && ending ? `(${formatCurrency(Math.abs(ending))})` : formatCurrency(ending)}
      </TableCell>
      <TableCell className={`text-right text-sm ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-500' : ''}`}>
        {beginning !== null && ending !== null ? (
          change !== 0 ? `${change > 0 ? '+' : ''}${formatCurrency(change)}` : '-'
        ) : '-'}
      </TableCell>
    </TableRow>
  );
};
