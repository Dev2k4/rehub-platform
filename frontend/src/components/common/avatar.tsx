import { memo } from "react"
import { User } from "lucide-react"
import { cn } from "@/lib/utils"
import { getInitials } from "@/lib/utils"

interface AvatarProps {
  src?: string | null
  alt?: string
  name?: string
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  className?: string
}

const sizeClasses = {
  xs: "size-6 text-xs",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
  xl: "size-16 text-lg",
}

/**
 * Avatar - User avatar with fallback
 */
export const Avatar = memo(function Avatar({
  src,
  alt,
  name,
  size = "md",
  className,
}: AvatarProps) {
  const initials = name ? getInitials(name) : null

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full bg-muted overflow-hidden",
        sizeClasses[size],
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt || name || "Avatar"}
          className="size-full object-cover"
          loading="lazy"
        />
      ) : initials ? (
        <span className="font-medium text-muted-foreground">
          {initials}
        </span>
      ) : (
        <User className="size-1/2 text-muted-foreground" />
      )}
    </div>
  )
})
