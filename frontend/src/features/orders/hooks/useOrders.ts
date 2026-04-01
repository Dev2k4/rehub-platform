import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { OrderRead } from "@/client"
import {
  cancelOrder,
  completeOrder,
  getMyOrders,
  getOrder,
} from "@/features/orders/api/orders.api"

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
    onSuccess: (updatedOrder, orderId) => {
      queryClient.setQueryData<OrderRead>(["orders", orderId], updatedOrder)
      queryClient.setQueryData<OrderRead[]>(["orders", "me"], (old) => {
        if (!old) {
          return old
        }
        return old.map((item) => (item.id === updatedOrder.id ? updatedOrder : item))
      })
      queryClient.invalidateQueries({ queryKey: ["orders", "me"] })
      queryClient.invalidateQueries({ queryKey: ["orders", orderId] })
    },
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderId: string) => cancelOrder(orderId),
    onSuccess: (updatedOrder, orderId) => {
      queryClient.setQueryData<OrderRead>(["orders", orderId], updatedOrder)
      queryClient.setQueryData<OrderRead[]>(["orders", "me"], (old) => {
        if (!old) {
          return old
        }
        return old.map((item) => (item.id === updatedOrder.id ? updatedOrder : item))
      })
      queryClient.invalidateQueries({ queryKey: ["orders", "me"] })
      queryClient.invalidateQueries({ queryKey: ["orders", orderId] })
    },
  })
}
