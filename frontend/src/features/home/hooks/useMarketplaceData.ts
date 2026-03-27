import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import type { CategoryTree, UserPublicProfile } from "@/client"
import { getCategoriesTree, getListings } from "@/features/home/api/marketplace.api"
import { flattenCategories } from "@/features/home/utils/marketplace.utils"
import { getUserPublicProfile } from "@/features/users/api/users.api"

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
    categoriesQuery,
    listingsQuery,
    categoryMap,
    sellerMap,
    flatCategories,
  }
}
