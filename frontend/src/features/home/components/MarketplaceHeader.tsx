import { Menu, Search, Package, PlusCircle, Bell, User } from "lucide-react"
import { Link } from "@tanstack/react-router"

type MarketplaceHeaderProps = {
  keyword: string
  onKeywordChange: (value: string) => void
  onOpenCategoryMenu: () => void
}

export function MarketplaceHeader({ keyword, onKeywordChange, onOpenCategoryMenu }: MarketplaceHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-lg md:px-6 md:py-4">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 md:gap-8">
        {/* Top Header Mobile / Full Header Left Desktop */}
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              type="button"
              className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200"
              onClick={onOpenCategoryMenu}
            >
              <Menu className="h-5 w-5" />
            </button>
            
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600">
                <Package className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900">ReHub</span>
            </Link>
          </div>

          {/* Mobile Right Icons (hidden on sm+) */}
          <div className="flex sm:hidden items-center gap-2">
            <Link to="/" className="flex items-center justify-center rounded-full bg-blue-600 h-10 w-10 text-white hover:bg-blue-700">
              <PlusCircle className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Search Input */}
        <div className="flex-1 w-full max-w-2xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              value={keyword}
              onChange={(event) => onKeywordChange(event.target.value)}
              placeholder="Tìm kiếm sản phẩm, danh mục, hoặc người bán..."
              className="w-full rounded-full border-none bg-gray-100 py-3 pl-12 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Desktop Right Icons (hidden on mobile) */}
        <div className="hidden sm:flex items-center gap-2">
          <button className="relative rounded-full p-2.5 text-gray-600 transition-colors hover:bg-gray-100">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>
          <Link
            to="/"
            className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Đăng tin</span>
          </Link>
          <button className="rounded-full p-2.5 text-gray-600 transition-colors hover:bg-gray-100">
            <User className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
