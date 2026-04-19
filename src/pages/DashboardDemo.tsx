/**
 * DashboardDemo — static demo dashboard at /dashboard/demo
 * Auth + ToS required. Tracks demo views for marketing.
 */
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DemoAuthGate } from "@/components/DemoAuthGate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Lock, FileEdit, ArrowRight } from "lucide-react";
import ShepiLogo from "@/components/ShepiLogo";

export default function DashboardDemo() {
  const navigate = useNavigate();

  return (
    <DemoAuthGate page="dashboard">
    <div className="min-h-screen bg-background">
      {/* Demo Banner */}
      <div className="bg-destructive/10 border-b border-destructive/20">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <p className="text-sm text-destructive font-medium">
            🎬 Demo mode — this is a preview of the Shepi dashboard. No real data.
          </p>
          <Link to="/auth">
            <Button size="sm" className="gap-2">
              Sign Up Free <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <ShepiLogo variant="dark" size="md" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              Explore a fully populated QoE analysis
            </span>
            <Link to="/auth">
              <Button size="sm" className="gap-2">
                Sign Up Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold">Your Projects</h1>
            <p className="text-muted-foreground">Manage your Quality of Earnings analyses</p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button className="gap-2" disabled>
                  <Plus className="w-4 h-4" /> New Project
                  <Lock className="w-3 h-3 ml-1" />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Sign up to create your own projects</TooltipContent>
          </Tooltip>
        </div>

        {/* Single mock project card */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            onClick={() => navigate("/wizard/demo")}
            className="cursor-pointer"
          >
            <Card className="hover:border-primary transition-colors h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">Acme Industrial Supply Co.</CardTitle>
                  <FileEdit className="w-5 h-5 text-muted-foreground shrink-0" />
                </div>
                <CardDescription>Buy-Side QoE Analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-muted-foreground">Buy-Side</span>
                  <span className="text-muted-foreground">Phase 7/7</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted-foreground">Jan 2022 – Dec 2024</span>
                  <span className="text-xs font-medium text-primary">Click to explore →</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Placeholder locked card */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-not-allowed">
                <Card className="opacity-40 h-full border-dashed">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg text-muted-foreground">Your project here</CardTitle>
                      <Lock className="w-5 h-5 text-muted-foreground shrink-0" />
                    </div>
                    <CardDescription>Sign up to create real projects</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-2 bg-muted rounded-full" />
                  </CardContent>
                </Card>
              </div>
            </TooltipTrigger>
            <TooltipContent>Sign up to create your own projects</TooltipContent>
          </Tooltip>
        </div>

        {/* CTA section */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Ready to run your own Quality of Earnings analysis?
          </p>
          <Link to="/auth">
            <Button size="lg" className="gap-2">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </main>
    </div>
    </DemoAuthGate>
  );
}
