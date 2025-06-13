import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CoachConfig } from "../config.js";
import { getDb } from "../db.js";

/**
 * Registers the `update-goal` tool which allows the user to update the text,
 * due-date or metadata for an existing goal identified by its numeric id.
 */
export function registerUpdateGoal(
  server: McpServer,
  config: CoachConfig
): void {
  const db = getDb(config.database_path);

  server.tool(
    "update-goal",
    {
      id: z.number().int().positive(),
      text: z.string().min(3).optional(),
      due_date: z.string().optional(),
      metadata: z.record(z.unknown()).optional(),
    },
    async ({ id, text, due_date, metadata }) => {
      const updates: string[] = [];
      const values: unknown[] = [];

      if (text !== undefined) {
        updates.push("text = ?");
        values.push(text);
      }
      if (due_date !== undefined) {
        updates.push("due_date = ?");
        values.push(due_date);
      }
      if (metadata !== undefined) {
        updates.push("metadata = ?");
        values.push(JSON.stringify(metadata));
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

      // Add id for the WHERE clause
      values.push(id);
      const stmt = db.prepare(
        `UPDATE goals SET ${updates.join(", ")} WHERE id = ?`
      );
      const info = stmt.run(...values);

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
            text: `Goal ${id} updated successfully.`,
          },
        ],
      };
    }
  );
}
