import { FiBell, FiUser, FiChevronRight } from "react-icons/fi"
import { Drawer, Portal, Box, Button, CloseButton, VStack, Flex, Text } from "@chakra-ui/react"
import type { CategoryTree } from "@/client"

type CategoryOverlayProps = {
  open: boolean
  categories: CategoryTree[]
  selectedCategoryId: string
  onClose: () => void
  onSelectCategory: (id: string) => void
}

export function CategoryOverlay({
  open,
  categories,
  selectedCategoryId,
  onClose,
  onSelectCategory,
}: CategoryOverlayProps) {
  return (
    <Drawer.Root open={open} onOpenChange={(e) => !e.open && onClose()} placement="start">
      <Portal>
        <Drawer.Backdrop bg="blackAlpha.600" backdropFilter="blur(4px)" display={{ base: "block", lg: "none" }} />
        <Drawer.Positioner display={{ base: "flex", lg: "none" }}>
          <Drawer.Content maxW="280px" w="80vw" h="full" bg="white" boxShadow="2xl">
            <Drawer.Header
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              borderBottom="1px"
              borderColor="gray.200"
              px={5}
              py={4}
            >
              <Drawer.Title fontSize="md" fontWeight="semibold" color="gray.900">
                Danh mục
              </Drawer.Title>
              <Drawer.CloseTrigger asChild position="relative" top="auto" right="auto">
                <CloseButton size="sm" />
              </Drawer.CloseTrigger>
            </Drawer.Header>

            {/* Category List */}
            <Drawer.Body flex={1} overflowY="auto" p={4}>
              <VStack gap={1} align="stretch">
                <Button
                  onClick={() => {
                    onSelectCategory("")
                    onClose()
                  }}
                  variant="ghost"
                  w="full"
                  justifyContent="space-between"
                  borderRadius="xl"
                  px={3}
                  py={2.5}
                  h="auto"
                  bg={selectedCategoryId === "" ? "blue.50" : "transparent"}
                  color={selectedCategoryId === "" ? "blue.600" : "gray.700"}
                  fontSize="sm"
                  fontWeight="medium"
                  _hover={{ bg: selectedCategoryId === "" ? "blue.50" : "gray.50" }}
                  transition="all 0.2s"
                >
                  <span>Tất cả ngành hàng</span>
                  <Box as={FiChevronRight} w={4} h={4} color={selectedCategoryId === "" ? "blue.500" : "gray.400"} />
                </Button>

                {categories.map((category) => {
                  const active = selectedCategoryId === category.id
                  return (
                    <Button
                      key={category.id}
                      onClick={() => {
                        onSelectCategory(category.id)
                        onClose()
                      }}
                      variant="ghost"
                      w="full"
                      justifyContent="space-between"
                      borderRadius="xl"
                      px={3}
                      py={2.5}
                      h="auto"
                      bg={active ? "blue.50" : "transparent"}
                      color={active ? "blue.600" : "gray.700"}
                      fontSize="sm"
                      fontWeight="medium"
                      _hover={{ bg: active ? "blue.50" : "gray.50" }}
                      transition="all 0.2s"
                    >
                      <Text lineClamp={1}>{category.name}</Text>
                      <Box as={FiChevronRight} w={4} h={4} color={active ? "blue.500" : "gray.400"} />
                    </Button>
                  )
                })}
              </VStack>
            </Drawer.Body>

            {/* Bottom Actions for Mobile */}
            <Box borderTop="1px" borderColor="gray.200" p={4}>
              <VStack gap={1} align="stretch">
                <Button
                  variant="ghost"
                  w="full"
                  justifyContent="flex-start"
                  borderRadius="xl"
                  px={3}
                  py={2.5}
                  h="auto"
                  fontSize="sm"
                  fontWeight="medium"
                  color="gray.700"
                  _hover={{ bg: "gray.50" }}
                  transition="all 0.2s"
                >
                  <Flex align="center" gap={3} w="full">
                    <Box position="relative">
                      <Box as={FiBell} w={5} h={5} />
                      <Box position="absolute" right={0} top={0} w="1.5" h="1.5" borderRadius="full" bg="red.500" />
                    </Box>
                    <Text flex={1} textAlign="left">
                      Thông báo
                    </Text>
                  </Flex>
                </Button>

                <Button
                  variant="ghost"
                  w="full"
                  justifyContent="flex-start"
                  borderRadius="xl"
                  px={3}
                  py={2.5}
                  h="auto"
                  fontSize="sm"
                  fontWeight="medium"
                  color="gray.700"
                  _hover={{ bg: "gray.50" }}
                  transition="all 0.2s"
                >
                  <Flex align="center" gap={3} w="full">
                    <Box as={FiUser} w={5} h={5} />
                    <Text flex={1} textAlign="left">
                      Tài khoản cá nhân
                    </Text>
                  </Flex>
                </Button>
              </VStack>
            </Box>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  )
}
