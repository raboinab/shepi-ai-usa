import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ShepiLogo } from "./ShepiLogo";

interface LegalPageLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function LegalPageLayout({ title, children }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <ShepiLogo className="h-8 w-8" />
            <span className="text-xl font-bold text-foreground">Shepi</span>
          </Link>
          <Link 
            to="/" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-8">{title}</h1>
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ShepiLogo className="h-6 w-6" />
              <span className="text-sm text-muted-foreground">
                © 2026 SMB EDGE. All rights reserved.
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link to="/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
              <Link to="/eula" className="hover:text-foreground transition-colors">EULA</Link>
              <Link to="/dpa" className="hover:text-foreground transition-colors">DPA</Link>
              <Link to="/subprocessors" className="hover:text-foreground transition-colors">Subprocessors</Link>
              <button 
                onClick={() => (window as any).UC_UI?.showSecondLayer()} 
                className="hover:text-foreground transition-colors cursor-pointer"
              >
                Privacy Settings
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
