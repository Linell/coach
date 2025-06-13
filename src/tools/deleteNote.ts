import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CoachConfig } from "../config.js";
import { getDb } from "../db.js";

/**
 * Registers the `delete-note` tool which removes a note from the database.
 */
export function registerDeleteNote(
  server: McpServer,
  config: CoachConfig
): void {
  const db = getDb(config.database_path);

  server.tool(
    "delete-note",
    {
      id: z.number().int().positive(),
    },
    async ({ id }) => {
      const stmt = db.prepare("DELETE FROM notes WHERE id = ?");
      const info = stmt.run(id);

      if (info.changes === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No note found with id ${id}.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Note ${id} deleted successfully.`,
          },
        ],
      };
    }
  );
}
