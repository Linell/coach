import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { promises as fs } from "node:fs";
import type { CoachConfig } from "../config.js";

/**
 * Registers the `add-goal` tool which allows the user to append a goal to a
 * simple JSON store (one file per user configuration).
 */
export function registerAddGoal(server: McpServer, config: CoachConfig): void {
  const goalsFile = `${config.database_path}.goals.json`;

  server.tool("add-goal", { goal: z.string().min(3) }, async ({ goal }) => {
    let stored: string[] = [];
    try {
      const raw = await fs.readFile(goalsFile, "utf8");
      stored = JSON.parse(raw) as string[];
    } catch {
      // ignore missing/corrupt file – start fresh
    }

    stored.push(goal);
    await fs.writeFile(goalsFile, JSON.stringify(stored, null, 2), "utf8");

    return {
      content: [
        {
          type: "text",
          text: `Great! I've added "${goal}" to your goals list.`,
        },
      ],
    };
  });
}
