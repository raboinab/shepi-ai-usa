import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

const GEO_KEY = "shepi_geo_allowed";

export default function GeoGate({ children }: { children: ReactNode }) {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const cached = sessionStorage.getItem(GEO_KEY);
    if (cached === "true") return;
    if (cached === "false") {
      setBlocked(true);
      return;
    }

    supabase.functions
      .invoke("geo-check", { method: "POST", body: {} })
      .then(({ data, error }) => {
        if (error || !data) {
          sessionStorage.setItem(GEO_KEY, "true");
          return;
        }
        const allowed = data.allowed !== false;
        sessionStorage.setItem(GEO_KEY, String(allowed));
        if (!allowed) setBlocked(true);
      })
      .catch(() => {
        sessionStorage.setItem(GEO_KEY, "true");
      });
  }, []);

  if (blocked) return <div />;

  return <>{children}</>;
}
