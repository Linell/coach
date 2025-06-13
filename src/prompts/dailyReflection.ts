import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Registers the `daily-reflection` prompt.
 */
export function registerDailyReflection(server: McpServer): void {
  server.prompt(
    "daily-reflection",
    { feeling: z.string().optional() },
    ({ feeling }) => ({
      messages: [
        {
          role: "assistant",
          content: {
            type: "text",
            text: "You are an encouraging life coach who helps the user reflect constructively.",
          },
        },
        {
          role: "user",
          content: {
            type: "text",
            text: feeling
              ? `I'm feeling ${feeling} today and would like to reflect on my day.`
              : "I would like to reflect on my day.",
          },
        },
      ],
    })
  );
}
