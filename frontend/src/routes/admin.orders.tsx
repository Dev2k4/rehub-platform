import { createFileRoute } from "@tanstack/react-router"
import { Flex, Spinner } from "@chakra-ui/react"
import { lazy, Suspense } from "react"

const AdminOrdersPage = lazy(() =>
  import("@/features/admin/pages/AdminOrdersPage").then((module) => ({
    default: module.AdminOrdersPage,
  })),
)

function RouteFallback() {
  return (
    <Flex minH="40vh" align="center" justify="center">
      <Spinner size="md" color="blue.500" />
    </Flex>
  )
}

function AdminOrdersRoutePage() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <AdminOrdersPage />
    </Suspense>
  )
}

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrdersRoutePage,
})
