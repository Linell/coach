#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";

/**
 * Default database path configuration
 */
function defaultDatabasePath() {
  return path.join(os.homedir(), ".local", "share", "coach", "coach.sqlite");
}

/**
 * Load the coach configuration to get the database path
 */
async function loadConfig() {
  const configDir =
    process.env.COACH_CONFIG_DIR ?? path.join(os.homedir(), ".config", "coach");
  const configFile = path.join(configDir, "config.json");

  let databasePath = defaultDatabasePath();

  try {
    const raw = await fs.readFile(configFile, "utf8");
    const config = JSON.parse(raw);
    if (config.database_path) {
      databasePath = config.database_path;
    }
  } catch {
    // If config file doesn't exist, use default path
    console.log(`No config found at ${configFile}, using default database path.`);
  }

  return databasePath;
}

/**
 * Launch sqlite3 with the configured database path
 */
async function main() {
  try {
    const databasePath = await loadConfig();
    
    console.log(`Opening SQLite console for: ${databasePath}`);
    console.log("Type '.quit' to exit the SQLite console");
    console.log("---");

    // Launch sqlite3 in interactive mode
    const sqlite3 = spawn("sqlite3", [databasePath], {
      stdio: "inherit",
    });

    sqlite3.on("close", (code) => {
      process.exit(code || 0);
    });

    sqlite3.on("error", (err) => {
      if (err.code === "ENOENT") {
        console.error("Error: sqlite3 command not found.");
        console.error("Please install SQLite3:");
        console.error("  macOS: brew install sqlite");
        console.error("  Ubuntu/Debian: sudo apt-get install sqlite3");
        console.error("  Windows: Download from https://sqlite.org/download.html");
      } else {
        console.error("Error launching sqlite3:", err.message);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main(); 