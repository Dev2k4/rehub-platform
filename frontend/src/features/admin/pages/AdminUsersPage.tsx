import { Box, Container, Flex, Heading, Input, Text } from "@chakra-ui/react"
import { useState } from "react"
import { UsersTable } from "../components/UsersTable"
import { useAdminUsers } from "../hooks/useAdminUsers"

export function AdminUsersPage() {
  const [searchKeyword, setSearchKeyword] = useState("")
  const { data: users = [], isLoading } = useAdminUsers({ limit: 100 })

  // Simple client-side filter
  const filteredUsers = users.filter((user) => {
    const keyword = searchKeyword.toLowerCase()
    return (
      user.full_name.toLowerCase().includes(keyword) ||
      user.email.toLowerCase().includes(keyword)
    )
  })

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
        <UsersTable users={filteredUsers} isLoading={isLoading} />
      </Box>

      {/* Stats */}
      <Flex gap={4} mt={4} fontSize="sm" color="gray.600">
        <Text>Tổng: {users.length} người dùng</Text>
        <Text>Hiển thị: {filteredUsers.length}</Text>
      </Flex>
    </Container>
  )
}
