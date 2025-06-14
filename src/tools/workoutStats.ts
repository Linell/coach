import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CoachConfig } from "../config.js";
import { getDb } from "../db.js";

interface WorkoutStats {
  total_workouts: number;
  total_distance_miles: number;
  total_duration_mins: number;
  avg_rpe: number;
  avg_heart_rate: number;
  workout_types: { [key: string]: number };
  last_workout_date: string | null;
  current_streak: number;
}

export function registerWorkoutStats(
  server: McpServer,
  config: CoachConfig
): void {
  const db = getDb(config.database_path);

  server.tool(
    "workout-stats",
    {
      days: z.number().int().positive().optional(), // Analysis period in days (default: all time)
      type: z.enum(["running", "cycling", "functional"]).optional(), // Filter by workout type
    },
    async ({ days, type }) => {
      // Build base query conditions
      const conditions: string[] = [];
      const params: any[] = [];

      if (days) {
        conditions.push("date >= date('now', '-' || ? || ' days')");
        params.push(days);
      }

      if (type) {
        conditions.push("type = ?");
        params.push(type);
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      // Get basic workout statistics
      const statsQuery = `
        SELECT 
          COUNT(*) as total_workouts,
          COALESCE(SUM(distance_miles), 0) as total_distance_miles,
          COALESCE(SUM(duration_mins), 0) as total_duration_mins,
          COALESCE(AVG(rpe), 0) as avg_rpe,
          COALESCE(AVG(avg_heart_rate), 0) as avg_heart_rate,
          MAX(date) as last_workout_date
        FROM workouts 
        ${whereClause}
      `;

      const stats = db.prepare(statsQuery).get(...params) as WorkoutStats;

      if (stats.total_workouts === 0) {
        const periodDesc = days ? ` in the last ${days} days` : "";
        const typeDesc = type ? ` ${type}` : "";
        return {
          content: [
            {
              type: "text",
              text: `📊 No${typeDesc} workouts found${periodDesc}.`,
            },
          ],
        };
      }

      // Get workout type distribution
      const typeQuery = `
        SELECT type, COUNT(*) as count
        FROM workouts 
        ${whereClause}
        GROUP BY type
        ORDER BY count DESC
      `;

      const typeStats = db.prepare(typeQuery).all(...params) as {
        type: string;
        count: number;
      }[];
      stats.workout_types = {};
      typeStats.forEach((t) => {
        stats.workout_types[t.type] = t.count;
      });

      // Calculate current workout streak (consecutive days with workouts)
      const streakQuery = `
        WITH workout_dates AS (
          SELECT DISTINCT date 
          FROM workouts 
          ORDER BY date DESC
        ),
        date_sequence AS (
          SELECT 
            date,
            LAG(date) OVER (ORDER BY date DESC) as prev_date,
            julianday(LAG(date) OVER (ORDER BY date DESC)) - julianday(date) as day_diff
          FROM workout_dates
        )
        SELECT COUNT(*) as streak
        FROM date_sequence
        WHERE day_diff IS NULL OR day_diff = 1
      `;

      const streakResult = db.prepare(streakQuery).get() as { streak: number };
      stats.current_streak = streakResult.streak;

      // Get recent progress trends (if analyzing recent period)
      let trendAnalysis = "";
      if (days && days >= 14) {
        const halfPeriod = Math.floor(days / 2);

        const recentQuery = `
          SELECT 
            COUNT(*) as workouts,
            COALESCE(AVG(distance_miles), 0) as avg_distance,
            COALESCE(AVG(duration_mins), 0) as avg_duration,
            COALESCE(AVG(rpe), 0) as avg_rpe
          FROM workouts 
          WHERE date >= date('now', '-' || ? || ' days')
        `;

        const previousQuery = `
          SELECT 
            COUNT(*) as workouts,
            COALESCE(AVG(distance_miles), 0) as avg_distance,
            COALESCE(AVG(duration_mins), 0) as avg_duration,
            COALESCE(AVG(rpe), 0) as avg_rpe
          FROM workouts 
          WHERE date >= date('now', '-' || ? || ' days') 
            AND date < date('now', '-' || ? || ' days')
        `;

        const recentStats = db.prepare(recentQuery).get(halfPeriod) as any;
        const previousStats = db
          .prepare(previousQuery)
          .get(days, halfPeriod) as any;

        trendAnalysis = "\n\n📈 **Trend Analysis:**";

        const workoutChange = recentStats.workouts - previousStats.workouts;
        const distanceChange =
          ((recentStats.avg_distance - previousStats.avg_distance) /
            previousStats.avg_distance) *
            100 || 0;
        const durationChange =
          ((recentStats.avg_duration - previousStats.avg_duration) /
            previousStats.avg_duration) *
            100 || 0;
        const rpeChange = recentStats.avg_rpe - previousStats.avg_rpe;

        if (workoutChange > 0) {
          trendAnalysis += `\n• Workout frequency: +${workoutChange} workouts vs previous period 📈`;
        } else if (workoutChange < 0) {
          trendAnalysis += `\n• Workout frequency: ${workoutChange} workouts vs previous period 📉`;
        } else {
          trendAnalysis += `\n• Workout frequency: Consistent with previous period ➡️`;
        }

        if (Math.abs(distanceChange) > 5) {
          const trend = distanceChange > 0 ? "📈" : "📉";
          trendAnalysis += `\n• Average distance: ${
            distanceChange > 0 ? "+" : ""
          }${distanceChange.toFixed(1)}% ${trend}`;
        }

        if (Math.abs(durationChange) > 5) {
          const trend = durationChange > 0 ? "📈" : "📉";
          trendAnalysis += `\n• Average duration: ${
            durationChange > 0 ? "+" : ""
          }${durationChange.toFixed(1)}% ${trend}`;
        }

        if (Math.abs(rpeChange) > 0.5) {
          const trend = rpeChange > 0 ? "📈" : "📉";
          const interpretation =
            rpeChange > 0 ? "(working harder)" : "(feeling easier)";
          trendAnalysis += `\n• Perceived effort: ${
            rpeChange > 0 ? "+" : ""
          }${rpeChange.toFixed(1)} RPE ${interpretation} ${trend}`;
        }
      }

      // Format the response
      const periodDesc = days ? ` (Last ${days} days)` : " (All time)";
      const typeDesc = type ? ` ${type.toUpperCase()}` : "";

      let response = `🏋️ **${typeDesc} Workout Statistics${periodDesc}**\n\n`;

      response += `📊 **Overview:**\n`;
      response += `• Total workouts: ${stats.total_workouts}\n`;
      response += `• Current streak: ${stats.current_streak} days 🔥\n`;

      if (stats.total_distance_miles > 0) {
        response += `• Total distance: ${stats.total_distance_miles.toFixed(
          1
        )} miles\n`;
        response += `• Average distance: ${(
          stats.total_distance_miles / stats.total_workouts
        ).toFixed(1)} miles per workout\n`;
      }

      if (stats.total_duration_mins > 0) {
        const totalHours = Math.floor(stats.total_duration_mins / 60);
        const remainingMins = Math.round(stats.total_duration_mins % 60);
        response += `• Total time: ${totalHours}h ${remainingMins}m\n`;
        response += `• Average duration: ${Math.round(
          stats.total_duration_mins / stats.total_workouts
        )} minutes\n`;
      }

      if (stats.avg_rpe > 0) {
        response += `• Average RPE: ${stats.avg_rpe.toFixed(1)}/10\n`;
      }

      if (stats.avg_heart_rate > 0) {
        response += `• Average heart rate: ${Math.round(
          stats.avg_heart_rate
        )} BPM\n`;
      }

      if (stats.last_workout_date) {
        response += `• Last workout: ${stats.last_workout_date}\n`;
      }

      // Workout type breakdown
      if (!type && Object.keys(stats.workout_types).length > 1) {
        response += `\n🎯 **Workout Types:**\n`;
        Object.entries(stats.workout_types).forEach(([workoutType, count]) => {
          const percentage = ((count / stats.total_workouts) * 100).toFixed(0);
          response += `• ${workoutType}: ${count} workouts (${percentage}%)\n`;
        });
      }

      response += trendAnalysis;

      return {
        content: [
          {
            type: "text",
            text: response,
          },
        ],
      };
    }
  );
}
