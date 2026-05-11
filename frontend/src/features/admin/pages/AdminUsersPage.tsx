import {
  Box,
  Container,
  Flex,
  Heading,
  HStack,
  Input,
  Text,
} from "@chakra-ui/react"
import { useState } from "react"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination"
import { UsersTable } from "../components/UsersTable"
import { useAdminUsers } from "../hooks/useAdminUsers"

export function AdminUsersPage() {
  const [searchKeyword, setSearchKeyword] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 10
  const { data: users = [], isLoading } = useAdminUsers({ limit: 100 })

  // Simple client-side filter
  const filteredUsers = users.filter((user) => {
    const keyword = searchKeyword.toLowerCase()
    return (
      user.full_name.toLowerCase().includes(keyword) ||
      user.email.toLowerCase().includes(keyword)
    )
  })

  // Pagination processing
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * pageSize,
    page * pageSize,
  )

  return (
    <Container maxW="7xl" px={0}>
      <Box mb={6}>
        <Heading as="h1" size="lg" color="gray.900" mb={2}>
          Quản lý người dùng
        </Heading>
        <Text color="gray.600" fontSize="sm">
          Quản lý tài khoản người dùng, cấm/bỏ cấm
        </Text>
      </Box>

      {/* Search */}
      <Box
        bg="whiteAlpha.800"
        backdropFilter="blur(20px)"
        border="1px"
        borderColor="whiteAlpha.400"
        borderRadius="lg"
        boxShadow="0 4px 20px rgba(0,0,0,0.05)"
        p={4}
        mb={6}
      >
        <Input
          placeholder="Tìm kiếm theo tên hoặc email..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          size="md"
        />
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
        <UsersTable users={paginatedUsers} isLoading={isLoading} />
      </Box>

      {/* Stats and Pagination */}
      <Flex
        justify="space-between"
        align="center"
        mt={4}
        flexDirection={{ base: "column", sm: "row" }}
        gap={4}
      >
        <Flex gap={4} fontSize="sm" color="gray.600">
          <Text>Tổng: {users.length} người dùng</Text>
          <Text>Tìm thấy: {filteredUsers.length}</Text>
        </Flex>

        <PaginationRoot
          count={filteredUsers.length}
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
  )
}
