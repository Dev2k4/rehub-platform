import { memo, type ReactNode } from "react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCompactNumber } from "@/lib/format"
import { Card, CardContent } from "@/components/ui/card"

interface StatsCardProps {
  title: string
  value: number | string
  icon?: ReactNode
  change?: number
  changeLabel?: string
  format?: "number" | "compact" | "currency" | "percent"
  className?: string
  onClick?: () => void
}

/**
 * StatsCard - Display a statistic with optional trend
 */
export const StatsCard = memo(function StatsCard({
  title,
  value,
  icon,
  change,
  changeLabel,
  format = "number",
  className,
  onClick,
}: StatsCardProps) {
  const formatValue = (val: number | string) => {
    if (typeof val === "string") return val

    switch (format) {
      case "compact":
        return formatCompactNumber(val)
      case "currency":
        return new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
          maximumFractionDigits: 0,
        }).format(val)
      case "percent":
        return `${val}%`
      default:
        return new Intl.NumberFormat("vi-VN").format(val)
    }
  }

  const getTrendIcon = () => {
    if (change === undefined || change === 0) {
      return <Minus className="size-4" />
    }
    return change > 0 ? (
      <TrendingUp className="size-4" />
    ) : (
      <TrendingDown className="size-4" />
    )
  }

  const getTrendColor = () => {
    if (change === undefined || change === 0) return "text-muted-foreground"
    return change > 0 ? "text-success" : "text-destructive"
  }

  return (
    <Card
      className={cn(
        "transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-md hover:-translate-y-0.5",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">
              {formatValue(value)}
            </p>
          </div>
          {icon && (
            <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
          )}
        </div>

        {change !== undefined && (
          <div className={cn("flex items-center gap-1 mt-2", getTrendColor())}>
            {getTrendIcon()}
            <span className="text-sm font-medium">
              {change > 0 ? "+" : ""}
              {change}%
            </span>
            {changeLabel && (
              <span className="text-xs text-muted-foreground ml-1">
                {changeLabel}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
})
