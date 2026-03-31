import { Box, Flex, IconButton, Spinner, Table, Text } from "@chakra-ui/react"
import { useState } from "react"
import { FiEdit2, FiTrash2 } from "react-icons/fi"
import type { CategoryRead } from "@/client"
import { useDeleteCategory } from "../hooks/useAdminCategories"
import { ConfirmDialog } from "./ConfirmDialog"

interface CategoriesTableProps {
  categories: CategoryRead[]
  isLoading: boolean
  onEdit: (category: CategoryRead) => void
}

export function CategoriesTable({
  categories,
  isLoading,
  onEdit,
}: CategoriesTableProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryRead | null>(
    null,
  )
  const deleteMutation = useDeleteCategory()

  const handleDelete = (category: CategoryRead) => {
    setSelectedCategory(category)
  }

  const handleConfirmDelete = () => {
    if (!selectedCategory) return

    deleteMutation.mutate(selectedCategory.id, {
      onSuccess: () => {
        setSelectedCategory(null)
      },
    })
  }

  if (isLoading) {
    return (
      <Flex justify="center" py={12}>
        <Spinner size="lg" color="blue.500" />
      </Flex>
    )
  }

  if (categories.length === 0) {
    return (
      <Flex justify="center" py={12}>
        <Text color="gray.500">Chưa có danh mục nào</Text>
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
                Slug
              </Table.ColumnHeader>
              <Table.ColumnHeader
                px={6}
                py={3}
                fontSize="sm"
                fontWeight="semibold"
                color="gray.900"
              >
                Icon URL
              </Table.ColumnHeader>
              <Table.ColumnHeader
                px={6}
                py={3}
                fontSize="sm"
                fontWeight="semibold"
                color="gray.900"
              >
                Ngày tạo
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
            {categories.map((category) => (
              <Table.Row
                key={category.id}
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
                  {category.name}
                </Table.Cell>
                <Table.Cell px={6} py={4} fontSize="sm" color="gray.600">
                  {category.slug || "-"}
                </Table.Cell>
                <Table.Cell
                  px={6}
                  py={4}
                  fontSize="sm"
                  color="gray.600"
                  maxW="200px"
                >
                  <Text lineClamp={1}>{category.icon_url || "-"}</Text>
                </Table.Cell>
                <Table.Cell px={6} py={4} fontSize="sm" color="gray.600">
                  {new Date(category.created_at).toLocaleDateString("vi-VN")}
                </Table.Cell>
                <Table.Cell px={6} py={4}>
                  <Flex gap={2}>
                    <IconButton
                      aria-label="Sửa"
                      onClick={() => onEdit(category)}
                      variant="ghost"
                      size="sm"
                      color="blue.600"
                      _hover={{ bg: "blue.50" }}
                      title="Sửa danh mục"
                    >
                      <Box as={FiEdit2} w={4} h={4} />
                    </IconButton>
                    <IconButton
                      aria-label="Xóa"
                      onClick={() => handleDelete(category)}
                      variant="ghost"
                      size="sm"
                      color="red.600"
                      _hover={{ bg: "red.50" }}
                      title="Xóa danh mục"
                    >
                      <Box as={FiTrash2} w={4} h={4} />
                    </IconButton>
                  </Flex>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>

      <ConfirmDialog
        open={!!selectedCategory}
        onOpenChange={(open) => !open && setSelectedCategory(null)}
        title="Xóa danh mục?"
        description={`Bạn có chắc muốn xóa danh mục "${selectedCategory?.name}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        confirmColorPalette="red"
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}
