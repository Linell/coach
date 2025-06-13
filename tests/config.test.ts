import { ensureConfig } from "../src/config";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";

describe("ensureConfig", () => {
  it("creates default config and database when they do not exist", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "coach-test-"));
    process.env.COACH_CONFIG_DIR = tmpDir;

    const config = await ensureConfig();

    // Config file should now exist
    const configPath = path.join(tmpDir, "config.json");
    await expect(fs.access(configPath)).resolves.not.toThrow();

    // Database file should now exist
    await expect(fs.access(config.database_path)).resolves.not.toThrow();

    // Clean up
    delete process.env.COACH_CONFIG_DIR;
  });
});
