import { Box, Container, Heading, Text } from "@chakra-ui/react"
import { PendingListingsTable } from "../components/PendingListingsTable"
import { usePendingListings } from "../hooks/useAdminListings"

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
      <Box
        bg="whiteAlpha.800"
        backdropFilter="blur(20px)"
        border="1px"
        borderColor="whiteAlpha.400"
        borderRadius="lg"
        boxShadow="0 10px 40px rgba(0,0,0,0.06)"
        overflow="hidden"
      >
        <PendingListingsTable listings={listings} isLoading={isLoading} />
      </Box>

      {/* Stats */}
      <Text mt={4} fontSize="sm" color="gray.600">
        Tổng: {listings.length} tin đăng chờ duyệt
      </Text>
    </Container>
  )
}
