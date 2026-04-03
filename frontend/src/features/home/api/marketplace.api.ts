import {
  CategoriesService,
  type CategoryRead,
  type CategoryTree,
  type ConditionGrade,
  ListingsService,
  type ListingWithImages,
} from "@/client"

export type CategoryNode = CategoryRead | CategoryTree

export type ListingsQueryParams = {
  keyword?: string
  categoryId?: string
  conditionGrade?: ConditionGrade
  province?: string
  district?: string
  skip?: number
  limit?: number
  minPrice?: number
  maxPrice?: number
  sortBy?: "newest" | "price_asc" | "price_desc"
}

export async function getCategoriesTree(): Promise<CategoryTree[]> {
  const response = await CategoriesService.getCategoriesApiV1CategoriesGet({
    asTree: true,
  })

  if (!Array.isArray(response) || response.length === 0) {
    return []
  }

  const first = response[0] as CategoryNode
  if ("children" in first) {
    return response as CategoryTree[]
  }

  // Backend may return a flat list when tree mode is unsupported.
  const flat = response as CategoryRead[]
  return flat.map((item) => ({ ...item, children: [] }))
}

export async function getListings(params: ListingsQueryParams = {}): Promise<{
  items: ListingWithImages[]
  total: number
}> {
  const response = await ListingsService.listListingsApiV1ListingsGet({
    keyword: params.keyword,
    categoryId: params.categoryId,
    conditionGrade: params.conditionGrade,
    province: params.province,
    district: params.district,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    sortBy: params.sortBy,
    skip: params.skip,
    limit: params.limit,
  })

  return {
    items: response.items,
    total: response.total,
  }
}
