#!/usr/bin/env node

import { ensureConfig } from "./config.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

async function main(): Promise<void> {
  const config = await ensureConfig();

  // Future work: replace with a proper SQLite client library. For now we just
  // ensure the file exists (handled by ensureConfig) and log its location.
  console.log(`Database initialized at ${config.database_path}`);

  // Instantiate an MCP server instance. Actual routes and tools will be added later.
  const server = new McpServer({
    name: "coach-server",
    version: "0.1.0",
  });

  // eslint-disable-next-line no-unused-vars
  void server; // Placeholder – prevents the unused variable rule from triggering for now.

  console.log("Coach foundation initialised successfully.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
