import { useState, useEffect, useMemo, useRef } from "react";
import { OnboardingFlow } from "./OnboardingFlow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { 
  ChevronDown, 
  ChevronUp, 
  Calendar as CalendarIcon,
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  User, 
  Ban, 
  ExternalLink,
  Package,
  Sparkles,
  Upload,
  Loader2,
  FileText,
  Check,
  ChevronsUpDown
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  generatePeriods, 
  getYearRange, 
  getMaxEndMonth,
  MONTHS, 
  Period, 
  formatPeriodRange,
  createStubPeriods,
  calculatePeriodCoverage
} from "@/lib/periodUtils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CIMInsightsCard, type CIMInsights } from "./CIMInsightsCard";
import { FinancialCategoryLabelsCard } from "./FinancialCategoryLabelsCard";
import { WIPAccountMappingCard } from "./WIPAccountMappingCard";
import type { ProjectData } from "@/pages/Project";
import { QuickBooksSyncBadge } from "../shared/QuickBooksSyncBadge";

import { getIndustryLabels } from "@/lib/industryConfig";

// Currency options from template
const CURRENCY_OPTIONS = [
  { value: "USD $", label: "USD $" },
  { value: "CAD $", label: "CAD $" },
  { value: "GBP £", label: "GBP £" },
  { value: "AUD $", label: "AUD $" },
  { value: "NZD $", label: "NZD $" },
  { value: "MXN $", label: "MXN $" },
  { value: "EUR €", label: "EUR €" },
];

// Financial category label options (from QoE Template - Financials Descriptions Drop Down Options)
const FINANCIAL_LABEL_OPTIONS = {
  salesLabel: [
    { value: "Sales", label: "Sales", description: "Gross sales income from products/services" },
    { value: "Net sales", label: "Net sales", description: "Gross sales less returns, allowances, discounts" },
    { value: "Revenues", label: "Revenues", description: "Gross operating income from sales and services" },
    { value: "Net revenues", label: "Net revenues", description: "Gross revenues less allowances, returns, discounts" },
  ],
  cogsLabel: [
    { value: "Cost of goods sold", label: "Cost of goods sold", description: "Direct costs of acquiring/producing goods" },
    { value: "Cost of revenue", label: "Cost of revenue", description: "Includes COGS plus marketing, commissions, discounts" },
  ],
  operatingExpensesLabel: [
    { value: "Operating expenses", label: "Operating expenses", description: "Standard operating expenses" },
  ],
  interestLabel: [
    { value: "Interest expense", label: "Interest expense", description: "Interest expense separately disclosed" },
    { value: "Interest expense, net", label: "Interest expense, net", description: "Interest expense net of interest income" },
  ],
  depreciationLabel: [
    { value: "Depreciation and amortization expense", label: "Depreciation and amortization", description: "Both PP&E and intangible assets exist" },
    { value: "Depreciation expense", label: "Depreciation expense", description: "Only PP&E depreciation (no intangibles)" },
    { value: "Amortization expense", label: "Amortization expense", description: "Only amortization (no PP&E)" },
  ],
  taxesLabel: [
    { value: "Income taxes", label: "Income taxes", description: "Standard income taxes" },
    { value: "Income taxes, net", label: "Income taxes, net", description: "Income taxes net presentation" },
  ],
};

// Default financial labels
const DEFAULT_FINANCIAL_LABELS = {
  salesLabel: "Sales",
  cogsLabel: "Cost of goods sold",
  operatingExpensesLabel: "Operating expenses",
  interestLabel: "Interest expense, net",
  depreciationLabel: "Depreciation expense",
  taxesLabel: "Income taxes",
};

// Import checklist from shared utility
import { 
  getFilteredChecklist,
  isChecklistItemComplete,
  type DocumentTier,
  type ChecklistItem 
} from "@/lib/documentChecklist";

interface Document {
  id: string;
  account_type: string | null;
  period_start: string | null;
  period_end: string | null;
  processing_status: string | null;
}

type CoverageStatus = 'full' | 'partial' | 'none';

interface ProjectSetupSectionProps {
  project: ProjectData;
  updateProject: (updates: Partial<ProjectData>) => void;
  updateWizardData: (section: string, data: Record<string, unknown>) => void;
  dueDiligenceData: Record<string, unknown>;
  updateDueDiligenceData: (data: Record<string, unknown>) => void;
  onNavigate?: (phase: number, section: number) => void;
  onSave?: (overrides?: Partial<ProjectData>) => Promise<void>;
}

export const ProjectSetupSection = (props: ProjectSetupSectionProps) => {
  // Onboarding guard: show guided flow for new projects
  const settings = (props.project.wizard_data?.settings as Record<string, unknown>) || {};
  const onboardingComplete = settings.onboardingComplete as boolean;
  
  if (!onboardingComplete) {
    return (
      <OnboardingFlow
        project={props.project}
        updateProject={props.updateProject}
        updateWizardData={props.updateWizardData}
        onNavigate={props.onNavigate}
        onSave={props.onSave}
      />
    );
  }

  return <ProjectSetupSectionInner {...props} />;
};

const ProjectSetupSectionInner = ({
  project,
  updateProject,
  updateWizardData,
  dueDiligenceData,
  updateDueDiligenceData,
  onNavigate,
  onSave,
}: ProjectSetupSectionProps) => {
  // Get settings from wizard_data
  const settings = (project.wizard_data?.settings as Record<string, unknown>) || {};
  const inventoryEnabled = (settings.inventoryEnabled as boolean) || false;
  const wipEnabled = (settings.wipEnabled as boolean) || false;

  // Filter checklist based on conditional items (inventory/WIP only shows when enabled)
  const DD_CHECKLIST = useMemo(() => getFilteredChecklist(inventoryEnabled, wipEnabled), [inventoryEnabled, wipEnabled]);

  const updateSettings = (updates: Record<string, unknown>) => {
    updateWizardData("settings", { ...settings, ...updates });
  };
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-indexed
  const years = getYearRange();
  
  // Period range state
  const [startMonth, setStartMonth] = useState(1);
  const [startYear, setStartYear] = useState(currentYear - 2);
  const [endMonth, setEndMonth] = useState(12);
  const [endYear, setEndYear] = useState(currentYear);
  const [showAllPeriods, setShowAllPeriods] = useState(false);
  
  // Calculate max allowed end month based on selected end year
  const maxEndMonth = getMaxEndMonth(endYear);
  
  // Stub period state (month/year selects matching the main period style)
  const [includeStub, setIncludeStub] = useState(false);
  const [stubStartMonth, setStubStartMonth] = useState(1);
  const [stubStartYear, setStubStartYear] = useState(currentYear);
  const [stubEndMonth, setStubEndMonth] = useState(currentMonth);
  const [stubEndYear, setStubEndYear] = useState(currentYear);
  
  // Initialization flag to prevent race condition with period effects
  const [isInitialized, setIsInitialized] = useState(false);

  // Document checklist state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(true);
  
  // CIM insights state
  const [cimInsights, setCimInsights] = useState<CIMInsights | null>(null);
  const [uploadingCim, setUploadingCim] = useState(false);
  const [cimSynced, setCimSynced] = useState(false);
  const cimFileInputRef = useRef<HTMLInputElement>(null);
  
  // Industry combobox state
  const [industryOpen, setIndustryOpen] = useState(false);
  const [industrySearch, setIndustrySearch] = useState("");

  const checklist = (dueDiligenceData.checklist as Record<string, boolean>) || {};
  const checklistOverrides = (dueDiligenceData.checklistOverrides as Record<string, boolean>) || {};
  const notApplicable = (dueDiligenceData.notApplicable as Record<string, boolean>) || {};
  
  // Initialize period state from existing project data
  useEffect(() => {
    if (project.periods && Array.isArray(project.periods) && project.periods.length > 0) {
      const regularPeriods = (project.periods as unknown as Period[]).filter(p => !p.isStub);
      const stubPeriods = (project.periods as unknown as Period[]).filter(p => p.isStub);
      
      if (regularPeriods.length > 0) {
        const firstPeriod = regularPeriods[0];
        const lastPeriod = regularPeriods[regularPeriods.length - 1];
        
        if (typeof firstPeriod === 'object' && 'year' in firstPeriod && firstPeriod.year > 0) {
          setStartMonth(firstPeriod.month);
          setStartYear(firstPeriod.year);
        }
        if (typeof lastPeriod === 'object' && 'year' in lastPeriod && lastPeriod.year > 0) {
          setEndMonth(lastPeriod.month);
          setEndYear(lastPeriod.year);
        }
      }
      
      if (stubPeriods.length > 0) {
        const firstStub = stubPeriods[0];
        const lastStub = stubPeriods[stubPeriods.length - 1];
        if (firstStub.startDate && lastStub.endDate) {
          setIncludeStub(true);
          const [sy, sm] = firstStub.startDate.split('-').map(Number);
          setStubStartMonth(sm);
          setStubStartYear(sy);
          const [ey, em] = lastStub.endDate.split('-').map(Number);
          setStubEndMonth(em);
          setStubEndYear(ey);
        }
      }
    }
    setIsInitialized(true);
  }, []);

  // Auto-correct end month if it exceeds the maximum allowed for the selected end year
  useEffect(() => {
    if (!isInitialized) return; // Skip until initialized
    if (endMonth > maxEndMonth) {
      setEndMonth(maxEndMonth);
    }
  }, [isInitialized, endYear, endMonth, maxEndMonth]);

  // Generate periods when range changes
  useEffect(() => {
    if (!isInitialized) return; // Skip until initialized
    if (startYear > endYear || (startYear === endYear && startMonth > endMonth)) {
      return;
    }
    
    let periods = generatePeriods(startMonth, startYear, endMonth, endYear);
    
    if (includeStub) {
      const stubStart = new Date(stubStartYear, stubStartMonth - 1, 1);
      const stubEnd = new Date(stubEndYear, stubEndMonth, 0); // last day of end month
      if (stubStart < stubEnd) {
        const stubPeriods = createStubPeriods(stubStart, stubEnd);
        periods = [...periods, ...stubPeriods];
      }
    }
    
    updateProject({ periods: periods as unknown as string[] });
  }, [isInitialized, startMonth, startYear, endMonth, endYear, includeStub, stubStartMonth, stubStartYear, stubEndMonth, stubEndYear]);

  // Fetch documents + realtime subscription for live updates
  useEffect(() => {
    if (!project.id) return;

    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const { data: docs, error } = await supabase
          .from("documents")
          .select("id, account_type, period_start, period_end, processing_status")
          .eq("project_id", project.id)
          .limit(1000000);

        if (error) throw error;
        setDocuments(docs || []);
      } catch (error) {
        console.error("Error fetching documents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();

    // Subscribe to realtime changes so checklist updates when documents are uploaded/processed
    const channel = supabase
      .channel(`setup-docs-${project.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `project_id=eq.${project.id}`,
        },
        () => {
          // Re-fetch documents on any change
          fetchDocuments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [project.id]);

  // Fetch CIM insights and auto-apply if project fields are empty
  useEffect(() => {
    if (!project.id) return;

    const fetchCimInsights = async () => {
      try {
        const { data, error } = await supabase
          .from("processed_data")
          .select("data")
          .eq("project_id", project.id)
          .eq("data_type", "cim_insights")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data?.data) {
          const insights = data.data as unknown as CIMInsights;
          setCimInsights(insights);
          
          // Auto-apply CIM insights if key project fields are empty
          const needsSync = !project.industry && !project.target_company;
          if (needsSync && !cimSynced) {
            const { fieldsUpdated, updates } = autoFillFromCim(insights);
            if (fieldsUpdated > 0) {
              setCimSynced(true);
              // Auto-save with overrides to persist changes (bypasses async state timing)
              if (onSave && Object.keys(updates).length > 0) {
                await onSave(updates);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching CIM insights:", error);
      }
    };

    fetchCimInsights();
  }, [project.id]);

  // Auto-fill from CIM insights - returns both count and updates object
  const autoFillFromCim = (insights: CIMInsights): { fieldsUpdated: number; updates: Partial<ProjectData> } => {
    let fieldsUpdated = 0;
    const updates: Partial<ProjectData> = {};
    
    // Use CIM industry directly (no mapping needed with combobox)
    if (insights.marketPosition?.industry) {
      updates.industry = insights.marketPosition.industry;
      fieldsUpdated++;
    }
    
    // Try to extract company name - check multiple sources
    if (!project.target_company) {
      let companyName: string | null = null;
      
      // Method 1: Extract from businessOverview.description
      // Pattern: "Company Name is a..." or "Company Name, a..."
      if (insights.businessOverview?.description) {
        const descMatch = insights.businessOverview.description.match(
          /^([A-Z][A-Za-z0-9\s&'.-]+(?:\([A-Z]+\))?)\s+(?:is|are|,)\s/
        );
        if (descMatch) {
          companyName = descMatch[1].trim();
        }
      }
      
      // Method 2: Fallback to rawSummary with same pattern
      if (!companyName && insights.rawSummary) {
        const summaryMatch = insights.rawSummary.match(
          /^([A-Z][A-Za-z0-9\s&'.-]+(?:\([A-Z]+\))?)\s+(?:is|are|,)\s/
        );
        if (summaryMatch) {
          companyName = summaryMatch[1].trim();
        }
      }
      
      // Validate and set extracted name
      if (companyName && companyName.length > 2 && companyName.length < 100) {
        updates.target_company = companyName;
        fieldsUpdated++;
      }
    }
    
    // Update project fields (local state)
    if (Object.keys(updates).length > 0) {
      updateProject(updates);
    }
    
    // Build comprehensive notes from multiple CIM sections
    const notesParts: string[] = [];
    
    if (insights.businessOverview?.description) {
      notesParts.push(`**Business Overview:**\n${insights.businessOverview.description}`);
    }
    
    if (insights.businessOverview?.headquarters) {
      notesParts.push(`**Headquarters:** ${insights.businessOverview.headquarters}`);
    }
    
    if (insights.businessOverview?.foundedYear || insights.businessOverview?.employeeCount) {
      const details: string[] = [];
      if (insights.businessOverview.foundedYear) details.push(`Founded: ${insights.businessOverview.foundedYear}`);
      if (insights.businessOverview.employeeCount) details.push(`Employees: ${insights.businessOverview.employeeCount}`);
      notesParts.push(`**Company Details:** ${details.join(' | ')}`);
    }
    
    if (insights.dealContext?.reasonForSale) {
      notesParts.push(`**Reason for Sale:** ${insights.dealContext.reasonForSale}`);
    }
    
    if (insights.keyRisks && insights.keyRisks.length > 0) {
      notesParts.push(`**Key Risks:** ${insights.keyRisks.slice(0, 3).join('; ')}`);
    }
    
    if (insights.marketPosition?.competitiveAdvantages && insights.marketPosition.competitiveAdvantages.length > 0) {
      notesParts.push(`**Competitive Advantages:** ${insights.marketPosition.competitiveAdvantages.slice(0, 3).join('; ')}`);
    }
    
    if (notesParts.length > 0) {
      updateDueDiligenceData({
        ...dueDiligenceData,
        notes: `--- Auto-extracted from CIM ---\n\n${notesParts.join('\n\n')}`,
      });
      fieldsUpdated++;
    }
    
    return { fieldsUpdated, updates };
  };

  // Handle CIM file upload
  const handleCimUpload = async (file: File) => {
    setUploadingCim(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${project.id}/cim/${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);
      if (uploadError) throw uploadError;
      
      // Create document record
      const { data: doc, error: insertError } = await supabase
        .from("documents")
        .insert({
          project_id: project.id,
          user_id: user.id,
          name: file.name,
          file_path: filePath,
          file_type: fileExt,
          file_size: file.size,
          account_type: "cim",
          processing_status: "processing",
        })
        .select()
        .single();
      if (insertError) throw insertError;
      
      // Call parse-cim edge function
      const { data: parseResult, error: parseError } = await supabase.functions.invoke('parse-cim', {
        body: { documentId: doc.id, projectId: project.id }
      });
      
      if (parseError) throw parseError;
      
      if (parseResult?.insights) {
        setCimInsights(parseResult.insights);
        
        // Auto-apply to fields immediately
        const { fieldsUpdated, updates } = autoFillFromCim(parseResult.insights);
        setCimSynced(true);
        
        // Auto-save with overrides to persist changes (bypasses async state timing)
        if (onSave && fieldsUpdated > 0 && Object.keys(updates).length > 0) {
          await onSave(updates);
        }
        
        toast.success(
          `CIM parsed! ${fieldsUpdated} field${fieldsUpdated > 1 ? 's' : ''} auto-filled — please review for accuracy.`,
          { duration: 5000 }
        );
      }
    } catch (error) {
      console.error("CIM upload error:", error);
      toast.error("Failed to process CIM");
    } finally {
      setUploadingCim(false);
    }
  };

  // Handle sync from CIM (manual trigger)
  const handleSyncFromCim = async () => {
    if (!cimInsights) return;
    
    const { fieldsUpdated, updates } = autoFillFromCim(cimInsights);
    setCimSynced(true);
    
    if (fieldsUpdated > 0) {
      // Auto-save with overrides
      if (onSave && Object.keys(updates).length > 0) {
        await onSave(updates);
      }
      toast.success(`Synced ${fieldsUpdated} field${fieldsUpdated > 1 ? 's' : ''} from CIM — please review for accuracy.`);
    } else {
      toast.info("No fields to sync - all fields already have values");
    }
  };

  const periods = (project.periods as unknown as Period[]) || [];
  const regularPeriods = periods.filter(p => !p.isStub);
  const stubPeriod = periods.find(p => p.isStub);
  const displayPeriods = showAllPeriods ? regularPeriods : regularPeriods.slice(0, 6);

  // Checklist logic — uses shared isChecklistItemComplete for consistency
  const autoCheckStates = useMemo(() => {
    const states: Record<string, CoverageStatus> = {};
    const wizardData = project.wizard_data as Record<string, unknown>;

    DD_CHECKLIST.forEach((item) => {
      // Use shared completion check (covers wizard data + QB sync + uploaded docs)
      const isComplete = isChecklistItemComplete(item, wizardData, documents);

      if (isComplete) {
        states[item.id] = 'full';
        return;
      }

      // For period-coverage items, check partial coverage
      if (item.docType && item.needsPeriodCoverage && periods.length > 0) {
        const docsOfType = documents.filter(d => d.account_type === item.docType);
        if (docsOfType.length > 0) {
          const coverage = calculatePeriodCoverage(periods, docsOfType);
          states[item.id] = coverage.status as CoverageStatus;
          return;
        }
      }

      states[item.id] = 'none';
    });

    return states;
  }, [documents, periods, project.wizard_data]);

  const getEffectiveChecked = (itemId: string): boolean => {
    if (notApplicable[itemId]) return false;
    if (itemId in checklistOverrides) return checklistOverrides[itemId];
    if (autoCheckStates[itemId] === 'full') return true;
    return checklist[itemId] || false;
  };

  const getCheckSource = (itemId: string): 'na' | 'auto' | 'partial' | 'manual' | 'none' => {
    if (notApplicable[itemId]) return 'na';
    if (itemId in checklistOverrides) return 'manual';
    if (autoCheckStates[itemId] === 'full') return 'auto';
    if (autoCheckStates[itemId] === 'partial') return 'partial';
    return 'none';
  };

  const toggleItem = (itemId: string) => {
    if (notApplicable[itemId]) return;

    const currentEffective = getEffectiveChecked(itemId);
    const autoState = autoCheckStates[itemId];

    if (autoState === 'full') {
      if (currentEffective) {
        updateDueDiligenceData({
          ...dueDiligenceData,
          checklistOverrides: { ...checklistOverrides, [itemId]: false },
        });
      } else {
        const newOverrides = { ...checklistOverrides };
        delete newOverrides[itemId];
        updateDueDiligenceData({
          ...dueDiligenceData,
          checklistOverrides: newOverrides,
        });
      }
    } else {
      updateDueDiligenceData({
        ...dueDiligenceData,
        checklist: {
          ...checklist,
          [itemId]: !currentEffective,
        },
      });
    }
  };

  const toggleNA = (itemId: string) => {
    const isCurrentlyNA = notApplicable[itemId];
    
    if (isCurrentlyNA) {
      const newNA = { ...notApplicable };
      delete newNA[itemId];
      updateDueDiligenceData({ ...dueDiligenceData, notApplicable: newNA });
    } else {
      const newChecklist = { ...checklist };
      delete newChecklist[itemId];
      const newOverrides = { ...checklistOverrides };
      delete newOverrides[itemId];
      updateDueDiligenceData({
        ...dueDiligenceData,
        notApplicable: { ...notApplicable, [itemId]: true },
        checklist: newChecklist,
        checklistOverrides: newOverrides,
      });
    }
  };

  const getStatusBadge = (itemId: string) => {
    const source = getCheckSource(itemId);
    const item = DD_CHECKLIST.find(i => i.id === itemId);
    const hasDocType = item?.docType;
    const hasWizardCheck = item?.checkWizardSection;

    if (source === 'na') {
      return (
        <Badge variant="outline" className="text-xs gap-1 text-muted-foreground bg-muted/50">
          <Ban className="w-3 h-3" /> N/A
        </Badge>
      );
    }
    if (source === 'auto') {
      return (
        <Badge variant="default" className="bg-green-600 text-xs gap-1">
          <CheckCircle2 className="w-3 h-3" /> Auto
        </Badge>
      );
    }
    if (source === 'partial' && hasDocType) {
      return (
        <Badge variant="secondary" className="text-xs gap-1">
          <AlertCircle className="w-3 h-3" /> Partial
        </Badge>
      );
    }
    if (source === 'manual' && hasDocType) {
      return (
        <Badge variant="outline" className="text-xs gap-1">
          <User className="w-3 h-3" /> Override
        </Badge>
      );
    }
    if ((hasDocType || hasWizardCheck) && autoCheckStates[itemId] === 'none') {
      if (hasWizardCheck && item?.sectionNav && onNavigate) {
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className="text-xs gap-1 text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onNavigate(item.sectionNav!.phase, item.sectionNav!.section)}
                >
                  <ExternalLink className="w-3 h-3" /> Go to {item.sectionNav.label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Complete the {item.sectionNav.label} section to auto-check this item</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
      return (
        <Badge variant="outline" className="text-xs gap-1 text-muted-foreground">
          <Clock className="w-3 h-3" /> Awaiting
        </Badge>
      );
    }
    return null;
  };

  const stats = useMemo(() => {
    const byTier = (tier: DocumentTier) => {
      const items = DD_CHECKLIST.filter(i => i.tier === tier);
      const received = items.filter(item => !notApplicable[item.id] && getEffectiveChecked(item.id)).length;
      return { total: items.length, received };
    };
    const received = DD_CHECKLIST.filter(item => 
      !notApplicable[item.id] && getEffectiveChecked(item.id)
    ).length;
    const naCount = DD_CHECKLIST.filter(item => notApplicable[item.id]).length;
    const awaiting = DD_CHECKLIST.length - received - naCount;
    const required = byTier('required');
    const recommended = byTier('recommended');
    const optional = byTier('optional');
    return { received, naCount, awaiting, required, recommended, optional };
  }, [checklist, checklistOverrides, notApplicable, autoCheckStates]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold">Project Setup</h2>
        <p className="text-muted-foreground">
          Enter engagement details, contacts, and define the analysis period
        </p>
      </div>

      {/* Quick Start with CIM */}
      <Card className="border-dashed border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Quick Start with CIM
          </CardTitle>
          <CardDescription>
            Upload your CIM (Confidential Information Memorandum) to auto-fill project details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!cimInsights ? (
            <div className="space-y-4">
              {!uploadingCim ? (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag & drop your CIM or click to browse
                  </p>
                  <input 
                    ref={cimFileInputRef}
                    type="file" 
                    accept=".pdf,.docx,.doc"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCimUpload(file);
                    }}
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      cimFileInputRef.current?.click();
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Select CIM File
                  </Button>
                </div>
              ) : (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>
                    Extracting business insights from CIM...
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <Alert className="border-green-600/30 bg-green-600/5">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="flex items-center justify-between">
                  <span>CIM uploaded and parsed successfully!</span>
                  {!cimSynced && (
                    <Button variant="outline" size="sm" onClick={handleSyncFromCim}>
                      Apply to Fields
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
              <CIMInsightsCard insights={cimInsights} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Alert after CIM sync */}
      {cimSynced && (
        <Alert className="border-amber-500/30 bg-amber-500/5">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            <strong>Please review:</strong> Fields below were auto-filled from your CIM. 
            Verify the information is accurate and make any necessary corrections.
          </AlertDescription>
        </Alert>
      )}

      {/* Engagement Details */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Details</CardTitle>
          <CardDescription>Client and project information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="clientName">Client Name</Label>
            <Input
              id="clientName"
              placeholder="e.g., ABC Capital Partners"
              value={project.client_name || ""}
              onChange={(e) => updateProject({ client_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetCompany">Target Company</Label>
            <Input
              id="targetCompany"
              placeholder="e.g., XYZ Manufacturing Inc."
              value={project.target_company || ""}
              onChange={(e) => updateProject({ target_company: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="transactionType">Transaction Type</Label>
            <Select
              value={project.transaction_type || "buy-side"}
              onValueChange={(value) => updateProject({ transaction_type: value })}
            >
              <SelectTrigger id="transactionType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buy-side">Buy-Side</SelectItem>
                <SelectItem value="sell-side">Sell-Side</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="industry">Industry</Label>
              {cimSynced && cimInsights?.marketPosition?.industry && project.industry && (
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                  From CIM
                </Badge>
              )}
            </div>
            <Popover open={industryOpen} onOpenChange={setIndustryOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={industryOpen}
                  className="w-full justify-between font-normal"
                >
                  {project.industry || "Select industry..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 bg-background" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Search or type custom..." 
                    value={industrySearch} 
                    onValueChange={setIndustrySearch} 
                  />
                  <CommandList>
                    <CommandEmpty>
                      {industrySearch.trim() && (
                        <button
                          className="w-full px-4 py-2 text-left text-sm hover:bg-accent cursor-pointer"
                          onClick={() => {
                            updateProject({ industry: industrySearch.trim() });
                            setIndustryOpen(false);
                            setIndustrySearch("");
                          }}
                        >
                          Add "{industrySearch.trim()}"
                        </button>
                      )}
                    </CommandEmpty>
                    <CommandGroup>
                      {getIndustryLabels().map((label) => (
                        <CommandItem
                          key={label}
                          value={label}
                          onSelect={() => {
                            updateProject({ industry: label });
                            setIndustryOpen(false);
                            setIndustrySearch("");
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              project.industry === label ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., Dallas, TX"
              value={(dueDiligenceData.location as string) || ""}
              onChange={(e) => updateDueDiligenceData({ ...dueDiligenceData, location: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={(dueDiligenceData.currency as string) || "USD $"}
              onValueChange={(value) => updateDueDiligenceData({ ...dueDiligenceData, currency: value })}
            >
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Contacts - Optional Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Key Contacts</CardTitle>
              <CardDescription>For accounting firms managing client engagements</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="showContacts" className="text-sm text-muted-foreground">
                {Boolean(settings.showKeyContacts) ? "Enabled" : "Disabled"}
              </Label>
              <Switch
                id="showContacts"
                checked={Boolean(settings.showKeyContacts)}
                onCheckedChange={(checked) => updateSettings({ showKeyContacts: checked })}
              />
            </div>
          </div>
        </CardHeader>
        {Boolean(settings.showKeyContacts) && (
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="clientContact">Client Contact</Label>
              <Input
                id="clientContact"
                placeholder="Name"
                value={(dueDiligenceData.clientContact as string) || ""}
                onChange={(e) => updateDueDiligenceData({ ...dueDiligenceData, clientContact: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientEmail">Client Email</Label>
              <Input
                id="clientEmail"
                type="email"
                placeholder="email@example.com"
                value={(dueDiligenceData.clientEmail as string) || ""}
                onChange={(e) => updateDueDiligenceData({ ...dueDiligenceData, clientEmail: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetContact">Target Company Contact</Label>
              <Input
                id="targetContact"
                placeholder="Name"
                value={(dueDiligenceData.targetContact as string) || ""}
                onChange={(e) => updateDueDiligenceData({ ...dueDiligenceData, targetContact: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetEmail">Target Email</Label>
              <Input
                id="targetEmail"
                type="email"
                placeholder="email@example.com"
                value={(dueDiligenceData.targetEmail as string) || ""}
                onChange={(e) => updateDueDiligenceData({ ...dueDiligenceData, targetEmail: e.target.value })}
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Financial Category Labels - Gated by COA */}
      <FinancialCategoryLabelsCard
        project={project}
        dueDiligenceData={dueDiligenceData}
        updateDueDiligenceData={updateDueDiligenceData}
        onNavigate={onNavigate}
      />

      {/* Financial Periods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Financial Periods
          </CardTitle>
          <CardDescription>Define the analysis period range</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fiscalYearEnd">Fiscal Year End</Label>
            <Select
              value={project.fiscal_year_end || ""}
              onValueChange={(value) => updateProject({ fiscal_year_end: value })}
            >
              <SelectTrigger id="fiscalYearEnd" className="w-full md:w-[200px]">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Start Period</Label>
              <div className="flex gap-2">
                <Select
                  value={String(startMonth)}
                  onValueChange={(v) => setStartMonth(Number(v))}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month, idx) => (
                      <SelectItem key={month} value={String(idx + 1)}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={String(startYear)}
                  onValueChange={(v) => setStartYear(Number(v))}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>End Period</Label>
              <div className="flex gap-2">
                <Select
                  value={String(endMonth)}
                  onValueChange={(v) => setEndMonth(Number(v))}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month, idx) => {
                      const monthNum = idx + 1;
                      const isDisabled = monthNum > maxEndMonth;
                      return (
                        <SelectItem 
                          key={month} 
                          value={String(monthNum)}
                          disabled={isDisabled}
                          className={isDisabled ? "text-muted-foreground" : ""}
                        >
                          {month}
                          {isDisabled && " (future)"}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Select
                  value={String(endYear)}
                  onValueChange={(v) => setEndYear(Number(v))}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {endYear === currentYear && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Future months disabled – QuickBooks cannot sync data that doesn't exist yet
                </p>
              )}
            </div>
          </div>
          
          {/* Stub Period Section */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includeStub" 
                checked={includeStub}
                onCheckedChange={(checked) => setIncludeStub(checked === true)}
              />
              <Label htmlFor="includeStub" className="font-normal cursor-pointer">
                Include stub period (YTD / partial period)
              </Label>
            </div>
            
            {includeStub && (
              <div className="grid gap-4 md:grid-cols-2 pl-6">
                <div className="space-y-2">
                  <Label>Stub Start Period</Label>
                  <div className="flex gap-2">
                    <Select value={String(stubStartMonth)} onValueChange={(v) => setStubStartMonth(Number(v))}>
                      <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m, i) => (
                          <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={String(stubStartYear)} onValueChange={(v) => setStubStartYear(Number(v))}>
                      <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {years.map((y) => (
                          <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Stub End Period</Label>
                  <div className="flex gap-2">
                    <Select value={String(stubEndMonth)} onValueChange={(v) => setStubEndMonth(Number(v))}>
                      <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m, i) => (
                          <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={String(stubEndYear)} onValueChange={(v) => setStubEndYear(Number(v))}>
                      <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {years.map((y) => (
                          <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {(stubStartYear > stubEndYear || (stubStartYear === stubEndYear && stubStartMonth > stubEndMonth)) && (
                  <p className="text-sm text-destructive col-span-2">
                    End period must be after start period
                  </p>
                )}
              </div>
            )}
          </div>
          
          {startYear > endYear || (startYear === endYear && startMonth > endMonth) ? (
            <p className="text-sm text-destructive">
              End period must be after start period
            </p>
          ) : (
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Generated Periods: <span className="text-primary">{regularPeriods.length} months</span>
                  {stubPeriod && <span className="text-muted-foreground"> + 1 stub</span>}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatPeriodRange(periods)}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-1.5">
                {displayPeriods.map((period) => (
                  <Badge key={period.id} variant="secondary" className="text-xs">
                    {period.label}
                  </Badge>
                ))}
                {regularPeriods.length > 6 && !showAllPeriods && (
                  <Badge variant="outline" className="text-xs">
                    +{regularPeriods.length - 6} more
                  </Badge>
                )}
                {stubPeriod && (
                  <Badge variant="default" className="text-xs bg-primary/80">
                    {stubPeriod.label}
                  </Badge>
                )}
              </div>
              
              {regularPeriods.length > 6 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllPeriods(!showAllPeriods)}
                  className="h-8 px-2 text-xs"
                >
                  {showAllPeriods ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Show all {regularPeriods.length} periods
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Optional Sections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Optional Sections
          </CardTitle>
          <CardDescription>Enable or disable optional wizard sections based on business type</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div className="space-y-0.5">
              <Label htmlFor="inventoryEnabled" className="font-medium cursor-pointer">
                Track Inventory
              </Label>
              <p className="text-sm text-muted-foreground">
                Enable if the company holds inventory (raw materials, work-in-progress, finished goods)
              </p>
            </div>
            <Switch
              id="inventoryEnabled"
              checked={inventoryEnabled}
              onCheckedChange={(checked) => updateSettings({ inventoryEnabled: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div className="space-y-0.5">
              <Label htmlFor="wipEnabled" className="font-medium cursor-pointer">
                Track Work in Progress (WIP)
              </Label>
              <p className="text-sm text-muted-foreground">
                Enable for project-based or construction businesses with job costing, over/under billings
              </p>
            </div>
            <Switch
              id="wipEnabled"
              checked={wipEnabled}
              onCheckedChange={(checked) => updateSettings({ wipEnabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* WIP Account Mapping - only when WIP tracking is enabled */}
      {wipEnabled && (
        <WIPAccountMappingCard
          project={project}
          dueDiligenceData={dueDiligenceData}
          updateDueDiligenceData={updateDueDiligenceData}
          onNavigate={onNavigate}
        />
      )}

      {/* Document Request Checklist - Collapsible */}
      <Collapsible open={checklistOpen} onOpenChange={setChecklistOpen}>
        <Card>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <div>
                  <CardTitle>Document Request Checklist</CardTitle>
                  <CardDescription>
                    Required: {stats.required.received}/{stats.required.total} • Recommended: {stats.recommended.received}/{stats.recommended.total} • Optional: {stats.optional.received}/{stats.optional.total}
                    {stats.naCount > 0 && ` • ${stats.naCount} N/A`}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm">
                  {checklistOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              {(['required', 'recommended', 'optional'] as DocumentTier[]).map((tier) => {
                const tierItems = DD_CHECKLIST.filter(i => i.tier === tier);
                if (tierItems.length === 0) return null;
                const tierLabels = {
                  required: { label: 'Required', color: 'text-destructive', bg: 'bg-destructive/10' },
                  recommended: { label: 'Recommended', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20' },
                  optional: { label: 'Optional', color: 'text-muted-foreground', bg: 'bg-muted/30' },
                };
                const config = tierLabels[tier];
                return (
                  <div key={tier} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("text-xs", config.color)}>{config.label}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {tierItems.filter(i => !notApplicable[i.id] && getEffectiveChecked(i.id)).length}/{tierItems.length}
                      </span>
                    </div>
                    <div className={cn("rounded-lg p-2 space-y-1", config.bg)}>
                      {tierItems.map((item) => {
                        const isChecked = getEffectiveChecked(item.id);
                        const isNA = notApplicable[item.id];
                        return (
                          <div
                            key={item.id}
                            className={cn(
                              "flex items-center justify-between p-2 rounded-md transition-colors",
                              isNA && "opacity-60",
                              isChecked && !isNA && "bg-green-50 dark:bg-green-950/20"
                            )}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Checkbox
                                id={item.id}
                                checked={isChecked}
                                onCheckedChange={() => toggleItem(item.id)}
                                disabled={isNA}
                                className={cn(isNA && "opacity-50")}
                              />
                              <Label
                                htmlFor={item.id}
                                className={cn(
                                  "font-normal cursor-pointer truncate",
                                  isNA && "line-through text-muted-foreground"
                                )}
                              >
                                {item.label}
                              </Label>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {getStatusBadge(item.id)}
                              {item.canBeNA && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn("h-6 px-2 text-xs", isNA && "bg-muted")}
                                        onClick={() => toggleNA(item.id)}
                                      >
                                        N/A
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{isNA ? "Remove N/A status" : "Mark as Not Applicable"}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Notes */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Notes</CardTitle>
            {cimSynced && cimInsights?.businessOverview?.description && dueDiligenceData.notes && (
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                From CIM
              </Badge>
            )}
          </div>
          <CardDescription>Additional notes or comments</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter any additional notes..."
            value={(dueDiligenceData.notes as string) || ""}
            onChange={(e) => updateDueDiligenceData({ ...dueDiligenceData, notes: e.target.value })}
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  );
};
