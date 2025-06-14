import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CoachConfig } from "../config.js";
import { getDb } from "../db.js";
import type { WorkoutRow, ExerciseRow } from "../types.js";

export function registerListWorkouts(
  server: McpServer,
  config: CoachConfig
): void {
  const db = getDb(config.database_path);

  server.tool(
    "list-workouts",
    {
      type: z.enum(["running", "cycling", "functional"]).optional(),
      days: z.number().int().positive().optional(), // Show workouts from last N days
      limit: z.number().int().positive().max(50).optional(), // Limit results
    },
    async ({ type, days, limit }) => {
      // Build query based on filters
      let query = `
        SELECT id, type, date, duration_mins, distance_miles, avg_heart_rate, rpe, notes, created_at 
        FROM workouts
      `;
      const params: any[] = [];
      const conditions: string[] = [];

      if (type) {
        conditions.push("type = ?");
        params.push(type);
      }

      if (days) {
        conditions.push("date >= date('now', '-' || ? || ' days')");
        params.push(days);
      }

      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " ORDER BY date DESC, created_at DESC";

      if (limit) {
        query += " LIMIT ?";
        params.push(limit);
      }

      const workouts = db.prepare<any[], WorkoutRow>(query).all(...params);

      if (workouts.length === 0) {
        const filterDesc = type ? ` ${type}` : "";
        const daysDesc = days ? ` from the last ${days} days` : "";
        return {
          content: [
            {
              type: "text",
              text: `No${filterDesc} workouts found${daysDesc}.`,
            },
          ],
        };
      }

      // Get exercises for functional workouts
      const workoutIds = workouts
        .filter((w) => w.type === "functional")
        .map((w) => w.id);

      const exerciseMap = new Map<number, ExerciseRow[]>();
      if (workoutIds.length > 0) {
        const exerciseQuery = `
          SELECT id, workout_id, name, sets, reps, weight_lbs, rest_sec, notes
          FROM exercises 
          WHERE workout_id IN (${workoutIds.map(() => "?").join(",")})
          ORDER BY id ASC
        `;
        const exercises = db
          .prepare<any[], ExerciseRow>(exerciseQuery)
          .all(...workoutIds);

        exercises.forEach((ex) => {
          if (!exerciseMap.has(ex.workout_id)) {
            exerciseMap.set(ex.workout_id, []);
          }
          exerciseMap.get(ex.workout_id)!.push(ex);
        });
      }

      // Format output
      const workoutStrings = workouts.map((w) => {
        let workoutText = `#${w.id}: ${w.type.toUpperCase()} - ${w.date}`;

        // Add workout metrics
        const metrics: string[] = [];
        if (w.duration_mins) metrics.push(`${w.duration_mins} min`);
        if (w.distance_miles) metrics.push(`${w.distance_miles} miles`);
        if (w.avg_heart_rate) metrics.push(`${w.avg_heart_rate} BPM avg`);
        if (w.rpe) metrics.push(`RPE ${w.rpe}/10`);

        if (metrics.length > 0) {
          workoutText += ` (${metrics.join(", ")})`;
        }

        if (w.notes) {
          workoutText += `\n   Notes: ${w.notes}`;
        }

        // Add exercises for functional workouts
        if (w.type === "functional" && exerciseMap.has(w.id)) {
          const exercises = exerciseMap.get(w.id)!;
          workoutText += `\n   Exercises:`;
          exercises.forEach((ex, i) => {
            workoutText += `\n     ${i + 1}. ${ex.name}`;
            const exDetails: string[] = [];
            if (ex.sets && ex.reps) exDetails.push(`${ex.sets}x${ex.reps}`);
            if (ex.weight_lbs) exDetails.push(`${ex.weight_lbs} lbs`);
            if (ex.rest_sec) exDetails.push(`${ex.rest_sec}s rest`);
            if (exDetails.length > 0) {
              workoutText += ` - ${exDetails.join(", ")}`;
            }
            if (ex.notes) {
              workoutText += ` (${ex.notes})`;
            }
          });
        }

        return workoutText;
      });

      const headerParts = [];
      if (type) headerParts.push(type);
      headerParts.push("workouts");
      if (days) headerParts.push(`(last ${days} days)`);

      return {
        content: [
          {
            type: "text",
            text: `📊 Your ${headerParts.join(" ")}:\n\n${workoutStrings.join(
              "\n\n"
            )}`,
          },
        ],
      };
    }
  );
}
