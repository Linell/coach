import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CoachConfig } from "../config.js";
import { getDb } from "../db.js";

/**
 * Registers the `delete-goal` tool which removes a goal from the database.
 */
export function registerDeleteGoal(
  server: McpServer,
  config: CoachConfig
): void {
  const db = getDb(config.database_path);

  server.tool(
    "delete-goal",
    {
      id: z.number().int().positive(),
    },
    async ({ id }) => {
      const stmt = db.prepare("DELETE FROM goals WHERE id = ?");
      const info = stmt.run(id);

      if (info.changes === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No goal found with id ${id}.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Goal ${id} deleted successfully.`,
          },
        ],
      };
    }
  );
}
