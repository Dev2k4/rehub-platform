import { X, Bell, User, ChevronRight } from "lucide-react"
import type { CategoryTree } from "@/client"

type CategoryOverlayProps = {
  open: boolean
  categories: CategoryTree[]
  selectedCategoryId: string
  onClose: () => void
  onSelectCategory: (id: string) => void
}

export function CategoryOverlay({
  open,
  categories,
  selectedCategoryId,
  onClose,
  onSelectCategory,
}: CategoryOverlayProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[70] flex lg:hidden">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        aria-label="Đóng menu danh mục"
        onClick={onClose}
      />

      {/* Sidebar Drawer */}
      <aside className="relative flex w-[280px] max-w-[80vw] flex-col bg-white shadow-2xl h-full animate-in slide-in-from-left">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Danh mục</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Category List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          <button
            type="button"
            onClick={() => onSelectCategory("")}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
              selectedCategoryId === "" ? "bg-blue-50 text-blue-600" : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span>Tất cả ngành hàng</span>
            <ChevronRight className={`h-4 w-4 ${selectedCategoryId === "" ? "text-blue-500" : "text-slate-400"}`} />
          </button>
          
          {categories.map((category) => {
            const active = selectedCategoryId === category.id
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onSelectCategory(category.id)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                  active ? "bg-blue-50 text-blue-600" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="line-clamp-1">{category.name}</span>
                <ChevronRight className={`h-4 w-4 ${active ? "text-blue-500" : "text-slate-400"}`} />
              </button>
            )
          })}
        </div>

        {/* Bottom Actions for Mobile */}
        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
              <div className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute right-0 top-0 h-1.5 w-1.5 rounded-full bg-red-500" />
              </div>
              <span className="flex-1 text-left">Thông báo</span>
            </button>
          </div>
          <div className="mt-1 flex items-center gap-3">
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
              <User className="h-5 w-5" />
              <span className="flex-1 text-left">Tài khoản cá nhân</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}
