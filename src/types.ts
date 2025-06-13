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
