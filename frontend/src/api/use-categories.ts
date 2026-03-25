import { useQuery } from "@tanstack/react-query"
import { categoriesGetAll, categoriesGetBySlug } from "@/client"
import type { Category } from "@/types"

// Query Keys
export const categoryKeys = {
  all: ["categories"] as const,
  lists: () => [...categoryKeys.all, "list"] as const,
  list: (asTree?: boolean) => [...categoryKeys.lists(), { asTree }] as const,
  details: () => [...categoryKeys.all, "detail"] as const,
  detail: (slug: string) => [...categoryKeys.details(), slug] as const,
}

/**
 * useCategories - Get all categories (optionally as tree)
 */
export function useCategories(asTree = true) {
  return useQuery({
    queryKey: categoryKeys.list(asTree),
    queryFn: async () => {
      const response = await categoriesGetAll({
        query: { as_tree: asTree },
      })
      return response.data as Category[]
    },
    staleTime: 1000 * 60 * 10, // 10 minutes - categories rarely change
  })
}

/**
 * useCategory - Get single category by slug
 */
export function useCategory(slug: string) {
  return useQuery({
    queryKey: categoryKeys.detail(slug),
    queryFn: async () => {
      const response = await categoriesGetBySlug({ path: { slug } })
      return response.data as Category
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 10,
  })
}

/**
 * useFlatCategories - Get categories as flat list (for dropdowns)
 */
export function useFlatCategories() {
  const { data: treeCategories, ...rest } = useCategories(true)

  // Flatten the tree for easy selection
  const flatCategories = treeCategories
    ? flattenCategories(treeCategories)
    : []

  return {
    ...rest,
    data: flatCategories,
  }
}

// Helper to flatten category tree
function flattenCategories(categories: Category[], level = 0): Array<Category & { level: number }> {
  const result: Array<Category & { level: number }> = []

  for (const cat of categories) {
    result.push({ ...cat, level })
    if (cat.children && cat.children.length > 0) {
      result.push(...flattenCategories(cat.children, level + 1))
    }
  }

  return result
}
