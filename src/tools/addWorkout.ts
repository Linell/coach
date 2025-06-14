import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CoachConfig } from "../config.js";
import { getDb } from "../db.js";

/**
 * Exercise schema for functional fitness workouts
 */
const ExerciseSchema = z.object({
  name: z.string().min(1),
  sets: z.number().int().positive().optional(),
  reps: z.string().optional(), // flexible format: "10,10,8" or "10x3" or "30 seconds"
  weight_lbs: z.number().positive().optional(),
  rest_sec: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

/**
 * Registers the `add-workout` tool which allows comprehensive workout tracking
 * for running, cycling, and functional fitness activities.
 */
export function registerAddWorkout(
  server: McpServer,
  config: CoachConfig
): void {
  const db = getDb(config.database_path);

  server.tool(
    "add-workout",
    {
      type: z.enum(["running", "cycling", "functional"]),
      date: z.string(), // ISO date string (YYYY-MM-DD)
      duration_mins: z.number().int().positive().optional(),
      distance_miles: z.number().positive().optional(),
      avg_heart_rate: z.number().int().positive().max(220).optional(),
      rpe: z.number().int().min(1).max(10).optional(),
      notes: z.string().optional(),
      exercises: z.array(ExerciseSchema).optional(), // For functional fitness
    },
    async ({
      type,
      date,
      duration_mins,
      distance_miles,
      avg_heart_rate,
      rpe,
      notes,
      exercises,
    }) => {
      // Start a transaction for workout + exercises
      const insertWorkout = db.prepare(
        "INSERT INTO workouts (type, date, duration_mins, distance_miles, avg_heart_rate, rpe, notes) VALUES (?, ?, ?, ?, ?, ?, ?)"
      );

      const insertExercise = db.prepare(
        "INSERT INTO exercises (workout_id, name, sets, reps, weight_lbs, rest_sec, notes) VALUES (?, ?, ?, ?, ?, ?, ?)"
      );

      const transaction = db.transaction(() => {
        // Insert the workout
        const result = insertWorkout.run(
          type,
          date,
          duration_mins ?? null,
          distance_miles ?? null,
          avg_heart_rate ?? null,
          rpe ?? null,
          notes ?? null
        );

        const workoutId = result.lastInsertRowid as number;

        // Insert exercises if this is a functional workout
        if (type === "functional" && exercises && exercises.length > 0) {
          for (const exercise of exercises) {
            insertExercise.run(
              workoutId,
              exercise.name,
              exercise.sets ?? null,
              exercise.reps ?? null,
              exercise.weight_lbs ?? null,
              exercise.rest_sec ?? null,
              exercise.notes ?? null
            );
          }
        }

        return workoutId;
      });

      const workoutId = transaction();

      // Build confirmation message
      let message = `🏋️ Great workout! I've logged your ${type} session from ${date}`;

      if (duration_mins) {
        message += ` (${duration_mins} minutes)`;
      }

      if (distance_miles) {
        message += ` covering ${distance_miles} miles`;
      }

      if (avg_heart_rate) {
        message += ` with avg HR ${avg_heart_rate} BPM`;
      }

      if (rpe) {
        message += ` at RPE ${rpe}/10`;
      }

      if (type === "functional" && exercises && exercises.length > 0) {
        message += `\n\nExercises completed:`;
        exercises.forEach((ex, i) => {
          message += `\n${i + 1}. ${ex.name}`;
          if (ex.sets && ex.reps) {
            message += ` - ${ex.sets} sets of ${ex.reps}`;
          }
          if (ex.weight_lbs) {
            message += ` @ ${ex.weight_lbs} lbs`;
          }
        });
      }

      message += `\n\nWorkout ID: #${workoutId}`;

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
