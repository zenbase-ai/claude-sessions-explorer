import type React from "react"
import { cn } from "@/lib/utils"

export const Card: React.FC<React.ComponentProps<"div">> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      "rounded-xl border border-border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
)

export const CardHeader: React.FC<React.ComponentProps<"div">> = ({
  className,
  ...props
}) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
)

export const CardTitle: React.FC<React.ComponentProps<"h3">> = ({
  className,
  ...props
}) => (
  <h3
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
)

export const CardDescription: React.FC<React.ComponentProps<"p">> = ({
  className,
  ...props
}) => (
  <p className={cn("text-sm text-muted-foreground", className)} {...props} />
)

export const CardContent: React.FC<React.ComponentProps<"div">> = ({
  className,
  ...props
}) => <div className={cn("p-6 pt-0", className)} {...props} />

export const CardFooter: React.FC<React.ComponentProps<"div">> = ({
  className,
  ...props
}) => (
  <div className={cn("flex items-center p-6 pt-0", className)} {...props} />
)
