# Add UI Component

Create a new UI component following project conventions.

## Instructions

Create a new React component in `next/src/components/` with the following patterns:

1. **File naming**: Use PascalCase for component files (e.g., `Button.tsx`, `SessionCard.tsx`)

2. **Component structure**:
```typescript
import type React from "react"
import { cn } from "@/lib/utils"

type ComponentNameProps = React.ComponentProps<"div"> & {
  // Additional props
  variant?: "default" | "outline"
}

export const ComponentName: React.FC<ComponentNameProps> = ({
  className,
  variant = "default",
  ...props
}) => {
  return (
    <div
      className={cn(
        "base-classes-here",
        variant === "outline" && "outline-classes",
        className
      )}
      {...props}
    />
  )
}
```

3. **For variant-heavy components**, use CVA:
```typescript
import { cva, type VariantProps } from "class-variance-authority"

export const componentVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        default: "default-classes",
        outline: "outline-classes",
      },
      size: {
        sm: "small-classes",
        default: "default-size-classes",
        lg: "large-classes",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ComponentProps = React.ComponentProps<"button"> &
  VariantProps<typeof componentVariants>
```

4. **Styling conventions**:
   - Use Tailwind utility classes
   - Use `cn()` for conditional classes
   - Support `className` prop for customization
   - Use CSS variables for theming (`bg-background`, `text-foreground`, etc.)

5. **Dark mode**: Use `dark:` prefix for dark mode variants

Ask for the component name and purpose before creating.
