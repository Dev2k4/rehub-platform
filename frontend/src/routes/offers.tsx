import { createFileRoute } from "@tanstack/react-router"
import { Flex, Spinner } from "@chakra-ui/react"
import { lazy, Suspense } from "react"

const OffersPage = lazy(() =>
  import("@/features/offers/pages/OffersPage").then((module) => ({
    default: module.OffersPage,
  })),
)

function RouteFallback() {
  return (
    <Flex minH="40vh" align="center" justify="center">
      <Spinner size="md" color="blue.500" />
    </Flex>
  )
}

function OffersRoutePage() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <OffersPage />
    </Suspense>
  )
}

export const Route = createFileRoute("/offers")({
  component: OffersRoutePage,
})
