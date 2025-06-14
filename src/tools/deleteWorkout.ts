import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CoachConfig } from "../config.js";
import { getDb } from "../db.js";
import type { WorkoutRow } from "../types.js";

export function registerDeleteWorkout(
  server: McpServer,
  config: CoachConfig
): void {
  const db = getDb(config.database_path);

  server.tool(
    "delete-workout",
    {
      id: z.number().int().positive(),
    },
    async ({ id }) => {
      // Check if workout exists first and get details for confirmation
      const workout = db
        .prepare<[number], WorkoutRow>("SELECT * FROM workouts WHERE id = ?")
        .get(id);

      if (!workout) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Workout #${id} not found.`,
            },
          ],
        };
      }

      // Delete workout (exercises will be cascade deleted due to foreign key)
      const result = db.prepare("DELETE FROM workouts WHERE id = ?").run(id);

      if (result.changes === 0) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Failed to delete workout #${id}.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `🗑️ Deleted workout #${id} (${workout.type.toUpperCase()}) from ${
              workout.date
            }. All associated exercises have also been removed.`,
          },
        ],
      };
    }
  );
}
