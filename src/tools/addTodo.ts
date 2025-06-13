import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CoachConfig } from "../config.js";
import { getDb } from "../db.js";

/**
 * Registers the `add-todo` tool which allows the user to append a todo to a
 * persistent SQLite store.
 */
export function registerAddTodo(server: McpServer, config: CoachConfig): void {
  const db = getDb(config.database_path);

  server.tool(
    "add-todo",
    {
      todo: z.string().min(3),
      due_date: z.string().optional(),
      tags: z.array(z.string()).optional(),
    },
    async ({ todo, due_date, tags }) => {
      const insert = db.prepare(
        "INSERT INTO todos (text, due_date, tags) VALUES (?, ?, ?)"
      );
      insert.run(todo, due_date ?? null, tags ? JSON.stringify(tags) : null);

      let message = `Great! I've added "${todo}" to your todo list`;
      if (due_date) {
        message += `, due ${due_date}`;
      }
      if (tags && tags.length > 0) {
        message += ` (tags: ${tags.join(", ")})`;
      }
      message += ".";

      return {
        content: [
          {
            type: "text",
            text: message,
          },
        ],
      };
    }
  );
}
