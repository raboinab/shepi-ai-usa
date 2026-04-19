import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import {
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronsUpDown,
  Upload,
  Loader2,
  Sparkles,
  FileText,
  Calendar as CalendarIcon,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { QUICKBOOKS_CLOUD_RUN_URL } from "@/lib/externalApiUrls";
import { QuickBooksButton } from "@/components/QuickBooksButton";
import { INDUSTRIES } from "@/lib/industryConfig";
import {
  generatePeriods,
  getYearRange,
  getMaxEndMonth,
  MONTHS,
  createStubPeriods,
} from "@/lib/periodUtils";
import { format } from "date-fns";
import type { ProjectData } from "@/pages/Project";
import type { CIMInsights } from "./CIMInsightsCard";

interface OnboardingFlowProps {
  project: ProjectData;
  updateProject: (updates: Partial<ProjectData>) => void;
  updateWizardData: (section: string, data: Record<string, unknown>) => void;
  onNavigate?: (phase: number, section: number) => void;
  onSave?: (overrides?: Partial<ProjectData>) => Promise<void>;
}

export const OnboardingFlow = ({
  project,
  updateProject,
  updateWizardData,
  onNavigate,
  onSave,
}: OnboardingFlowProps) => {
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState<string>("");
  
  // Step 1 state
  const currentYear = new Date().getFullYear();
  const years = getYearRange();
  const [startMonth, setStartMonth] = useState(1);
  const [startYear, setStartYear] = useState(currentYear - 2);
  const [endMonth, setEndMonth] = useState(12);
  const [endYear, setEndYear] = useState(currentYear);
  const [includeStub, setIncludeStub] = useState(false);
  const [stubStartDate, setStubStartDate] = useState<Date | undefined>(undefined);
  const [stubEndDate, setStubEndDate] = useState<Date | undefined>(undefined);
  const [industryOpen, setIndustryOpen] = useState(false);
  const [industrySearch, setIndustrySearch] = useState("");
  
  // Step 2 state
  const [uploadingCim, setUploadingCim] = useState(false);
  const [cimUploaded, setCimUploaded] = useState(false);
  const [qbConnected, setQbConnected] = useState(false);
  const cimFileInputRef = useRef<HTMLInputElement>(null);

  const maxEndMonth = getMaxEndMonth(endYear);

  // Get userId on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  // QB connection check (for auto-complete watcher)
  const checkQbConnection = useCallback(async () => {
    if (!project.id) return;
    try {
      const response = await fetch(
        `${QUICKBOOKS_CLOUD_RUN_URL}/check-connection?projectId=${encodeURIComponent(project.id)}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.connected && !qbConnected) {
          setQbConnected(true);
          toast.success(`Connected to ${data.companyName || "QuickBooks"}!`);
          completeOnboarding({ phase: 2, section: 1 });
        }
      }
    } catch {}
  }, [project.id, qbConnected]);

  // Auto-correct end month if it exceeds max
  useEffect(() => {
    if (endMonth > maxEndMonth) {
      setEndMonth(maxEndMonth);
    }
  }, [endYear, endMonth, maxEndMonth]);

  // Initialize from existing project periods
  useEffect(() => {
    if (project.periods && Array.isArray(project.periods) && project.periods.length > 0) {
      const periods = project.periods as unknown as Array<{ year: number; month: number; isStub?: boolean; startDate?: string; endDate?: string }>;
      const regular = periods.filter(p => !p.isStub);
      const stubs = periods.filter(p => p.isStub);
      
      if (regular.length > 0) {
        const first = regular[0];
        const last = regular[regular.length - 1];
        if (first.year > 0) { setStartMonth(first.month); setStartYear(first.year); }
        if (last.year > 0) { setEndMonth(last.month); setEndYear(last.year); }
      }
      
      if (stubs.length > 0 && stubs[0].startDate && stubs[stubs.length - 1].endDate) {
        setIncludeStub(true);
        const [sy, sm, sd] = stubs[0].startDate.split('-').map(Number);
        setStubStartDate(new Date(sy, sm - 1, sd));
        const [ey, em, ed] = stubs[stubs.length - 1].endDate!.split('-').map(Number);
        setStubEndDate(new Date(ey, em - 1, ed));
      }
    }
  }, []);

  // Save period config and move to step 2
  const handleStep1Next = async () => {
    if (startYear > endYear || (startYear === endYear && startMonth > endMonth)) {
      toast.error("Start date must be before end date");
      return;
    }

    let periods = generatePeriods(startMonth, startYear, endMonth, endYear);
    if (includeStub && stubStartDate && stubEndDate && stubStartDate < stubEndDate) {
      const stubPeriods = createStubPeriods(stubStartDate, stubEndDate);
      periods = [...periods, ...stubPeriods];
    }

    updateProject({ periods: periods as unknown as string[] });
    
    if (onSave) {
      await onSave({ periods: periods as unknown as string[] });
    }
    
    setStep(2);
  };

  // CIM upload handler
  const handleCimUpload = async (file: File) => {
    setUploadingCim(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${project.id}/cim/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);
      if (uploadError) throw uploadError;

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

      const { data: parseResult, error: parseError } = await supabase.functions.invoke('parse-cim', {
        body: { documentId: doc.id, projectId: project.id }
      });
      if (parseError) throw parseError;

      if (parseResult?.insights) {
        const insights = parseResult.insights as CIMInsights;
        const updates: Partial<ProjectData> = {};
        
        if (insights.marketPosition?.industry) {
          updates.industry = insights.marketPosition.industry;
        }
        if (!project.target_company && insights.businessOverview?.description) {
          const match = insights.businessOverview.description.match(
            /^([A-Z][A-Za-z0-9\s&'.-]+(?:\([A-Z]+\))?)\s+(?:is|are|,)\s/
          );
          if (match && match[1].length > 2 && match[1].length < 100) {
            updates.target_company = match[1].trim();
          }
        }
        
        if (Object.keys(updates).length > 0) {
          updateProject(updates);
          if (onSave) await onSave(updates);
        }
        
        setCimUploaded(true);
        toast.success("CIM parsed! Project details updated.");
      }
    } catch (error) {
      console.error("CIM upload error:", error);
      toast.error("Failed to process CIM");
    } finally {
      setUploadingCim(false);
    }
  };

  // Complete onboarding
  const completeOnboarding = async (navigateToSection?: { phase: number; section: number }) => {
    const settings = (project.wizard_data?.settings as Record<string, unknown>) || {};
    const updatedSettings = { ...settings, onboardingComplete: true };
    updateWizardData("settings", updatedSettings);
    
    if (onSave) {
      await onSave({
        wizard_data: {
          ...project.wizard_data,
          settings: updatedSettings,
        },
      });
    }
    
    if (navigateToSection && onNavigate) {
      onNavigate(navigateToSection.phase, navigateToSection.section);
    } else if (onNavigate) {
      onNavigate(2, 1); // Default: Phase 2 Chart of Accounts
    }
  };

  // Poll for QB connection change to auto-complete onboarding
  useEffect(() => {
    if (step !== 2) return;
    checkQbConnection();
    const interval = setInterval(checkQbConnection, 5000);
    return () => clearInterval(interval);
  }, [step, checkQbConnection]);

  const industryLabels = INDUSTRIES.map(i => i.label);

  return (
    <div className="flex items-start justify-center min-h-full py-8 px-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Step {step} of 2</span>
            <span>{step === 1 ? "Review Period" : "Get Your Data In"}</span>
          </div>
          <Progress value={step * 50} className="h-2" />
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Review Period & Industry</CardTitle>
              <CardDescription>
                Set the analysis period and industry for{" "}
                <span className="font-medium text-foreground">
                  {project.target_company || project.name}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Industry combobox */}
              <div className="space-y-2">
                <Label>Industry</Label>
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
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search industries..."
                        value={industrySearch}
                        onValueChange={setIndustrySearch}
                      />
                      <CommandList>
                        <CommandEmpty>No industry found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {industryLabels.map((label) => (
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

              {/* Period selectors */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Month</Label>
                  <Select value={String(startMonth)} onValueChange={(v) => setStartMonth(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m, i) => (
                        <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Start Year</Label>
                  <Select value={String(startYear)} onValueChange={(v) => setStartYear(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>End Month</Label>
                  <Select value={String(endMonth)} onValueChange={(v) => setEndMonth(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m, i) => (
                        <SelectItem key={i} value={String(i + 1)} disabled={i + 1 > maxEndMonth}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>End Year</Label>
                  <Select value={String(endYear)} onValueChange={(v) => setEndYear(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Fiscal year end */}
              <div className="space-y-2">
                <Label>Fiscal Year End</Label>
                <Select
                  value={project.fiscal_year_end || "12"}
                  onValueChange={(v) => updateProject({ fiscal_year_end: v })}
                >
                  <SelectTrigger><SelectValue placeholder="December" /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => (
                      <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Stub period toggle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Include stub period</Label>
                  <Switch checked={includeStub} onCheckedChange={setIncludeStub} />
                </div>
                {includeStub && (
                  <div className="grid grid-cols-2 gap-4 pl-1">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Stub Start</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {stubStartDate ? format(stubStartDate, "PPP") : "Pick date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={stubStartDate} onSelect={setStubStartDate} />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Stub End</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {stubEndDate ? format(stubEndDate, "PPP") : "Pick date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={stubEndDate} onSelect={setStubEndDate} />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
              </div>

              <Button className="w-full gap-2" onClick={handleStep1Next}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {/* CIM Upload (optional) */}
            <Card className="border-dashed border-primary/30 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Upload a CIM
                  <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                </CardTitle>
                <CardDescription>
                  Auto-fill industry, target company, and key details from your Confidential Information Memorandum
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cimUploaded ? (
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <Check className="h-4 w-4" />
                    CIM uploaded and parsed
                  </div>
                ) : uploadingCim ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Parsing CIM...
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => cimFileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload your CIM (PDF)
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
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Data source choice */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Choose how to get your data in</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* QuickBooks card */}
                <Card className="sm:col-span-2 hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Connect QuickBooks</CardTitle>
                    <CardDescription className="text-xs">
                      Fastest path. We'll pull your Chart of Accounts and Trial Balance automatically. You'll still upload bank statements and other docs later.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <QuickBooksButton
                        projectId={project.id}
                        userId={userId}
                        periods={project.periods as any}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Upload documents card */}
                <Card className="hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Upload Documents</CardTitle>
                    <CardDescription className="text-xs">
                      Upload your financial statements, bank statements, and supporting documents manually.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => completeOnboarding({ phase: 2, section: 3 })}
                    >
                      <FileText className="h-4 w-4" />
                      Upload Documents
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Back + Skip */}
            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                variant="link"
                size="sm"
                className="text-muted-foreground"
                onClick={() => completeOnboarding()}
              >
                Skip for now
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
