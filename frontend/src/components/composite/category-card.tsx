import { memo, type ReactNode } from "react"
import { Link } from "@tanstack/react-router"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCompactNumber } from "@/lib/format"
import { ROUTES } from "@/lib/constants"
import { Card, CardContent } from "@/components/ui/card"
import type { Category } from "@/types"

interface CategoryCardProps {
  category: Category
  icon?: ReactNode
  className?: string
}

/**
 * CategoryCard - Display a category with icon and count
 */
export const CategoryCard = memo(function CategoryCard({
  category,
  icon,
  className,
}: CategoryCardProps) {
  return (
    <Link to={ROUTES.CATEGORY(category.slug)}>
      <Card
        className={cn(
          "group cursor-pointer transition-all duration-200",
          "hover:shadow-md hover:-translate-y-0.5 hover:border-primary/50",
          className
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            {icon && (
              <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10 text-primary shrink-0">
                {icon}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {category.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {formatCompactNumber(category.listing_count)} tin đăng
              </p>

              {/* Children categories */}
              {category.children && category.children.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {category.children.slice(0, 4).map((child) => (
                    <span
                      key={child.id}
                      className="text-xs text-muted-foreground hover:text-primary"
                    >
                      {child.name}
                      {category.children!.indexOf(child) < 3 && ", "}
                    </span>
                  ))}
                  {category.children.length > 4 && (
                    <span className="text-xs text-muted-foreground">
                      +{category.children.length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Arrow */}
            <ChevronRight className="size-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
})

interface CategoryIconCardProps {
  category: Category
  icon?: ReactNode
  className?: string
}

/**
 * CategoryIconCard - Compact category card with just icon and name
 */
export const CategoryIconCard = memo(function CategoryIconCard({
  category,
  icon,
  className,
}: CategoryIconCardProps) {
  return (
    <Link to={ROUTES.CATEGORY(category.slug)}>
      <div
        className={cn(
          "flex flex-col items-center gap-2 p-4 rounded-lg",
          "hover:bg-accent transition-colors cursor-pointer",
          "text-center",
          className
        )}
      >
        {icon && (
          <div className="flex items-center justify-center size-14 rounded-full bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <span className="text-sm font-medium text-foreground">
          {category.name}
        </span>
      </div>
    </Link>
  )
})
