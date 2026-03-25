import { ChevronRight } from "lucide-react"
import type { CategoryTree } from "@/client"

type CategorySidebarProps = {
  categories: CategoryTree[]
  selectedCategoryId: string
  onSelectCategory: (id: string) => void
}

export function CategorySidebar({ categories, selectedCategoryId, onSelectCategory }: CategorySidebarProps) {
  return (
    <aside className="hidden w-[260px] shrink-0 lg:block">
      <div className="sticky top-24 rounded-2xl border border-gray-200/50 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Danh mục</h2>
        
        <button
          type="button"
          onClick={() => onSelectCategory("")}
          className={`flex w-full items-center justify-between rounded-xl p-3 text-left transition ${
            selectedCategoryId === "" ? "bg-blue-50/50" : "hover:bg-gray-50 group"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${selectedCategoryId === "" ? "text-blue-600" : "text-gray-700 group-hover:text-gray-900"}`}>
              Đang bán
            </span>
          </div>
          <ChevronRight className={`h-4 w-4 ${selectedCategoryId === "" ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500"}`} />
        </button>

        <div className="mt-1 flex flex-col space-y-1">
          {categories.map((category) => {
            const active = selectedCategoryId === category.id
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onSelectCategory(category.id)}
                className={`flex w-full items-center justify-between rounded-xl p-3 text-left transition ${
                  active ? "bg-blue-50/50" : "hover:bg-gray-50 group"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium line-clamp-1 ${active ? "text-blue-600" : "text-gray-700 group-hover:text-gray-900"}`}>
                    {category.name}
                  </span>
                </div>
                <ChevronRight className={`h-4 w-4 shrink-0 ${active ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500"}`} />
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
