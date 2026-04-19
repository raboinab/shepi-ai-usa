import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface WelcomeBackBannerProps {
  userId: string;
  projects: { id: string; name: string; current_phase: number; status: string }[];
}

export function WelcomeBackBanner({ userId, projects }: WelcomeBackBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if already dismissed this session
    const key = `welcome_back_dismissed_${userId}`;
    if (sessionStorage.getItem(key)) return;

    // Show if no projects or all projects are still in draft phase 1
    const hasIncompleteOnly = projects.length === 0 ||
      projects.every((p) => p.status === 'draft' && p.current_phase <= 1);

    setShow(hasIncompleteOnly);
  }, [userId, projects]);

  if (!show || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(`welcome_back_dismissed_${userId}`, 'true');
  };

  const incompleteProject = projects.find((p) => p.status === 'draft');

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="flex items-center justify-between py-4 px-6">
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Welcome back! 👋</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {incompleteProject
              ? `Continue setting up "${incompleteProject.name}" — connect your data and generate your QoE report.`
              : 'Create your first project to start your Quality of Earnings analysis.'}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          {incompleteProject ? (
            <Link to={`/project/${incompleteProject.id}`}>
              <Button size="sm" className="gap-1">
                Continue <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          ) : (
            <Button size="sm" className="gap-1" onClick={() => {
              // Trigger create dialog - parent handles this
              document.querySelector<HTMLButtonElement>('[data-create-project]')?.click();
            }}>
              Create Project <ArrowRight className="h-3 w-3" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
