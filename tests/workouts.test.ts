import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { getDb } from "../src/db.js";
import { registerAddWorkout } from "../src/tools/addWorkout.js";
import { registerListWorkouts } from "../src/tools/listWorkouts.js";
import { registerUpdateWorkout } from "../src/tools/updateWorkout.js";
import { registerDeleteWorkout } from "../src/tools/deleteWorkout.js";
import { registerWorkoutStats } from "../src/tools/workoutStats.js";
import type { CoachConfig } from "../src/config.js";
import type { WorkoutRow } from "../src/types.js";

// Declare global type for database connection
declare global {
  // eslint-disable-next-line no-var
  var __coachDb: import("better-sqlite3").Database | undefined;
}

/** A minimal stub of the MCP server that only implements the `tool` method. */
class StubServer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handlers: Record<string, any> = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  tool(name: string, _schema: unknown, handler: any) {
    this.handlers[name] = handler;
  }
}

describe("Workout Tools", () => {
  let tmpDir: string;
  let config: CoachConfig;
  let server: StubServer;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "coach-workout-test-"));
    config = { database_path: path.join(tmpDir, "db.sqlite") };
    server = new StubServer();

    /* Register tools against the stub server */
    registerAddWorkout(server as unknown as any, config);
    registerListWorkouts(server as unknown as any, config);
    registerUpdateWorkout(server as unknown as any, config);
    registerDeleteWorkout(server as unknown as any, config);
    registerWorkoutStats(server as unknown as any, config);
  });

  afterEach(async () => {
    // Close the database connection and clear global state
    if (globalThis.__coachDb) {
      globalThis.__coachDb.close();
      globalThis.__coachDb = undefined;
    }
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test("add-workout creates running workout", async () => {
    const result = await server.handlers["add-workout"]({
      type: "running",
      date: "2024-01-15",
      duration_mins: 30,
      distance_miles: 3.1,
      avg_heart_rate: 150,
      rpe: 7,
      notes: "Good morning run",
    });

    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toContain("Great workout!");
    expect(result.content[0].text).toContain("running session");
    expect(result.content[0].text).toContain("3.1 miles");
    expect(result.content[0].text).toContain("150 BPM");
    expect(result.content[0].text).toContain("RPE 7/10");
  });

  test("add-workout creates functional workout with exercises", async () => {
    const result = await server.handlers["add-workout"]({
      type: "functional",
      date: "2024-01-15",
      duration_mins: 45,
      rpe: 8,
      exercises: [
        {
          name: "Kettlebell Swings",
          sets: 3,
          reps: "20",
          weight_lbs: 35,
        },
        {
          name: "Push-ups",
          sets: 3,
          reps: "15,12,10",
        },
      ],
    });

    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toContain("functional session");
    expect(result.content[0].text).toContain("Exercises completed:");
    expect(result.content[0].text).toContain("Kettlebell Swings");
    expect(result.content[0].text).toContain("35 lbs");
  });

  test("list-workouts shows empty list initially", async () => {
    const result = await server.handlers["list-workouts"]({});

    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toContain("No workouts found");
  });

  test("list-workouts shows workouts after adding", async () => {
    // Add a workout first
    await server.handlers["add-workout"]({
      type: "cycling",
      date: "2024-01-15",
      duration_mins: 60,
      distance_miles: 15.5,
      avg_heart_rate: 140,
      rpe: 6,
    });

    const result = await server.handlers["list-workouts"]({});

    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toContain("Your workouts:");
    expect(result.content[0].text).toContain("CYCLING");
    expect(result.content[0].text).toContain("15.5 miles");
    expect(result.content[0].text).toContain("140 BPM");
  });

  test("update-workout modifies existing workout", async () => {
    // Add a workout first
    await server.handlers["add-workout"]({
      type: "running",
      date: "2024-01-15",
      duration_mins: 30,
      distance_miles: 3.0,
      rpe: 6,
    });

    // Update the workout
    const updateResult = await server.handlers["update-workout"]({
      id: 1,
      distance_miles: 3.5,
      rpe: 7,
      notes: "Felt stronger today",
    });

    expect(updateResult.content[0].type).toBe("text");
    expect(updateResult.content[0].text).toContain("✅ Updated workout #1");
    expect(updateResult.content[0].text).toContain("3.5 miles");
    expect(updateResult.content[0].text).toContain("RPE 7/10");
    expect(updateResult.content[0].text).toContain("Felt stronger today");
  });

  test("delete-workout removes workout", async () => {
    // Add a workout first
    await server.handlers["add-workout"]({
      type: "running",
      date: "2024-01-15",
      duration_mins: 30,
    });

    // Delete the workout
    const deleteResult = await server.handlers["delete-workout"]({
      id: 1,
    });

    expect(deleteResult.content[0].type).toBe("text");
    expect(deleteResult.content[0].text).toContain("🗑️ Deleted workout #1");

    // Verify it's gone
    const listResult = await server.handlers["list-workouts"]({});
    expect(listResult.content[0].text).toContain("No workouts found");
  });

  test("workout-stats shows comprehensive statistics", async () => {
    // Add multiple workouts
    await server.handlers["add-workout"]({
      type: "running",
      date: "2024-01-15",
      duration_mins: 30,
      distance_miles: 3.0,
      rpe: 6,
    });

    await server.handlers["add-workout"]({
      type: "cycling",
      date: "2024-01-16",
      duration_mins: 45,
      distance_miles: 12.0,
      rpe: 7,
    });

    await server.handlers["add-workout"]({
      type: "functional",
      date: "2024-01-17",
      duration_mins: 40,
      rpe: 8,
    });

    const statsResult = await server.handlers["workout-stats"]({});

    expect(statsResult.content[0].type).toBe("text");
    expect(statsResult.content[0].text).toContain("Workout Statistics");
    expect(statsResult.content[0].text).toContain("Total workouts: 3");
    expect(statsResult.content[0].text).toContain("Total distance: 15.0 miles");
    expect(statsResult.content[0].text).toContain("Total time: 1h 55m");
    expect(statsResult.content[0].text).toContain("Average RPE: 7.0/10");
    expect(statsResult.content[0].text).toContain("Workout Types:");
  });

  test("workout-stats filters by type", async () => {
    // Add workouts of different types
    await server.handlers["add-workout"]({
      type: "running",
      date: "2024-01-15",
      duration_mins: 30,
      distance_miles: 3.0,
    });

    await server.handlers["add-workout"]({
      type: "cycling",
      date: "2024-01-16",
      duration_mins: 45,
      distance_miles: 12.0,
    });

    const runningStats = await server.handlers["workout-stats"]({
      type: "running",
    });

    expect(runningStats.content[0].type).toBe("text");
    expect(runningStats.content[0].text).toContain(
      "RUNNING Workout Statistics"
    );
    expect(runningStats.content[0].text).toContain("Total workouts: 1");
    expect(runningStats.content[0].text).toContain("Total distance: 3.0 miles");
  });

  test("workout database operations work correctly", async () => {
    // Add a workout
    await server.handlers["add-workout"]({
      type: "running",
      date: "2024-01-15",
      duration_mins: 30,
      distance_miles: 3.0,
    });

    // Verify it's in the database
    const db = getDb(config.database_path);
    const workout = db
      .prepare<[], WorkoutRow>("SELECT * FROM workouts WHERE id = 1")
      .get();

    expect(workout?.type).toBe("running");
    expect(workout?.distance_miles).toBe(3.0);
    expect(workout?.duration_mins).toBe(30);
  });

  test("functional workout exercises are stored correctly", async () => {
    // Add a functional workout with exercises
    await server.handlers["add-workout"]({
      type: "functional",
      date: "2024-01-15",
      duration_mins: 45,
      exercises: [
        {
          name: "Kettlebell Swings",
          sets: 3,
          reps: "20",
          weight_lbs: 35,
        },
      ],
    });

    // Verify exercises are in the database
    const db = getDb(config.database_path);
    const exercises = db
      .prepare("SELECT * FROM exercises WHERE workout_id = 1")
      .all() as any[];

    expect(exercises).toHaveLength(1);
    expect(exercises[0].name).toBe("Kettlebell Swings");
    expect(exercises[0].sets).toBe(3);
    expect(exercises[0].weight_lbs).toBe(35);
  });
});
