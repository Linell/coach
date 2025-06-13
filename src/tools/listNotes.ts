import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CoachConfig } from "../config.js";
import { getDb } from "../db.js";

interface NoteRow {
  id: number;
  text: string;
  tags: string | null;
}

/**
 * Registers the `list-notes` tool. Notes can be optionally filtered by a tag.
 * Because tags are stored as a JSON array we perform a LIKE match which is
 * sufficient for small data sets.
 */
export function registerListNotes(
  server: McpServer,
  config: CoachConfig
): void {
  const db = getDb(config.database_path);

  server.tool(
    "list-notes",
    {
      tag: z.string().optional(),
    },
    async ({ tag }) => {
      let notes: NoteRow[];

      if (tag) {
        // The surrounding %" and "% pattern catches the tag irrespective of
        // its position in the JSON array.
        const pattern = `%\"${tag}\"%`;
        notes = db
          .prepare<[string], NoteRow>(
            "SELECT id, text, tags FROM notes WHERE tags LIKE ? ORDER BY created_at DESC"
          )
          .all(pattern);
      } else {
        notes = db
          .prepare<[], NoteRow>(
            "SELECT id, text, tags FROM notes ORDER BY created_at DESC"
          )
          .all();
      }

      if (notes.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: tag
                ? `No notes found with tag \"${tag}\".`
                : "You have no notes yet.",
            },
          ],
        };
      }

      const noteLines = notes.map((n) => {
        const tags = n.tags ? (JSON.parse(n.tags) as string[]) : [];
        return `#${n.id}: ${n.text}${
          tags.length ? " (" + tags.join(", ") + ")" : ""
        }`;
      });

      return {
        content: [
          {
            type: "text",
            text: `Here are your notes${
              tag ? ' with tag "' + tag + '"' : ""
            }:\n- ${noteLines.join("\n- ")}`,
          },
        ],
      };
    }
  );
}
