import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CoachConfig } from "../config.js";
import { getDb } from "../db.js";
import type { NoteRow, TodoRow, GoalRow, WorkoutRow } from "../types.js";

/**
 * The `user-summary` tool provides an overview of everything the assistant
 * knows about the user by pulling together goals and notes. The response is
 * strictly textual so that the LLM has an easy-to-ingest context chunk.
 */
export function registerUserSummary(
  server: McpServer,
  config: CoachConfig
): void {
  const db = getDb(config.database_path);

  server.tool("user-summary", {}, async () => {
    const goals = db
      .prepare<[], GoalRow>(
        "SELECT id, text, due_date, completed FROM goals ORDER BY created_at DESC"
      )
      .all();

    const notes = db
      .prepare<[], NoteRow>(
        "SELECT id, text, tags FROM notes ORDER BY created_at DESC"
      )
      .all();

    const todos = db
      .prepare<[], TodoRow>(
        "SELECT id, text, due_date, tags, completed FROM todos ORDER BY created_at DESC"
      )
      .all();

    const workouts = db
      .prepare<[], WorkoutRow>(
        "SELECT id, type, date, duration_mins, distance_miles, avg_heart_rate, rpe, notes FROM workouts ORDER BY date DESC LIMIT 10"
      )
      .all();

    const goalLines = goals.map((g) => {
      const status = g.completed ? "✓" : "✗";
      const due = g.due_date ? " (due " + g.due_date + ")" : "";
      return `#${g.id}: ${g.text}${due} [${status}]`;
    });

    const noteLines = notes.map((n) => {
      const tags = n.tags ? (JSON.parse(n.tags) as string[]) : [];
      return `#${n.id}: ${n.text}${
        tags.length ? " (" + tags.join(", ") + ")" : ""
      }`;
    });

    const todoLines = todos.map((t) => {
      const status = t.completed ? "✓" : "✗";
      const due = t.due_date ? " (due " + t.due_date + ")" : "";
      return `#${t.id}: ${t.text}${due} [${status}]`;
    });

    const workoutLines = workouts.map((w) => {
      const metrics: string[] = [];
      if (w.duration_mins) metrics.push(`${w.duration_mins}min`);
      if (w.distance_miles) metrics.push(`${w.distance_miles}mi`);
      if (w.avg_heart_rate) metrics.push(`${w.avg_heart_rate}BPM`);
      if (w.rpe) metrics.push(`RPE${w.rpe}`);
      const metricStr = metrics.length > 0 ? ` (${metrics.join(", ")})` : "";
      return `#${w.id}: ${w.type.toUpperCase()} on ${w.date}${metricStr}`;
    });

    const summaryParts: string[] = [];

    summaryParts.push(
      goals.length > 0
        ? `Goals (total ${goals.length}):\n- ${goalLines.join("\n- ")}`
        : "No goals set."
    );
    summaryParts.push(
      notes.length > 0
        ? `Notes (total ${notes.length}):\n- ${noteLines.join("\n- ")}`
        : "No notes recorded."
    );
    summaryParts.push(
      todos.length > 0
        ? `Todos (total ${todos.length}):\n- ${todoLines.join("\n- ")}`
        : "No todos set."
    );
    summaryParts.push(
      workouts.length > 0
        ? `Recent Workouts (last ${workouts.length}):\n- ${workoutLines.join(
            "\n- "
          )}`
        : "No workouts recorded."
    );

    return {
      content: [
        {
          type: "text",
          text: summaryParts.join("\n\n"),
        },
      ],
    };
  });
}
