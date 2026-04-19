import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { WizardSidebar } from "./WizardSidebar";
import { useState } from "react";

interface MobileWizardSidebarProps {
  currentPhase: number;
  currentSection: number;
  onNavigate: (phase: number, section: number) => void;
  inventoryEnabled?: boolean;
}

export const MobileWizardSidebar = ({
  currentPhase,
  currentSection,
  onNavigate,
  inventoryEnabled = false,
}: MobileWizardSidebarProps) => {
  const [open, setOpen] = useState(false);

  const handleNavigate = (phase: number, section: number) => {
    onNavigate(phase, section);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open wizard menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-72">
        <WizardSidebar
          currentPhase={currentPhase}
          currentSection={currentSection}
          onNavigate={handleNavigate}
          inventoryEnabled={inventoryEnabled}
        />
      </SheetContent>
    </Sheet>
  );
};
