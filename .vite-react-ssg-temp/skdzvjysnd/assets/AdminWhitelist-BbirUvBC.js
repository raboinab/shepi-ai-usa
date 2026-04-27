import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { s as supabase, B as Button } from "../main.mjs";
import { I as Input } from "./input-CSM87NBF.js";
import { S as Spinner } from "./spinner-DXdBpr08.js";
import { toast } from "sonner";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-CVoj8f5R.js";
import { A as AlertDialog, h as AlertDialogTrigger, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-CKdO6TGo.js";
import { ShieldCheck, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import "vite-react-ssg";
import "react-router-dom";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "@radix-ui/react-tooltip";
import "@radix-ui/react-slot";
import "@supabase/supabase-js";
import "@radix-ui/react-accordion";
import "@radix-ui/react-alert-dialog";
function AdminWhitelist() {
  const queryClient = useQueryClient();
  const [newEmail, setNewEmail] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const { data: users, isLoading } = useQuery({
    queryKey: ["whitelisted-users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("whitelisted_users").select("*").order("created_at", { ascending: false }).limit(1e6);
      if (error) throw error;
      return data;
    }
  });
  const addMutation = useMutation({
    mutationFn: async ({ email, notes }) => {
      const { error } = await supabase.from("whitelisted_users").insert({ email: email.toLowerCase().trim(), notes: notes || null });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whitelisted-users"] });
      setNewEmail("");
      setNewNotes("");
      toast.success("User added to whitelist");
    },
    onError: (error) => {
      if (error.message.includes("duplicate")) {
        toast.error("This email is already whitelisted");
      } else {
        toast.error("Failed to add user: " + error.message);
      }
    }
  });
  const removeMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("whitelisted_users").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whitelisted-users"] });
      toast.success("User removed from whitelist");
    },
    onError: (error) => {
      toast.error("Failed to remove user: " + error.message);
    }
  });
  const handleAdd = (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    addMutation.mutate({ email: newEmail, notes: newNotes });
  };
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsx(Spinner, { className: "h-8 w-8" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx(ShieldCheck, { className: "h-8 w-8 text-primary" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Whitelist Management" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Whitelisted users bypass all subscription checks and have full access" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleAdd, className: "flex gap-3 items-end", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex-1 max-w-xs", children: [
        /* @__PURE__ */ jsx("label", { className: "text-sm font-medium mb-1 block", children: "Email" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            type: "email",
            placeholder: "user@example.com",
            value: newEmail,
            onChange: (e) => setNewEmail(e.target.value),
            required: true
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 max-w-xs", children: [
        /* @__PURE__ */ jsx("label", { className: "text-sm font-medium mb-1 block", children: "Notes (optional)" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            type: "text",
            placeholder: "e.g. Team member, Client",
            value: newNotes,
            onChange: (e) => setNewNotes(e.target.value)
          }
        )
      ] }),
      /* @__PURE__ */ jsxs(Button, { type: "submit", disabled: addMutation.isPending, children: [
        /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4 mr-2" }),
        "Add to Whitelist"
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "border rounded-lg", children: /* @__PURE__ */ jsxs(Table, { children: [
      /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableHead, { children: "Email" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Notes" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Added" }),
        /* @__PURE__ */ jsx(TableHead, { className: "w-20", children: "Actions" })
      ] }) }),
      /* @__PURE__ */ jsx(TableBody, { children: users && users.length > 0 ? users.map((user) => /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: user.email }),
        /* @__PURE__ */ jsx(TableCell, { className: "text-muted-foreground", children: user.notes || "—" }),
        /* @__PURE__ */ jsx(TableCell, { className: "text-muted-foreground", children: format(new Date(user.created_at), "MMM d, yyyy") }),
        /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs(AlertDialog, { children: [
          /* @__PURE__ */ jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              size: "icon",
              className: "text-destructive hover:text-destructive",
              children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" })
            }
          ) }),
          /* @__PURE__ */ jsxs(AlertDialogContent, { children: [
            /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
              /* @__PURE__ */ jsx(AlertDialogTitle, { children: "Remove from whitelist?" }),
              /* @__PURE__ */ jsxs(AlertDialogDescription, { children: [
                "This will remove ",
                /* @__PURE__ */ jsx("strong", { children: user.email }),
                " from the whitelist. They will need an active subscription to access premium features."
              ] })
            ] }),
            /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
              /* @__PURE__ */ jsx(AlertDialogCancel, { children: "Cancel" }),
              /* @__PURE__ */ jsx(
                AlertDialogAction,
                {
                  onClick: () => removeMutation.mutate(user.id),
                  className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                  children: "Remove"
                }
              )
            ] })
          ] })
        ] }) })
      ] }, user.id)) : /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: 4, className: "text-center text-muted-foreground py-8", children: "No whitelisted users yet" }) }) })
    ] }) })
  ] });
}
export {
  AdminWhitelist as default
};
