import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CoachConfig } from "../config.js";
import { getDb } from "../db.js";
import type { NoteRow, TodoRow, GoalRow, WorkoutRow } from "../types.js";

/**
 * Registers the `start-day` tool which provides context for starting a new day
 * based on the most recent recap, pending todos, upcoming goals, and recent notes.
 * This helps provide continuity and focus for the day ahead.
 */
export function registerStartDay(server: McpServer, config: CoachConfig): void {
  const db = getDb(config.database_path);

  server.tool(
    "start-day",
    {
      lookback_days: z
        .number()
        .min(1)
        .max(7)
        .optional()
        .describe("Number of days to look back for context (default: 3)"),
    },
    async ({ lookback_days = 3 }) => {
      const today = new Date().toISOString().split("T")[0];
      const lookbackDate = new Date(
        new Date().getTime() - lookback_days * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .split("T")[0];

      // Get the most recent recap note
      const recentRecap = db
        .prepare<[], NoteRow>(
          `SELECT id, text, tags, created_at 
           FROM notes 
           WHERE tags LIKE '%"recap"%' 
           ORDER BY created_at DESC 
           LIMIT 1`
        )
        .get();

      // Get pending todos (not completed)
      const pendingTodos = db
        .prepare<[], TodoRow>(
          `SELECT id, text, due_date, tags, completed, created_at 
           FROM todos 
           WHERE completed = 0 
           ORDER BY 
             CASE WHEN due_date IS NOT NULL THEN DATE(due_date) END ASC,
             created_at ASC`
        )
        .all();

      // Get active goals (not completed)
      const activeGoals = db
        .prepare<[], GoalRow>(
          `SELECT id, text, due_date, completed, created_at 
           FROM goals 
           WHERE completed = 0 
           ORDER BY 
             CASE WHEN due_date IS NOT NULL THEN DATE(due_date) END ASC,
             created_at ASC`
        )
        .all();

      // Get recent notes for context (excluding recaps)
      const recentNotes = db
        .prepare<[string], NoteRow>(
          `SELECT id, text, tags, created_at 
           FROM notes 
           WHERE DATE(created_at) >= ? 
           AND (tags IS NULL OR tags NOT LIKE '%"recap"%')
           ORDER BY created_at DESC 
           LIMIT 10`
        )
        .all(lookbackDate);

      // Get recent workouts for fitness context
      const recentWorkouts = db
        .prepare<[string], WorkoutRow>(
          `SELECT id, type, date, duration_mins, distance_miles, avg_heart_rate, rpe, notes
           FROM workouts 
           WHERE date >= ? 
           ORDER BY date DESC 
           LIMIT 5`
        )
        .all(lookbackDate);

      // Get overdue items
      const overdueTodos = pendingTodos.filter(
        (t) => t.due_date && new Date(t.due_date) < new Date(today)
      );

      const overdueGoals = activeGoals.filter(
        (g) => g.due_date && new Date(g.due_date) < new Date(today)
      );

      // Get items due today
      const todosDueToday = pendingTodos.filter((t) => t.due_date === today);
      const goalsDueToday = activeGoals.filter((g) => g.due_date === today);

      // Get items due soon (next 3 days)
      const soonDate = new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const todosDueSoon = pendingTodos.filter(
        (t) => t.due_date && t.due_date > today && t.due_date <= soonDate
      );

      const goalsDueSoon = activeGoals.filter(
        (g) => g.due_date && g.due_date > today && g.due_date <= soonDate
      );

      // Build the start-day briefing
      const briefingSections: string[] = [];

      briefingSections.push(`# Daily Briefing for ${today}`);
      briefingSections.push(
        `Good morning! Here's your context for starting the day:`
      );

      // Recent recap context
      if (recentRecap) {
        const recapDate = recentRecap.created_at.split("T")[0];
        briefingSections.push(`\n## Recent Context`);
        briefingSections.push(
          `Your most recent recap was from ${recapDate}. Here are the key highlights:`
        );

        // Extract key points from the recap (first few lines)
        const recapLines = recentRecap.text.split("\n").slice(0, 10);
        const keyPoints = recapLines
          .filter((line) => line.includes("- ") || line.includes("•"))
          .slice(0, 5);

        if (keyPoints.length > 0) {
          briefingSections.push(keyPoints.join("\n"));
        } else {
          // Fallback to first few meaningful lines
          const meaningfulLines = recapLines
            .filter((line) => line.trim().length > 20)
            .slice(0, 3);
          briefingSections.push(meaningfulLines.join("\n"));
        }
      }

      // Priority items - overdue
      if (overdueTodos.length > 0 || overdueGoals.length > 0) {
        briefingSections.push(
          `\n## ❗ OVERDUE ITEMS - Immediate Attention Needed`
        );

        if (overdueTodos.length > 0) {
          briefingSections.push(`\n### Overdue Todos (${overdueTodos.length})`);
          overdueTodos.forEach((t) => {
            const daysPast = Math.floor(
              (new Date(today).getTime() - new Date(t.due_date!).getTime()) /
                (24 * 60 * 60 * 1000)
            );
            briefingSections.push(
              `- #${t.id}: ${t.text} (${daysPast} days overdue)`
            );
          });
        }

        if (overdueGoals.length > 0) {
          briefingSections.push(`\n### Overdue Goals (${overdueGoals.length})`);
          overdueGoals.forEach((g) => {
            const daysPast = Math.floor(
              (new Date(today).getTime() - new Date(g.due_date!).getTime()) /
                (24 * 60 * 60 * 1000)
            );
            briefingSections.push(
              `- #${g.id}: ${g.text} (${daysPast} days overdue)`
            );
          });
        }
      }

      // Today's priorities
      if (todosDueToday.length > 0 || goalsDueToday.length > 0) {
        briefingSections.push(`\n## 🎯 TODAY'S PRIORITIES`);

        if (todosDueToday.length > 0) {
          briefingSections.push(
            `\n### Todos Due Today (${todosDueToday.length})`
          );
          todosDueToday.forEach((t) => {
            const tags = t.tags
              ? ` [${(JSON.parse(t.tags) as string[]).join(", ")}]`
              : "";
            briefingSections.push(`- #${t.id}: ${t.text}${tags}`);
          });
        }

        if (goalsDueToday.length > 0) {
          briefingSections.push(
            `\n### Goals Due Today (${goalsDueToday.length})`
          );
          goalsDueToday.forEach((g) => {
            briefingSections.push(`- #${g.id}: ${g.text}`);
          });
        }
      }

      // Upcoming items
      if (todosDueSoon.length > 0 || goalsDueSoon.length > 0) {
        briefingSections.push(`\n## 📅 COMING UP (Next 3 Days)`);

        if (todosDueSoon.length > 0) {
          briefingSections.push(
            `\n### Upcoming Todos (${todosDueSoon.length})`
          );
          todosDueSoon.forEach((t) => {
            const tags = t.tags
              ? ` [${(JSON.parse(t.tags) as string[]).join(", ")}]`
              : "";
            briefingSections.push(
              `- #${t.id}: ${t.text} (due ${t.due_date})${tags}`
            );
          });
        }

        if (goalsDueSoon.length > 0) {
          briefingSections.push(
            `\n### Upcoming Goals (${goalsDueSoon.length})`
          );
          goalsDueSoon.forEach((g) => {
            briefingSections.push(`- #${g.id}: ${g.text} (due ${g.due_date})`);
          });
        }
      }

      // Recent insights
      if (recentNotes.length > 0) {
        briefingSections.push(
          `\n## 💡 Recent Notes & Insights (Last ${lookback_days} Days)`
        );
        recentNotes.slice(0, 5).forEach((n) => {
          const tags = n.tags ? (JSON.parse(n.tags) as string[]) : [];
          const tagStr = tags.length ? ` [${tags.join(", ")}]` : "";
          const preview =
            n.text.length > 100 ? n.text.substring(0, 100) + "..." : n.text;
          briefingSections.push(`- #${n.id}: ${preview}${tagStr}`);
        });
      }

      // Fitness context
      if (recentWorkouts.length > 0) {
        briefingSections.push(
          `\n## 💪 Recent Fitness Activity (Last ${lookback_days} Days)`
        );

        // Calculate workout streak
        const sortedWorkouts = [...recentWorkouts].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        let streak = 0;
        let checkDate = new Date(today);

        for (let i = 0; i < 7; i++) {
          // Check up to 7 days back
          const dateStr = checkDate.toISOString().split("T")[0];
          const hasWorkout = sortedWorkouts.some((w) => w.date === dateStr);
          if (hasWorkout) {
            streak++;
          } else if (streak === 0) {
            // If no workout today, don't count as breaking streak yet
            if (dateStr !== today) break;
          } else {
            break;
          }
          checkDate.setDate(checkDate.getDate() - 1);
        }

        if (streak > 0) {
          briefingSections.push(`🔥 Current workout streak: ${streak} days!`);
        }

        briefingSections.push(`Recent workouts:`);
        recentWorkouts.forEach((w) => {
          const metrics: string[] = [];
          if (w.duration_mins) metrics.push(`${w.duration_mins}min`);
          if (w.distance_miles) metrics.push(`${w.distance_miles}mi`);
          if (w.rpe) metrics.push(`RPE${w.rpe}`);
          const metricStr =
            metrics.length > 0 ? ` (${metrics.join(", ")})` : "";
          briefingSections.push(
            `- ${w.date}: ${w.type.toUpperCase()}${metricStr}`
          );
        });

        // Fitness motivation based on recent activity
        const lastWorkout = sortedWorkouts[0];
        const daysSinceLastWorkout = Math.floor(
          (new Date(today).getTime() - new Date(lastWorkout.date).getTime()) /
            (24 * 60 * 60 * 1000)
        );

        if (daysSinceLastWorkout === 0) {
          briefingSections.push(
            `\n💡 You've already worked out today - amazing consistency!`
          );
        } else if (daysSinceLastWorkout === 1) {
          briefingSections.push(
            `\n💡 You worked out yesterday - great momentum! Consider maintaining it today.`
          );
        } else if (daysSinceLastWorkout >= 2) {
          briefingSections.push(
            `\n💡 It's been ${daysSinceLastWorkout} days since your last workout. Today could be perfect for getting back into it!`
          );
        }
      } else {
        briefingSections.push(`\n## 💪 Fitness Opportunity`);
        briefingSections.push(
          `No recent workouts recorded. Today could be a great day to start or restart your fitness journey!`
        );
      }

      // Summary stats
      const totalPending = pendingTodos.length + activeGoals.length;
      const urgentCount =
        overdueTodos.length +
        overdueGoals.length +
        todosDueToday.length +
        goalsDueToday.length;

      briefingSections.push(`\n## 📊 Quick Stats`);
      briefingSections.push(`- Total pending items: ${totalPending}`);
      briefingSections.push(`- Items needing attention today: ${urgentCount}`);
      briefingSections.push(
        `- Recent notes for context: ${recentNotes.length}`
      );
      if (recentWorkouts.length > 0) {
        briefingSections.push(`- Recent workouts: ${recentWorkouts.length}`);
      }

      // Motivational close
      if (urgentCount > 0) {
        briefingSections.push(`\n## 🚀 Focus for Today`);
        briefingSections.push(
          `You have ${urgentCount} priority items today. Start with the overdue items, then tackle today's priorities. You've got this!`
        );
      } else if (totalPending > 0) {
        briefingSections.push(`\n## 🌟 Opportunity Ahead`);
        briefingSections.push(
          `Great news - no urgent items today! This is a perfect opportunity to make progress on your ${totalPending} pending items or plan ahead.`
        );
      } else {
        briefingSections.push(`\n## 🎉 Clear Horizon`);
        briefingSections.push(
          `Excellent! You have a clean slate today. Consider setting new goals or reviewing your long-term objectives.`
        );
      }

      const briefingText = briefingSections.join("\n");

      // Save the briefing as a note
      const briefingTags = ["daily-briefing", `date-${today}`, "start-day"];
      const insert = db.prepare("INSERT INTO notes (text, tags) VALUES (?, ?)");
      insert.run(briefingText, JSON.stringify(briefingTags));

      return {
        content: [
          {
            type: "text",
            text:
              briefingText +
              `\n\n---\n💾 This briefing has been saved as a note tagged with "daily-briefing" for your records.`,
          },
        ],
      };
    }
  );
}
