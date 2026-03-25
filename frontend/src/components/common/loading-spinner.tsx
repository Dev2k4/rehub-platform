import { memo } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
}

/**
 * LoadingSpinner - Animated loading indicator
 */
export const LoadingSpinner = memo(function LoadingSpinner({
  size = "md",
  className,
}: LoadingSpinnerProps) {
  return (
    <Loader2
      className={cn(
        "animate-spin text-muted-foreground",
        sizeClasses[size],
        className
      )}
    />
  )
})

/**
 * LoadingPage - Full page loading state
 */
export const LoadingPage = memo(function LoadingPage() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <LoadingSpinner size="lg" />
    </div>
  )
})
