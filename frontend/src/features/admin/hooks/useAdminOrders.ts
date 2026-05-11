import { useQuery } from "@tanstack/react-query"
import type { OrderRead } from "@/client"
import { getAdminOrders } from "../api/admin.orders.api"

export function useAdminOrders(params?: { skip?: number; limit?: number }) {
  return useQuery<OrderRead[]>({
    queryKey: ["admin", "orders", params],
    queryFn: () => getAdminOrders(params),
    staleTime: 2 * 60 * 1000,
  })
}
