# Copilot Instructions for theme-control

## Project-Specific Guidelines

### JavaScript Runtime

- **This project uses Bun** as the JavaScript runtime, not Node.js
- Use Bun-specific APIs and features when appropriate
- Run scripts with `bun run` instead of `npm run`
- Use `bun install` for package management

### Code Formatting

- **Always run Prettier after making any changes to code files**
- Run: `bunx prettier --write <file>` for individual files
- Run: `bunx prettier --write .` for all files (when making multiple changes)
- Ensure formatting is applied before considering the task complete

### TypeScript Configuration

- This project uses TypeScript with module type: "module"
- Follow the TypeScript configuration in `tsconfig.json`
- Type definitions are available via `@types/bun`

### File Structure

- Main entry point: `main.ts`
- Configuration: `config.ts` and `config.example.toml`
- Theme definitions: `themes.ts`
- Application integrations: `apps/` directory

### Development Workflow

1. Make minimal, surgical changes
2. Run Prettier to format changed files
3. Test changes with `bun run main.ts` or relevant Bun commands
4. Verify no existing functionality is broken

### Best Practices

- Keep changes minimal and focused
- Don't modify working code unnecessarily
- Use Bun-native features when available
- Maintain existing code style and patterns
- Update documentation only when directly related to changes

## Testing Requirements

### Functional Changes
For any change that affects functionality:

1. **Run Existing Tests**: All existing tests must pass before and after changes.

2. **Add New Tests**: Add tests validating new functionality.

3. **Black-Box Testing**: Tests should focus on black-box style testing:
   - Test external observable effects only
   - Make no assumptions about internal behaviors or implementation details
   - Focus on inputs, outputs, and side effects

4. **Avoid Mocking**: Avoid mocking at all costs:
   - Use real implementations whenever possible
   - Test against actual file system, processes, or integrations
   - Only use mocks when absolutely necessary (e.g., external APIs that require authentication)

### Examples
- ✅ Test that a theme change results in the correct config file contents
- ✅ Test that running a command produces the expected output
- ❌ Mock internal function calls to verify they were called
- ❌ Test internal state or private methods directly
