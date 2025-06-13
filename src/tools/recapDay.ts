import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CoachConfig } from "../config.js";
import { getDb } from "../db.js";
import type { NoteRow, TodoRow, GoalRow } from "../types.js";

/**
 * Registers the `recap-day` tool which creates a comprehensive summary of
 * all activities from a specified date (defaults to today). This includes
 * notes, todos, goals, and conversations from that day.
 */
export function registerRecapDay(server: McpServer, config: CoachConfig): void {
  const db = getDb(config.database_path);

  server.tool(
    "recap-day",
    {
      date: z
        .string()
        .optional()
        .describe("Date to recap in YYYY-MM-DD format (defaults to today)"),
    },
    async ({ date }) => {
      const targetDate = date || new Date().toISOString().split("T")[0];

      // Get all items created on the target date
      const goals = db
        .prepare<[string], GoalRow>(
          `SELECT id, text, due_date, completed, created_at 
           FROM goals 
           WHERE DATE(created_at) = ? 
           ORDER BY created_at DESC`
        )
        .all(targetDate);

      const notes = db
        .prepare<[string], NoteRow>(
          `SELECT id, text, tags, created_at 
           FROM notes 
           WHERE DATE(created_at) = ? 
           ORDER BY created_at DESC`
        )
        .all(targetDate);

      const todos = db
        .prepare<[string], TodoRow>(
          `SELECT id, text, due_date, tags, completed, created_at 
           FROM todos 
           WHERE DATE(created_at) = ? 
           ORDER BY created_at DESC`
        )
        .all(targetDate);

      // For simplicity, we'll focus on items created on the target date
      // The completed status will be checked in the items we already retrieved
      const completedGoals: GoalRow[] = [];
      const completedTodos: TodoRow[] = [];

      // Get conversation notes from this date
      const conversations = notes.filter((note) => {
        if (!note.tags) return false;
        const tags = JSON.parse(note.tags) as string[];
        return (
          tags.includes("conversation") && tags.includes(`date-${targetDate}`)
        );
      });

      // Build comprehensive recap
      const recapSections: string[] = [];

      recapSections.push(`# Daily Recap for ${targetDate}`);
      recapSections.push(`Generated on: ${new Date().toISOString()}`);

      // Goals section
      if (goals.length > 0 || completedGoals.length > 0) {
        recapSections.push(`\n## Goals`);

        if (goals.length > 0) {
          recapSections.push(`\n### New Goals Created Today (${goals.length})`);
          goals.forEach((g) => {
            const status = g.completed ? "✓ COMPLETED" : "⏳ In Progress";
            const due = g.due_date ? ` (due ${g.due_date})` : "";
            recapSections.push(`- #${g.id}: ${g.text}${due} [${status}]`);
          });
        }

        if (completedGoals.length > 0) {
          recapSections.push(
            `\n### Goals Completed Today (${completedGoals.length})`
          );
          completedGoals.forEach((g) => {
            recapSections.push(`- #${g.id}: ${g.text} ✓ COMPLETED`);
          });
        }
      }

      // Todos section
      if (todos.length > 0 || completedTodos.length > 0) {
        recapSections.push(`\n## Tasks & Todos`);

        if (todos.length > 0) {
          recapSections.push(`\n### New Todos Created Today (${todos.length})`);
          todos.forEach((t) => {
            const status = t.completed ? "✓ COMPLETED" : "⏳ Pending";
            const due = t.due_date ? ` (due ${t.due_date})` : "";
            const tags = t.tags
              ? ` [${(JSON.parse(t.tags) as string[]).join(", ")}]`
              : "";
            recapSections.push(
              `- #${t.id}: ${t.text}${due}${tags} [${status}]`
            );
          });
        }

        if (completedTodos.length > 0) {
          recapSections.push(
            `\n### Todos Completed Today (${completedTodos.length})`
          );
          completedTodos.forEach((t) => {
            const tags = t.tags
              ? ` [${(JSON.parse(t.tags) as string[]).join(", ")}]`
              : "";
            recapSections.push(`- #${t.id}: ${t.text}${tags} ✓ COMPLETED`);
          });
        }
      }

      // Notes section
      const regularNotes = notes.filter((n) => !conversations.includes(n));
      if (regularNotes.length > 0) {
        recapSections.push(
          `\n## Notes & Observations (${regularNotes.length})`
        );
        regularNotes.forEach((n) => {
          const tags = n.tags ? (JSON.parse(n.tags) as string[]) : [];
          const tagStr = tags.length ? ` [${tags.join(", ")}]` : "";
          recapSections.push(`- #${n.id}: ${n.text}${tagStr}`);
        });
      }

      // Conversations section
      if (conversations.length > 0) {
        recapSections.push(
          `\n## Conversations & Discussions (${conversations.length})`
        );
        conversations.forEach((c) => {
          recapSections.push(`- #${c.id}: ${c.text}`);
        });
      }

      // Summary stats
      const totalItems = goals.length + todos.length + notes.length;
      const completedItems =
        goals.filter((g) => g.completed).length +
        todos.filter((t) => t.completed).length +
        completedGoals.length +
        completedTodos.length;

      if (totalItems > 0) {
        recapSections.push(`\n## Daily Summary`);
        recapSections.push(`- Total new items: ${totalItems}`);
        recapSections.push(`- Items completed: ${completedItems}`);
        recapSections.push(
          `- Productivity score: ${
            totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
          }%`
        );
      }

      const recapText = recapSections.join("\n");

      // Save the recap as a note with appropriate tags
      const recapTags = ["recap", `date-${targetDate}`, "daily-summary"];
      const insert = db.prepare("INSERT INTO notes (text, tags) VALUES (?, ?)");
      insert.run(recapText, JSON.stringify(recapTags));

      if (totalItems === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No activities found for ${targetDate}. It looks like it was a quiet day! I've still created a recap note for completeness.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `✓ Daily recap for ${targetDate} complete!\n\nSummary:\n- ${totalItems} total activities\n- ${completedItems} items completed\n- ${conversations.length} conversations recorded\n\nI've saved a detailed recap as a note tagged with "recap" and "date-${targetDate}". You can review it anytime or use it with the start-day tool tomorrow.`,
          },
        ],
      };
    }
  );
}
