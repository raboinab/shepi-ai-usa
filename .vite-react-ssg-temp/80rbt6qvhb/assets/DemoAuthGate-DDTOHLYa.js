import { jsx, Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { s as supabase, i as trackEvent } from "../main.mjs";
import { u as useTosAcceptance, T as TermsAcceptanceModal } from "./TermsAcceptanceModal-DCI1QJ_5.js";
import { S as Spinner } from "./spinner-DXdBpr08.js";
function DemoAuthGate({ page, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const { hasAccepted, loading: tosLoading } = useTosAcceptance();
  const viewLogged = useRef(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate(`/auth?mode=signup&redirect=${encodeURIComponent(location.pathname)}`, { replace: true });
      } else {
        setIsAuthed(true);
      }
      setAuthChecked(true);
    });
  }, [navigate, location.pathname]);
  useEffect(() => {
    if (!isAuthed || !hasAccepted || viewLogged.current) return;
    viewLogged.current = true;
    trackEvent("demo_started", { page });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      supabase.from("demo_views").insert({ user_id: session.user.id, page }).then(({ error }) => {
        if (error) console.error("[DemoAuthGate] Failed to log demo view:", error);
      });
      const userEmail = session.user.email ?? "unknown";
      const userName = session.user.user_metadata?.full_name ?? session.user.user_metadata?.name ?? "Unknown";
      supabase.functions.invoke("notify-admin", {
        body: { event_type: "demo_view", user_email: userEmail, user_name: userName, page }
      }).catch((err) => console.error("[DemoAuthGate] notify-admin error:", err));
    });
  }, [isAuthed, hasAccepted, page]);
  if (!authChecked || tosLoading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Spinner, { className: "size-8" }) });
  }
  if (!isAuthed) return null;
  if (!hasAccepted) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(
      TermsAcceptanceModal,
      {
        open: true,
        onOpenChange: () => {
        },
        onAccepted: () => {
          window.location.reload();
        }
      }
    ) });
  }
  return /* @__PURE__ */ jsx(Fragment, { children });
}
export {
  DemoAuthGate as D
};
