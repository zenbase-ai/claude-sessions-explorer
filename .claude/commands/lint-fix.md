# Lint and Format Code

Run linting and fix issues following project conventions.

## Instructions

1. **Run lint check**:
```bash
cd next && bun run lint
```

2. **If using Biome** (recommended upgrade):
```bash
bun run lint     # Check for issues
bun run fmt      # Format code
```

3. **Common fixes**:

- **Unused imports**: Remove them
- **Missing dependencies in hooks**: Add to dependency array
- **Prefer `for...of`**: Replace `.forEach()` with `for...of`
- **Async functions**: Ensure promises are awaited
- **Console statements**: Remove `console.log` in production code

4. **Pre-commit checklist**:
   - [ ] No lint errors
   - [ ] No unused variables/imports
   - [ ] No `console.log` statements
   - [ ] All hook dependencies specified
   - [ ] Types are explicit where helpful

Run `bun run lint` to check the codebase.
