import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2, ArrowRight, RefreshCcw } from "lucide-react";
import ShepiLogo from "@/components/ShepiLogo";
import { useSubscription } from "@/hooks/useSubscription";

const PaymentSuccess = () => {
  const __seoTags = useSEO({ title: "Payment Successful — shepi", noindex: true });

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkSubscription, hasActiveSubscription, paidProjects, projectCredits, loading } = useSubscription();
  const [checking, setChecking] = useState(true);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

  const planType = searchParams.get("plan");
  
  // Determine if payment is confirmed based on plan type
  // Whitelisted users have hasActiveSubscription=true with 0 credits, so check that too
  const isPaymentConfirmed = (planType === "per_project" || planType === "done_for_you")
    ? (projectCredits > 0 || paidProjects.length > 0 || hasActiveSubscription)
    : hasActiveSubscription;

  // Auto-redirect when payment is confirmed
  useEffect(() => {
    if (isPaymentConfirmed && !checking && !loading) {
      setRedirectCountdown(3);
    }
  }, [isPaymentConfirmed, checking, loading]);

  // Countdown and redirect
  useEffect(() => {
    if (redirectCountdown === null) return;
    
    if (redirectCountdown === 0) {
      navigate('/dashboard');
      return;
    }

    const timer = setTimeout(() => {
      setRedirectCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [redirectCountdown, navigate]);

  useEffect(() => {
    // Refresh subscription status after payment
    const refreshStatus = async () => {
      setChecking(true);
      await checkSubscription();
      setChecking(false);
    };
    
    refreshStatus();
    
    // Poll a few times to ensure webhook has processed
    const intervals = [2000, 5000, 10000];
    const timers = intervals.map(delay => 
      setTimeout(refreshStatus, delay)
    );
    
    return () => timers.forEach(clearTimeout);
  }, [checkSubscription]);

  

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {__seoTags}
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <ShepiLogo variant="dark" size="md" />
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Payment Successful!</CardTitle>
            <CardDescription>
              Thank you for your purchase. Your account has been updated.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Payment Status</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setChecking(true);
                    checkSubscription();
                    setTimeout(() => setChecking(false), 2000);
                  }}
                  disabled={checking || loading}
                  className="h-8 px-2"
                >
                  <RefreshCcw className={`w-4 h-4 ${checking || loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              {checking || loading ? (
                <div className="flex items-center justify-center gap-2 text-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </div>
              ) : isPaymentConfirmed ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-primary font-medium">
                    <CheckCircle className="w-4 h-4" />
                    <span>{planType === "per_project" ? "Project Credit Applied" : "Active"}</span>
                  </div>
                  {redirectCountdown !== null && (
                    <p className="text-sm text-muted-foreground text-center">
                      Redirecting to dashboard in {redirectCountdown}...
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-foreground">
                  Processing... (may take a moment)
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Link to="/dashboard" className="block">
                <Button className="w-full" size="lg">
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/pricing" className="block">
                <Button variant="outline" className="w-full">
                  View Plans
                </Button>
              </Link>
            </div>

            <p className="text-xs text-muted-foreground">
              If your subscription status doesn't update within a few minutes, 
              please refresh the page or contact support.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PaymentSuccess;
