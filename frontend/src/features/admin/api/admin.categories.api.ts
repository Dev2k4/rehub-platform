import { CategoriesService } from "@/client"
import type { CategoryRead, CategoryTree } from "@/client"

export interface CreateCategoryInput {
  name: string
  slug?: string | null
  parent_id?: string | null
  icon_url?: string | null
}

export interface UpdateCategoryInput {
  name?: string | null
  slug?: string | null
  parent_id?: string | null
  icon_url?: string | null
}

export async function getCategories(asTree: boolean = false): Promise<CategoryTree[] | CategoryRead[]> {
  return CategoriesService.getCategoriesApiV1CategoriesGet({ asTree })
}

export async function createCategory(data: CreateCategoryInput): Promise<CategoryRead> {
  return CategoriesService.createCategoryApiV1CategoriesPost({
    requestBody: data as any,
  })
}

export async function updateCategory(
  categoryId: string,
  data: UpdateCategoryInput
): Promise<CategoryRead> {
  return CategoriesService.updateCategoryApiV1CategoriesCategoryIdPatch({
    categoryId,
    requestBody: data as any,
  })
}

export async function deleteCategory(categoryId: string): Promise<void> {
  return CategoriesService.deleteCategoryApiV1CategoriesCategoryIdDelete({ categoryId })
}
