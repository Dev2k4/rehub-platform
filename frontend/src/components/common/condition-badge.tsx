import { memo } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CONDITION_GRADES } from "@/lib/constants"
import type { ConditionGrade } from "@/types"

interface ConditionBadgeProps {
  condition: ConditionGrade
  showDescription?: boolean
  className?: string
}

/**
 * ConditionBadge - Display product condition
 */
export const ConditionBadge = memo(function ConditionBadge({
  condition,
  showDescription = false,
  className,
}: ConditionBadgeProps) {
  const config = CONDITION_GRADES[condition]

  if (!config) {
    return null
  }

  type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "muted"

  const variantMap: Record<string, BadgeVariant> = {
    success: "success",
    warning: "warning",
    info: "info",
    muted: "muted",
  }

  const variant = variantMap[config.color] || "default"

  return (
    <div className={cn("inline-flex flex-col gap-0.5", className)}>
      <Badge variant={variant}>
        {config.label}
      </Badge>
      {showDescription && (
        <span className="text-xs text-muted-foreground">
          {config.description}
        </span>
      )}
    </div>
  )
})
