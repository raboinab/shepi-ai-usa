import { cn } from "@/lib/utils";
import { CheckCircle, Circle, ChevronDown, ChevronRight, Edit3, Eye } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";


interface Section {
  id: number;
  name: string;
  type?: "write" | "read";
}

interface Subgroup {
  label: string;
  sections: Section[];
}

interface Phase {
  id: number;
  name: string;
  sections?: Section[];
  subgroups?: Subgroup[];
  type?: "input" | "report";
}

const WIZARD_PHASES: Phase[] = [
  {
    id: 1,
    name: "Project Setup",
    type: "input",
    sections: [
      { id: 1, name: "Project Setup", type: "write" },
    ],
  },
  {
    id: 2,
    name: "Core Data Entry",
    type: "input",
    sections: [
      { id: 1, name: "Chart of Accounts", type: "write" },
      { id: 2, name: "Trial Balance", type: "write" },
      { id: 3, name: "Document Upload", type: "write" },
    ],
  },
  {
    id: 3,
    name: "Adjustments & Schedules",
    type: "input",
    subgroups: [
      {
        label: "Adjustments",
        sections: [
          { id: 1, name: "DD Adjustments", type: "write" },
          { id: 2, name: "Reclassifications", type: "write" },
          { id: 3, name: "Journal Entries", type: "read" },
        ],
      },
      {
        label: "Schedules",
        sections: [
          { id: 4, name: "AR Aging", type: "write" },
          { id: 5, name: "AP Aging", type: "write" },
          { id: 6, name: "Fixed Assets", type: "write" },
          { id: 7, name: "Inventory", type: "write" },
          { id: 8, name: "Payroll", type: "write" },
          { id: 9, name: "Supplementary", type: "write" },
          { id: 10, name: "Material Contracts", type: "write" },
        ],
      },
    ],
  },
  {
    id: 4,
    name: "Customer & Vendor",
    type: "input",
    sections: [
      { id: 1, name: "Top Customers", type: "write" },
      { id: 2, name: "Top Vendors", type: "write" },
    ],
  },
  {
    id: 5,
    name: "Reports",
    type: "report",
    subgroups: [
      {
        label: "Financial Statements",
        sections: [
          { id: 1, name: "Income Statement", type: "read" },
          { id: 2, name: "Income Statement - Detailed", type: "read" },
          { id: 3, name: "Balance Sheet", type: "read" },
          { id: 4, name: "Balance Sheet - Detailed", type: "read" },
          { id: 5, name: "IS/BS Reconciliation", type: "read" },
        ],
      },
      {
        label: "Detail Schedules",
        sections: [
          { id: 6, name: "Sales Detail", type: "read" },
          { id: 7, name: "COGS Detail", type: "read" },
          { id: 8, name: "Operating Expenses", type: "read" },
          { id: 9, name: "Other Income/Expense", type: "read" },
        ],
      },
      {
        label: "QoE Reports",
        sections: [
           { id: 10, name: "QoE Analysis", type: "read" },
          { id: 11, name: "QoE Summary", type: "read" },
        ],
      },
      {
        label: "Working Capital",
        sections: [
          { id: 12, name: "Working Capital", type: "read" },
          { id: 13, name: "NWC Analysis", type: "read" },
          { id: 14, name: "Cash Analysis", type: "read" },
          { id: 15, name: "Other Current Assets", type: "read" },
          { id: 16, name: "Other Current Liabilities", type: "read" },
        ],
      },
      {
        label: "Supporting",
        sections: [
          { id: 17, name: "Proof of Cash", type: "write" },
          { id: 18, name: "Free Cash Flow", type: "read" },
        ],
      },
    ],
  },
  {
    id: 6,
    name: "Deliverables",
    type: "report",
    sections: [
      { id: 1, name: "QoE Executive Summary", type: "read" },
      { id: 2, name: "Financial Reports", type: "read" },
      { id: 3, name: "Analysis Reports", type: "read" },
      { id: 4, name: "Export Center", type: "write" },
    ],
  },
];

interface WizardSidebarProps {
  currentPhase: number;
  currentSection: number;
  onNavigate: (phase: number, section: number) => void;
  inventoryEnabled?: boolean;
}

export const WizardSidebar = ({
  currentPhase,
  currentSection,
  onNavigate,
  inventoryEnabled = false,
}: WizardSidebarProps) => {
  const [expandedPhases, setExpandedPhases] = useState<number[]>([currentPhase]);

  const togglePhase = (phaseId: number) => {
    setExpandedPhases((prev) =>
      prev.includes(phaseId)
        ? prev.filter((id) => id !== phaseId)
        : [...prev, phaseId]
    );
  };

  const isPhaseComplete = (phaseId: number) => phaseId < currentPhase;
  const isSectionComplete = (phaseId: number, sectionId: number) => {
    if (phaseId < currentPhase) return true;
    if (phaseId === currentPhase && sectionId < currentSection) return true;
    return false;
  };

  return (
    <aside className="w-72 md:border-r border-border bg-card overflow-y-auto flex-shrink-0 flex flex-col h-full">
      <div className="p-4 flex-1 overflow-y-auto">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          QoE Wizard
        </h2>
        <nav className="space-y-1">
          {WIZARD_PHASES.map((phase) => {
            const isExpanded = expandedPhases.includes(phase.id);
            const isComplete = isPhaseComplete(phase.id);
            const isCurrent = phase.id === currentPhase;
            const isReportPhase = phase.type === "report";

            // Filter subgroups to hide Inventory when disabled
            const filteredSubgroups = phase.subgroups?.map(sg => ({
              ...sg,
              sections: sg.sections.filter(s => {
                // Hide Inventory section (id: 7 in Schedules subgroup of phase 3) when not enabled
                if (phase.id === 3 && s.name === "Inventory" && !inventoryEnabled) {
                  return false;
                }
                return true;
              })
            }));

            return (
              <div key={phase.id}>
                <button
                  onClick={() => togglePhase(phase.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isCurrent
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {isComplete ? (
                      <CheckCircle className="w-4 h-4 text-primary" />
                    ) : (
                      <Circle className={cn("w-4 h-4", isCurrent ? "text-primary" : "text-muted-foreground")} />
                    )}
                    <span>{phase.name}</span>
                    {isReportPhase && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        <Eye className="w-3 h-3" />
                      </Badge>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 flex-shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    {filteredSubgroups ? (
                      // Render with subgroup labels
                      filteredSubgroups.map((subgroup, sgIndex) => (
                        <div key={subgroup.label}>
                          {sgIndex > 0 && <div className="h-2" />}
                          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1">
                            {subgroup.label}
                          </div>
                          {subgroup.sections.map((section) => {
                            const sectionComplete = isSectionComplete(phase.id, section.id);
                            const isCurrentSection =
                              phase.id === currentPhase && section.id === currentSection;
                            const isReadOnly = section.type === "read";

                            return (
                              <button
                                key={section.id}
                                onClick={() => onNavigate(phase.id, section.id)}
                                className={cn(
                                  "w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                                  isCurrentSection
                                    ? "bg-primary text-primary-foreground"
                                    : sectionComplete
                                    ? "text-muted-foreground hover:text-foreground"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                              >
                                {isReadOnly ? (
                                  <Eye className="w-3 h-3 flex-shrink-0" />
                                ) : sectionComplete ? (
                                  <CheckCircle className="w-3 h-3 flex-shrink-0" />
                                ) : (
                                  <Edit3 className="w-3 h-3 flex-shrink-0" />
                                )}
                                <span>{section.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      ))
                    ) : (
                      // Render flat sections
                      phase.sections?.map((section) => {
                        const sectionComplete = isSectionComplete(phase.id, section.id);
                        const isCurrentSection =
                          phase.id === currentPhase && section.id === currentSection;
                        const isReadOnly = section.type === "read";

                        return (
                          <button
                            key={section.id}
                            onClick={() => onNavigate(phase.id, section.id)}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                              isCurrentSection
                                ? "bg-primary text-primary-foreground"
                                : sectionComplete
                                ? "text-muted-foreground hover:text-foreground"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            {isReadOnly ? (
                              <Eye className="w-3 h-3 flex-shrink-0" />
                            ) : sectionComplete ? (
                              <CheckCircle className="w-3 h-3 flex-shrink-0" />
                            ) : (
                              <Edit3 className="w-3 h-3 flex-shrink-0" />
                            )}
                            <span>{section.name}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
      
    </aside>
  );
};
