import { useState } from "react"
import { Box, Container, Heading, Text, Button, Flex } from "@chakra-ui/react"
import { FiPlus } from "react-icons/fi"
import { useAdminCategories } from "../hooks/useAdminCategories"
import { CategoriesTable } from "../components/CategoriesTable"
import { CategoryFormModal } from "../components/CategoryFormModal"
import type { CategoryRead } from "@/client"

export function AdminCategoriesPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryRead | null>(null)
  const { data: categories = [], isLoading } = useAdminCategories(false)

  const handleCreateNew = () => {
    setEditingCategory(null)
    setModalOpen(true)
  }

  const handleEdit = (category: CategoryRead) => {
    setEditingCategory(category)
    setModalOpen(true)
  }

  return (
    <Container maxW="7xl" px={0}>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading as="h1" size="lg" color="gray.900" mb={2}>
            Quản lý danh mục
          </Heading>
          <Text color="gray.600" fontSize="sm">
            Thêm, sửa, xóa danh mục sản phẩm
          </Text>
        </Box>
        <Button colorPalette="blue" onClick={handleCreateNew}>
          <Flex align="center" gap={2}>
            <Box as={FiPlus} w={5} h={5} />
            <span>Thêm danh mục</span>
          </Flex>
        </Button>
      </Flex>

      {/* Table */}
      <Box bg="white" borderRadius="lg" boxShadow="sm" overflow="hidden">
        <CategoriesTable
          categories={categories as CategoryRead[]}
          isLoading={isLoading}
          onEdit={handleEdit}
        />
      </Box>

      {/* Stats */}
      <Text mt={4} fontSize="sm" color="gray.600">
        Tổng: {categories.length} danh mục
      </Text>

      {/* Form Modal */}
      <CategoryFormModal open={modalOpen} onOpenChange={setModalOpen} category={editingCategory} />
    </Container>
  )
}
