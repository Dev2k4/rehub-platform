import { createFileRoute } from "@tanstack/react-router"
import { Flex, Spinner } from "@chakra-ui/react"
import { lazy, Suspense } from "react"

const ListingDetailPage = lazy(() =>
  import("@/features/listings/pages/ListingDetailPage").then((module) => ({
    default: module.ListingDetailPage,
  })),
)

function RouteFallback() {
  return (
    <Flex minH="60vh" align="center" justify="center">
      <Spinner size="lg" color="blue.500" />
    </Flex>
  )
}

function ListingsDetailRoutePage() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <ListingDetailPage />
    </Suspense>
  )
}

export const Route = createFileRoute("/listings/$id")({
  component: ListingsDetailRoutePage,
})
