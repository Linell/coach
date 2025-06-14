# Contributing to Coach MCP Server

Thank you for your interest in contributing to Coach MCP Server! This guide will help you get started.

## 🤝 Ways to Contribute

- **Bug Reports**: Found a bug? Please report it!
- **Feature Requests**: Have an idea for improvement? We'd love to hear it!
- **Code Contributions**: Ready to write some code? Awesome!
- **Documentation**: Help improve our docs and examples
- **Testing**: Help us improve test coverage

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/Linell/coach-mcp-server.git
   cd coach-mcp-server
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Development Workflow

1. **Make your changes** following our coding standards
2. **Add tests** for new functionality
3. **Run the test suite**:
   ```bash
   npm test
   ```
4. **Run the linter**:
   ```bash
   npm run lint
   ```
5. **Build the project**:
   ```bash
   npm run build
   ```

## 📋 Code Standards

### TypeScript Guidelines
- Use TypeScript strict mode
- Prefer explicit typing over `any`
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### Code Style
- Use the provided ESLint configuration
- Follow existing code patterns
- Keep functions small and focused
- Use async/await over Promises when possible

### Database Guidelines
- Always use prepared statements
- Include proper error handling
- Test database operations thoroughly
- Consider backward compatibility for schema changes

## 🧪 Testing

### Writing Tests
- Write unit tests for all new tools
- Test both success and error cases
- Use descriptive test names
- Mock external dependencies

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Coverage
- Maintain coverage above 80%
- Focus on critical paths and edge cases
- Include integration tests for complex features

## 📝 Documentation

- Update README.md for new features
- Add JSDoc comments for new functions
- Include usage examples
- Update tool descriptions

## 🔍 Pull Request Process

1. **Create a clear PR title** describing your changes
2. **Fill out the PR template** with details about your changes
3. **Link relevant issues** using keywords like "Fixes #123"
4. **Request review** from maintainers
5. **Address feedback** promptly and respectfully

### PR Checklist
- [ ] Tests pass locally
- [ ] Linter passes without warnings
- [ ] Code follows project conventions
- [ ] Documentation updated if needed
- [ ] Changelog updated for significant changes

## 🐛 Bug Reports

### Before Reporting
- Check existing issues to avoid duplicates
- Try to reproduce the bug consistently
- Gather relevant system information

### Bug Report Template
```
**Describe the bug**
A clear and concise description of the bug.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Environment**
- OS: [e.g. macOS, Windows, Linux]
- Node.js version: [e.g. 18.0.0]
- Coach MCP Server version: [e.g. 0.1.0]

**Additional context**
Any other context about the problem.
```

## 💡 Feature Requests

### Before Requesting
- Check if the feature already exists
- Consider if it fits the project's scope
- Think about implementation complexity

### Feature Request Template
```
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions you've thought about.

**Additional context**
Any other context or screenshots.
```

## 🎯 Development Focus Areas

We're particularly interested in contributions in these areas:

- **New Tools**: Life coaching tools that add value
- **Improved Analytics**: Better insights and reporting
- **Integration**: Support for other MCP clients
- **Performance**: Optimizations for large datasets
- **Testing**: Improved test coverage and quality

## 📞 Getting Help

- **Discussions**: Use GitHub Discussions for questions
- **Issues**: Use GitHub Issues for bugs and feature requests
- **Code Review**: Don't hesitate to ask for help in PRs

## 🏆 Recognition

Contributors are recognized in:
- Our README.md contributors section
- Release notes for significant contributions
- GitHub's contributor graph

## 📜 Code of Conduct

We follow the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). Please be respectful and inclusive in all interactions.

## 📚 Additional Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)

---

Thank you for contributing to Coach MCP Server! 🎉 