import { auth, defineMcp } from "@lovable.dev/mcp-js";
import echoTool from "./tools/echo";
import listProjectsTool from "./tools/listProjects";
import getProjectSummaryTool from "./tools/getProjectSummary";
import listDocumentsTool from "./tools/listDocuments";
import listAdjustmentsTool from "./tools/listAdjustments";
import getAdjustmentDetailTool from "./tools/getAdjustmentDetail";
import getQualityOfEarningsSummaryTool from "./tools/getQualityOfEarningsSummary";
import createProjectTool from "./tools/createProject";
import updateAdjustmentStatusTool from "./tools/updateAdjustmentStatus";
import getExportDataTool from "./tools/getExportData";
import runDiscoveryTool from "./tools/runDiscovery";
import getDiscoveryStatusTool from "./tools/getDiscoveryStatus";
import validateFinancialStatementTool from "./tools/validateFinancialStatement";

// The OAuth issuer must be the direct Supabase host (never the .lovable.cloud
// proxy). Build it from the project ref, which survives publish unchanged.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "shepi-mcp",
  title: "shepi",
  version: "0.2.0",
  instructions:
    "MCP server for the Shepi Intelligent Quality of Earnings Platform. Tools let a connected AI assistant read projects, documents, adjustments, and QoE summaries; create projects; update adjustment statuses; and retrieve structured export data. All data access is scoped to the authenticated Shepi user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    echoTool,
    listProjectsTool,
    getProjectSummaryTool,
    listDocumentsTool,
    listAdjustmentsTool,
    getAdjustmentDetailTool,
    getQualityOfEarningsSummaryTool,
    createProjectTool,
    updateAdjustmentStatusTool,
    getExportDataTool,
    runDiscoveryTool,
    getDiscoveryStatusTool,
    validateFinancialStatementTool,
  ],
});
