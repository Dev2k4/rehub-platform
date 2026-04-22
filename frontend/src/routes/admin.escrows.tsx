import { createFileRoute } from "@tanstack/react-router"
import { Flex, Spinner } from "@chakra-ui/react"
import { lazy, Suspense } from "react"

const AdminEscrowsPage = lazy(() =>
  import("@/features/admin/pages/AdminEscrowsPage").then((module) => ({
    default: module.AdminEscrowsPage,
  })),
)

function RouteFallback() {
  return (
    <Flex minH="40vh" align="center" justify="center">
      <Spinner size="md" color="blue.500" />
    </Flex>
  )
}

function AdminEscrowsRoutePage() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <AdminEscrowsPage />
    </Suspense>
  )
}

export const Route = createFileRoute("/admin/escrows")({
  component: AdminEscrowsRoutePage,
})
