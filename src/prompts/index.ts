import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDailyReflection } from "./dailyReflection.js";

/**
 * Register all Prompts with the given MCP server instance.
 */
export function registerPrompts(server: McpServer): void {
  registerDailyReflection(server);
}
