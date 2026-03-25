import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import type { CategoryTree } from "@/client"
import { getCategoriesTree, getListings } from "@/features/home/api/marketplace.api"
import { flattenCategories } from "@/features/home/utils/marketplace.utils"

const DEFAULT_LIMIT = 24

export function useMarketplaceData() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
  const [keyword, setKeyword] = useState("")

  const categoriesQuery = useQuery({
    queryKey: ["categories", "tree"],
    queryFn: () => getCategoriesTree(),
  })

  const listingsQuery = useQuery({
    queryKey: ["listings", "public", selectedCategoryId, keyword],
    queryFn: () =>
      getListings({
        categoryId: selectedCategoryId || undefined,
        keyword: keyword || undefined,
        limit: DEFAULT_LIMIT,
        skip: 0,
      }),
  })

  const flatCategories = useMemo(() => {
    const tree = categoriesQuery.data ?? []
    return flattenCategories(tree)
  }, [categoriesQuery.data])

  const categoryMap = useMemo(() => {
    return new Map(flatCategories.map((item: CategoryTree) => [item.id, item]))
  }, [flatCategories])

  return {
    selectedCategoryId,
    setSelectedCategoryId,
    keyword,
    setKeyword,
    categoriesQuery,
    listingsQuery,
    categoryMap,
    flatCategories,
  }
}
