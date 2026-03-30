import { CategoriesService, OpenAPI } from "@/client"
import type { CategoryRead, CategoryTree } from "@/client"
import { getAccessToken } from "@/features/auth/utils/auth.storage"

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
  const base = OpenAPI.BASE.replace(/\/+$/, "")
  const token = getAccessToken()

  const response = await fetch(`${base}/api/v1/categories/${categoryId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const detail = payload?.detail ?? "Không thể cập nhật danh mục"
    throw new Error(typeof detail === "string" ? detail : "Không thể cập nhật danh mục")
  }

  return response.json() as Promise<CategoryRead>
}

export async function deleteCategory(categoryId: string): Promise<void> {
  return CategoriesService.deleteCategoryApiV1CategoriesCategoryIdDelete({ categoryId })
}
