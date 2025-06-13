import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CoachConfig } from "../config.js";
import { getDb } from "../db.js";

type TodoRow = {
  id: number;
  text: string;
  due_date: string | null;
  tags: string | null;
  completed: number; // 0 or 1
};

export function registerListTodos(
  server: McpServer,
  config: CoachConfig
): void {
  const db = getDb(config.database_path);

  server.tool("list-todos", {}, async () => {
    const todos = db
      .prepare<[], TodoRow>(
        "SELECT id, text, due_date, tags, completed FROM todos"
      )
      .all();

    if (todos.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "You have no todos yet.",
          },
        ],
      };
    }

    const todoStrings = todos.map((t) => {
      const status = t.completed ? "✓" : "✗";
      let todoText = `#${t.id}: ${t.text} [${status}]`;
      if (t.due_date) {
        todoText += ` (due: ${t.due_date})`;
      }
      if (t.tags) {
        const tags = JSON.parse(t.tags) as string[];
        if (tags.length > 0) {
          todoText += ` (tags: ${tags.join(", ")})`;
        }
      }
      return todoText;
    });

    return {
      content: [
        {
          type: "text",
          text: `Here are your todos:\n- ${todoStrings.join("\n- ")}`,
        },
      ],
    };
  });
}
