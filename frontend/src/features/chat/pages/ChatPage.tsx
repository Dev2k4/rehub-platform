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
import type { AssistantQueryResponse } from "@/features/assistant/api/assistant.api"
import {
  useAssistantQuery,
  useAssistantSuggestions,
} from "@/features/assistant/hooks/useAssistant"
import { useAuthUser } from "@/features/auth/hooks/useAuthUser"
import {
  createOrGetConversation,
  listConversationMessages,
  listMyConversations,
  sendChatMessage,
} from "@/features/chat/api/chat.api"
import {
  formatCurrencyVnd,
  getListingImageUrl,
} from "@/features/home/utils/marketplace.utils"
import { wsClient } from "@/features/shared/realtime/ws.client"

type AssistantTurn = {
  id: string
  userMessage: string
  response: AssistantQueryResponse
}

export function ChatPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: "/chat" }) as { peer?: string } | undefined
  const queryClient = useQueryClient()
  const { user, isAuthenticated, isLoading: authLoading } = useAuthUser()

  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null)
  const [messageInput, setMessageInput] = useState("")
  const [chatMode, setChatMode] = useState<"user" | "assistant">("user")
  const [assistantTurns, setAssistantTurns] = useState<AssistantTurn[]>([])
  const assistantMutation = useAssistantQuery()
  const suggestionContext = useMemo(() => {
    const lastTurn =
      assistantTurns.length > 0
        ? assistantTurns[assistantTurns.length - 1]
        : undefined
    const lastIntent = lastTurn?.response.intent
    if (lastIntent === "listing_search" || lastIntent === "seller_reputation") {
      return lastIntent
    }

    const lowerText = messageInput.toLowerCase()
    if (
      lowerText.includes("uy tin") ||
      lowerText.includes("nguoi ban") ||
      lowerText.includes("seller")
    ) {
      return "seller_reputation"
    }
    if (
      lowerText.includes("tim") ||
      lowerText.includes("goi y") ||
      lowerText.includes("gia") ||
      lowerText.includes("listing")
    ) {
      return "listing_search"
    }
    return "general"
  }, [assistantTurns, messageInput])
  const suggestionsQuery = useAssistantSuggestions(suggestionContext)
  const assistantPrompts =
    suggestionsQuery.data?.suggestions?.length &&
    suggestionsQuery.data.suggestions.length > 0
      ? suggestionsQuery.data.suggestions
      : [
          "Tìm laptop dưới 20 triệu phù hợp cho lập trình",
          "So sánh độ uy tín người bán có id 5",
          "Gợi ý 3 sản phẩm cho sinh viên ngành thiết kế",
        ]

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
        error instanceof Error ? error.message : "Khong the tao cuoc tro chuyen"
      toaster.create({ title: message, type: "error" })
    },
  })

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!selectedConversationId) {
        throw new Error("Chua chon cuoc tro chuyen")
      }
      const content = messageInput.trim()
      if (!content) {
        throw new Error("Noi dung tin nhan khong duoc de trong")
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
        error instanceof Error ? error.message : "Khong the gui tin nhan"
      toaster.create({ title: message, type: "error" })
    },
  })

  const handleAssistantSend = async () => {
    const message = messageInput.trim()
    if (!message) {
      return
    }

    try {
      const response = await assistantMutation.mutateAsync({
        message,
        max_results: 5,
      })
      setAssistantTurns((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          userMessage: message,
          response,
        },
      ])
      setMessageInput("")
    } catch (error: unknown) {
      const errMessage =
        error instanceof Error ? error.message : "Khong the goi tro ly AI"
      toaster.create({ title: errMessage, type: "error" })
    }
  }

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
          Quay lai
        </Button>

        <HStack mb={4}>
          <Button
            size="sm"
            variant={chatMode === "user" ? "solid" : "outline"}
            colorPalette="blue"
            onClick={() => setChatMode("user")}
          >
            Chat nguoi dung
          </Button>
          <Button
            size="sm"
            variant={chatMode === "assistant" ? "solid" : "outline"}
            colorPalette="purple"
            onClick={() => setChatMode("assistant")}
          >
            Tro ly AI
          </Button>
        </HStack>

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
              Cuoc tro chuyen
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
                          User {peerId.slice(0, 8)}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {conversation.last_message_at
                            ? new Date(
                                conversation.last_message_at,
                              ).toLocaleString("vi-VN")
                            : "Chua co tin nhan"}
                        </Text>
                      </VStack>
                    </Button>
                  )
                })}
                {conversationsQuery.data?.length === 0 && (
                  <Text fontSize="sm" color="gray.500">
                    Chua co cuoc tro chuyen nao.
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
                {chatMode === "assistant"
                  ? "Tro ly AI ReHub"
                  : selectedConversation
                    ? `Chat ${selectedConversation.id.slice(0, 8)}`
                    : "Chon cuoc tro chuyen"}
              </Text>
            </Box>

            <VStack align="stretch" gap={3} flex={1} p={4} overflowY="auto">
              {chatMode === "user" && messagesQuery.isLoading && selectedConversationId ? (
                <Flex justify="center" py={8}>
                  <Spinner size="md" color="blue.500" />
                </Flex>
              ) : chatMode === "user" && (messagesQuery.data?.items ?? []).length > 0 ? (
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
              ) : chatMode === "assistant" && assistantTurns.length > 0 ? (
                assistantTurns.map((turn) => (
                  <VStack key={turn.id} align="stretch" gap={2}>
                    <Flex justify="flex-end">
                      <Box bg="blue.600" color="white" px={3} py={2} borderRadius="lg" maxW="75%">
                        <Text whiteSpace="pre-wrap">{turn.userMessage}</Text>
                      </Box>
                    </Flex>
                    <Flex justify="flex-start">
                      <Box bg="purple.50" border="1px" borderColor="purple.200" px={3} py={2} borderRadius="lg" maxW="85%">
                        <Text whiteSpace="pre-wrap" color="gray.800">
                          {turn.response.answer}
                        </Text>
                        {turn.response.listings.length > 0 && (
                          <VStack mt={3} align="stretch" gap={2}>
                            {turn.response.listings.map((item) => (
                              <Box key={item.id} border="1px" borderColor="purple.100" borderRadius="md" p={2} bg="white">
                                {item.image_url && (
                                  <Box h="120px" bg="gray.50" borderRadius="md" overflow="hidden" mb={2}>
                                    <img
                                      src={getListingImageUrl(item.image_url)}
                                      alt={item.title}
                                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                  </Box>
                                )}
                                <Text fontWeight="semibold">{item.title}</Text>
                                <Text fontSize="sm" color="purple.700">
                                  Gia: {formatCurrencyVnd(item.price)}
                                </Text>
                                <Text fontSize="xs" color="gray.600">
                                  Seller: {item.seller_name ?? item.seller_id.slice(0, 8)} | Trust: {item.trust_score.toFixed(1)}
                                </Text>
                                {item.match_reason && (
                                  <Text fontSize="xs" color="purple.700" mt={1}>
                                    Ly do goi y: {item.match_reason}
                                  </Text>
                                )}
                              </Box>
                            ))}
                          </VStack>
                        )}
                        {turn.response.seller_insight && (
                          <Box mt={3} border="1px" borderColor="purple.100" borderRadius="md" p={2} bg="white">
                            <Text fontWeight="semibold">Danh gia nguoi ban</Text>
                            <Text fontSize="sm" color="gray.700">
                              {turn.response.seller_insight.full_name} | Trust {turn.response.seller_insight.trust_score.toFixed(1)} | Rating {turn.response.seller_insight.rating_avg.toFixed(2)} ({turn.response.seller_insight.rating_count})
                            </Text>
                          </Box>
                        )}
                        {turn.response.follow_up_questions.length > 0 && (
                          <VStack mt={3} align="stretch" gap={2}>
                            <Text fontSize="xs" color="gray.600">
                              Goi y cau hoi tiep theo:
                            </Text>
                            <HStack gap={2} flexWrap="wrap">
                              {turn.response.follow_up_questions.map((q) => (
                                <Button
                                  key={q}
                                  size="xs"
                                  variant="outline"
                                  colorPalette="purple"
                                  onClick={() => setMessageInput(q)}
                                >
                                  {q}
                                </Button>
                              ))}
                            </HStack>
                          </VStack>
                        )}
                      </Box>
                    </Flex>
                  </VStack>
                ))
              ) : (
                <Flex justify="center" py={8}>
                  <Text color="gray.500">
                    {chatMode === "assistant"
                      ? "Hay dat cau hoi ve san pham, khoang gia, hoac uy tin nguoi ban."
                      : "Chua co tin nhan nao."}
                  </Text>
                </Flex>
              )}
            </VStack>

            <Box borderTop="1px" borderColor="gray.100" p={3}>
              {chatMode === "assistant" && (
                <HStack gap={2} mb={2} flexWrap="wrap">
                  {assistantPrompts.map((prompt) => (
                    <Button
                      key={prompt}
                      size="xs"
                      variant="outline"
                      colorPalette="purple"
                      onClick={() => setMessageInput(prompt)}
                    >
                      {prompt}
                    </Button>
                  ))}
                </HStack>
              )}
              <HStack>
                <Input
                  placeholder="Nhap tin nhan..."
                  value={messageInput}
                  onChange={(event) => setMessageInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault()
                      if (chatMode === "assistant") {
                        void handleAssistantSend()
                      } else if (selectedConversationId) {
                        sendMessageMutation.mutate()
                      }
                    }
                  }}
                  disabled={chatMode === "user" && !selectedConversationId}
                />
                <Button
                  colorPalette={chatMode === "assistant" ? "purple" : "blue"}
                  onClick={() => {
                    if (chatMode === "assistant") {
                      void handleAssistantSend()
                      return
                    }
                    sendMessageMutation.mutate()
                  }}
                  loading={
                    chatMode === "assistant"
                      ? assistantMutation.isPending
                      : sendMessageMutation.isPending
                  }
                  disabled={
                    !messageInput.trim() ||
                    (chatMode === "user" && !selectedConversationId)
                  }
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
