import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { CategoryRead, CategoryTree } from "@/client"
import {
  type CreateCategoryInput,
  createCategory,
  deleteCategory,
  getCategoryById,
  getCategories,
  type UpdateCategoryInput,
  updateCategory,
} from "../api/admin.categories.api"

export function useAdminCategories(asTree: boolean = false) {
  return useQuery<CategoryTree[] | CategoryRead[]>({
    queryKey: ["admin", "categories", { asTree }],
    queryFn: () => getCategories(asTree),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCategoryInput) => createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] })
      queryClient.invalidateQueries({ queryKey: ["categories"] }) // Also invalidate public categories
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      categoryId,
      data,
    }: {
      categoryId: string
      data: UpdateCategoryInput
    }) => updateCategory(categoryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] })
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (categoryId: string) => deleteCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] })
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
  })
}

export function useAdminCategoryDetail(categoryId?: string) {
  return useQuery<CategoryRead>({
    queryKey: ["admin", "categories", "detail", categoryId],
    queryFn: () => getCategoryById(categoryId as string),
    enabled: !!categoryId,
  })
}
