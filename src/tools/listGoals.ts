import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CoachConfig } from "../config.js";
import { getDb } from "../db.js";

type GoalRow = {
  id: number;
  text: string;
  completed: number; // 0 or 1
};

export function registerListGoals(
  server: McpServer,
  config: CoachConfig
): void {
  const db = getDb(config.database_path);

  server.tool("list-goals", {}, async () => {
    const goals = db
      .prepare<[], GoalRow>("SELECT id, text, completed FROM goals")
      .all();

    if (goals.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "You have no goals yet.",
          },
        ],
      };
    }

    const goalStrings = goals.map((g) => {
      const status = g.completed ? "✓" : "✗";
      return `#${g.id}: ${g.text} [${status}]`;
    });

    return {
      content: [
        {
          type: "text",
          text: `Here are your goals:\n- ${goalStrings.join("\n- ")}`,
        },
      ],
    };
  });
}
