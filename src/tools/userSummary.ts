import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CoachConfig } from "../config.js";
import { getDb } from "../db.js";

interface GoalRow {
  id: number;
  text: string;
  due_date: string | null;
  completed: number;
}

interface NoteRow {
  id: number;
  text: string;
  tags: string | null;
}

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
