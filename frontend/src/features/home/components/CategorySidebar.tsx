import { FiChevronRight } from "react-icons/fi"
import { Box, Heading, Button, VStack, Flex, Text } from "@chakra-ui/react"
import type { CategoryTree } from "@/client"

type CategorySidebarProps = {
  categories: CategoryTree[]
  selectedCategoryId: string
  onSelectCategory: (id: string) => void
}

export function CategorySidebar({ categories, selectedCategoryId, onSelectCategory }: CategorySidebarProps) {
  return (
    <Box as="aside" display={{ base: "none", lg: "block" }} w="260px" flexShrink={0}>
      <Box position="sticky" top="96px" borderRadius="2xl" border="1px" borderColor="gray.200" bg="white" p={6} boxShadow="sm">
        <Heading as="h2" size="md" mb={4} color="gray.900">
          Danh mục
        </Heading>

        <Button
          onClick={() => onSelectCategory("")}
          variant="ghost"
          w="full"
          justifyContent="space-between"
          borderRadius="xl"
          p={3}
          h="auto"
          bg={selectedCategoryId === "" ? "blue.50" : "transparent"}
          _hover={{ bg: selectedCategoryId === "" ? "blue.50" : "gray.50" }}
          transition="all 0.2s"
        >
          <Flex align="center" gap={3}>
            <Text
              fontSize="sm"
              fontWeight="medium"
              color={selectedCategoryId === "" ? "blue.600" : "gray.700"}
              _groupHover={{ color: selectedCategoryId === "" ? "blue.600" : "gray.900" }}
            >
              Đang bán
            </Text>
          </Flex>
          <Box as={FiChevronRight} w={4} h={4} color={selectedCategoryId === "" ? "blue.500" : "gray.400"} />
        </Button>

        <VStack gap={1} mt={1} align="stretch">
          {categories.map((category) => {
            const active = selectedCategoryId === category.id
            return (
              <Button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                variant="ghost"
                w="full"
                justifyContent="space-between"
                borderRadius="xl"
                p={3}
                h="auto"
                bg={active ? "blue.50" : "transparent"}
                _hover={{ bg: active ? "blue.50" : "gray.50" }}
                transition="all 0.2s"
              >
                <Flex align="center" gap={3} flex={1} overflow="hidden">
                  <Text
                    fontSize="sm"
                    fontWeight="medium"
                    color={active ? "blue.600" : "gray.700"}
                    _groupHover={{ color: active ? "blue.600" : "gray.900" }}
                    lineClamp={1}
                  >
                    {category.name}
                  </Text>
                </Flex>
                <Box as={FiChevronRight} w={4} h={4} flexShrink={0} color={active ? "blue.500" : "gray.400"} />
              </Button>
            )
          })}
        </VStack>
      </Box>
    </Box>
  )
}
