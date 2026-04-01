import type { OrderRead } from "@/client"
import { AdminService } from "@/client"

export async function getAdminOrders(params?: {
  skip?: number
  limit?: number
}): Promise<OrderRead[]> {
  return AdminService.listOrdersForAdminApiV1AdminOrdersGet(
    params || {},
  ) as Promise<OrderRead[]>
}
