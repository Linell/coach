import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CoachConfig } from "../config.js";
import { getDb } from "../db.js";
import type { WorkoutRow } from "../types.js";

const ExerciseSchema = z.object({
  name: z.string().min(1),
  sets: z.number().int().positive().optional(),
  reps: z.string().optional(),
  weight_lbs: z.number().positive().optional(),
  rest_sec: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

export function registerUpdateWorkout(
  server: McpServer,
  config: CoachConfig
): void {
  const db = getDb(config.database_path);

  server.tool(
    "update-workout",
    {
      id: z.number().int().positive(),
      type: z.enum(["running", "cycling", "functional"]).optional(),
      date: z.string().optional(),
      duration_mins: z.number().int().positive().optional(),
      distance_miles: z.number().positive().optional(),
      avg_heart_rate: z.number().int().positive().max(220).optional(),
      rpe: z.number().int().min(1).max(10).optional(),
      notes: z.string().optional(),
      exercises: z.array(ExerciseSchema).optional(), // Replace all exercises for functional workouts
    },
    async ({
      id,
      type,
      date,
      duration_mins,
      distance_miles,
      avg_heart_rate,
      rpe,
      notes,
      exercises,
    }) => {
      // Check if workout exists
      const existingWorkout = db
        .prepare<[number], WorkoutRow>("SELECT * FROM workouts WHERE id = ?")
        .get(id);

      if (!existingWorkout) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Workout #${id} not found.`,
            },
          ],
        };
      }

      // Build update query for workout
      const updates: string[] = [];
      const params: any[] = [];

      if (type !== undefined) {
        updates.push("type = ?");
        params.push(type);
      }
      if (date !== undefined) {
        updates.push("date = ?");
        params.push(date);
      }
      if (duration_mins !== undefined) {
        updates.push("duration_mins = ?");
        params.push(duration_mins);
      }
      if (distance_miles !== undefined) {
        updates.push("distance_miles = ?");
        params.push(distance_miles);
      }
      if (avg_heart_rate !== undefined) {
        updates.push("avg_heart_rate = ?");
        params.push(avg_heart_rate);
      }
      if (rpe !== undefined) {
        updates.push("rpe = ?");
        params.push(rpe);
      }
      if (notes !== undefined) {
        updates.push("notes = ?");
        params.push(notes);
      }

      const transaction = db.transaction(() => {
        // Update workout if any fields provided
        if (updates.length > 0) {
          const updateQuery = `UPDATE workouts SET ${updates.join(
            ", "
          )} WHERE id = ?`;
          params.push(id);
          db.prepare(updateQuery).run(...params);
        }

        // Handle exercises for functional workouts
        const finalType = type ?? existingWorkout.type;
        if (finalType === "functional" && exercises !== undefined) {
          // Delete existing exercises
          db.prepare("DELETE FROM exercises WHERE workout_id = ?").run(id);

          // Insert new exercises
          if (exercises.length > 0) {
            const insertExercise = db.prepare(
              "INSERT INTO exercises (workout_id, name, sets, reps, weight_lbs, rest_sec, notes) VALUES (?, ?, ?, ?, ?, ?, ?)"
            );

            for (const exercise of exercises) {
              insertExercise.run(
                id,
                exercise.name,
                exercise.sets ?? null,
                exercise.reps ?? null,
                exercise.weight_lbs ?? null,
                exercise.rest_sec ?? null,
                exercise.notes ?? null
              );
            }
          }
        }
      });

      transaction();

      // Get updated workout for confirmation
      const updatedWorkout = db
        .prepare<[number], WorkoutRow>("SELECT * FROM workouts WHERE id = ?")
        .get(id)!;

      // Build confirmation message
      let message = `✅ Updated workout #${id} (${updatedWorkout.type.toUpperCase()}) from ${
        updatedWorkout.date
      }`;

      const metrics: string[] = [];
      if (updatedWorkout.duration_mins)
        metrics.push(`${updatedWorkout.duration_mins} min`);
      if (updatedWorkout.distance_miles)
        metrics.push(`${updatedWorkout.distance_miles} miles`);
      if (updatedWorkout.avg_heart_rate)
        metrics.push(`${updatedWorkout.avg_heart_rate} BPM`);
      if (updatedWorkout.rpe) metrics.push(`RPE ${updatedWorkout.rpe}/10`);

      if (metrics.length > 0) {
        message += `\n📊 Metrics: ${metrics.join(", ")}`;
      }

      if (updatedWorkout.notes) {
        message += `\n📝 Notes: ${updatedWorkout.notes}`;
      }

      if (updatedWorkout.type === "functional" && exercises !== undefined) {
        message += `\n💪 Updated exercises (${exercises.length} total)`;
        if (exercises.length > 0) {
          exercises.forEach((ex, i) => {
            message += `\n  ${i + 1}. ${ex.name}`;
            if (ex.sets && ex.reps) {
              message += ` - ${ex.sets}x${ex.reps}`;
            }
            if (ex.weight_lbs) {
              message += ` @ ${ex.weight_lbs} lbs`;
            }
          });
        }
      }

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
