/**
 * Centralized type definitions for database rows.
 * These types match the database schema defined in src/db.ts
 */

export interface NoteRow {
  id: number;
  text: string;
  tags: string | null;
  created_at: string;
}

export interface TodoRow {
  id: number;
  text: string;
  due_date: string | null;
  tags: string | null;
  completed: number; // 0 = incomplete, 1 = complete
  created_at: string;
}

export interface GoalRow {
  id: number;
  text: string;
  due_date: string | null;
  metadata: string | null;
  completed: number; // 0 = incomplete, 1 = complete
  created_at: string;
}

export interface WorkoutRow {
  id: number;
  type: string; // 'running', 'cycling', 'functional'
  date: string;
  duration_mins: number | null;
  distance_miles: number | null;
  avg_heart_rate: number | null;
  rpe: number | null; // rate of perceived exertion (1-10)
  notes: string | null;
  created_at: string;
}

export interface ExerciseRow {
  id: number;
  workout_id: number;
  name: string;
  sets: number | null;
  reps: string | null; // flexible format: "10,10,8" or "10x3"
  weight_lbs: number | null;
  rest_sec: number | null;
  notes: string | null;
}
