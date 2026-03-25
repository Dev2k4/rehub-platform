import { memo } from "react"
import { cn } from "@/lib/utils"
import { formatPrice, formatCompactNumber } from "@/lib/format"

interface PriceProps {
  amount: number
  originalAmount?: number
  compact?: boolean
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const sizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl",
}

/**
 * Price - Display price with proper formatting
 */
export const Price = memo(function Price({
  amount,
  originalAmount,
  compact = false,
  size = "md",
  className,
}: PriceProps) {
  const hasDiscount = originalAmount && originalAmount > amount
  const formattedPrice = compact
    ? `${formatCompactNumber(amount)}đ`
    : formatPrice(amount)

  return (
    <div className={cn("inline-flex items-baseline gap-2", className)}>
      <span
        className={cn(
          "font-bold text-price",
          sizeClasses[size]
        )}
      >
        {formattedPrice}
      </span>
      {hasDiscount && (
        <span className="text-sm text-muted-foreground line-through">
          {compact
            ? `${formatCompactNumber(originalAmount)}đ`
            : formatPrice(originalAmount)}
        </span>
      )}
    </div>
  )
})
