import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CoachConfig } from "../config.js";
import { getDb } from "../db.js";

/**
 * Registers the `update-todo` tool which allows the user to update the text,
 * due-date, tags, or completed status for an existing todo identified by its
 * numeric id.
 */
export function registerUpdateTodo(
  server: McpServer,
  config: CoachConfig
): void {
  const db = getDb(config.database_path);

  server.tool(
    "update-todo",
    {
      id: z.number().int().positive(),
      text: z.string().min(3).optional(),
      due_date: z.string().optional(),
      tags: z.array(z.string()).optional(),
      completed: z.boolean().optional(),
    },
    async ({ id, text, due_date, tags, completed }) => {
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
      if (tags !== undefined) {
        updates.push("tags = ?");
        values.push(JSON.stringify(tags));
      }
      if (completed !== undefined) {
        updates.push("completed = ?");
        values.push(completed ? 1 : 0);
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
        `UPDATE todos SET ${updates.join(", ")} WHERE id = ?`
      );
      const info = stmt.run(...values);

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
            text: `Todo ${id} updated successfully.`,
          },
        ],
      };
    }
  );
}
