import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

/**
 * Lazily initialises and returns a shared SQLite database connection using the
 * provided database file path. The first time this function is called it will
 * also ensure that all required tables exist so that tools can rely on them
 * without running their own migrations.
 */
export function getDb(databasePath: string): Database.Database {
  if (!globalThis.__coachDb) {
    // Make sure the parent directory exists before opening the database file.
    fs.mkdirSync(path.dirname(databasePath), {
      recursive: true,
    });

    globalThis.__coachDb = new Database(databasePath);
    initialiseSchema(globalThis.__coachDb);
  }

  return globalThis.__coachDb as Database.Database;
}

/**
 * Creates any tables that have not yet been set up. This is a very lightweight
 * alternative to a full migration system and should be sufficient for the
 * small number of tables used by Coach.
 */
function initialiseSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS goals (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      text       TEXT    NOT NULL,
      due_date   TEXT,
      metadata   TEXT,
      completed  INTEGER NOT NULL DEFAULT 0, -- 0 = incomplete, 1 = complete
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    /* ------------------------------------------------------------------
     * A free-form notes table that allows the assistant to store arbitrary
     * information about the user. Tags are persisted as a JSON-encoded
     * array so that we have flexibility without needing migrations when we
     * want to capture additional metadata in future.
     * ----------------------------------------------------------------*/
    CREATE TABLE IF NOT EXISTS notes (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      text       TEXT    NOT NULL,
      tags       TEXT,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    /* ------------------------------------------------------------------
     * A free-form todos table that allows the assistant to store arbitrary
     * information about the user. Tags are persisted as a JSON-encoded
     * array so that we have flexibility without needing migrations when we
     * want to capture additional metadata in future.
     * ----------------------------------------------------------------*/
    CREATE TABLE IF NOT EXISTS todos (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      text       TEXT    NOT NULL,
      due_date   TEXT,
      tags       TEXT,
      completed  INTEGER NOT NULL DEFAULT 0, -- 0 = incomplete, 1 = complete
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    /* ------------------------------------------------------------------
     * Workouts table for tracking fitness activities. Supports different
     * workout types (running, cycling, functional fitness) with flexible
     * JSON metadata for type-specific data.
     * ----------------------------------------------------------------*/
    CREATE TABLE IF NOT EXISTS workouts (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      type            TEXT    NOT NULL, -- 'running', 'cycling', 'functional'
      date            TEXT    NOT NULL,
      duration_mins   INTEGER, -- workout duration in minutes
      distance_miles  REAL,    -- distance in miles (for cardio)
      avg_heart_rate  INTEGER, -- average heart rate in BPM
      rpe             INTEGER, -- rate of perceived exertion (1-10)
      notes           TEXT,    -- free-form notes about the workout
      created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    /* ------------------------------------------------------------------
     * Exercises table for detailed tracking of individual exercises within
     * functional fitness workouts. Links to workouts via workout_id.
     * ----------------------------------------------------------------*/
    CREATE TABLE IF NOT EXISTS exercises (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_id  INTEGER NOT NULL,
      name        TEXT    NOT NULL, -- exercise name (e.g., "Kettlebell Swings")
      sets        INTEGER,          -- number of sets
      reps        TEXT,             -- reps per set (could be "10,10,8" or "10x3")
             weight_lbs  REAL,             -- weight used in pounds
      rest_sec    INTEGER,          -- rest time between sets in seconds
      notes       TEXT,             -- exercise-specific notes
      FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
    );
  `);

  /* ------------------------------------------------------------
   * Lightweight migration: ensure the `completed` column exists
   * for users who created the database before this column was
   * introduced. SQLite supports adding columns via ALTER TABLE.
   * ----------------------------------------------------------*/
  const cols = db
    .prepare<[], { name: string }>("PRAGMA table_info(goals)")
    .all();
  const hasCompleted = cols.some((c) => c.name === "completed");
  if (!hasCompleted) {
    db.exec(
      "ALTER TABLE goals ADD COLUMN completed INTEGER NOT NULL DEFAULT 0"
    );
  }
}

// Augment the global object so we can cache the singleton connection without
// polluting the module namespace.
declare global {
  var __coachDb: Database.Database | undefined;
}
