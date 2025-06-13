import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the `tip://daily` resource which returns a short coaching tip that
 * changes each day.
 */
export function registerDailyTip(server: McpServer): void {
  const tips = [
    "Take a short walk today to refresh your mind and body.",
    "Write down three things you're grateful for.",
    "Spend five minutes practising deep breathing.",
    "Reach out to someone you appreciate and tell them why.",
    "Set a small, achievable goal for the next hour.",
    "Declutter a tiny area of your workspace.",
    "Drink a full glass of water and stretch your shoulders.",
  ];

  server.resource(
    "daily-tip",
    new ResourceTemplate("tip://daily", { list: undefined }),
    async () => ({
      contents: [
        {
          uri: "tip://daily",
          text: tips[new Date().getDate() % tips.length],
        },
      ],
    })
  );
}
