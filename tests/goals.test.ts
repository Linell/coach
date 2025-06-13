import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { getDb } from "../src/db";
import { registerAddGoal } from "../src/tools/addGoal";
import { registerUpdateGoal } from "../src/tools/updateGoal";
import { registerListGoals } from "../src/tools/listGoals";
import type { CoachConfig } from "../src/config";

/** A minimal stub of the MCP server that only implements the `tool` method. */
class StubServer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handlers: Record<string, any> = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  tool(name: string, _schema: unknown, handler: any) {
    this.handlers[name] = handler;
  }
}

describe("Goal tools", () => {
  let tmpDir: string;
  let config: CoachConfig;
  let server: StubServer;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "coach-test-"));
    config = { database_path: path.join(tmpDir, "db.sqlite") };
    server = new StubServer();

    /* Register tools against the stub server */
    registerAddGoal(server as unknown as any, config);
    registerUpdateGoal(server as unknown as any, config);
    registerListGoals(server as unknown as any, config);
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("defaults newly added goals to not completed", async () => {
    const handler = server.handlers["add-goal"];
    await handler({ goal: "Finish report" });

    const db = getDb(config.database_path);
    const row = db.prepare("SELECT completed FROM goals WHERE id = 1").get();
    expect(row.completed).toBe(0);
  });

  it("can mark a goal as completed via update-goal", async () => {
    // First add
    await server.handlers["add-goal"]({ goal: "Go for a run" });
    // Then mark complete
    await server.handlers["update-goal"]({ id: 1, completed: true });

    const db = getDb(config.database_path);
    const row = db.prepare("SELECT completed FROM goals WHERE id = 1").get();
    expect(row.completed).toBe(1);
  });

  it("list-goals indicates completion status", async () => {
    await server.handlers["add-goal"]({ goal: "Meditate" });
    await server.handlers["update-goal"]({ id: 1, completed: true });

    const result = await server.handlers["list-goals"]();
    const text: string = (result as any).content[0].text;
    expect(text).toContain("✓");
    expect(text).not.toContain("✗");
  });
});
