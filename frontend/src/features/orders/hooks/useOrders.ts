import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  getMyOrders,
  getOrder,
  completeOrder,
  cancelOrder,
} from "@/features/orders/api/orders.api"
import type { OrderRead } from "@/client"

export function useMyOrders() {
  return useQuery<OrderRead[]>({
    queryKey: ["orders", "me"],
    queryFn: () => getMyOrders(),
  })
}

export function useOrder(orderId: string) {
  return useQuery<OrderRead>({
    queryKey: ["orders", orderId],
    queryFn: () => getOrder(orderId),
    enabled: !!orderId,
  })
}

export function useCompleteOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderId: string) => completeOrder(orderId),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: ["orders", "me"] })
      queryClient.invalidateQueries({ queryKey: ["orders", orderId] })
    },
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderId: string) => cancelOrder(orderId),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: ["orders", "me"] })
      queryClient.invalidateQueries({ queryKey: ["orders", orderId] })
    },
  })
}
