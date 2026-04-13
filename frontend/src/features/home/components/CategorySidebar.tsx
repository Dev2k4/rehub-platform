import { Box, Button, Flex, Heading, Text, VStack } from "@chakra-ui/react"
import { useMemo, useState } from "react"
import { FiChevronRight } from "react-icons/fi"
import type { CategoryTree } from "@/client"

type CategorySidebarProps = {
  categories: CategoryTree[]
  selectedCategoryId: string
  onSelectCategory: (id: string) => void
}

export function CategorySidebar({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategorySidebarProps) {
  const rootByCategoryId = useMemo(() => {
    const map = new Map<string, string>()
    for (const root of categories) {
      map.set(root.id, root.id)
      for (const child of root.children ?? []) {
        map.set(child.id, root.id)
      }
    }
    return map
  }, [categories])

  const [expandedRootId, setExpandedRootId] = useState<string | null>(null)
  const activeRootId =
    rootByCategoryId.get(selectedCategoryId) ?? expandedRootId ?? null

  const toggleRoot = (rootId: string) => {
    setExpandedRootId((current) => (current === rootId ? null : rootId))
  }

  return (
    <Box
      as="aside"
      display={{ base: "none", lg: "block" }}
      w="260px"
      flexShrink={0}
    >
      <Box
        position="sticky"
        top="96px"
        borderRadius="2xl"
        border="1px"
        borderColor="whiteAlpha.400"
        bg="whiteAlpha.800"
        backdropFilter="blur(16px)"
        p={6}
        boxShadow="0 10px 40px rgba(0,0,0,0.06)"
      >
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
          _hover={{
            bg: selectedCategoryId === "" ? "blue.50" : "whiteAlpha.600",
          }}
          transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
        >
          <Flex align="center" gap={3}>
            <Text
              fontSize="sm"
              fontWeight="medium"
              color={selectedCategoryId === "" ? "blue.600" : "gray.700"}
              _groupHover={{
                color: selectedCategoryId === "" ? "blue.600" : "gray.900",
              }}
            >
              Tất cả danh mục
            </Text>
          </Flex>
          <Box
            as={FiChevronRight}
            w={4}
            h={4}
            color={selectedCategoryId === "" ? "blue.500" : "gray.400"}
          />
        </Button>

        <VStack gap={1} mt={1} align="stretch">
          {categories.map((category) => {
            const active = selectedCategoryId === category.id
            const hasChildren = (category.children?.length ?? 0) > 0
            const isExpanded = activeRootId === category.id

            return (
              <Box key={category.id}>
                <Button
                  onClick={() => {
                    onSelectCategory(category.id)
                    if (hasChildren) {
                      toggleRoot(category.id)
                    }
                  }}
                  variant="ghost"
                  w="full"
                  justifyContent="space-between"
                  borderRadius="xl"
                  p={3}
                  h="auto"
                  bg={active ? "blue.50" : "transparent"}
                  _hover={{ bg: active ? "blue.50" : "whiteAlpha.600" }}
                  transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                >
                  <Flex align="center" gap={3} flex={1} overflow="hidden">
                    <Text
                      fontSize="sm"
                      fontWeight="medium"
                      color={active ? "blue.600" : "gray.700"}
                      lineClamp={1}
                    >
                      {category.name}
                    </Text>
                  </Flex>
                  <Box
                    as={FiChevronRight}
                    w={4}
                    h={4}
                    flexShrink={0}
                    color={active ? "blue.500" : "gray.400"}
                    transform={
                      hasChildren && isExpanded ? "rotate(90deg)" : "none"
                    }
                    transition="transform 0.2s ease"
                  />
                </Button>

                {hasChildren && isExpanded ? (
                  <VStack align="stretch" gap={1} mt={1} pl={4}>
                    {category.children?.map((child) => {
                      const activeChild = selectedCategoryId === child.id
                      return (
                        <Button
                          key={child.id}
                          onClick={() => onSelectCategory(child.id)}
                          variant="ghost"
                          w="full"
                          justifyContent="space-between"
                          borderRadius="lg"
                          p={2.5}
                          h="auto"
                          bg={activeChild ? "blue.50" : "transparent"}
                          _hover={{ bg: activeChild ? "blue.50" : "gray.50" }}
                        >
                          <Text
                            fontSize="sm"
                            color={activeChild ? "blue.600" : "gray.600"}
                            lineClamp={1}
                          >
                            {child.name}
                          </Text>
                          <Box
                            as={FiChevronRight}
                            w={3.5}
                            h={3.5}
                            color={activeChild ? "blue.500" : "gray.400"}
                          />
                        </Button>
                      )
                    })}
                  </VStack>
                ) : null}
              </Box>
            )
          })}
        </VStack>
      </Box>
    </Box>
  )
}
