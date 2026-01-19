import { Card, CardContent } from "@/components/ui/card"

type StatsCardProps = {
  title: string
  value: string | number
  subtitle?: string
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, subtitle }) => (
  <Card>
    <CardContent className="p-6">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
      {subtitle && (
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      )}
    </CardContent>
  </Card>
)
