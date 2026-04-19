import { useState, useEffect } from "react";
import { WelcomeBackBanner } from "@/components/WelcomeBackBanner";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { Plus, FolderOpen, LogOut, Clock, CheckCircle, FileEdit, Archive, CreditCard, Lock, User as UserIcon, Trash2, Users } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import ShepiLogo from "@/components/ShepiLogo";
import { PRICING } from "@/lib/pricing";
import { clearOAuthProcessedFlag } from "@/lib/authUtils";
import type { User } from "@supabase/supabase-js";
import { TermsAcceptanceModal } from "@/components/TermsAcceptanceModal";
import { useTosAcceptance } from "@/hooks/useTosAcceptance";
import { trackEvent } from "@/lib/analytics";

interface Project {
  id: string;
  name: string;
  client_name: string | null;
  target_company: string | null;
  transaction_type: string | null;
  status: string;
  current_phase: number;
  created_at: string;
  updated_at: string;
  funded_by_credit: boolean;
  user_id: string;
}

const statusIcons = {
  draft: Clock,
  "in-progress": FileEdit,
  completed: CheckCircle,
  archived: Archive,
};

const Dashboard = () => {
  useSEO({ title: "Dashboard — shepi", noindex: true });

  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [overageDialogOpen, setOverageDialogOpen] = useState(false);
  const [selectedProjectForPayment, setSelectedProjectForPayment] = useState<Project | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [tosModalOpen, setTosModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [newProject, setNewProject] = useState({
    name: "",
    client_name: "",
    target_company: "",
    transaction_type: "buy-side",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hasActiveSubscription, paidProjects, projectCredits, activeProjectCount, monthlyProjectLimit, loading: subscriptionLoading, hasAccessToProject, canCreateProjects, isAtMonthlyLimit, checkSubscription } = useSubscription();
  const { hasAccepted, loading: tosLoading } = useTosAcceptance();

  useEffect(() => {
    // Check for payment success
    if (searchParams.get("payment") === "success") {
      toast({ title: "Payment successful!", description: "Thank you for your purchase." });
      checkSubscription();
    }
  }, [searchParams, checkSubscription]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      } else {
        fetchProjects(session.user);
      }
    });
  }, [navigate]);

  const fetchProjects = async (currentUser?: any) => {
    setLoading(true);
    try {
      // Parallelize: fetch projects + shares at the same time
      const [projectsRes, sharesRes] = await Promise.all([
        supabase
          .from("projects")
          .select("id, name, client_name, target_company, transaction_type, status, current_phase, created_at, updated_at, funded_by_credit, user_id")
          .order("updated_at", { ascending: false }),
        supabase
          .from('project_shares')
          .select('project_id'),
      ]);

      if (projectsRes.error) {
        toast({
          title: "Error loading projects",
          description: projectsRes.error.message,
          variant: "destructive",
        });
      } else {
        const currentUserId = currentUser?.id ?? user?.id;
        const sharedIds = new Set((sharesRes.data || []).map((s: any) => s.project_id));
        const myProjects = (projectsRes.data || []).filter(
          (p) => p.user_id === currentUserId || sharedIds.has(p.id)
        );
        setProjects(myProjects);
      }
    } catch (err) {
      toast({
        title: "Error loading projects",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      toast({
        title: "Project name required",
        description: "Please enter a name for your project.",
        variant: "destructive",
      });
      return;
    }

    // Monthly subscribers at their 3-project limit: show overage dialog
    if (isAtMonthlyLimit()) {
      setCreateDialogOpen(false);
      setOverageDialogOpen(true);
      return;
    }

    // Check if user has subscription or a project credit
    if (!canCreateProjects()) {
      toast({
        title: "Subscription required",
        description: "You need an active subscription or a project credit to create new projects.",
        variant: "destructive",
      });
      setCreateDialogOpen(false);
      navigate("/pricing");
      return;
    }

    // Gate on ToS acceptance for credit-consuming creates (non-subscription)
    const useCredit = !hasActiveSubscription && projectCredits > 0;
    if (useCredit && !hasAccepted) {
      setPendingAction(() => () => doCreateProject(useCredit));
      setCreateDialogOpen(false);
      setTosModalOpen(true);
      return;
    }

    await doCreateProject(useCredit);
  };

  const doCreateProject = async (useCredit: boolean) => {
    // Check if the user's credit is for done_for_you service
    let serviceTier = 'diy';
    if (useCredit) {
      const { data: creditData } = await supabase
        .from("user_credits")
        .select("credit_type")
        .eq("user_id", user?.id)
        .single();
      if (creditData?.credit_type === 'done_for_you') {
        serviceTier = 'done_for_you';
      }
    }

    const { data, error } = await supabase
      .from("projects")
      .insert({
        user_id: user?.id,
        name: newProject.name,
        client_name: newProject.client_name || null,
        target_company: newProject.target_company || null,
        transaction_type: newProject.transaction_type,
        funded_by_credit: useCredit,
        service_tier: serviceTier,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error creating project",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // If a credit was used, decrement it and set 90-day expiry on the project
    if (useCredit) {
      const newCredits = projectCredits - 1;
      const creditExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
      await Promise.all([
        supabase
          .from("user_credits")
          .update({ credits_remaining: newCredits, credit_type: 'per_project' })
          .eq("user_id", user?.id),
        supabase
          .from("projects")
          .update({ credit_expires_at: creditExpiresAt })
          .eq("id", data.id),
      ]);
      console.log('[Dashboard] Credit consumed, remaining:', newCredits, 'expires:', creditExpiresAt);
    }

    trackEvent("project_created", {
      project_id: data.id,
      service_tier: serviceTier,
      funded_by_credit: useCredit,
      transaction_type: newProject.transaction_type,
    });

    toast({
      title: "Project created!",
    });

    setCreateDialogOpen(false);
    setNewProject({ name: "", client_name: "", target_company: "", transaction_type: "buy-side" });
    navigate(`/project/${data.id}`);
  };

  const handleProjectClick = (project: Project) => {
    if (hasAccessToProject(project.id)) {
      navigate(`/project/${project.id}`);
    } else {
      setSelectedProjectForPayment(project);
      setPaymentDialogOpen(true);
    }
  };

  const handlePayForProject = async () => {
    if (!selectedProjectForPayment) return;

    if (!hasAccepted) {
      setPendingAction(() => () => doPayForProject());
      setPaymentDialogOpen(false);
      setTosModalOpen(true);
      return;
    }

    await doPayForProject();
  };

  const doPayForProject = async () => {
    if (!selectedProjectForPayment) return;
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planType: 'per_project', projectId: selectedProjectForPayment.id }
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start checkout",
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(false);
      setPaymentDialogOpen(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open subscription management",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' });
    clearOAuthProcessedFlag();
    navigate("/");
  };

  const handleDeleteProject = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectToDelete.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Project deleted", description: "Your project has been permanently deleted." });
      fetchProjects();
    }
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <TermsAcceptanceModal
        open={tosModalOpen}
        onOpenChange={setTosModalOpen}
        onAccepted={() => {
          if (pendingAction) {
            pendingAction();
            setPendingAction(null);
          }
        }}
      />
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <ShepiLogo variant="dark" size="md" />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/account">
              <Button variant="outline" size="sm" className="gap-2">
                <UserIcon className="w-4 h-4" /> Account
              </Button>
            </Link>
            <span className="text-muted-foreground text-sm">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Subscription Status Banner */}
      {!subscriptionLoading && !hasActiveSubscription && (
        <div className="bg-primary/10 border-b border-primary/20">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              <span className="text-sm">
                You don't have an active subscription. Subscribe to create unlimited projects.
              </span>
            </div>
            <Link to="/pricing">
              <Button size="sm">View Plans</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {user && (
          <WelcomeBackBanner
            userId={user.id}
            projects={projects.map((p) => ({ id: p.id, name: p.name, current_phase: p.current_phase, status: p.status }))}
          />
        )}
        <div className="flex items-center justify-between mb-8 mt-4">
          <div>
            <h1 className="text-3xl font-serif font-bold">Your Projects</h1>
            <p className="text-muted-foreground">Manage your Quality of Earnings analyses</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" disabled={!canCreateProjects()}>
                <Plus className="w-4 h-4" /> New Project
                {!canCreateProjects() && <Lock className="w-3 h-3 ml-1" />}
                {!hasActiveSubscription && projectCredits > 0 && (
                  <span className="ml-1 text-xs bg-primary-foreground/20 px-1 rounded">{projectCredits} credit{projectCredits !== 1 ? 's' : ''}</span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New QoE Project</DialogTitle>
                <DialogDescription>
                  Set up the basic information for your analysis
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name *</Label>
                  <Input
                    id="projectName"
                    placeholder="e.g., Q4 2024 Acquisition Analysis"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input
                    id="clientName"
                    placeholder="e.g., ABC Capital Partners"
                    value={newProject.client_name}
                    onChange={(e) => setNewProject({ ...newProject, client_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetCompany">Target Company</Label>
                  <Input
                    id="targetCompany"
                    placeholder="e.g., XYZ Manufacturing Inc."
                    value={newProject.target_company}
                    onChange={(e) => setNewProject({ ...newProject, target_company: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transactionType">Transaction Type</Label>
                  <Select
                    value={newProject.transaction_type}
                    onValueChange={(value) => setNewProject({ ...newProject, transaction_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy-side">Buy-Side</SelectItem>
                      <SelectItem value="sell-side">Sell-Side</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={handleCreateProject}>
                  Create Project
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-full"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                {canCreateProjects()
                  ? projectCredits > 0 && !hasActiveSubscription
                    ? `You have ${projectCredits} project credit${projectCredits !== 1 ? 's' : ''} — create your first project`
                    : "Create your first QoE project to get started"
                  : "Subscribe to create your first QoE project"}
              </p>
              {canCreateProjects() ? (
                <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" /> Create Project
                </Button>
              ) : (
                <Link to="/pricing">
                  <Button className="gap-2">
                    <CreditCard className="w-4 h-4" /> View Plans
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Own projects first, then shared */}
            {[...projects].sort((a, b) => {
              const aOwned = a.user_id === user?.id;
              const bOwned = b.user_id === user?.id;
              if (aOwned && !bOwned) return -1;
              if (!aOwned && bOwned) return 1;
              return 0;
            }).map((project) => {
              const StatusIcon = statusIcons[project.status as keyof typeof statusIcons] || Clock;
              const hasAccess = hasAccessToProject(project.id);
              const isShared = project.user_id !== user?.id;
              return (
                <div key={project.id} onClick={() => handleProjectClick(project)} className="cursor-pointer">
                  <Card className={`hover:border-primary transition-colors h-full ${!hasAccess ? 'opacity-75' : ''}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                          {isShared && (
                            <span className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                              <Users className="w-3 h-3" /> Shared
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {!hasAccess && <Lock className="w-4 h-4 text-muted-foreground" />}
                          <StatusIcon className="w-5 h-5 text-muted-foreground" />
                          {!isShared && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={(e) => handleDeleteProject(project, e)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <CardDescription>
                        {project.target_company || "No target company specified"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground capitalize">
                          {project.transaction_type?.replace("-", " ")}
                        </span>
                        <span className="text-muted-foreground">
                          Phase {project.current_phase}/7
                        </span>
                      </div>
                      <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${(project.current_phase / 7) * 100}%` }}
                        />
                      </div>
                      {!hasAccess && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <CreditCard className="w-3 h-3" /> Payment required to access
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Monthly Overage Dialog */}
      <Dialog open={overageDialogOpen} onOpenChange={setOverageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Project Limit Reached</DialogTitle>
            <DialogDescription>
              Your Monthly plan includes {monthlyProjectLimit} concurrent projects. You currently have {activeProjectCount} active project{activeProjectCount !== 1 ? 's' : ''}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Purchase Additional Slot</h4>
                    <p className="text-sm text-muted-foreground">One-time payment for one extra project</p>
                  </div>
                  <span className="text-xl font-bold">${PRICING.monthly.overagePerProject.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
            <Button
              className="w-full"
              disabled={checkoutLoading}
              onClick={async () => {
                setCheckoutLoading(true);
                try {
                  const { data, error } = await supabase.functions.invoke('create-checkout', {
                    body: { planType: 'monthly_overage' }
                  });
                  if (error) throw error;
                  if (data?.url) window.open(data.url, '_blank');
                } catch (err) {
                  toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to start checkout", variant: "destructive" });
                } finally {
                  setCheckoutLoading(false);
                  setOverageDialogOpen(false);
                }
              }}
            >
              {checkoutLoading ? "Redirecting..." : `Purchase Additional Slot ($${PRICING.monthly.overagePerProject.toLocaleString()})`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlock This Project</DialogTitle>
            <DialogDescription>
              Choose how you'd like to access "{selectedProjectForPayment?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Card className="cursor-pointer hover:border-primary" onClick={handlePayForProject}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Pay Per Project</h4>
                    <p className="text-sm text-muted-foreground">One-time payment for this project</p>
                  </div>
                  <span className="text-xl font-bold">{PRICING.perProject.display}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary" onClick={() => { setPaymentDialogOpen(false); navigate('/pricing'); }}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Monthly Subscription</h4>
                    <p className="text-sm text-muted-foreground">Up to 3 concurrent projects, cancel anytime</p>
                  </div>
                  <span className="text-xl font-bold">{PRICING.monthly.display}/mo</span>
                </div>
              </CardContent>
            </Card>
            {checkoutLoading && (
              <div className="text-center text-muted-foreground">
                Redirecting to checkout...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {projectToDelete?.funded_by_credit ? "Delete Paid Project" : "Delete Project"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              {projectToDelete?.funded_by_credit ? (
                <div className="space-y-3">
                  <p>
                    This project was funded by a one-time purchase. Deleting it will permanently consume your credit and remove all data. You will need to purchase a new credit to create another project.
                  </p>
                  <div className="bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground">
                    💡 Consider using <strong>Reset Project Data</strong> inside the project to start over without losing your credit.
                  </div>
                </div>
              ) : (
                <p>Are you sure you want to delete "{projectToDelete?.name}"? This action cannot be undone.</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {projectToDelete?.funded_by_credit && (
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  navigate(`/project/${projectToDelete.id}`);
                }}
              >
                Go to Project
              </Button>
            )}
            <AlertDialogAction onClick={confirmDeleteProject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;