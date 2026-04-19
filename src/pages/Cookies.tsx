import { useEffect } from "react";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import { useSEO } from "@/hooks/useSEO";

export default function Cookies() {
  const __seoTags = useSEO({
    title: "Cookie Policy — shepi",
    description: "Read shepi's Cookie Policy to understand how we use cookies and tracking technologies.",
    canonical: "https://shepi.ai/cookies",
    
  });

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://policies.termageddon.com/api/embed/TkVGVWMxVjVlSEZzTW1oWUwzYzlQUT09.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src="https://policies.termageddon.com/api/embed/TkVGVWMxVjVlSEZzTW1oWUwzYzlQUT09.js"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return (
    <LegalPageLayout title="Cookie Policy">
      {__seoTags}
      <div 
        id="TkVGVWMxVjVlSEZzTW1oWUwzYzlQUT09"
        className="policy_embed_div"
      >
        Please wait while the policy is loaded. If it does not load, please{" "}
        <a 
          rel="nofollow" 
          href="https://policies.termageddon.com/api/policy/TkVGVWMxVjVlSEZzTW1oWUwzYzlQUT09" 
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
