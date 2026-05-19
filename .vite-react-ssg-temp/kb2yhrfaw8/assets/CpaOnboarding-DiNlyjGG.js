import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { v as useToast, s as supabase, C as Card, b as CardHeader, d as CardTitle, e as CardDescription, f as CardContent, B as Button, j as Badge } from "../main.mjs";
import { S as Spinner } from "./spinner-Cl42thGn.js";
import { I as Input } from "./input-RFtselAh.js";
import { L as Label } from "./label-DiNTC6Nb.js";
import { T as Textarea } from "./textarea-AMc2tKlb.js";
import { CheckCircle2, Upload, FileText, Trash2 } from "lucide-react";
import "vite-react-ssg";
import "react-router-dom";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "sonner";
import "@radix-ui/react-tooltip";
import "@radix-ui/react-slot";
import "@supabase/supabase-js";
import "@radix-ui/react-accordion";
import "@radix-ui/react-label";
const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
  "DC"
];
const INDUSTRIES = [
  "SaaS / Software",
  "E-commerce / Retail",
  "Professional Services",
  "Manufacturing",
  "Healthcare",
  "Construction",
  "Restaurants / Hospitality",
  "Logistics / Transportation",
  "Financial Services",
  "Real Estate",
  "Media / Marketing",
  "Other"
];
const DOC_TYPES = [
  { value: "w9", label: "W-9" },
  { value: "liability_insurance", label: "Liability Insurance Certificate" },
  { value: "license_verification", label: "License Verification" },
  { value: "other", label: "Other" }
];
function CpaOnboarding() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [statesServed, setStatesServed] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [maxEngagements, setMaxEngagements] = useState(3);
  const [uploadType, setUploadType] = useState("w9");
  const [uploading, setUploading] = useState(false);
  const { data: profile, isLoading } = useQuery({
    queryKey: ["cpa-profile-self"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { data, error } = await supabase.from("cpa_profiles").select("*").eq("user_id", u.user.id).maybeSingle();
      if (error) throw error;
      return data ?? null;
    }
  });
  const { data: docs } = useQuery({
    queryKey: ["cpa-onboarding-docs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cpa_onboarding_documents").select("id, document_type, file_name, file_path, status, created_at").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    }
  });
  useEffect(() => {
    if (profile) {
      setStatesServed(profile.states_served ?? []);
      setIndustries(profile.industries ?? []);
      setBio(profile.bio ?? "");
      setPhone(profile.phone ?? "");
      setLinkedin(profile.linkedin_url ?? "");
      setMaxEngagements(profile.max_concurrent_engagements ?? 3);
    }
  }, [profile]);
  const save = useMutation({
    mutationFn: async (markComplete) => {
      if (!profile) throw new Error("Profile not found");
      const patch = {
        states_served: statesServed,
        industries,
        bio: bio.trim() || null,
        phone: phone.trim() || null,
        linkedin_url: linkedin.trim() || null,
        max_concurrent_engagements: maxEngagements
      };
      if (markComplete) patch.onboarding_completed_at = (/* @__PURE__ */ new Date()).toISOString();
      const { error } = await supabase.from("cpa_profiles").update(patch).eq("id", profile.id);
      if (error) throw error;
    },
    onSuccess: (_, markComplete) => {
      qc.invalidateQueries({ queryKey: ["cpa-profile-self"] });
      toast({
        title: markComplete ? "Onboarding submitted" : "Profile saved"
      });
    },
    onError: (e) => toast({ title: "Save failed", description: e?.message, variant: "destructive" })
  });
  async function handleUpload(file) {
    if (!profile) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${profile.user_id}/${uploadType}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("cpa-onboarding").upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from("cpa_onboarding_documents").insert({
        cpa_user_id: profile.user_id,
        document_type: uploadType,
        file_path: path,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type
      });
      if (insErr) throw insErr;
      if (uploadType === "w9") {
        await supabase.from("cpa_profiles").update({ w9_on_file: true }).eq("id", profile.id);
      }
      if (uploadType === "liability_insurance") {
        await supabase.from("cpa_profiles").update({ liability_covered: true }).eq("id", profile.id);
      }
      qc.invalidateQueries({ queryKey: ["cpa-onboarding-docs"] });
      qc.invalidateQueries({ queryKey: ["cpa-profile-self"] });
      toast({ title: "File uploaded" });
    } catch (e) {
      toast({ title: "Upload failed", description: e?.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }
  async function handleDelete(doc) {
    if (!confirm(`Delete ${doc.file_name}?`)) return;
    await supabase.storage.from("cpa-onboarding").remove([doc.file_path]);
    await supabase.from("cpa_onboarding_documents").delete().eq("id", doc.id);
    qc.invalidateQueries({ queryKey: ["cpa-onboarding-docs"] });
  }
  const checklist = useMemo(() => {
    if (!profile) return [];
    return [
      { label: "Confirm contact info", done: !!profile.phone || phone.trim().length > 0 },
      { label: "Add at least one state served", done: statesServed.length > 0 },
      { label: "Add at least one industry", done: industries.length > 0 },
      { label: "Short professional bio", done: (profile.bio ?? bio).trim().length >= 80 },
      { label: "W-9 on file", done: profile.w9_on_file },
      { label: "Liability insurance on file", done: profile.liability_covered }
    ];
  }, [profile, phone, statesServed, industries, bio]);
  const completion = checklist.length ? Math.round(checklist.filter((c) => c.done).length / checklist.length * 100) : 0;
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "flex h-64 items-center justify-center", children: /* @__PURE__ */ jsx(Spinner, { className: "h-8 w-8" }) });
  }
  if (!profile) {
    return /* @__PURE__ */ jsx("div", { className: "max-w-xl", children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsx(CardTitle, { children: "Profile not ready yet" }),
      /* @__PURE__ */ jsx(CardDescription, { children: "We haven't created your CPA profile. An admin will activate your account shortly after approving your application. If you think this is a mistake, email partners@shepi.ai." })
    ] }) }) });
  }
  function toggle(list, value) {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  }
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold", children: [
          "Welcome, ",
          profile.full_name.split(" ")[0]
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-1", children: "Complete the steps below so we can route engagements to you." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-3xl font-bold", children: [
          completion,
          "%"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground uppercase tracking-wide", children: "complete" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Checklist" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("ul", { className: "space-y-2 text-sm", children: checklist.map((c) => /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(
          CheckCircle2,
          {
            className: `h-4 w-4 ${c.done ? "text-primary" : "text-muted-foreground/40"}`
          }
        ),
        /* @__PURE__ */ jsx("span", { className: c.done ? "" : "text-muted-foreground", children: c.label })
      ] }, c.label)) }) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Contact & profile" }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Email" }),
            /* @__PURE__ */ jsx(Input, { value: profile.email, disabled: true })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Phone" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                value: phone,
                onChange: (e) => setPhone(e.target.value),
                placeholder: "(555) 123-4567"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "License" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                value: `${profile.state_of_licensure} · ${profile.license_number}`,
                disabled: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "LinkedIn URL" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                value: linkedin,
                onChange: (e) => setLinkedin(e.target.value),
                placeholder: "https://linkedin.com/in/..."
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Max concurrent engagements" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "number",
                min: 1,
                max: 20,
                value: maxEngagements,
                onChange: (e) => setMaxEngagements(Math.max(1, Number(e.target.value) || 1))
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Professional bio" }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              rows: 4,
              value: bio,
              onChange: (e) => setBio(e.target.value),
              placeholder: "2–4 sentences. Industry focus, years in QoE, notable deal sizes."
            }
          ),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
            bio.length,
            " characters"
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsx(CardTitle, { children: "States served" }),
        /* @__PURE__ */ jsx(CardDescription, { children: "Pick every state where you're comfortable reviewing engagements." })
      ] }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: US_STATES.map((s) => {
        const active = statesServed.includes(s);
        return /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setStatesServed((prev) => toggle(prev, s)),
            className: `px-3 py-1 rounded-full text-xs border transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-border"}`,
            children: s
          },
          s
        );
      }) }) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Industries" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: INDUSTRIES.map((i) => {
        const active = industries.includes(i);
        return /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setIndustries((prev) => toggle(prev, i)),
            className: `px-3 py-1.5 rounded-full text-sm border transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-border"}`,
            children: i
          },
          i
        );
      }) }) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsx(CardTitle, { children: "Documents" }),
        /* @__PURE__ */ jsx(CardDescription, { children: "W-9 is required for payouts. Liability insurance certificate is required to claim engagements." })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-end gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Document type" }),
            /* @__PURE__ */ jsx(
              "select",
              {
                className: "block h-10 rounded-md border border-input bg-background px-3 text-sm",
                value: uploadType,
                onChange: (e) => setUploadType(e.target.value),
                children: DOC_TYPES.map((d) => /* @__PURE__ */ jsx("option", { value: d.value, children: d.label }, d.value))
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "inline-flex", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "file",
                className: "sr-only",
                accept: ".pdf,.png,.jpg,.jpeg",
                disabled: uploading,
                onChange: (e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                  e.target.value = "";
                }
              }
            ),
            /* @__PURE__ */ jsx(Button, { type: "button", disabled: uploading, asChild: true, children: /* @__PURE__ */ jsxs("span", { children: [
              /* @__PURE__ */ jsx(Upload, { className: "h-4 w-4 mr-2" }),
              uploading ? "Uploading…" : "Upload file"
            ] }) })
          ] })
        ] }),
        !docs?.length ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No documents uploaded yet." }) : /* @__PURE__ */ jsx("ul", { className: "divide-y rounded-md border", children: docs.map((d) => /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-3 px-3 py-2 text-sm", children: [
          /* @__PURE__ */ jsx(FileText, { className: "h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsx("div", { className: "truncate font-medium", children: d.file_name }),
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: DOC_TYPES.find((t) => t.value === d.document_type)?.label ?? d.document_type })
          ] }),
          /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "capitalize", children: d.status }),
          /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", onClick: () => handleDelete(d), children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) })
        ] }, d.id)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
      /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => save.mutate(false), disabled: save.isPending, children: "Save draft" }),
      /* @__PURE__ */ jsx(
        Button,
        {
          onClick: () => save.mutate(true),
          disabled: save.isPending || completion < 100,
          children: profile.onboarding_completed_at ? "Update onboarding" : "Submit onboarding"
        }
      )
    ] })
  ] });
}
export {
  CpaOnboarding as default
};
