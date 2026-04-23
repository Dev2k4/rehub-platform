import { createFileRoute } from "@tanstack/react-router"
import { Flex, Spinner } from "@chakra-ui/react"
import { lazy, Suspense } from "react"

const OrdersPage = lazy(() =>
  import("@/features/orders/pages/OrdersPage").then((module) => ({
    default: module.OrdersPage,
  })),
)

function RouteFallback() {
  return (
    <Flex minH="40vh" align="center" justify="center">
      <Spinner size="md" color="blue.500" />
    </Flex>
  )
}

function OrdersIndexRoutePage() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <OrdersPage />
    </Suspense>
  )
}

export const Route = createFileRoute("/orders/")({
  component: OrdersIndexRoutePage,
})
