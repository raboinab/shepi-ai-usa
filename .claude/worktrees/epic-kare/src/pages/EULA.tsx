import { useEffect } from "react";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import { useSEO } from "@/hooks/useSEO";

export default function EULA() {
  useSEO({
    title: "End User License Agreement — Shepi",
    description: "Read Shepi's End User License Agreement (EULA) for terms governing software use.",
    canonical: "https://shepi.ai/eula",
    
  });

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://policies.termageddon.com/api/embed/VjFSeU1EWmxOV2g1YVRCTVdrRTlQUT09.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src="https://policies.termageddon.com/api/embed/VjFSeU1EWmxOV2g1YVRCTVdrRTlQUT09.js"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return (
    <LegalPageLayout title="End User License Agreement">
      <div 
        id="VjFSeU1EWmxOV2g1YVRCTVdrRTlQUT09"
        className="policy_embed_div"
      >
        Please wait while the policy is loaded. If it does not load, please{" "}
        <a 
          rel="nofollow" 
          href="https://policies.termageddon.com/api/policy/VjFSeU1EWmxOV2g1YVRCTVdrRTlQUT09" 
          target="_blank"
          className="text-primary hover:underline"
        >
          click here
        </a>{" "}
        to view the policy.
      </div>
    </LegalPageLayout>
  );
}
