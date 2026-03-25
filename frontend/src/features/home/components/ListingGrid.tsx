import { Tag } from "lucide-react"
import type { CategoryTree, ListingWithImages } from "@/client"
import { formatCurrencyVnd, formatPostedTime, getListingImageUrl } from "@/features/home/utils/marketplace.utils"

type ListingGridProps = {
  listings: ListingWithImages[]
  categoryMap: Map<string, CategoryTree>
}

export function ListingGrid({ listings, categoryMap }: ListingGridProps) {
  if (listings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        Không có sản phẩm phù hợp với bộ lọc hiện tại.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {listings.map((listing) => {
        const category = categoryMap.get(listing.category_id)
        const firstImageUrl = getListingImageUrl(listing.images?.[0]?.image_url)

        return (
          <article
            key={listing.id}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="aspect-listing overflow-hidden bg-slate-100">
              {firstImageUrl ? (
                <img
                  src={firstImageUrl}
                  alt={listing.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">Chưa có ảnh</div>
              )}
            </div>

            <div className="space-y-2 p-3">
              <h3 className="line-clamp-2 min-h-10 text-sm font-semibold text-slate-900">{listing.title}</h3>

              <div className="text-price text-lg leading-none">{formatCurrencyVnd(listing.price)}</div>

              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Tag className="h-3.5 w-3.5" />
                <span className="line-clamp-1">{category?.name ?? "Danh mục chưa xác định"}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{listing.condition_grade.replace(/_/g, " ")}</span>
                <span>{formatPostedTime(listing.created_at)}</span>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
