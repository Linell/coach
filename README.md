# Coach – MCP Server Foundation

This repository contains the minimal scaffolding required to start building a [Model Context Protocol](https://modelcontextprotocol.io) server in TypeScript.

## Features

* Modern TypeScript (`strict` mode, ESM output)
* [Model Context Protocol SDK](https://github.com/modelcontextprotocol/typescript-sdk) pre-installed
* Automatic creation of:
  * A user-scoped configuration file at `~/.config/coach/config.json` (overridable via `COACH_CONFIG_DIR`)
  * A SQLite database (using `better-sqlite3`)
* ESLint with `@typescript-eslint`
* Jest with `ts-jest` for type-checked unit tests

## Getting Started

```bash
# Install dependencies
npm install

# Run the development build (executes directly with ts-node)
npm run dev

# Compile TypeScript ➜ JavaScript
npm run build

# Execute compiled code
npm start

# Lint the project
npm run lint

# Run tests
npm test
```

## Configuration

Configuration lives in a **user-specific** location:

* **Linux / macOS** – `~/.config/coach/config.json`
* **Windows** – `%USERPROFILE%/.config/coach/config.json`

You can override the directory at runtime:

```bash
COACH_CONFIG_DIR=/tmp/my-config npm run dev
```

The default configuration schema is currently very small:

```json
{
  "database_path": "~/.local/share/coach/coach.sqlite"
}
```

Feel free to extend this as your project grows.

## Next Steps

1. Define your database schema (see `src/index.ts` for where the connection is created).
2. Register tools, resources and prompts with your `McpServer` instance.
3. Add integration/end-to-end tests as features are implemented.

---

© MIT License 