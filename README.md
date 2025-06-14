# Coach MCP Server 🎯

A **local-first** AI-powered life coach Model Context Protocol (MCP) server that helps you track goals, manage todos, take notes, and provides daily guidance through structured prompts and intelligent tools. Your data stays on your machine - no cloud required.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)

## ✨ Features

### 🛠️ Core Tools
- **Goal Management**: Create, update, complete, and track long-term objectives
- **Todo Management**: Manage daily tasks with due dates and tags
- **Note Taking**: Capture thoughts, insights, and observations with flexible tagging
- **Daily Briefings**: Get personalized morning briefings with prioritized tasks
- **Day Recaps**: Generate comprehensive end-of-day summaries
- **Conversation Memory**: Remember and reference past conversations

### 📋 Smart Organization
- **Priority Intelligence**: Automatically prioritizes overdue and due-today items
- **Context Awareness**: Provides relevant historical context for better decision-making
- **Tag-based Filtering**: Organize and filter items using flexible tagging system
- **Date-based Tracking**: Track progress over time with date-aware queries

### 🔧 MCP Integration
- **Tools**: Easy, comprehensive tools for life management
- **Resources**: Daily tips and motivational content
- **Prompts**: Structured prompts for reflection and planning

### 🏠 Local-First Design
- **Complete Data Ownership**: Your data stays on your machine, always
- **Privacy by Design**: No cloud dependencies, tracking, or data uploads
- **SQLite Database**: Standard format for easy backup, export, and migration
- **Offline Operation**: Works without internet connection or external services

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Linell/coach-mcp-server.git
cd coach-mcp-server

# Install dependencies
npm install

# Build the project
npm run build

# Run tests to verify installation
npm test
```

### Development

```bash
# Run in development mode (with hot reload)
npm run dev

# Run linter
npm run lint

# Run tests with coverage
npm run test:coverage
```

## 📖 Usage

### With Claude Desktop

Add the following to your Claude Desktop MCP configuration file:

```jsonc
{
  "mcpServers": {
    "coach": {
      "command": "node",
      "args": ["/path/to/coach-mcp-server/dist/index.js"]
    }
  }
}
```

**Development tip**: For active development, you can point directly to the TypeScript source:
```jsonc
"command": "npx",
"args": ["ts-node-esm", "/path/to/coach-mcp-server/src/index.ts"]
```

## 🏠 Local-First Configuration & Data

**Your data belongs to YOU.** Coach MCP Server is built with a local-first philosophy - everything stays on your machine, giving you complete control, privacy, and ownership of your personal data.

### 🔧 Configuration

The server automatically creates a user-specific configuration file at `~/.config/coach/config.json`

**Example configuration:**
```json
{
  "database_path": "~/.local/share/coach/coach.sqlite"
}
```

**Customize your setup:**
```bash
# Use a custom config directory
COACH_CONFIG_DIR=/custom/path npm start

# Point to a specific database location
# Edit ~/.config/coach/config.json:
{
  "database_path": "/path/to/your/coach-data.sqlite"
}
```

### 🗄️ SQLite Database - Your Personal Data Store

Your data is all stored in a **single SQLite file** that you completely control.

### 🎯 Why Local-First Matters

**🔒 Privacy by Design**
- No cloud dependencies or data uploads
- No third-party analytics or tracking
- Your personal insights stay personal

**📊 Complete Data Control**
- Standard SQLite format - use any SQLite browser/tool
- Easy backups: just copy the `.sqlite` file
- Export your data anytime, anywhere
- Migrate between systems effortlessly

**⚡ Performance & Reliability**
- Lightning-fast queries (no network latency)
- Works offline, always available
- No rate limits or service interruptions

**View your data directly:**
```bash
sqlite3 ~/.local/share/coach/coach.sqlite

.schema                    # View table structure
SELECT * FROM goals;       # See all goals
SELECT * FROM notes WHERE tags LIKE '%work%';  # Filter by tags
```

## 🛠️ Available Tools

### Goal Management
- `add-goal` - Create a new goal with optional due date and metadata
- `list-goals` - View all goals with completion status and due dates
- `update-goal` - Modify goal text, due date, or mark as completed
- `delete-goal` - Remove a goal permanently

### Todo Management  
- `add-todo` - Create a new todo with optional due date and tags
- `list-todos` - View all todos with filtering options
- `update-todo` - Modify todo details or mark as completed
- `delete-todo` - Remove a todo permanently

### Note Taking
- `add-note` - Capture thoughts and insights with optional tags
- `list-notes` - Browse notes with tag-based filtering
- `update-note` - Edit existing notes
- `delete-note` - Remove notes permanently

### Daily Workflows
- `start-day` - Get a personalized morning briefing with priorities
- `recap-day` - Generate a comprehensive end-of-day summary
- `remember-convo` - Save important conversation points for future reference

### Analytics
- `user-summary` - Get insights into your productivity patterns and progress

## 🏗️ Architecture

### Database Schema
The server uses SQLite with the following tables:
- `goals` - Long-term objectives with completion tracking
- `todos` - Short-term tasks with due dates and tags  
- `notes` - Free-form notes with tagging support

### Project Structure
```
src/
├── tools/          # MCP tools (17 tools for life management)
├── resources/      # MCP resources (daily tips, etc.)
├── prompts/        # MCP prompts (reflection prompts)
├── db.ts          # Database connection and schema
├── config.ts      # Configuration management
├── types.ts       # TypeScript type definitions
└── index.ts       # Server entry point
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

The test suite includes:
- Unit tests for all major tools
- Database integration tests
- Configuration validation tests

## 🔒 Security Considerations

- **SQL Injection Prevention**: All database queries use prepared statements
- **Input Validation**: Zod schemas validate all tool inputs
- **User Isolation**: Data is stored in user-specific directories
- **No Network Access**: Operates entirely locally for privacy

## 🤝 Contributing

Contributions are welcome! Please see the [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run the test suite: `npm test`
5. Commit your changes: `git commit -m "Add amazing feature"`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Standards
- Follow TypeScript best practices
- Maintain test coverage above 80%
- Use ESLint configuration provided
- Document new tools and features
- Vibe hardcore

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with the [Model Context Protocol SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- Uses [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) for reliable SQLite operations
- Inspired by untreated ADHD 😅

## 📞 Support

- 🐛 **Bug Reports**: [Open an issue](https://github.com/Linell/coach-mcp-server/issues)
- 💡 **Feature Requests**: [Request a feature](https://github.com/Linell/coach-mcp-server/issues)
- 💬 **Questions**: [Start a discussion](https://github.com/Linell/coach-mcp-server/discussions)

---

⭐ **Star this repository** if you find it helpful!