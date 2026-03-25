import { memo } from "react"
import { Star, StarHalf } from "lucide-react"
import { cn } from "@/lib/utils"

interface RatingProps {
  value: number
  count?: number
  showCount?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  sm: "size-3",
  md: "size-4",
  lg: "size-5",
}

const textSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
}

/**
 * Rating - Display star rating
 */
export const Rating = memo(function Rating({
  value,
  count,
  showCount = true,
  size = "md",
  className,
}: RatingProps) {
  const fullStars = Math.floor(value)
  const hasHalfStar = value % 1 >= 0.5
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <div className="flex items-center">
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star
            key={`full-${i}`}
            className={cn(sizeClasses[size], "fill-warning text-warning")}
          />
        ))}

        {/* Half star */}
        {hasHalfStar && (
          <StarHalf
            className={cn(sizeClasses[size], "fill-warning text-warning")}
          />
        )}

        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star
            key={`empty-${i}`}
            className={cn(sizeClasses[size], "text-muted-foreground/30")}
          />
        ))}
      </div>

      {/* Rating value and count */}
      <span className={cn("text-muted-foreground", textSizeClasses[size])}>
        {value.toFixed(1)}
        {showCount && count !== undefined && (
          <span className="ml-1">({count})</span>
        )}
      </span>
    </div>
  )
})
