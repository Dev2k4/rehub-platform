import {
  Box,
  Button,
  Container,
  Flex,
  HStack,
  Input,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useEffect, useMemo, useState } from "react"
import { FiArrowLeft, FiSend } from "react-icons/fi"
import { toaster } from "@/components/ui/toaster"
import { useAuthUser } from "@/features/auth/hooks/useAuthUser"
import {
  createOrGetConversation,
  listConversationMessages,
  listMyConversations,
  sendChatMessage,
} from "@/features/chat/api/chat.api"
import { wsClient } from "@/features/shared/realtime/ws.client"

export function ChatPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: "/chat" }) as { peer?: string } | undefined
  const queryClient = useQueryClient()
  const { user, isAuthenticated, isLoading: authLoading } = useAuthUser()

  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null)
  const [messageInput, setMessageInput] = useState("")

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

  const messagesQuery = useQuery({
    queryKey: ["chat", "messages", selectedConversationId],
    queryFn: () =>
      listConversationMessages(selectedConversationId!, { skip: 0, limit: 50 }),
    enabled: isAuthenticated && !!selectedConversationId,
    refetchInterval: 12000,
  })

  const openConversationMutation = useMutation({
    mutationFn: createOrGetConversation,
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] })
      setSelectedConversationId(conversation.id)
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Không thể tạo cuộc trò chuyện"
      toaster.create({ title: message, type: "error" })
    },
  })

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!selectedConversationId) {
        throw new Error("Chưa chọn cuộc trò chuyện")
      }
      const content = messageInput.trim()
      if (!content) {
        throw new Error("Nội dung tin nhắn không được để trống")
      }
      return sendChatMessage(selectedConversationId, {
        message_type: "text",
        content,
      })
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
        error instanceof Error ? error.message : "Không thể gửi tin nhắn"
      toaster.create({ title: message, type: "error" })
    },
  })

  useEffect(() => {
    if (!search?.peer || !isAuthenticated) {
      return
    }
    openConversationMutation.mutate(search.peer)
  }, [search?.peer, isAuthenticated, openConversationMutation.mutate])

  useEffect(() => {
    if (selectedConversationId) {
      return
    }
    const first = conversationsQuery.data?.[0]
    if (first) {
      setSelectedConversationId(first.id)
    }
  }, [conversationsQuery.data, selectedConversationId])

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

  if (!authLoading && !isAuthenticated) {
    navigate({ to: "/auth/login" })
    return null
  }

  if (authLoading || !user) {
    return (
      <Flex minH="100vh" align="center" justify="center">
        <Spinner size="lg" color="blue.500" />
      </Flex>
    )
  }

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="7xl" py={8}>
        <Button
          variant="ghost"
          mb={4}
          onClick={() => navigate({ to: "/" })}
          color="blue.600"
        >
          <FiArrowLeft style={{ marginRight: "0.5rem" }} />
          Quay lại
        </Button>

        <Flex gap={4} align="stretch" direction={{ base: "column", lg: "row" }}>
          <Box
            w={{ base: "full", lg: "360px" }}
            border="1px"
            borderColor="gray.200"
            borderRadius="xl"
            bg="white"
            p={3}
          >
            <Text fontWeight="bold" mb={3} color="gray.800">
              Cuộc trò chuyện
            </Text>
            {conversationsQuery.isLoading ? (
              <Flex py={8} justify="center">
                <Spinner size="md" color="blue.500" />
              </Flex>
            ) : (
              <VStack align="stretch" gap={2}>
                {(conversationsQuery.data ?? []).map((conversation) => {
                  const peerId =
                    conversation.participant_a_id === user.id
                      ? conversation.participant_b_id
                      : conversation.participant_a_id
                  const selected = conversation.id === selectedConversationId
                  return (
                    <Button
                      key={conversation.id}
                      justifyContent="start"
                      h="auto"
                      py={3}
                      px={3}
                      borderRadius="lg"
                      variant={selected ? "subtle" : "ghost"}
                      colorPalette={selected ? "blue" : "gray"}
                      onClick={() => setSelectedConversationId(conversation.id)}
                    >
                      <VStack align="start" gap={0}>
                        <Text fontWeight="semibold">
                          Người dùng {peerId.slice(0, 8)}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {conversation.last_message_at
                            ? new Date(
                                conversation.last_message_at,
                              ).toLocaleString("vi-VN")
                            : "Chưa có tin nhắn"}
                        </Text>
                      </VStack>
                    </Button>
                  )
                })}
                {conversationsQuery.data?.length === 0 && (
                  <Text fontSize="sm" color="gray.500">
                    Chưa có cuộc trò chuyện nào.
                  </Text>
                )}
              </VStack>
            )}
          </Box>

          <Box
            flex={1}
            border="1px"
            borderColor="gray.200"
            borderRadius="xl"
            bg="white"
            display="flex"
            flexDirection="column"
            minH="560px"
          >
            <Box px={4} py={3} borderBottom="1px" borderColor="gray.100">
              <Text fontWeight="bold" color="gray.800">
                {selectedConversation
                  ? `Trò chuyện ${selectedConversation.id.slice(0, 8)}`
                  : "Chọn cuộc trò chuyện"}
              </Text>
            </Box>

            <VStack align="stretch" gap={3} flex={1} p={4} overflowY="auto">
              {messagesQuery.isLoading && selectedConversationId ? (
                <Flex justify="center" py={8}>
                  <Spinner size="md" color="blue.500" />
                </Flex>
              ) : (messagesQuery.data?.items ?? []).length > 0 ? (
                (messagesQuery.data?.items ?? []).map((message) => {
                  const mine = message.sender_id === user.id
                  return (
                    <Flex
                      key={message.id}
                      justify={mine ? "flex-end" : "flex-start"}
                    >
                      <Box
                        maxW="75%"
                        px={3}
                        py={2}
                        borderRadius="lg"
                        bg={mine ? "blue.600" : "gray.100"}
                        color={mine ? "white" : "gray.800"}
                      >
                        <Text whiteSpace="pre-wrap">
                          {message.content ?? ""}
                        </Text>
                        <Text fontSize="xs" mt={1} opacity={0.75}>
                          {new Date(message.created_at).toLocaleString("vi-VN")}
                        </Text>
                      </Box>
                    </Flex>
                  )
                })
              ) : (
                <Flex justify="center" py={8}>
                  <Text color="gray.500">Chưa có tin nhắn nào.</Text>
                </Flex>
              )}
            </VStack>

            <Box borderTop="1px" borderColor="gray.100" p={3}>
              <HStack>
                <Input
                  placeholder="Nhập tin nhắn..."
                  value={messageInput}
                  onChange={(event) => setMessageInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault()
                      if (selectedConversationId) {
                        sendMessageMutation.mutate()
                      }
                    }
                  }}
                  disabled={!selectedConversationId}
                />
                <Button
                  colorPalette="blue"
                  onClick={() => sendMessageMutation.mutate()}
                  loading={sendMessageMutation.isPending}
                  disabled={!selectedConversationId || !messageInput.trim()}
                >
                  <FiSend />
                </Button>
              </HStack>
            </Box>
          </Box>
        </Flex>
      </Container>
    </Box>
  )
}
