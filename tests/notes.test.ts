import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { registerAddNote } from "../src/tools/addNote";
import { registerListNotes } from "../src/tools/listNotes";
import { registerDeleteNote } from "../src/tools/deleteNote";
import type { CoachConfig } from "../src/config";

// Declare global type for database connection
declare global {
  // eslint-disable-next-line no-var
  var __coachDb: import("better-sqlite3").Database | undefined;
}

class StubServer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handlers: Record<string, any> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tool(name: string, _schema: unknown, handler: any) {
    this.handlers[name] = handler;
  }
}

describe("Note tools", () => {
  let tmpDir: string;
  let config: CoachConfig;
  let server: StubServer;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "coach-test-"));
    config = { database_path: path.join(tmpDir, "db.sqlite") };
    server = new StubServer();

    registerAddNote(server as unknown as any, config);
    registerListNotes(server as unknown as any, config);
    registerDeleteNote(server as unknown as any, config);
  });

  afterEach(async () => {
    // Close the database connection and clear global state
    if (globalThis.__coachDb) {
      globalThis.__coachDb.close();
      globalThis.__coachDb = undefined;
    }
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("adds a note and lists it", async () => {
    await server.handlers["add-note"]({
      note: "Remember to hydrate",
      tags: ["health"],
    });
    const result = await server.handlers["list-notes"]({});
    const text: string = (result as any).content[0].text;
    expect(text).toContain("Remember to hydrate");
  });

  it("filters notes by tag", async () => {
    await server.handlers["add-note"]({
      note: "Drink water",
      tags: ["health"],
    });
    await server.handlers["add-note"]({
      note: "Pick up groceries",
      tags: ["errand"],
    });

    const result = await server.handlers["list-notes"]({ tag: "health" });
    const text: string = (result as any).content[0].text;
    expect(text).toContain("Drink water");
    expect(text).not.toContain("Pick up groceries");
  });

  it("deletes a note", async () => {
    await server.handlers["add-note"]({ note: "Temporary note" });
    await server.handlers["delete-note"]({ id: 1 });

    const result = await server.handlers["list-notes"]({});
    const text: string = (result as any).content[0].text;
    expect(text).toContain("You have no notes yet");
  });
});
