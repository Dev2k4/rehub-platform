import { createFileRoute } from "@tanstack/react-router"
import { OrderDetailPage } from "@/features/orders/pages/OrderDetailPage"

export const Route = createFileRoute("/orders/$id")({
  component: OrderDetailPage,
})
