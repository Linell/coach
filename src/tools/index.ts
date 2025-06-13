import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CoachConfig } from "../config.js";
import { registerAddGoal } from "./addGoal.js";
import { registerUpdateGoal } from "./updateGoal.js";
import { registerDeleteGoal } from "./deleteGoal.js";
import { registerListGoals } from "./listGoals.js";
import { registerAddNote } from "./addNote.js";
import { registerUpdateNote } from "./updateNote.js";
import { registerDeleteNote } from "./deleteNote.js";
import { registerListNotes } from "./listNotes.js";
import { registerUserSummary } from "./userSummary.js";
import { registerAddTodo } from "./addTodo.js";
import { registerDeleteTodo } from "./deleteTodo.js";
import { registerListTodos } from "./listTodos.js";
import { registerUpdateTodo } from "./updateTodo.js";
import { registerRememberConvo } from "./rememberConvo.js";
import { registerRecapDay } from "./recapDay.js";
import { registerStartDay } from "./startDay.js";

/**
 * Register all Tools with the given MCP server instance.
 */
export function registerTools(server: McpServer, config: CoachConfig): void {
  registerAddGoal(server, config);
  registerUpdateGoal(server, config);
  registerDeleteGoal(server, config);
  registerListGoals(server, config);
  registerAddNote(server, config);
  registerUpdateNote(server, config);
  registerDeleteNote(server, config);
  registerListNotes(server, config);
  registerUserSummary(server, config);
  registerAddTodo(server, config);
  registerDeleteTodo(server, config);
  registerListTodos(server, config);
  registerUpdateTodo(server, config);
  registerRememberConvo(server, config);
  registerRecapDay(server, config);
  registerStartDay(server, config);
}
