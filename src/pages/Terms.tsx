import { useEffect } from "react";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import { useSEO } from "@/hooks/useSEO";

export default function Terms() {
  const __seoTags = useSEO({
    title: "Terms of Service — shepi",
    description: "Read shepi's Terms of Service to understand your rights and responsibilities when using our platform.",
    canonical: "https://shepi.ai/terms",
    
  });

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://policies.termageddon.com/api/embed/WlVSSFVtMUdLMWxXVTNkd1RXYzlQUT09.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src="https://policies.termageddon.com/api/embed/WlVSSFVtMUdLMWxXVTNkd1RXYzlQUT09.js"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return (
    <LegalPageLayout title="Terms of Service">
      {__seoTags}
      <div 
        id="WlVSSFVtMUdLMWxXVTNkd1RXYzlQUT09"
        className="policy_embed_div"
      >
        Please wait while the policy is loaded. If it does not load, please{" "}
        <a 
          rel="nofollow" 
          href="https://policies.termageddon.com/api/policy/WlVSSFVtMUdLMWxXVTNkd1RXYzlQUT09" 
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
