import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDailyTip } from "./dailyTip.js";

/**
 * Register all Resources with the given MCP server instance.
 */
export function registerResources(server: McpServer): void {
  registerDailyTip(server);
}
