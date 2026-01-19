# Setup shadcn/ui

Initialize shadcn/ui with project conventions.

## Instructions

1. **Install dependencies**:
```bash
cd next && bun add clsx tailwind-merge class-variance-authority @radix-ui/react-slot
```

2. **Create lib/utils.ts**:
```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
```

3. **Create components.json** (for shadcn CLI):
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "zinc",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

4. **Update globals.css** with full theme:
```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(0.98 0.004 106);
  --foreground: oklch(0.27 0.002 107);
  --card: oklch(0.98 0.004 106);
  --card-foreground: oklch(0.19 0.002 107);
  --popover: oklch(0.98 0.004 106);
  --popover-foreground: oklch(0.37 0.003 107);
  --primary: oklch(0.70 0.058 200);
  --primary-foreground: oklch(0.98 0.004 106);
  --secondary: oklch(0.92 0.007 97);
  --secondary-foreground: oklch(0.37 0.003 107);
  --muted: oklch(0.95 0.007 107);
  --muted-foreground: oklch(0.66 0.006 107);
  --accent: oklch(0.95 0.007 107);
  --accent-foreground: oklch(0.21 0 0);
  --destructive: oklch(0.57 0.149 28);
  --destructive-foreground: oklch(0.98 0.004 106);
  --border: oklch(0.92 0.007 97);
  --input: oklch(0.92 0.007 97);
  --ring: oklch(0.70 0.058 200);
  --radius: 0.5rem;
}

.dark {
  --background: oklch(0.27 0.002 107);
  --foreground: oklch(0.95 0.007 107);
  --card: oklch(0.27 0.002 107);
  --card-foreground: oklch(0.98 0.004 106);
  --popover: oklch(0.37 0.003 107);
  --popover-foreground: oklch(0.98 0.004 106);
  --primary: oklch(0.70 0.058 200);
  --primary-foreground: oklch(0.98 0.004 106);
  --secondary: oklch(0.37 0.003 107);
  --secondary-foreground: oklch(0.92 0.007 97);
  --muted: oklch(0.37 0.003 107);
  --muted-foreground: oklch(0.80 0.007 107);
  --accent: oklch(0.21 0 0);
  --accent-foreground: oklch(0.98 0.004 106);
  --destructive: oklch(0.57 0.149 28);
  --destructive-foreground: oklch(0.98 0.004 106);
  --border: oklch(0.51 0.005 107);
  --input: oklch(0.51 0.005 107);
  --ring: oklch(0.70 0.058 200);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

5. **Add components** using shadcn CLI:
```bash
bunx shadcn@latest add button card
```

Run this command to set up the complete shadcn/ui configuration.
