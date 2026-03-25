import { memo } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  LISTING_STATUSES,
  OFFER_STATUSES,
  ORDER_STATUSES,
} from "@/lib/constants"

type StatusType = "listing" | "offer" | "order"

interface StatusBadgeProps {
  type: StatusType
  status: string
  className?: string
}

const statusMaps = {
  listing: LISTING_STATUSES,
  offer: OFFER_STATUSES,
  order: ORDER_STATUSES,
} as const

/**
 * StatusBadge - Display status with appropriate color
 */
export const StatusBadge = memo(function StatusBadge({
  type,
  status,
  className,
}: StatusBadgeProps) {
  const statusMap = statusMaps[type]
  const config = statusMap[status as keyof typeof statusMap]

  if (!config) {
    return (
      <Badge variant="muted" className={className}>
        {status}
      </Badge>
    )
  }

  type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "muted"

  const variantMap: Record<string, BadgeVariant> = {
    success: "success",
    warning: "warning",
    destructive: "destructive",
    info: "info",
    muted: "muted",
  }

  const variant = variantMap[config.color] || "default"

  return (
    <Badge variant={variant} className={cn(className)}>
      {config.label}
    </Badge>
  )
})
