import { useEffect } from "react";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import { useSEO } from "@/hooks/useSEO";

export default function Privacy() {
  useSEO({
    title: "Privacy Policy — Shepi",
    description: "Read Shepi's Privacy Policy to understand how we collect, use, and protect your data.",
    canonical: "https://shepi.ai/privacy",
    
  });

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://policies.termageddon.com/api/embed/TVVoS1IwOTFhMVJXYTJZdlNFRTlQUT09.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src="https://policies.termageddon.com/api/embed/TVVoS1IwOTFhMVJXYTJZdlNFRTlQUT09.js"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return (
    <LegalPageLayout title="Privacy Policy">
      <div 
        id="TVVoS1IwOTFhMVJXYTJZdlNFRTlQUT09"
        className="policy_embed_div"
      >
        Please wait while the policy is loaded. If it does not load, please{" "}
        <a 
          rel="nofollow" 
          href="https://policies.termageddon.com/api/policy/TVVoS1IwOTFhMVJXYTJZdlNFRTlQUT09" 
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
