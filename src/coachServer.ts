import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ensureConfig } from "./config.js";
import { registerResources } from "./resources/index.js";
import { registerTools } from "./tools/index.js";
import { registerPrompts } from "./prompts/index.js";

/**
 * Build and start an MCP server with example life-coach content.
 */
export async function startCoachServer(): Promise<void> {
  const config = await ensureConfig();

  const server = new McpServer({
    name: "CoachAI",
    version: "0.1.0",
  });

  // Register resources, tools and prompts from their respective modules.
  registerResources(server);
  registerTools(server, config);
  registerPrompts(server);

  /* ────────────────────────────────────────────
   * Connect the server via stdio so it can be used directly from the CLI or
   * by compatible MCP clients.
   * ────────────────────────────────────────────*/
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr so we don't interfere with the MCP JSON stream on stdout.
  console.error("Coach MCP server is ready.");
}
