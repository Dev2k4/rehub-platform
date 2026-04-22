import type { OrderRead } from "@/client"
import type { EscrowRead } from "@/features/escrow/api/escrow.api"

export type FulfillmentStatus =
  | "created"
  | "awaiting_funding"
  | "funded"
  | "seller_marked_delivered"
  | "buyer_confirmed_received"
  | "disputed"
  | "resolved_refund"
  | "cancelled"

export type OrderWithFulfillment = OrderRead & {
  fulfillment_status?: FulfillmentStatus | null
  seller_marked_delivered_at?: string | null
  buyer_confirmed_received_at?: string | null
}

export function deriveFulfillmentStatus(
  order: OrderWithFulfillment,
  escrow?: EscrowRead | null,
): FulfillmentStatus {
  if (order.fulfillment_status) {
    return order.fulfillment_status
  }

  if (escrow) {
    switch (escrow.status) {
      case "awaiting_funding":
        return "awaiting_funding"
      case "held":
        return "funded"
      case "release_pending":
        return "seller_marked_delivered"
      case "released":
        return "buyer_confirmed_received"
      case "refunded":
        return "resolved_refund"
      case "disputed":
        return "disputed"
      default:
        return "created"
    }
  }

  switch (order.status) {
    case "completed":
      return "buyer_confirmed_received"
    case "cancelled":
      return "cancelled"
    case "disputed":
      return "disputed"
    default:
      return "created"
  }
}

export function fulfillmentStatusMeta(status: FulfillmentStatus): {
  label: string
  color: string
} {
  switch (status) {
    case "created":
      return { label: "Đã tạo đơn", color: "gray" }
    case "awaiting_funding":
      return { label: "Chờ nạp quỹ", color: "yellow" }
    case "funded":
      return { label: "Tiền đang giữ", color: "blue" }
    case "seller_marked_delivered":
      return { label: "Người bán báo đã giao", color: "orange" }
    case "buyer_confirmed_received":
      return { label: "Người mua đã xác nhận", color: "green" }
    case "disputed":
      return { label: "Đang tranh chấp", color: "red" }
    case "resolved_refund":
      return { label: "Đã hoàn tiền", color: "purple" }
    case "cancelled":
      return { label: "Đã hủy", color: "red" }
    default:
      return { label: status, color: "gray" }
  }
}
