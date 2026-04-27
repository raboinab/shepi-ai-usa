import { jsx, jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { s as supabase, B as Button } from "../main.mjs";
import { S as Spinner } from "./spinner-DXdBpr08.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-CVoj8f5R.js";
import { format } from "date-fns";
import { D as Dialog, a as DialogTrigger, b as DialogContent, c as DialogHeader, d as DialogTitle } from "./dialog-sNpTUd89.js";
import { Eye } from "lucide-react";
import "vite-react-ssg";
import "react";
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
import "@radix-ui/react-dialog";
function AdminContacts() {
  const { data: contacts, isLoading } = useQuery({
    queryKey: ["admin-contacts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contact_submissions").select("*").order("created_at", { ascending: false }).limit(1e6);
      if (error) throw error;
      return data;
    }
  });
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsx(Spinner, { className: "h-8 w-8" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Contact Submissions" }),
    /* @__PURE__ */ jsx("div", { className: "rounded-md border", children: /* @__PURE__ */ jsxs(Table, { children: [
      /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableHead, { children: "Name" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Email" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Role" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Interest" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Submitted" }),
        /* @__PURE__ */ jsx(TableHead, { className: "w-[80px]" })
      ] }) }),
      /* @__PURE__ */ jsx(TableBody, { children: contacts?.length === 0 ? /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: 6, className: "text-center text-muted-foreground", children: "No contact submissions yet" }) }) : contacts?.map((contact) => /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: contact.name }),
        /* @__PURE__ */ jsx(TableCell, { children: contact.email }),
        /* @__PURE__ */ jsx(TableCell, { className: "text-muted-foreground text-sm", children: contact.role || "—" }),
        /* @__PURE__ */ jsx(TableCell, { className: "text-muted-foreground text-sm", children: contact.interest || "—" }),
        /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs(Dialog, { children: [
          /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", children: /* @__PURE__ */ jsx(Eye, { className: "h-4 w-4" }) }) }),
          /* @__PURE__ */ jsxs(DialogContent, { children: [
            /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsxs(DialogTitle, { children: [
              "Message from ",
              contact.name
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Email" }),
                /* @__PURE__ */ jsx("p", { className: "font-medium", children: contact.email })
              ] }),
              contact.company && /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Company" }),
                /* @__PURE__ */ jsx("p", { className: "font-medium", children: contact.company })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                contact.role && /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Role" }),
                  /* @__PURE__ */ jsx("p", { className: "font-medium", children: contact.role })
                ] }),
                contact.interest && /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Interest" }),
                  /* @__PURE__ */ jsx("p", { className: "font-medium", children: contact.interest })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Message" }),
                /* @__PURE__ */ jsx("p", { className: "whitespace-pre-wrap", children: contact.message })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Submitted" }),
                /* @__PURE__ */ jsx("p", { children: format(new Date(contact.created_at), "PPpp") })
              ] })
            ] })
          ] })
        ] }) })
      ] }, contact.id)) })
    ] }) })
  ] });
}
export {
  AdminContacts as default
};
