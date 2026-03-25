import { useMemo, useState } from "react"
import { CategoryOverlay } from "@/features/home/components/CategoryOverlay"
import { CategorySidebar } from "@/features/home/components/CategorySidebar"
import { ListingGrid } from "@/features/home/components/ListingGrid"
import { MarketplaceHeader } from "@/features/home/components/MarketplaceHeader"
import { useMarketplaceData } from "@/features/home/hooks/useMarketplaceData"

export function HomeMarketplacePage() {
  const [categoryOverlayOpen, setCategoryOverlayOpen] = useState(false)
  const {
    selectedCategoryId,
    setSelectedCategoryId,
    keyword,
    setKeyword,
    categoriesQuery,
    listingsQuery,
    categoryMap,
    flatCategories,
  } = useMarketplaceData()

  const selectedCategoryName = useMemo(() => {
    if (!selectedCategoryId) {
      return "Tất cả sản phẩm"
    }

    return categoryMap.get(selectedCategoryId)?.name ?? "Danh mục"
  }, [selectedCategoryId, categoryMap])

  return (
    <div className="min-h-screen bg-slate-50">
      <MarketplaceHeader
        keyword={keyword}
        onKeywordChange={setKeyword}
        onOpenCategoryMenu={() => setCategoryOverlayOpen(true)}
      />

      <CategoryOverlay
        open={categoryOverlayOpen}
        categories={flatCategories}
        selectedCategoryId={selectedCategoryId}
        onClose={() => setCategoryOverlayOpen(false)}
        onSelectCategory={(id) => {
          setSelectedCategoryId(id)
          setCategoryOverlayOpen(false)
        }}
      />

      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-md">
          <p className="text-xs uppercase tracking-wider text-blue-100 font-medium">Marketplace</p>
          <h1 className="mt-1 text-2xl font-bold md:text-3xl">Khám phá sản phẩm</h1>
          <p className="mt-2 text-sm text-blue-50 md:text-base">Hàng nghìn sản phẩm từ những người bán uy tín đang chờ đón bạn.</p>
        </div>

        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">{selectedCategoryName}</h2>
          <div className="text-sm font-medium text-slate-500">
            {listingsQuery.data ? `${listingsQuery.data.total} kết quả` : "Đang tải..."}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <CategorySidebar
            categories={flatCategories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
          />

          <main className="flex-1 min-w-0">
            {categoriesQuery.isLoading || listingsQuery.isLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Đang tải dữ liệu...</div>
            ) : null}

            {categoriesQuery.isError || listingsQuery.isError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-sm text-red-700">
                Không thể tải dữ liệu. Vui lòng kiểm tra cấu hình VITE_API_URL và trạng thái server.
              </div>
            ) : null}

            {!categoriesQuery.isLoading && !listingsQuery.isLoading && !categoriesQuery.isError && !listingsQuery.isError ? (
              <ListingGrid listings={listingsQuery.data?.items ?? []} categoryMap={categoryMap} />
            ) : null}
          </main>
        </div>
      </div>
    </div>
  )
}
