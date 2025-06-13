import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CoachConfig } from "../config.js";
import { getDb } from "../db.js";

/**
 * Registers the `add-note` tool which allows the assistant to store arbitrary
 * free-form notes about the user. Tags are optional and stored as a
 * JSON-encoded array so that we can filter or search by them later.
 */
export function registerAddNote(server: McpServer, config: CoachConfig): void {
  const db = getDb(config.database_path);

  server.tool(
    "add-note",
    {
      note: z.string().min(3),
      tags: z.array(z.string()).optional(),
    },
    async ({ note, tags }) => {
      const insert = db.prepare("INSERT INTO notes (text, tags) VALUES (?, ?)");
      insert.run(note, tags ? JSON.stringify(tags) : null);

      return {
        content: [
          {
            type: "text",
            text: `Got it! I've made a note: \"${note}\"${
              tags && tags.length > 0 ? " (tags: " + tags.join(", ") + ")" : ""
            }.`,
          },
        ],
      };
    }
  );
}
