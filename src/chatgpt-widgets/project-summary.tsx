/**
 * ChatGPT / MCP Apps widget: Shepi project summary + QoE metrics.
 *
 * This widget runs inside a sandboxed iframe in ChatGPT. It receives the
 * tool-call result (project metadata + QoE summary) via the MCP Apps bridge
 * and can call back into the server for actions like refreshing metrics.
 */
import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult, McpUiHostContext } from "@modelcontextprotocol/ext-apps";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

interface ProjectSummary {
  project?: {
    id: string;
    name: string;
    target_company: string | null;
    client_name: string | null;
    industry: string | null;
    transaction_type: string | null;
    status: string;
    service_tier: string;
    current_phase: number;
    current_section: number;
  };
  summary?: {
    project_id: string;
    project_name: string;
    target_company: string | null;
    revenue: number;
    grossProfit: number;
    netIncome: number;
    reportedEBITDA: number;
    totalAdjustments: number;
    adjustedEBITDA: number;
    adjustmentCount: number;
    ltmPeriodIds: string[];
    currency: string;
    scope: string;
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function extractSummary(result: CallToolResult | null): ProjectSummary | null {
  if (!result) return null;
  const text = result.content.find((c) => c.type === "text")?.text;
  if (!text) return null;
  try {
    return JSON.parse(text) as ProjectSummary;
  } catch {
    return null;
  }
}

function ProjectSummaryApp() {
  const [toolResult, setToolResult] = useState<CallToolResult | null>(null);
  const [hostContext, setHostContext] = useState<McpUiHostContext | undefined>();

  const { app, error } = useApp({
    appInfo: { name: "Shepi Project Summary", version: "0.1.0" },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = async (result) => {
        setToolResult(result);
      };
      app.onhostcontextchanged = (params) => {
        setHostContext((prev) => ({ ...prev, ...params }));
      };
      app.onerror = console.error;
    },
  });

  useEffect(() => {
    if (app) {
      setHostContext(app.getHostContext());
    }
  }, [app]);

  if (error) {
    return (
      <div className="widget-root">
        <div className="widget-error">Error: {error.message}</div>
      </div>
    );
  }
  if (!app) {
    return (
      <div className="widget-root">
        <div className="widget-loading">Connecting to ChatGPT…</div>
      </div>
    );
  }

  return <ProjectSummaryInner app={app} result={toolResult} hostContext={hostContext} />;
}

interface ProjectSummaryInnerProps {
  app: any;
  result: CallToolResult | null;
  hostContext?: McpUiHostContext;
}

function ProjectSummaryInner({ app, result, hostContext }: ProjectSummaryInnerProps) {
  const summary = extractSummary(result);
  const project = summary?.project;
  const qoe = summary?.summary;

  const insets = hostContext?.safeAreaInsets;

  return (
    <div
      className="widget-root"
      style={{
        paddingTop: insets?.top,
        paddingRight: insets?.right,
        paddingBottom: insets?.bottom,
        paddingLeft: insets?.left,
      }}
    >
      <header className="widget-header">
        <h1 className="widget-title">{project?.name ?? qoe?.project_name ?? "Project Summary"}</h1>
        {project?.target_company && (
          <p className="widget-subtitle">Target: {project.target_company}</p>
        )}
      </header>

      {qoe && (
        <section className="widget-section">
          <h2 className="widget-section-title">Quality of Earnings (LTM)</h2>
          <div className="metrics-grid">
            <MetricCard label="Revenue" value={qoe.revenue} />
            <MetricCard label="Gross Profit" value={qoe.grossProfit} />
            <MetricCard label="Reported EBITDA" value={qoe.reportedEBITDA} />
            <MetricCard label="Total Adjustments" value={qoe.totalAdjustments} />
            <MetricCard label="Adjusted EBITDA" value={qoe.adjustedEBITDA} highlighted />
          </div>
          <p className="widget-scope">{qoe.scope}</p>
        </section>
      )}

      {project && (
        <section className="widget-section">
          <h2 className="widget-section-title">Project Details</h2>
          <dl className="details-list">
            <DetailRow label="Status" value={project.status} />
            <DetailRow label="Service tier" value={project.service_tier} />
            <DetailRow label="Industry" value={project.industry} />
            <DetailRow label="Transaction type" value={project.transaction_type} />
            <DetailRow label="Phase" value={`${project.current_phase}.${project.current_section}`} />
          </dl>
        </section>
      )}

      <div className="widget-actions">
        <button
          className="widget-button"
          onClick={async () => {
            try {
              await app.callServerTool({
                name: "get_quality_of_earnings_summary",
                arguments: { project_id: project?.id ?? qoe?.project_id },
              });
            } catch (e) {
              console.error("Failed to refresh QoE summary:", e);
            }
          }}
        >
          Refresh QoE summary
        </button>
      </div>
    </div>
  );
}

function MetricCard({ label, value, highlighted = false }: { label: string; value: number; highlighted?: boolean }) {
  return (
    <div className={`metric-card ${highlighted ? "metric-card-highlighted" : ""}`}>
      <span className="metric-label">{label}</span>
      <span className="metric-value">{formatCurrency(value)}</span>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="detail-row">
      <dt className="detail-label">{label}</dt>
      <dd className="detail-value">{value}</dd>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ProjectSummaryApp />
  </StrictMode>,
);
