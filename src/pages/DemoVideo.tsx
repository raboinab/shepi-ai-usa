import { DemoAuthGate } from "@/components/DemoAuthGate";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play } from "lucide-react";
import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

const VIDEO_TITLE = "Shepi Product Demo";
const LOOM_VIDEO_ID = "f378161442644660bd880b0c2b9e9c9f";

export default function DemoVideo() {
  const milestonesFired = useRef<Set<number>>(new Set());
  const startedRef = useRef(false);
  const completedRef = useRef(false);
  const lastPercentRef = useRef(0);

  // Listen to Loom's postMessage events for play / time / end
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      // Loom posts messages from https://www.loom.com
      if (typeof e.origin !== "string" || !e.origin.includes("loom.com")) return;
      let data: any = e.data;
      if (typeof data === "string") {
        try { data = JSON.parse(data); } catch { return; }
      }
      if (!data || typeof data !== "object") return;

      // Loom emits events like: { event: "play" | "pause" | "timeupdate" | "ended", currentTime, duration }
      const evt = data.event || data.type;
      const currentTime = Number(data.currentTime ?? data.data?.currentTime ?? 0);
      const duration = Number(data.duration ?? data.data?.duration ?? 0);

      if (evt === "play" && !startedRef.current) {
        startedRef.current = true;
        trackEvent("video_start", {
          video_title: VIDEO_TITLE,
          video_provider: "loom",
          video_duration: duration || undefined,
        });
      }

      if ((evt === "timeupdate" || evt === "playbackProgress") && duration > 0) {
        const pct = Math.floor((currentTime / duration) * 100);
        lastPercentRef.current = pct;
        for (const m of [25, 50, 75]) {
          if (pct >= m && !milestonesFired.current.has(m)) {
            milestonesFired.current.add(m);
            trackEvent("video_progress", {
              video_title: VIDEO_TITLE,
              video_provider: "loom",
              percent: m,
              video_duration: duration,
            });
          }
        }
      }

      if ((evt === "ended" || evt === "complete") && !completedRef.current) {
        completedRef.current = true;
        trackEvent("video_complete", {
          video_title: VIDEO_TITLE,
          video_provider: "loom",
          video_duration: duration || undefined,
        });
      }
    };

    window.addEventListener("message", onMessage);

    // Fire abandon event with last known percent on unmount/unload
    const onUnload = () => {
      if (startedRef.current && !completedRef.current) {
        trackEvent("video_abandoned", {
          video_title: VIDEO_TITLE,
          video_provider: "loom",
          last_percent: lastPercentRef.current,
        });
      }
    };
    window.addEventListener("beforeunload", onUnload);

    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("beforeunload", onUnload);
      onUnload();
    };
  }, []);

  return (
    <DemoAuthGate page="demo_video">
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between px-4">
            <Link to="/" className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-semibold text-lg">Shepi</span>
            </Link>
            <Link to="/dashboard/demo">
              <Button variant="outline" size="sm" className="gap-2">
                <Play className="w-4 h-4" />
                Try Live Demo
              </Button>
            </Link>
          </div>
        </header>

        {/* Demo Banner */}
        <div className="bg-secondary/10 border-b border-secondary/20 py-2 px-4 text-center">
          <p className="text-sm text-secondary font-medium">
            🎥 Product Walkthrough — See how Shepi automates Quality of Earnings analysis
          </p>
        </div>

        {/* Video Section */}
        <main className="container max-w-5xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Watch Shepi in Action
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              See how Shepi transforms raw financial data into a complete Quality of Earnings report in minutes, not weeks.
            </p>
          </div>

          {/* Loom Embed — enable postMessage events via ?embedFrameUrl param */}
          <div className="relative w-full rounded-xl overflow-hidden border border-border/50 shadow-2xl" style={{ paddingBottom: "56.25%" }}>
            <iframe
              src={`https://www.loom.com/embed/${LOOM_VIDEO_ID}?sid=auto`}
              frameBorder="0"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
              title={VIDEO_TITLE}
            />
          </div>

          {/* CTA Section */}
          <div className="mt-12 text-center space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Ready to try it yourself?</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/dashboard/demo">
                <Button size="lg" className="gap-2 px-8">
                  <Play className="w-5 h-5" />
                  Try the Live Demo
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline" className="px-8">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </DemoAuthGate>
  );
}
