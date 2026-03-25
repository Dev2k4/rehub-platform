import { memo } from "react"
import { MapPin, Calendar, Package } from "lucide-react"
import { Link } from "@tanstack/react-router"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/format"
import { ROUTES } from "@/lib/constants"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/common/avatar"
import { Rating } from "@/components/common/rating"
import { TrustScore } from "@/components/common/trust-score"
import type { UserPublicProfile } from "@/types"

interface UserCardProps {
  user: UserPublicProfile
  showStats?: boolean
  showAction?: boolean
  onMessage?: () => void
  className?: string
}

/**
 * UserCard - Display user profile card
 */
export const UserCard = memo(function UserCard({
  user,
  showStats = true,
  showAction = true,
  onMessage,
  className,
}: UserCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Link to={ROUTES.SELLER(user.id)}>
            <Avatar
              src={user.avatar_url}
              name={user.full_name}
              size="lg"
              className="shrink-0"
            />
          </Link>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <Link
              to={ROUTES.SELLER(user.id)}
              className="font-semibold text-foreground hover:text-primary transition-colors"
            >
              {user.full_name}
            </Link>

            {/* Rating & Trust */}
            <div className="flex items-center gap-3 mt-1">
              <Rating
                value={user.rating_avg}
                count={user.rating_count}
                size="sm"
              />
              <TrustScore score={user.trust_score} size="sm" />
            </div>

            {/* Location & Join date */}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              {(user.province || user.district) && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3" />
                  {[user.district, user.province].filter(Boolean).join(", ")}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3" />
                Từ {formatDate(user.created_at, { month: "short", year: "numeric" })}
              </span>
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {user.bio}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        {showStats && (
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {user.completed_orders}
              </div>
              <div className="text-xs text-muted-foreground">Đã bán</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {user.rating_count}
              </div>
              <div className="text-xs text-muted-foreground">Đánh giá</div>
            </div>
          </div>
        )}

        {/* Action */}
        {showAction && onMessage && (
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={onMessage}
          >
            Nhắn tin
          </Button>
        )}
      </CardContent>
    </Card>
  )
})

interface UserCardMiniProps {
  user: {
    id: string
    full_name: string
    avatar_url?: string | null
    rating_avg?: number
  }
  className?: string
}

/**
 * UserCardMini - Compact user display
 */
export const UserCardMini = memo(function UserCardMini({
  user,
  className,
}: UserCardMiniProps) {
  return (
    <Link
      to={ROUTES.SELLER(user.id)}
      className={cn(
        "inline-flex items-center gap-2 hover:opacity-80 transition-opacity",
        className
      )}
    >
      <Avatar
        src={user.avatar_url}
        name={user.full_name}
        size="sm"
      />
      <div className="min-w-0">
        <span className="text-sm font-medium text-foreground truncate">
          {user.full_name}
        </span>
        {user.rating_avg !== undefined && (
          <Rating
            value={user.rating_avg}
            showCount={false}
            size="sm"
          />
        )}
      </div>
    </Link>
  )
})
