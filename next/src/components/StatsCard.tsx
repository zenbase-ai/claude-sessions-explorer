/**
 * StatsCard Component
 *
 * A reusable card for displaying a single statistic with optional icon.
 * Used on the dashboard to show overview metrics.
 *
 * Features:
 * - Large prominent value display
 * - Optional subtitle for additional context
 * - Optional icon with customizable background color
 * - Consistent styling with the design system
 *
 * Used by: Dashboard page for Total Sessions, Messages, Tokens, etc.
 */

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/**
 * Props for the StatsCard component
 */
type StatsCardProps = {
  /** Label displayed above the value (e.g., "Total Sessions") */
  title: string
  /** The main statistic value to display prominently */
  value: string | number
  /** Optional additional context below the value (e.g., "Across 4 projects") */
  subtitle?: string
  /** Optional icon element to display on the right */
  icon?: React.ReactNode
  /** Optional Tailwind classes for the icon container */
  iconClassName?: string
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconClassName,
}) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        {/* Left side: title, value, and optional subtitle */}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {/* Right side: optional icon with colored background */}
        {icon && (
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg",
              iconClassName || "bg-primary/10 text-primary"
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </CardContent>
  </Card>
)
