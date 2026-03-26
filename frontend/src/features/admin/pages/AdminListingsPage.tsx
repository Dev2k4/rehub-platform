import { Box, Container, Heading, Text } from "@chakra-ui/react"
import { usePendingListings } from "../hooks/useAdminListings"
import { PendingListingsTable } from "../components/PendingListingsTable"

export function AdminListingsPage() {
  const { data: listings = [], isLoading } = usePendingListings({ limit: 100 })

  return (
    <Container maxW="7xl" px={0}>
      <Box mb={6}>
        <Heading as="h1" size="lg" color="gray.900" mb={2}>
          Phê duyệt tin đăng
        </Heading>
        <Text color="gray.600" fontSize="sm">
          Danh sách tin đăng chờ phê duyệt
        </Text>
      </Box>

      {/* Table */}
      <Box bg="white" borderRadius="lg" boxShadow="sm" overflow="hidden">
        <PendingListingsTable listings={listings} isLoading={isLoading} />
      </Box>

      {/* Stats */}
      <Text mt={4} fontSize="sm" color="gray.600">
        Tổng: {listings.length} tin đăng chờ duyệt
      </Text>
    </Container>
  )
}
