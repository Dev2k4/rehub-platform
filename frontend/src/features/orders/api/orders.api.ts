import { OrdersService } from "@/client"
import type { OrderRead, OrderDirectCreate } from "@/client"

export async function createOrder(data: OrderDirectCreate): Promise<OrderRead> {
  return OrdersService.createDirectOrderApiV1OrdersPost({
    requestBody: data,
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
