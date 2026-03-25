import { memo } from "react"
import { Heart, MapPin, Clock } from "lucide-react"
import { Link } from "@tanstack/react-router"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/format"
import { ROUTES } from "@/lib/constants"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Price } from "@/components/common/price"
import { ConditionBadge } from "@/components/common/condition-badge"
import { Avatar } from "@/components/common/avatar"
import { Rating } from "@/components/common/rating"
import type { ListingCard as ListingCardType } from "@/types"

interface ListingCardProps {
  listing: ListingCardType
  onFavorite?: (id: string) => void
  isFavorited?: boolean
  showSeller?: boolean
  className?: string
}

/**
 * ListingCard - Display a listing in card format
 */
export const ListingCard = memo(function ListingCard({
  listing,
  onFavorite,
  isFavorited = false,
  showSeller = true,
  className,
}: ListingCardProps) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onFavorite?.(listing.id)
  }

  return (
    <Card
      className={cn(
        "group relative overflow-hidden p-0 transition-all duration-200",
        "hover:shadow-md hover:-translate-y-0.5",
        className
      )}
    >
      <Link to={ROUTES.LISTING(listing.id)} className="block">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {listing.primary_image_url ? (
            <img
              src={listing.primary_image_url}
              alt={listing.title}
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="size-full flex items-center justify-center text-muted-foreground">
              No image
            </div>
          )}

          {/* Badges overlay */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {listing.is_negotiable && (
              <Badge variant="secondary" className="text-xs">
                Có thể thương lượng
              </Badge>
            )}
          </div>

          {/* Favorite button */}
          {onFavorite && (
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn(
                "absolute top-2 right-2 bg-background/80 backdrop-blur-sm",
                "opacity-0 group-hover:opacity-100 transition-opacity",
                isFavorited && "opacity-100"
              )}
              onClick={handleFavoriteClick}
            >
              <Heart
                className={cn(
                  "size-4",
                  isFavorited && "fill-destructive text-destructive"
                )}
              />
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          {/* Price */}
          <Price amount={listing.price} size="lg" />

          {/* Title */}
          <h3 className="font-medium text-sm leading-tight line-clamp-2 text-foreground">
            {listing.title}
          </h3>

          {/* Condition & Location */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ConditionBadge condition={listing.condition_grade} />
            {listing.province && (
              <span className="inline-flex items-center gap-0.5">
                <MapPin className="size-3" />
                {listing.province}
              </span>
            )}
          </div>

          {/* Time */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            {formatRelativeTime(listing.created_at)}
          </div>

          {/* Seller Info */}
          {showSeller && listing.seller && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <Avatar
                src={listing.seller.avatar_url}
                name={listing.seller.full_name}
                size="xs"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">
                  {listing.seller.full_name}
                </p>
              </div>
              <Rating
                value={listing.seller.rating_avg}
                showCount={false}
                size="sm"
              />
            </div>
          )}
        </div>
      </Link>
    </Card>
  )
})

/**
 * ListingCardSkeleton - Loading skeleton for ListingCard
 */
export const ListingCardSkeleton = memo(function ListingCardSkeleton({
  className,
}: {
  className?: string
}) {
  return (
    <Card className={cn("overflow-hidden p-0", className)}>
      <Skeleton className="aspect-square w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex items-center gap-2 pt-2 border-t">
          <Skeleton className="size-6 rounded-full" />
          <Skeleton className="h-4 flex-1" />
        </div>
      </div>
    </Card>
  )
})
