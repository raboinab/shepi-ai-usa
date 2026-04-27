import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { s as supabase, S as ShepiLogo, B as Button, C as Card, b as CardHeader, d as CardTitle, e as CardDescription, f as CardContent, a as clearOAuthProcessedFlag, t as toast } from "../main.mjs";
import { B as Badge } from "./badge-BbLwm7hH.js";
import { I as Input } from "./input-CSM87NBF.js";
import { L as Label } from "./label-B2r_8dgk.js";
import { u as useSubscription } from "./useSubscription-fJr4XAL_.js";
import { LogOut, ArrowLeft, User, Loader2, Save, CreditCard, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import "vite-react-ssg";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "sonner";
import "@radix-ui/react-tooltip";
import "@tanstack/react-query";
import "@radix-ui/react-slot";
import "@supabase/supabase-js";
import "@radix-ui/react-accordion";
import "@radix-ui/react-label";
const Account = () => {
  const [user, setUser] = useState(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [profile, setProfile] = useState({ full_name: "", company: "" });
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { hasActiveSubscription, subscriptionEnd, paidProjects, loading: subscriptionLoading, checkSubscription } = useSubscription();
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      } else {
        fetchProfile(session.user.id);
      }
    });
  }, [navigate]);
  const fetchProfile = async (userId) => {
    setProfileLoading(true);
    const { data, error } = await supabase.from("profiles").select("full_name, company").eq("user_id", userId).maybeSingle();
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
    const { data: existingProfile } = await supabase.from("profiles").select("id").eq("user_id", user.id).maybeSingle();
    let error;
    if (existingProfile) {
      const result = await supabase.from("profiles").update({ full_name: trimmedName, company: trimmedCompany }).eq("user_id", user.id);
      error = result.error;
    } else {
      const result = await supabase.from("profiles").insert({ user_id: user.id, full_name: trimmedName, company: trimmedCompany });
      error = result.error;
    }
    if (error) {
      toast({
        title: "Error saving profile",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Profile saved",
        description: "Your profile has been updated."
      });
    }
    setSaving(false);
  };
  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to open billing portal",
        variant: "destructive"
      });
    } finally {
      setPortalLoading(false);
    }
  };
  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: "local" });
    clearOAuthProcessedFlag();
    navigate("/");
  };
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsx("header", { className: "border-b border-border bg-card", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-4 flex items-center justify-between", children: [
      /* @__PURE__ */ jsx(Link, { to: "/", children: /* @__PURE__ */ jsx(ShepiLogo, { variant: "dark", size: "md" }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-sm", children: user?.email }),
        /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", onClick: handleLogout, children: /* @__PURE__ */ jsx(LogOut, { className: "w-4 h-4" }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("main", { className: "container mx-auto px-4 py-8 max-w-3xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
        /* @__PURE__ */ jsx(Link, { to: "/dashboard", children: /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", className: "gap-2 mb-4", children: [
          /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
          " Back to Dashboard"
        ] }) }),
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-serif font-bold", children: "Account Settings" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Manage your account and subscription" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(User, { className: "w-5 h-5" }),
              " Profile"
            ] }),
            /* @__PURE__ */ jsx(CardDescription, { children: "Update your personal information" })
          ] }),
          /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Email" }),
                /* @__PURE__ */ jsx("span", { className: "font-medium", children: user?.email })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Account created" }),
                /* @__PURE__ */ jsx("span", { className: "font-medium", children: user?.created_at ? formatDate(user.created_at) : "N/A" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "pt-4 border-t border-border space-y-4", children: profileLoading ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center py-4", children: /* @__PURE__ */ jsx(Loader2, { className: "w-5 h-5 animate-spin text-muted-foreground" }) }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { htmlFor: "fullName", children: "Full Name" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    id: "fullName",
                    placeholder: "Enter your full name",
                    value: profile.full_name || "",
                    onChange: (e) => setProfile({ ...profile, full_name: e.target.value }),
                    maxLength: 100
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { htmlFor: "company", children: "Company" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    id: "company",
                    placeholder: "Enter your company name",
                    value: profile.company || "",
                    onChange: (e) => setProfile({ ...profile, company: e.target.value }),
                    maxLength: 100
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs(Button, { onClick: handleSaveProfile, disabled: saving, className: "gap-2", children: [
                saving ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" }),
                "Save Profile"
              ] })
            ] }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(CreditCard, { className: "w-5 h-5" }),
                " Subscription"
              ] }),
              subscriptionLoading ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : hasActiveSubscription ? /* @__PURE__ */ jsxs(Badge, { className: "bg-green-500/10 text-green-600 border-green-500/20", children: [
                /* @__PURE__ */ jsx(CheckCircle, { className: "w-3 h-3 mr-1" }),
                " Active"
              ] }) : /* @__PURE__ */ jsxs(Badge, { variant: "secondary", children: [
                /* @__PURE__ */ jsx(XCircle, { className: "w-3 h-3 mr-1" }),
                " Inactive"
              ] })
            ] }),
            /* @__PURE__ */ jsx(CardDescription, { children: hasActiveSubscription ? "You have full access to all features" : "Subscribe to unlock all features" })
          ] }),
          /* @__PURE__ */ jsx(CardContent, { className: "space-y-4", children: subscriptionLoading ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center py-4", children: /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin text-muted-foreground" }) }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Plan" }),
                /* @__PURE__ */ jsx("span", { className: "font-medium", children: hasActiveSubscription ? "Monthly Subscription" : "No active plan" })
              ] }),
              hasActiveSubscription && subscriptionEnd && /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Renews on" }),
                /* @__PURE__ */ jsx("span", { className: "font-medium", children: formatDate(subscriptionEnd) })
              ] }),
              paidProjects.length > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Paid projects" }),
                /* @__PURE__ */ jsx("span", { className: "font-medium", children: paidProjects.length })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "pt-4 border-t border-border space-y-2", children: [
              hasActiveSubscription ? /* @__PURE__ */ jsxs(
                Button,
                {
                  onClick: handleManageSubscription,
                  className: "w-full gap-2",
                  disabled: portalLoading,
                  children: [
                    portalLoading ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(ExternalLink, { className: "w-4 h-4" }),
                    "Manage Billing"
                  ]
                }
              ) : /* @__PURE__ */ jsx(Link, { to: "/pricing", className: "block", children: /* @__PURE__ */ jsxs(Button, { className: "w-full gap-2", children: [
                /* @__PURE__ */ jsx(CreditCard, { className: "w-4 h-4" }),
                " View Plans"
              ] }) }),
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "outline",
                  onClick: () => checkSubscription(),
                  className: "w-full",
                  children: "Refresh Status"
                }
              )
            ] })
          ] }) })
        ] })
      ] })
    ] })
  ] });
};
export {
  Account as default
};
