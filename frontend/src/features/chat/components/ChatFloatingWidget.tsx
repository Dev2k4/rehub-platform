import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Input,
  Spinner,
  Text,
  useBreakpointValue,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { FiMessageCircle, FiMinimize2, FiSend, FiX } from "react-icons/fi"
import { Avatar } from "@/components/ui/avatar"
import { toaster } from "@/components/ui/toaster"
import { useAuthUser } from "@/features/auth/hooks/useAuthUser"
import {
  createOrGetConversation,
  listConversationMessages,
  listMyConversations,
  markConversationRead,
  sendChatMessage,
} from "@/features/chat/api/chat.api"
import { onChatWidgetOpenRequest } from "@/features/chat/chat-widget.events"
import {
  formatCurrencyVnd,
  getListingImageUrl,
} from "@/features/home/utils/marketplace.utils"
import { wsClient } from "@/features/shared/realtime/ws.client"
import { useIsUserOnline } from "@/features/shared/realtime/ws.provider"
import { getUserPublicProfile } from "@/features/users/api/users.api"

function extractListingIdFromText(text: string): string | null {
  const trimmed = text.trim()
  if (!trimmed) {
    return null
  }

  const pathMatch = trimmed.match(/\/listings\/([0-9a-fA-F-]{36})/)
  if (pathMatch?.[1]) {
    return pathMatch[1]
  }

  try {
    const parsed = new URL(trimmed)
    const urlMatch = parsed.pathname.match(/\/listings\/([0-9a-fA-F-]{36})/)
    return urlMatch?.[1] ?? null
  } catch {
    return null
  }
}

function ListingSharedCard({
  listing,
  onOpen,
}: {
  listing: {
    id: string
    title: string
    price: string | number
    image_url?: string | null
  }
  onOpen: () => void
}) {
  return (
    <Box
      role="button"
      onClick={onOpen}
      border="1px solid"
      borderColor="gray.200"
      borderRadius="md"
      bg="white"
      overflow="hidden"
      maxW="260px"
      _hover={{ borderColor: "blue.300", boxShadow: "sm" }}
    >
      {listing.image_url ? (
        <Box h="120px" bg="gray.50">
          <img
            src={getListingImageUrl(listing.image_url)}
            alt={listing.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Box>
      ) : (
        <Flex h="120px" align="center" justify="center" bg="gray.50">
          <Text fontSize="xs" color="gray.500">
            Khong co hinh
          </Text>
        </Flex>
      )}
      <Box p={2.5}>
        <Text fontSize="sm" fontWeight="semibold" lineClamp={2}>
          {listing.title}
        </Text>
        <Text fontSize="xs" color="blue.700" mt={1}>
          {formatCurrencyVnd(listing.price)}
        </Text>
      </Box>
    </Box>
  )
}

function ConversationItem({
  conversation,
  currentUserId,
  selected,
  onSelect,
}: {
  conversation: {
    id: string
    participant_a_id: string
    participant_b_id: string
    unread_count: number
    last_message_at?: string | null
  }
  currentUserId: string
  selected: boolean
  onSelect: () => void
}) {
  const peerId =
    conversation.participant_a_id === currentUserId
      ? conversation.participant_b_id
      : conversation.participant_a_id

  const profileQuery = useQuery({
    queryKey: ["user-public", peerId],
    queryFn: () => getUserPublicProfile(peerId),
    staleTime: 5 * 60 * 1000,
  })

  const displayName =
    profileQuery.data?.full_name ?? `User ${peerId.slice(0, 6)}`
  const avatarUrl = profileQuery.data?.avatar_url ?? undefined
  const isOnline = useIsUserOnline(peerId)

  return (
    <Button
      key={conversation.id}
      justifyContent="start"
      h="auto"
      py={2}
      px={2}
      borderRadius="md"
      variant={selected ? "subtle" : "ghost"}
      colorPalette={selected ? "blue" : "gray"}
      onClick={onSelect}
    >
      <HStack w="full" align="center" gap={2}>
        <Box position="relative">
          <Avatar name={displayName} src={avatarUrl} size="sm" />
          <Box
            position="absolute"
            right={0}
            bottom={0}
            w={2.5}
            h={2.5}
            borderRadius="full"
            bg={isOnline ? "green.400" : "gray.300"}
            border="2px solid"
            borderColor="white"
          />
        </Box>
        <VStack align="start" gap={0} flex={1} minW={0}>
          <Text fontSize="sm" fontWeight="semibold" truncate maxW="100%">
            {displayName}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {conversation.last_message_at
              ? new Date(conversation.last_message_at).toLocaleTimeString(
                  "vi-VN",
                )
              : "Chua co tin"}
          </Text>
        </VStack>
        {conversation.unread_count > 0 && (
          <Badge colorPalette="red" borderRadius="full" px={1.5}>
            {conversation.unread_count > 99 ? "99+" : conversation.unread_count}
          </Badge>
        )}
      </HStack>
    </Button>
  )
}

export function ChatFloatingWidget() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? false
  const { user, isAuthenticated, isLoading: authLoading } = useAuthUser()

  const [isOpen, setIsOpen] = useState(false)
  const [isPanelMounted, setIsPanelMounted] = useState(false)
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null)
  const [messageInput, setMessageInput] = useState("")
  const [pendingListingShareId, setPendingListingShareId] = useState<
    string | null
  >(null)
  const closeTimerRef = useRef<number | null>(null)
  const messagesScrollRef = useRef<HTMLDivElement | null>(null)

  const openWidget = useCallback(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setIsPanelMounted(true)
    window.requestAnimationFrame(() => setIsOpen(true))
  }, [])

  const closeWidget = useCallback(() => {
    setIsOpen(false)
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
    }
    closeTimerRef.current = window.setTimeout(() => {
      setIsPanelMounted(false)
      closeTimerRef.current = null
    }, 220)
  }, [])

  const scrollMessagesToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      const container = messagesScrollRef.current
      if (!container) {
        return
      }
      container.scrollTo({ top: container.scrollHeight, behavior })
    },
    [],
  )

  const conversationsQuery = useQuery({
    queryKey: ["chat", "conversations"],
    queryFn: listMyConversations,
    enabled: isAuthenticated,
  })

  const selectedConversation = useMemo(
    () =>
      conversationsQuery.data?.find(
        (item) => item.id === selectedConversationId,
      ) ?? null,
    [conversationsQuery.data, selectedConversationId],
  )

  const unreadCount = useMemo(() => {
    if (!conversationsQuery.data || isOpen) {
      return 0
    }
    return conversationsQuery.data.reduce(
      (acc, item) => acc + (item.unread_count ?? 0),
      0,
    )
  }, [conversationsQuery.data, isOpen])

  const messagesQuery = useQuery({
    queryKey: ["chat", "messages", selectedConversationId],
    queryFn: () =>
      listConversationMessages(selectedConversationId!, { skip: 0, limit: 50 }),
    enabled: isAuthenticated && isOpen && !!selectedConversationId,
    refetchInterval: isOpen ? 12000 : false,
  })

  const openConversationMutation = useMutation({
    mutationFn: createOrGetConversation,
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] })
      setSelectedConversationId(conversation.id)
      openWidget()
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Khong the tao cuoc tro chuyen"
      toaster.create({ title: message, type: "error" })
    },
  })

  const sendMessageMutation = useMutation({
    mutationFn: async (
      payload:
        | { message_type: "text"; content: string }
        | {
            message_type: "listing_share"
            listing_id: string
            content?: string
          },
    ) => {
      if (!selectedConversationId) {
        throw new Error("Chua chon cuoc tro chuyen")
      }
      return sendChatMessage(selectedConversationId, payload)
    },
    onSuccess: () => {
      setMessageInput("")
      queryClient.invalidateQueries({
        queryKey: ["chat", "messages", selectedConversationId],
      })
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] })
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Khong the gui tin nhan"
      toaster.create({ title: message, type: "error" })
    },
  })

  const markReadMutation = useMutation({
    mutationFn: markConversationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] })
    },
  })

  useEffect(() => {
    const off = onChatWidgetOpenRequest((payload) => {
      if (!isAuthenticated) {
        toaster.create({
          title: "Vui long dang nhap de nhan tin",
          type: "info",
        })
        return
      }
      openWidget()
      if (payload.listingId) {
        setPendingListingShareId(payload.listingId)
      }
      if (payload.peerId) {
        openConversationMutation.mutate(payload.peerId)
      }
    })
    return () => off()
  }, [isAuthenticated, openConversationMutation, openWidget])

  useEffect(
    () => () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current)
      }
    },
    [],
  )

  useEffect(() => {
    if (!isAuthenticated || !isOpen || selectedConversationId) {
      return
    }
    const first = conversationsQuery.data?.[0]
    if (first) {
      setSelectedConversationId(first.id)
    }
  }, [isAuthenticated, isOpen, conversationsQuery.data, selectedConversationId])

  useEffect(() => {
    if (!selectedConversationId || !isOpen) {
      return
    }
    const timer = window.setTimeout(() => scrollMessagesToBottom("auto"), 0)
    return () => window.clearTimeout(timer)
  }, [isOpen, scrollMessagesToBottom, selectedConversationId])

  useEffect(() => {
    const off = wsClient.on("chat:message", () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] })
      if (selectedConversationId) {
        queryClient.invalidateQueries({
          queryKey: ["chat", "messages", selectedConversationId],
        })
      }
    })
    return () => off()
  }, [queryClient, selectedConversationId])

  useEffect(() => {
    if (!isOpen || !selectedConversationId) {
      return
    }
    const selected = conversationsQuery.data?.find(
      (item) => item.id === selectedConversationId,
    )
    if (!selected || selected.unread_count <= 0 || markReadMutation.isPending) {
      return
    }
    markReadMutation.mutate(selectedConversationId)
  }, [
    conversationsQuery.data,
    isOpen,
    markReadMutation,
    selectedConversationId,
  ])

  useEffect(() => {
    if (!isOpen || !selectedConversationId) {
      return
    }
    if (!messagesQuery.data?.items) {
      return
    }
    scrollMessagesToBottom("smooth")
  }, [
    isOpen,
    messagesQuery.data?.items,
    scrollMessagesToBottom,
    selectedConversationId,
  ])

  useEffect(() => {
    if (!isOpen || !selectedConversationId || !pendingListingShareId) {
      return
    }

    const existingShared = (messagesQuery.data?.items ?? []).some(
      (item) =>
        item.message_type === "listing_share" &&
        item.listing?.id === pendingListingShareId,
    )
    if (existingShared) {
      setPendingListingShareId(null)
      return
    }

    sendMessageMutation.mutate(
      {
        message_type: "listing_share",
        listing_id: pendingListingShareId,
      },
      {
        onSettled: () => {
          setPendingListingShareId(null)
        },
      },
    )
  }, [
    isOpen,
    messagesQuery.data?.items,
    pendingListingShareId,
    selectedConversationId,
    sendMessageMutation,
  ])

  const handleSendMessage = useCallback(() => {
    const raw = messageInput.trim()
    if (!selectedConversationId || !raw) {
      return
    }

    const listingId = extractListingIdFromText(raw)
    if (listingId) {
      sendMessageMutation.mutate({
        message_type: "listing_share",
        listing_id: listingId,
      })
    } else {
      sendMessageMutation.mutate({
        message_type: "text",
        content: raw,
      })
    }
  }, [messageInput, selectedConversationId, sendMessageMutation])

  if (authLoading || !isAuthenticated || !user) {
    return null
  }

  return (
    <>
      {!isPanelMounted && (
        <Box
          position="fixed"
          right={{ base: 3, md: 5 }}
          bottom={{ base: 3, md: 5 }}
          zIndex={1200}
        >
          <Button
            borderRadius="full"
            h="56px"
            px={5}
            colorPalette="blue"
            boxShadow="0 14px 30px rgba(1,138,190,0.35)"
            onClick={openWidget}
          >
            <FiMessageCircle style={{ marginRight: "0.5rem" }} />
            Tin nhan
            {unreadCount > 0 && (
              <Badge
                ml={2}
                colorPalette="whiteAlpha"
                borderRadius="full"
                px={2}
              >
                {unreadCount}
              </Badge>
            )}
          </Button>
        </Box>
      )}

      {isPanelMounted && (
        <Box
          position="fixed"
          right={isMobile ? 0 : 5}
          bottom={isMobile ? 0 : 5}
          top={isMobile ? 0 : "auto"}
          left={isMobile ? 0 : "auto"}
          w={isMobile ? "100vw" : "min(92vw, 420px)"}
          h={isMobile ? "100vh" : "560px"}
          zIndex={1300}
          borderRadius={isMobile ? 0 : "xl"}
          bg="white"
          border={isMobile ? "none" : "1px solid"}
          borderColor="gray.200"
          boxShadow={isMobile ? "none" : "0 20px 60px rgba(0,0,0,0.18)"}
          display="flex"
          flexDirection="column"
          transition="transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 220ms ease"
          transform={
            isOpen
              ? isMobile
                ? "translateY(0)"
                : "translateY(0) scale(1)"
              : isMobile
                ? "translateY(100%)"
                : "translateY(20px) scale(0.98)"
          }
          opacity={isOpen ? 1 : 0}
        >
          <HStack
            px={4}
            py={3}
            borderBottom="1px"
            borderColor="gray.100"
            justify="space-between"
          >
            <VStack align="start" gap={0}>
              <Text fontWeight="bold">Tin nhan</Text>
              <Text fontSize="xs" color="gray.500">
                {selectedConversation
                  ? `Cuoc tro chuyen ${selectedConversation.id.slice(0, 8)}`
                  : "Chon cuoc tro chuyen"}
              </Text>
            </VStack>
            <HStack>
              {!isMobile && (
                <IconButton
                  aria-label="Thu gon chat"
                  variant="ghost"
                  size="sm"
                  onClick={closeWidget}
                >
                  <FiMinimize2 />
                </IconButton>
              )}
              <IconButton
                aria-label="Dong chat"
                variant="ghost"
                size="sm"
                onClick={closeWidget}
              >
                <FiX />
              </IconButton>
            </HStack>
          </HStack>

          <Flex minH={0} flex={1}>
            <Box
              w="42%"
              borderRight="1px"
              borderColor="gray.100"
              p={2}
              overflowY="auto"
            >
              {conversationsQuery.isLoading ? (
                <Flex py={8} justify="center">
                  <Spinner size="sm" color="blue.500" />
                </Flex>
              ) : (
                <VStack align="stretch" gap={1}>
                  {(conversationsQuery.data ?? []).map((conversation) => {
                    return (
                      <ConversationItem
                        key={conversation.id}
                        conversation={conversation}
                        currentUserId={user.id}
                        selected={conversation.id === selectedConversationId}
                        onSelect={() =>
                          setSelectedConversationId(conversation.id)
                        }
                      />
                    )
                  })}
                  {conversationsQuery.data?.length === 0 && (
                    <Text px={2} py={4} fontSize="sm" color="gray.500">
                      Chua co cuoc tro chuyen.
                    </Text>
                  )}
                </VStack>
              )}
            </Box>

            <Flex flex={1} minW={0} direction="column">
              <VStack
                ref={messagesScrollRef}
                align="stretch"
                gap={2}
                flex={1}
                p={3}
                overflowY="auto"
              >
                {messagesQuery.isLoading && selectedConversationId ? (
                  <Flex justify="center" py={8}>
                    <Spinner size="sm" color="blue.500" />
                  </Flex>
                ) : (messagesQuery.data?.items ?? []).length > 0 ? (
                  (messagesQuery.data?.items ?? []).map((message) => {
                    const mine = message.sender_id === user.id
                    return (
                      <Flex
                        key={message.id}
                        justify={mine ? "flex-end" : "flex-start"}
                      >
                        {message.message_type === "listing_share" &&
                        message.listing ? (
                          <ListingSharedCard
                            listing={message.listing}
                            onOpen={() => {
                              navigate({
                                to: "/listings/$id",
                                params: { id: message.listing!.id },
                              })
                            }}
                          />
                        ) : (
                          <Box
                            maxW="85%"
                            px={3}
                            py={2}
                            borderRadius="lg"
                            bg={mine ? "blue.600" : "gray.100"}
                            color={mine ? "white" : "gray.800"}
                          >
                            <Text fontSize="sm" whiteSpace="pre-wrap">
                              {message.content ?? ""}
                            </Text>
                          </Box>
                        )}
                      </Flex>
                    )
                  })
                ) : (
                  <Flex justify="center" py={8}>
                    <Text color="gray.500" fontSize="sm">
                      Chua co tin nhan.
                    </Text>
                  </Flex>
                )}
              </VStack>

              <HStack borderTop="1px" borderColor="gray.100" p={3}>
                <Input
                  placeholder="Nhap tin nhan..."
                  value={messageInput}
                  onChange={(event) => setMessageInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  disabled={!selectedConversationId}
                />
                <IconButton
                  aria-label="Gui tin nhan"
                  colorPalette="blue"
                  onClick={handleSendMessage}
                  loading={sendMessageMutation.isPending}
                  disabled={!selectedConversationId || !messageInput.trim()}
                >
                  <FiSend />
                </IconButton>
              </HStack>
            </Flex>
          </Flex>
        </Box>
      )}
    </>
  )
}
