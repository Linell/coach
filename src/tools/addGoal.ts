import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CoachConfig } from "../config.js";
import { getDb } from "../db.js";

/**
 * Registers the `add-goal` tool which allows the user to append a goal to a
 * persistent SQLite store. The schema also supports optional metadata so the
 * structure can evolve without touching every tool.
 */
export function registerAddGoal(server: McpServer, config: CoachConfig): void {
  const db = getDb(config.database_path);

  server.tool(
    "add-goal",
    {
      goal: z.string().min(3),
      due_date: z.string().optional(),
      metadata: z.record(z.unknown()).optional(),
    },
    async ({ goal, due_date, metadata }) => {
      // Insert the new goal into the database. We currently don't capture any
      // additional metadata beyond an optional due date, but the table schema
      // has a JSON column should we wish to store more in future.
      const insert = db.prepare(
        "INSERT INTO goals (text, due_date, metadata) VALUES (?, ?, ?)"
      );
      insert.run(
        goal,
        due_date ?? null,
        metadata ? JSON.stringify(metadata) : null
      );

      return {
        content: [
          {
            type: "text",
            text: `Great! I've added "${goal}" to your goals list${
              due_date ? ", due " + due_date + "." : "."
            }`,
          },
        ],
      };
    }
  );
}
