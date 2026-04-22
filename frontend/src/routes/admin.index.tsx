import { createFileRoute } from "@tanstack/react-router"
import { Flex, Spinner } from "@chakra-ui/react"
import { lazy, Suspense } from "react"

const AdminDashboardPage = lazy(() =>
  import("@/features/admin/pages/AdminDashboardPage").then((module) => ({
    default: module.AdminDashboardPage,
  })),
)

function RouteFallback() {
  return (
    <Flex minH="50vh" align="center" justify="center">
      <Spinner size="md" color="blue.500" />
    </Flex>
  )
}

function AdminIndexRoutePage() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <AdminDashboardPage />
    </Suspense>
  )
}

export const Route = createFileRoute("/admin/")({
  component: AdminIndexRoutePage,
})
