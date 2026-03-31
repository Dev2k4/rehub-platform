import {
  Badge,
  Box,
  Flex,
  IconButton,
  Spinner,
  Table,
  Text,
} from "@chakra-ui/react"
import { useState } from "react"
import { FiUserCheck, FiUserX } from "react-icons/fi"
import type { UserMe } from "@/client"
import { useUpdateUserStatus } from "../hooks/useAdminUsers"
import { ConfirmDialog } from "./ConfirmDialog"

interface UsersTableProps {
  users: UserMe[]
  isLoading: boolean
}

export function UsersTable({ users, isLoading }: UsersTableProps) {
  const [selectedUser, setSelectedUser] = useState<UserMe | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const updateStatus = useUpdateUserStatus()

  const handleToggleStatus = (user: UserMe) => {
    setSelectedUser(user)
    setConfirmOpen(true)
  }

  const handleConfirm = () => {
    if (!selectedUser) return

    updateStatus.mutate(
      { userId: selectedUser.id, isActive: !selectedUser.is_active },
      {
        onSuccess: () => {
          setConfirmOpen(false)
          setSelectedUser(null)
        },
      },
    )
  }

  if (isLoading) {
    return (
      <Flex justify="center" py={12}>
        <Spinner size="lg" color="blue.500" />
      </Flex>
    )
  }

  if (users.length === 0) {
    return (
      <Flex justify="center" py={12}>
        <Text color="gray.500">Không có người dùng nào</Text>
      </Flex>
    )
  }

  return (
    <>
      <Box overflowX="auto">
        <Table.Root size="md">
          <Table.Header>
            <Table.Row bg="gray.100">
              <Table.ColumnHeader
                px={6}
                py={3}
                fontSize="sm"
                fontWeight="semibold"
                color="gray.900"
              >
                Tên
              </Table.ColumnHeader>
              <Table.ColumnHeader
                px={6}
                py={3}
                fontSize="sm"
                fontWeight="semibold"
                color="gray.900"
              >
                Email
              </Table.ColumnHeader>
              <Table.ColumnHeader
                px={6}
                py={3}
                fontSize="sm"
                fontWeight="semibold"
                color="gray.900"
              >
                Vai trò
              </Table.ColumnHeader>
              <Table.ColumnHeader
                px={6}
                py={3}
                fontSize="sm"
                fontWeight="semibold"
                color="gray.900"
              >
                Trạng thái
              </Table.ColumnHeader>
              <Table.ColumnHeader
                px={6}
                py={3}
                fontSize="sm"
                fontWeight="semibold"
                color="gray.900"
              >
                Điểm tin cậy
              </Table.ColumnHeader>
              <Table.ColumnHeader
                px={6}
                py={3}
                fontSize="sm"
                fontWeight="semibold"
                color="gray.900"
              >
                Hành động
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {users.map((user) => (
              <Table.Row
                key={user.id}
                _hover={{ bg: "gray.50" }}
                transition="all 0.2s"
              >
                <Table.Cell
                  px={6}
                  py={4}
                  fontSize="sm"
                  fontWeight="medium"
                  color="gray.900"
                >
                  {user.full_name}
                </Table.Cell>
                <Table.Cell px={6} py={4} fontSize="sm" color="gray.600">
                  {user.email}
                </Table.Cell>
                <Table.Cell px={6} py={4}>
                  <Badge
                    colorPalette={
                      user.role === "admin"
                        ? "red"
                        : user.role === "moderator"
                          ? "purple"
                          : "blue"
                    }
                    variant="subtle"
                    borderRadius="full"
                    px={3}
                    py={1}
                  >
                    {user.role === "admin"
                      ? "Quản trị viên"
                      : user.role === "moderator"
                        ? "Kiểm duyệt"
                        : "Thành viên"}
                  </Badge>
                </Table.Cell>
                <Table.Cell px={6} py={4}>
                  <Badge
                    colorPalette={user.is_active ? "green" : "red"}
                    variant="subtle"
                    borderRadius="full"
                    px={3}
                    py={1}
                  >
                    {user.is_active ? "Hoạt động" : "Bị cấm"}
                  </Badge>
                </Table.Cell>
                <Table.Cell px={6} py={4} fontSize="sm" color="gray.600">
                  {user.trust_score.toFixed(1)}
                </Table.Cell>
                <Table.Cell px={6} py={4}>
                  <Flex gap={2}>
                    <IconButton
                      aria-label={user.is_active ? "Cấm người dùng" : "Bỏ cấm"}
                      onClick={() => handleToggleStatus(user)}
                      variant="ghost"
                      size="sm"
                      color={user.is_active ? "red.600" : "green.600"}
                      _hover={{ bg: user.is_active ? "red.50" : "green.50" }}
                      title={user.is_active ? "Cấm người dùng" : "Bỏ cấm"}
                    >
                      <Box
                        as={user.is_active ? FiUserX : FiUserCheck}
                        w={5}
                        h={5}
                      />
                    </IconButton>
                  </Flex>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={
          selectedUser?.is_active ? "Cấm người dùng?" : "Bỏ cấm người dùng?"
        }
        description={
          selectedUser?.is_active
            ? `Bạn có chắc muốn cấm người dùng "${selectedUser?.full_name}"?`
            : `Bạn có chắc muốn bỏ cấm người dùng "${selectedUser?.full_name}"?`
        }
        confirmText={selectedUser?.is_active ? "Cấm" : "Bỏ cấm"}
        confirmColorPalette={selectedUser?.is_active ? "red" : "green"}
        onConfirm={handleConfirm}
        isLoading={updateStatus.isPending}
      />
    </>
  )
}
