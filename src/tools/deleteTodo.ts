import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CoachConfig } from "../config.js";
import { getDb } from "../db.js";

/**
 * Registers the `delete-todo` tool which removes a todo from the database.
 */
export function registerDeleteTodo(
  server: McpServer,
  config: CoachConfig
): void {
  const db = getDb(config.database_path);

  server.tool(
    "delete-todo",
    {
      id: z.number().int().positive(),
    },
    async ({ id }) => {
      const stmt = db.prepare("DELETE FROM todos WHERE id = ?");
      const info = stmt.run(id);

      if (info.changes === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No todo found with id ${id}.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Todo ${id} deleted successfully.`,
          },
        ],
      };
    }
  );
}
