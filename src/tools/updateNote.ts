import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CoachConfig } from "../config.js";
import { getDb } from "../db.js";

/**
 * Registers the `update-note` tool which allows updating the text and/or tags
 * of a note identified by its numeric id.
 */
export function registerUpdateNote(
  server: McpServer,
  config: CoachConfig
): void {
  const db = getDb(config.database_path);

  server.tool(
    "update-note",
    {
      id: z.number().int().positive(),
      text: z.string().min(3).optional(),
      tags: z.array(z.string()).optional(),
    },
    async ({ id, text, tags }) => {
      const updates: string[] = [];
      const values: unknown[] = [];

      if (text !== undefined) {
        updates.push("text = ?");
        values.push(text);
      }
      if (tags !== undefined) {
        updates.push("tags = ?");
        values.push(JSON.stringify(tags));
      }

      if (updates.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No updates provided. Please specify at least one field to change.",
            },
          ],
        };
      }

      values.push(id);
      const stmt = db.prepare(
        `UPDATE notes SET ${updates.join(", ")} WHERE id = ?`
      );
      const info = stmt.run(...values);

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
            text: `Note ${id} updated successfully.`,
          },
        ],
      };
    }
  );
}
