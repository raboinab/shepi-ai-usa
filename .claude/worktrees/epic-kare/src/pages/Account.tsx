import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { LogOut, CreditCard, ArrowLeft, ExternalLink, CheckCircle, XCircle, Loader2, User, Save } from "lucide-react";
import ShepiLogo from "@/components/ShepiLogo";
import { clearOAuthProcessedFlag } from "@/lib/authUtils";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Profile {
  full_name: string | null;
  company: string | null;
}

const Account = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [profile, setProfile] = useState<Profile>({ full_name: "", company: "" });
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { hasActiveSubscription, subscriptionEnd, paidProjects, loading: subscriptionLoading, checkSubscription } = useSubscription();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      } else {
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    setProfileLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, company")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
    } else if (data) {
      setProfile({ full_name: data.full_name || "", company: data.company || "" });
    }
    setProfileLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    const trimmedName = profile.full_name?.trim().slice(0, 100) || null;
    const trimmedCompany = profile.company?.trim().slice(0, 100) || null;
    
    setSaving(true);
    
    // Try to update first, if no rows affected, insert
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    let error;
    if (existingProfile) {
      const result = await supabase
        .from("profiles")
        .update({ full_name: trimmedName, company: trimmedCompany })
        .eq("user_id", user.id);
      error = result.error;
    } else {
      const result = await supabase
        .from("profiles")
        .insert({ user_id: user.id, full_name: trimmedName, company: trimmedCompany });
      error = result.error;
    }

    if (error) {
      toast({
        title: "Error saving profile",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Profile saved",
        description: "Your profile has been updated.",
      });
    }
    setSaving(false);
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to open billing portal",
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' });
    clearOAuthProcessedFlag();
    navigate("/");
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <ShepiLogo variant="dark" size="md" />
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground text-sm">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2 mb-4">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-serif font-bold">Account Settings</h1>
          <p className="text-muted-foreground">Manage your account and subscription</p>
        </div>

        <div className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" /> Profile
              </CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{user?.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Account created</span>
                  <span className="font-medium">{user?.created_at ? formatDate(user.created_at) : "N/A"}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border space-y-4">
                {profileLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        placeholder="Enter your full name"
                        value={profile.full_name || ""}
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                        maxLength={100}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        placeholder="Enter your company name"
                        value={profile.company || ""}
                        onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                        maxLength={100}
                      />
                    </div>
                    <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Profile
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Subscription Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" /> Subscription
                </CardTitle>
                {subscriptionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : hasActiveSubscription ? (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                    <CheckCircle className="w-3 h-3 mr-1" /> Active
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="w-3 h-3 mr-1" /> Inactive
                  </Badge>
                )}
              </div>
              <CardDescription>
                {hasActiveSubscription 
                  ? "You have full access to all features"
                  : "Subscribe to unlock all features"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscriptionLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plan</span>
                      <span className="font-medium">
                        {hasActiveSubscription ? "Monthly Subscription" : "No active plan"}
                      </span>
                    </div>
                    {hasActiveSubscription && subscriptionEnd && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Renews on</span>
                        <span className="font-medium">{formatDate(subscriptionEnd)}</span>
                      </div>
                    )}
                    {paidProjects.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Paid projects</span>
                        <span className="font-medium">{paidProjects.length}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-border space-y-2">
                    {hasActiveSubscription ? (
                      <Button 
                        onClick={handleManageSubscription} 
                        className="w-full gap-2"
                        disabled={portalLoading}
                      >
                        {portalLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ExternalLink className="w-4 h-4" />
                        )}
                        Manage Billing
                      </Button>
                    ) : (
                      <Link to="/pricing" className="block">
                        <Button className="w-full gap-2">
                          <CreditCard className="w-4 h-4" /> View Plans
                        </Button>
                      </Link>
                    )}
                    <Button 
                      variant="outline" 
                      onClick={() => checkSubscription()} 
                      className="w-full"
                    >
                      Refresh Status
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Account;
