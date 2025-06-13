import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CoachConfig } from "../config.js";
import { registerAddGoal } from "./addGoal.js";

/**
 * Register all Tools with the given MCP server instance.
 */
export function registerTools(server: McpServer, config: CoachConfig): void {
  registerAddGoal(server, config);
}
