import { defineMcp } from "@lovable.dev/mcp-js";
import echoTool from "./tools/echo";

export default defineMcp({
  name: "shepi-mcp",
  title: "shepi",
  version: "0.1.0",
  instructions:
    "MCP server for the shepi Quality of Earnings platform. Use `echo` to verify connectivity. More tools will be added over time.",
  tools: [echoTool],
});
