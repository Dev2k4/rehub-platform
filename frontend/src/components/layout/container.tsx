import { memo, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ContainerProps {
  children: ReactNode
  size?: "sm" | "md" | "lg" | "xl" | "full"
  className?: string
}

const sizeClasses = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-7xl",
  xl: "max-w-screen-2xl",
  full: "max-w-full",
}

/**
 * Container - Responsive container with max-width
 */
export const Container = memo(function Container({
  children,
  size = "lg",
  className,
}: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        sizeClasses[size],
        className
      )}
    >
      {children}
    </div>
  )
})
