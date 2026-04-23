import { createFileRoute } from "@tanstack/react-router"
import { Flex, Spinner } from "@chakra-ui/react"
import { lazy, Suspense } from "react"

const AdminListingsPage = lazy(() =>
  import("@/features/admin/pages/AdminListingsPage").then((module) => ({
    default: module.AdminListingsPage,
  })),
)

function RouteFallback() {
  return (
    <Flex minH="40vh" align="center" justify="center">
      <Spinner size="md" color="blue.500" />
    </Flex>
  )
}

function AdminListingsRoutePage() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <AdminListingsPage />
    </Suspense>
  )
}

export const Route = createFileRoute("/admin/listings")({
  component: AdminListingsRoutePage,
})
