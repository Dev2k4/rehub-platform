import {
  Box,
  Button,
  CloseButton,
  Drawer,
  Flex,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useNavigate } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { FiBell, FiChevronRight, FiList, FiUser } from "react-icons/fi"
import type { CategoryTree } from "@/client"
import { useAuthUser } from "@/features/auth/hooks/useAuthUser"

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
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthUser()

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
    <Drawer.Root
      open={open}
      onOpenChange={(e) => !e.open && onClose()}
      placement="start"
    >
      <Portal>
        <Drawer.Backdrop
          bg="blackAlpha.600"
          backdropFilter="blur(4px)"
          display={{ base: "block", lg: "none" }}
        />
        <Drawer.Positioner display={{ base: "flex", lg: "none" }}>
          <Drawer.Content
            maxW="280px"
            w="80vw"
            h="full"
            bg="white"
            boxShadow="2xl"
          >
            <Drawer.Header
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              borderBottom="1px"
              borderColor="gray.200"
              px={5}
              py={4}
            >
              <Drawer.Title
                fontSize="md"
                fontWeight="semibold"
                color="gray.900"
              >
                Danh mục
              </Drawer.Title>
              <Drawer.CloseTrigger
                asChild
                position="relative"
                top="auto"
                right="auto"
              >
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
                  _hover={{
                    bg: selectedCategoryId === "" ? "blue.50" : "gray.50",
                  }}
                  transition="all 0.2s"
                >
                  <span>Tất cả danh mục</span>
                  <Box
                    as={FiChevronRight}
                    w={4}
                    h={4}
                    color={selectedCategoryId === "" ? "blue.500" : "gray.400"}
                  />
                </Button>

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
                            return
                          }
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
                        <Box
                          as={FiChevronRight}
                          w={4}
                          h={4}
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
                                onClick={() => {
                                  onSelectCategory(child.id)
                                  onClose()
                                }}
                                variant="ghost"
                                w="full"
                                justifyContent="space-between"
                                borderRadius="lg"
                                px={3}
                                py={2}
                                h="auto"
                                bg={activeChild ? "blue.50" : "transparent"}
                                color={activeChild ? "blue.600" : "gray.600"}
                                fontSize="sm"
                                _hover={{
                                  bg: activeChild ? "blue.50" : "gray.50",
                                }}
                              >
                                <Text lineClamp={1}>{child.name}</Text>
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
                      <Box
                        position="absolute"
                        right={0}
                        top={0}
                        w="1.5"
                        h="1.5"
                        borderRadius="full"
                        bg="red.500"
                      />
                    </Box>
                    <Text flex={1} textAlign="left">
                      Thông báo
                    </Text>
                  </Flex>
                </Button>

                {isAuthenticated ? (
                  <>
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
                      onClick={() => {
                        navigate({ to: "/profile" })
                        onClose()
                      }}
                    >
                      <Flex align="center" gap={3} w="full">
                        <Box as={FiUser} w={5} h={5} />
                        <Text flex={1} textAlign="left">
                          Hồ sơ
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
                      onClick={() => {
                        navigate({ to: "/my-listings" })
                        onClose()
                      }}
                    >
                      <Flex align="center" gap={3} w="full">
                        <Box as={FiList} w={5} h={5} />
                        <Text flex={1} textAlign="left">
                          Tin đăng của tôi
                        </Text>
                      </Flex>
                    </Button>
                  </>
                ) : (
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
                    onClick={() => {
                      navigate({ to: "/auth/login" })
                      onClose()
                    }}
                  >
                    <Flex align="center" gap={3} w="full">
                      <Box as={FiUser} w={5} h={5} />
                      <Text flex={1} textAlign="left">
                        Đăng nhập
                      </Text>
                    </Flex>
                  </Button>
                )}
              </VStack>
            </Box>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  )
}
