# Claude Sessions Explorer - Code Standards

This project follows strict code quality standards inspired by Ultracite/Biome conventions.

## Quick Reference

- **Format code**: `bun run lint` (uses ESLint currently)
- **Dev server**: `bun run dev`
- **Build**: `bun run build`

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`
- Prefer semicolons-as-needed style (no semicolons when not required)

### React & JSX

- Use function components over class components
- Use `export default function` for page/layout components
- Use `export const ComponentName: React.FC<Props>` for reusable components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Use semantic HTML and ARIA attributes for accessibility
- Prefer self-closing tags when no children are needed

### Styling with Tailwind CSS v4

- Use Tailwind utility classes for styling
- Use CSS variables for theming (defined in globals.css)
- Use the `cn()` utility for conditional class merging (install `clsx` + `tailwind-merge`)
- Prefer design tokens over arbitrary values
- Use responsive prefixes (`sm:`, `md:`, `lg:`) for responsive design
- Use dark mode with `dark:` prefix

### Component Patterns

- Use `class-variance-authority` (CVA) for component variants
- Export component variants for reuse
- Use `data-slot` attribute for component part identification
- Props interface pattern:
  ```typescript
  type ButtonProps = React.ComponentProps<"button"> & {
    variant?: "default" | "outline" | "ghost"
    size?: "sm" | "default" | "lg"
  }
  ```

### Project Structure

```
src/
├── app/           # Next.js App Router pages
├── components/    # Reusable components
│   └── ui/        # Base UI components (button, card, etc.)
├── hooks/         # Custom React hooks
├── lib/           # Utility functions
└── types/         # TypeScript type definitions
```

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings
- Use `try-catch` blocks meaningfully
- Prefer early returns over nested conditionals

### Code Organization

- Keep functions focused and under reasonable complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Group related code together and separate concerns

### Performance

- Avoid spread syntax in accumulators within loops
- Use proper image components (`next/image`) over `<img>` tags
- Memoize expensive computations with `useMemo`
- Memoize callbacks passed to children with `useCallback`

### Next.js Specific

- Use Next.js `<Image>` component for images
- Use App Router metadata API for SEO
- Use Server Components for async data fetching
- Keep non-interactive layout wrappers in server components
- Extract data fetching into named async functions for clarity

---

## Dependencies to Consider

For enhanced development experience, consider adding:

```json
{
  "dependencies": {
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.4.0",
    "class-variance-authority": "^0.7.1"
  }
}
```

## Utility Functions

Create a `lib/utils.ts` with:

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
```

---

## Recommended Permissions

The following bash commands are pre-approved for this project:
- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun add *` - Add dependencies
- Git operations (status, add, commit, push, etc.)
