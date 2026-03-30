import { OrdersService } from "@/client"
import type { OrderRead, OrderDirectCreate } from "@/client"

export type CreateOrderInput = OrderDirectCreate & {
  use_escrow?: boolean
}

export async function createOrder(data: CreateOrderInput): Promise<OrderRead> {
  return OrdersService.createDirectOrderApiV1OrdersPost({
    requestBody: data as OrderDirectCreate,
  })
}

export async function getMyOrders(params?: {
  skip?: number
  limit?: number
}): Promise<OrderRead[]> {
  void params
  return OrdersService.getMyOrdersApiV1OrdersMeGet()
}

export async function getOrder(orderId: string): Promise<OrderRead> {
  return OrdersService.getOrderApiV1OrdersOrderIdGet({ orderId })
}

export async function completeOrder(orderId: string): Promise<OrderRead> {
  return OrdersService.completeOrderApiV1OrdersOrderIdCompletePost({ orderId })
}

export async function cancelOrder(orderId: string): Promise<OrderRead> {
  return OrdersService.cancelOrderApiV1OrdersOrderIdCancelPost({ orderId })
}
