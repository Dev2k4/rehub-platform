import { useQuery } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import type { CategoryTree, ConditionGrade, UserPublicProfile } from "@/client"
import {
  getCategoriesTree,
  getListings,
} from "@/features/home/api/marketplace.api"
import { flattenCategories } from "@/features/home/utils/marketplace.utils"
import { getUserPublicProfile } from "@/features/users/api/users.api"

const DEFAULT_LIMIT = 24

export function useMarketplaceData() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
  const [keyword, setKeyword] = useState("")
  const [conditionGrade, setConditionGrade] = useState<ConditionGrade | "">("")
  const [province, setProvince] = useState("")
  const [district, setDistrict] = useState("")
  const [minPrice, setMinPrice] = useState<string>("")
  const [maxPrice, setMaxPrice] = useState<string>("")
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc">(
    "newest",
  )
  const [page, setPage] = useState(1)

  const categoriesQuery = useQuery({
    queryKey: ["categories", "tree"],
    queryFn: () => getCategoriesTree(),
  })

  const listingsQuery = useQuery({
    queryKey: [
      "listings",
      "public",
      selectedCategoryId,
      keyword,
      conditionGrade,
      province,
      district,
      minPrice,
      maxPrice,
      sortBy,
      page,
    ],
    queryFn: () =>
      getListings({
        categoryId: selectedCategoryId || undefined,
        keyword: keyword || undefined,
        conditionGrade: conditionGrade || undefined,
        province: province || undefined,
        district: district || undefined,
        minPrice: minPrice !== "" ? Number(minPrice) : undefined,
        maxPrice: maxPrice !== "" ? Number(maxPrice) : undefined,
        sortBy,
        limit: DEFAULT_LIMIT,
        skip: (page - 1) * DEFAULT_LIMIT,
      }),
  })

  useEffect(() => {
    setPage(1)
  }, [])

  const sellerIds = useMemo(() => {
    const ids = listingsQuery.data?.items.map((item) => item.seller_id) ?? []
    return Array.from(new Set(ids)).sort()
  }, [listingsQuery.data])

  const sellerProfilesQuery = useQuery({
    queryKey: ["seller-profiles", sellerIds],
    enabled: sellerIds.length > 0,
    queryFn: async () => {
      const profiles = await Promise.all(
        sellerIds.map(async (sellerId) => {
          try {
            const profile = await getUserPublicProfile(sellerId)
            return [sellerId, profile] as const
          } catch {
            return [sellerId, null] as const
          }
        }),
      )

      return profiles
    },
  })

  const flatCategories = useMemo(() => {
    const tree = categoriesQuery.data ?? []
    return flattenCategories(tree)
  }, [categoriesQuery.data])

  const categoryMap = useMemo(() => {
    return new Map(flatCategories.map((item: CategoryTree) => [item.id, item]))
  }, [flatCategories])

  const sellerMap = useMemo(() => {
    return new Map<string, UserPublicProfile>(
      (sellerProfilesQuery.data ?? []).filter(
        (entry): entry is [string, UserPublicProfile] => entry[1] !== null,
      ),
    )
  }, [sellerProfilesQuery.data])

  return {
    selectedCategoryId,
    setSelectedCategoryId,
    keyword,
    setKeyword,
    conditionGrade,
    setConditionGrade,
    province,
    setProvince,
    district,
    setDistrict,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    sortBy,
    setSortBy,
    page,
    setPage,
    pageSize: DEFAULT_LIMIT,
    categoriesQuery,
    listingsQuery,
    categoryMap,
    sellerMap,
    flatCategories,
  }
}
