import { useState } from "react";
import { Link } from "react-router-dom";
import { Bot, Check, Copy, ExternalLink, ArrowRight, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ShepiLogo from "@/components/ShepiLogo";
import { useSEO } from "@/hooks/useSEO";
import { useToast } from "@/hooks/use-toast";

/**
 * /connect — step-by-step instructions for connecting an AI assistant to the
 * shepi MCP server. Built for end users, not developers: one URL to copy and
 * click-by-click paths for ChatGPT and Claude.
 */

const CHATGPT_STEPS = [
  "Open ChatGPT → Settings → Apps & Connectors → Advanced settings and enable Developer mode.",
  "Go to Settings → Connectors → Create.",
  "Name the connector \"shepi\" and paste the ChatGPT MCP URL below.",
  "Approve the OAuth request when ChatGPT prompts you — this signs you in with your Shepi account.",
  "Start a chat, click + → More → shepi, then ask ChatGPT to \"list my shepi projects\" or \"summarize the QoE for project X.\" Interactive widgets render inline.",
];

const CLAUDE_STEPS = [
  "Open https://claude.ai/customize/connectors?modal=add-custom-connector.",
  "Name the connector \"shepi\" and paste the general MCP URL below.",
  "Enable the connector from the chat composer, then ask Claude to use shepi — for example, \"What adjustments are pending on my project?\"",
];

export default function Connect() {
  const { toast } = useToast();
  const [copiedChatgpt, setCopiedChatgpt] = useState(false);
  const [copiedGeneral, setCopiedGeneral] = useState(false);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const chatgptUrl = `https://${projectId}.supabase.co/functions/v1/chatgpt-mcp`;
  const generalUrl = `https://${projectId}.supabase.co/functions/v1/mcp`;

  const __seoTags = useSEO({
    title: "Connect an AI assistant to shepi",
    description:
      "Connect ChatGPT or Claude to your shepi account via MCP. Copy the server URL and follow the step-by-step instructions.",
    canonical: "https://shepi.ai/connect",
    ogImage: "https://shepi.ai/og-image.png",
  });

  async function copyUrl(url: string, setter: (v: boolean) => void) {
    try {
      await navigator.clipboard.writeText(url);
      setter(true);
      toast({ title: "Copied", description: "MCP server URL copied to clipboard." });
      setTimeout(() => setter(false), 2000);
    } catch {
      toast({ title: "Copy failed", description: "Please copy the URL manually.", variant: "destructive" });
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {__seoTags}

      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between" aria-label="Primary">
          <Link to="/" aria-label="shepi home">
            <ShepiLogo variant="dark" size="md" />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-muted-foreground hover:text-foreground">Home</Link>
            <Link to="/resources" className="text-muted-foreground hover:text-foreground">Resources</Link>
            <Link to="/for-ai-agents" className="text-muted-foreground hover:text-foreground">For AI agents</Link>
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth?mode=signup">
              <Button>Get started</Button>
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="bg-primary py-16 md:py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Bot className="w-12 h-12 text-primary-foreground/80 mx-auto mb-6" aria-hidden="true" />
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-primary-foreground mb-6">
              Connect an AI assistant to shepi
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              Let ChatGPT or Claude read your projects, adjustments, and QoE summaries — and even create or update projects on your behalf — through the shepi MCP server.
            </p>
          </div>
        </section>

        {/* Server URL */}
        <section className="py-16 px-6 bg-background" aria-labelledby="server-url-heading">
          <div className="max-w-3xl mx-auto">
            <h2 id="server-url-heading" className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-6 flex items-center gap-3">
              <Plug className="w-6 h-6 text-primary" aria-hidden="true" />
              MCP server URL
            </h2>
            <p className="text-muted-foreground mb-4">
              Copy this URL and paste it into ChatGPT or Claude as a custom connector. The assistant will discover the available tools automatically.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                readOnly
                value={mcpUrl}
                aria-label="shepi MCP server URL"
                className="font-mono text-sm bg-card border-border"
              />
              <Button onClick={copyUrl} className="shrink-0 gap-2" aria-label="Copy MCP URL">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy URL"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              This connection is user-authenticated. The assistant can only access the shepi data you authorize during the OAuth approval step.
            </p>
          </div>
        </section>

        {/* ChatGPT */}
        <section className="py-16 px-6 bg-secondary" aria-labelledby="chatgpt-heading">
          <div className="max-w-3xl mx-auto">
            <h2 id="chatgpt-heading" className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-6">
              ChatGPT
            </h2>
            <ol className="space-y-4 list-decimal list-inside text-foreground">
              {CHATGPT_STEPS.map((step, i) => (
                <li key={i} className="pl-2">
                  <span className="text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
            <a
              href="https://chatgpt.com/#settings/Connectors/Advanced"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 mt-6 text-primary hover:underline"
            >
              Open ChatGPT Connectors <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* Claude */}
        <section className="py-16 px-6 bg-background" aria-labelledby="claude-heading">
          <div className="max-w-3xl mx-auto">
            <h2 id="claude-heading" className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-6">
              Claude
            </h2>
            <ol className="space-y-4 list-decimal list-inside text-foreground">
              {CLAUDE_STEPS.map((step, i) => (
                <li key={i} className="pl-2">
                  <span className="text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
            <a
              href="https://claude.ai/customize/connectors?modal=add-custom-connector"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 mt-6 text-primary hover:underline"
            >
              Open Claude custom connectors <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-6 bg-secondary">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-4">
              Ready to analyze a deal?
            </h2>
            <p className="text-muted-foreground mb-8">
              Once connected, your assistant can read project summaries, list adjustments, and compute QoE metrics — but it cannot approve adjustments or issue attestation reports without your review.
            </p>
            <Link to="/auth?mode=signup">
              <Button size="lg" className="gap-2">
                Try shepi free <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShepiLogo size="sm" />
            <span className="text-sm text-muted-foreground">© 2026 SMB EDGE. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/for-ai-agents" className="hover:text-foreground">For AI agents</Link>
            <Link to="/resources" className="hover:text-foreground">Resources</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
