import { useState } from "react";
import { Box, Container, Heading, Text, Flex, HStack } from "@chakra-ui/react";
import { PendingListingsTable } from "../components/PendingListingsTable";
import { usePendingListings } from "../hooks/useAdminListings";
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination";

export function AdminListingsPage() {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const { data: listings = [], isLoading } = usePendingListings({ limit: 100 });

  const paginatedListings = listings.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

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
        <PendingListingsTable
          listings={paginatedListings}
          isLoading={isLoading}
        />
      </Box>

      {/* Stats and Pagination */}
      <Flex
        justify="space-between"
        align="center"
        mt={4}
        flexDirection={{ base: "column", sm: "row" }}
        gap={4}
      >
        <Text fontSize="sm" color="gray.600">
          Tổng: {listings.length} tin đăng chờ duyệt
        </Text>

        <PaginationRoot
          count={listings.length}
          pageSize={pageSize}
          page={page}
          onPageChange={(e) => setPage(e.page)}
          siblingCount={1}
        >
          <HStack gap={2}>
            <PaginationPrevTrigger />
            <PaginationItems />
            <PaginationNextTrigger />
          </HStack>
        </PaginationRoot>
      </Flex>
    </Container>
  );
}
