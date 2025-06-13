import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CoachConfig } from "../config.js";
import { getDb } from "../db.js";

/**
 * Registers the `remember-convo` tool which allows the assistant to save
 * conversation content as a note tagged with today's date. This helps preserve
 * important discussion points and context for future reference.
 */
export function registerRememberConvo(
  server: McpServer,
  config: CoachConfig
): void {
  const db = getDb(config.database_path);

  server.tool(
    "remember-convo",
    {
      conversation_summary: z
        .string()
        .min(10)
        .describe("A summary of the conversation content to remember"),
      additional_tags: z
        .array(z.string())
        .optional()
        .describe("Optional additional tags beyond the date"),
    },
    async ({ conversation_summary, additional_tags }) => {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
      const tags = [
        "conversation",
        `date-${today}`,
        ...(additional_tags || []),
      ];

      const noteText = `Conversation from ${today}:\n\n${conversation_summary}`;

      const insert = db.prepare("INSERT INTO notes (text, tags) VALUES (?, ?)");
      insert.run(noteText, JSON.stringify(tags));

      return {
        content: [
          {
            type: "text",
            text: `✓ Conversation saved! I've created a note with the conversation summary and tagged it with today's date (${today}) and "conversation". You can reference this later using the recap tools or by listing notes with the "conversation" tag.`,
          },
        ],
      };
    }
  );
}
