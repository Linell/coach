import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";

export interface CoachConfig {
  /** Absolute path to the SQLite database file */
  database_path: string;
}

/**
 * Compute the default location for the SQLite database inside the user's data directory.
 */
function defaultDatabasePath(): string {
  return path.join(os.homedir(), ".local", "share", "coach", "coach.sqlite");
}

function defaultConfig(): CoachConfig {
  return {
    database_path: defaultDatabasePath(),
  };
}

/**
 * Ensures that a valid configuration file and database exist before returning
 * the loaded configuration.
 *
 * The directory used can be overridden via the `COACH_CONFIG_DIR` environment
 * variable. This is particularly useful for testing.
 */
export async function ensureConfig(): Promise<CoachConfig> {
  const configDir =
    process.env.COACH_CONFIG_DIR ?? path.join(os.homedir(), ".config", "coach");
  const configFile = path.join(configDir, "config.json");

  // Make sure the configuration directory exists.
  await fs.mkdir(configDir, { recursive: true });

  let config: CoachConfig;

  try {
    const raw = await fs.readFile(configFile, "utf8");
    config = JSON.parse(raw) as CoachConfig;
  } catch {
    // If the file is missing or unreadable, write a fresh config.
    config = defaultConfig();
    await fs.writeFile(configFile, JSON.stringify(config, null, 2), "utf8");
  }

  // Guarantee the database file (and its parent directory) exist.
  await fs.mkdir(path.dirname(config.database_path), { recursive: true });
  // Open the DB file in append mode to create it if it doesn't exist, then close immediately.
  await fs.open(config.database_path, "a").then((fh) => fh.close());

  return config;
}
