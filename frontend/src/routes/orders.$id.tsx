import { createFileRoute } from "@tanstack/react-router"
import { Flex, Spinner } from "@chakra-ui/react"
import { lazy, Suspense } from "react"

const OrderDetailPage = lazy(() =>
  import("@/features/orders/pages/OrderDetailPage").then((module) => ({
    default: module.OrderDetailPage,
  })),
)

function RouteFallback() {
  return (
    <Flex minH="50vh" align="center" justify="center">
      <Spinner size="md" color="blue.500" />
    </Flex>
  )
}

function OrdersDetailRoutePage() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <OrderDetailPage />
    </Suspense>
  )
}

export const Route = createFileRoute("/orders/$id")({
  component: OrdersDetailRoutePage,
})
