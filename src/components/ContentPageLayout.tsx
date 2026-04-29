import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ShepiLogo from "@/components/ShepiLogo";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useSEO } from "@/hooks/useSEO";
import { useBreadcrumbJsonLd } from "@/hooks/useBreadcrumbJsonLd";
import { cn } from "@/lib/utils";

interface TOCItem {
  id: string;
  label: string;
}

interface BreadcrumbEntry {
  label: string;
  href?: string;
}

interface ContentPageLayoutProps {
  children: React.ReactNode;
  title: string;
  seoTitle: string;
  seoDescription: string;
  canonical: string;
  breadcrumbs: BreadcrumbEntry[];
  toc?: TOCItem[];
  jsonLd?: object;
  publishedDate?: string;
  modifiedDate?: string;
  heroAccent?: boolean;
}

export function ContentPageLayout({
  children,
  title,
  seoTitle,
  seoDescription,
  canonical,
  breadcrumbs,
  toc,
  jsonLd,
  publishedDate,
  modifiedDate,
  heroAccent,
}: ContentPageLayoutProps) {
  // Auto-generate BreadcrumbList JSON-LD from the same array used by the
  // visible breadcrumb UI. Merge with any caller-supplied jsonLd so guides
  // can also pass Article/HowTo schema.
  const breadcrumbJsonLd = useBreadcrumbJsonLd(breadcrumbs, canonical);
  const mergedJsonLd: object[] = [breadcrumbJsonLd];
  if (jsonLd) {
    if (Array.isArray(jsonLd)) mergedJsonLd.push(...(jsonLd as object[]));
    else mergedJsonLd.push(jsonLd);
  }

  const __seoTags = useSEO({
    title: seoTitle,
    description: seoDescription,
    canonical,
    ogImage: "/og-image.png",
    jsonLd: mergedJsonLd,
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  // Intersection observer for TOC highlight
  useEffect(() => {
    if (!toc?.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );
    toc.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [toc]);

  return (
    <div className="min-h-screen bg-background">
      {__seoTags}
      {/* Nav */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <ShepiLogo variant="dark" size="md" />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">Home</Link>
            <Link to="/resources" className="text-muted-foreground hover:text-foreground transition-colors">Resources</Link>
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/auth">
              <Button variant="outline">Log In</Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button>Get Started</Button>
            </Link>
          </div>
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border px-4 py-4 flex flex-col gap-3 bg-card">
            <Link to="/" className="text-muted-foreground hover:text-foreground py-2" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link to="/resources" className="text-muted-foreground hover:text-foreground py-2" onClick={() => setMobileMenuOpen(false)}>Resources</Link>
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground py-2" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
            <div className="flex gap-3 pt-3 border-t border-border">
              <Link to="/auth" className="flex-1"><Button variant="outline" className="w-full">Log In</Button></Link>
              <Link to="/auth?mode=signup" className="flex-1"><Button className="w-full">Get Started</Button></Link>
            </div>
          </div>
        )}
      </header>

      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link to="/">Home</Link></BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbs.map((b, i) => (
              <span key={i} className="contents">
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {b.href ? (
                    <BreadcrumbLink asChild><Link to={b.href}>{b.label}</Link></BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{b.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </span>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Main content with optional TOC sidebar */}
      <div className="container mx-auto px-4 pb-16">
        <div className="flex gap-12">
          {/* TOC sidebar (desktop) */}
          {toc && toc.length > 0 && (
            <aside className="hidden lg:block w-64 shrink-0">
              <nav className="sticky top-24 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">On this page</p>
                {toc.map(({ id, label }) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className={cn(
                      "block text-sm py-1.5 px-3 rounded-md transition-colors",
                      activeSection === id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {label}
                  </a>
                ))}
              </nav>
            </aside>
          )}

          {/* Article */}
          <article className="flex-1 min-w-0 max-w-3xl">
            <header className="mb-10">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground leading-tight mb-4">
                {title}
              </h1>
              {heroAccent && (
                <div className="h-1 w-16 rounded-full bg-primary mb-4" />
              )}
              {(publishedDate || modifiedDate) && (
                <p className="text-sm text-muted-foreground">
                  {modifiedDate ? `Updated ${modifiedDate}` : `Published ${publishedDate}`}
                </p>
              )}
            </header>
            <div className="prose prose-neutral dark:prose-invert max-w-none
              prose-headings:font-serif prose-headings:text-foreground
              prose-p:text-foreground/90 prose-li:text-foreground/90
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-strong:text-foreground
            ">
              {children}
            </div>
          </article>
        </div>
      </div>

      {/* CTA Section */}
      <section className="bg-primary py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-primary-foreground mb-4">
            Ready to Accelerate Your QoE Analysis?
          </h2>
          <p className="text-primary-foreground/80 mb-8 text-lg">
            From raw financials to lender-ready conclusions in hours, not weeks.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth?mode=signup">
              <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2">
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/dashboard/demo">
              <Button size="lg" variant="outline" className="border-secondary text-secondary bg-transparent hover:bg-secondary/10">
                Try Live Demo
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="ghost" className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/5">
                See Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ShepiLogo size="sm" />
              <span className="text-sm text-muted-foreground">© 2026 SMB EDGE. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/resources" className="hover:text-foreground transition-colors">Resources</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link to="/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
              <Link to="/eula" className="hover:text-foreground transition-colors">EULA</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
