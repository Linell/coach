import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CoachConfig } from "../config.js";
import { getDb } from "../db.js";

type GoalRow = {
  text: string;
};

export function registerListGoals(
  server: McpServer,
  config: CoachConfig
): void {
  const db = getDb(config.database_path);

  server.tool("list-goals", {}, async () => {
    const goals = db.prepare<[], GoalRow>("SELECT text FROM goals").all();

    return {
      content: [
        {
          type: "text",
          text: `Here are your goals: ${goals
            .map((goal) => goal.text)
            .join(", ")}`,
        },
      ],
    };
  });
}
