import {
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
import { useRouterState } from "@tanstack/react-router"
import { useCallback, useMemo, useRef, useState } from "react"
import { FiCpu, FiMinimize2, FiSend, FiX } from "react-icons/fi"
import { OpenAPI } from "@/client"

type AiProductItem = {
  listing_id: string
  title: string
  price: number
  condition: string
  condition_label: string
  category_name: string | null
  image_url: string | null
}

type AssistantMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  products?: AiProductItem[]
}

type AssistantMeta = {
  fallbackUsed: boolean
  provider?: string
  model?: string
}

function getApiBase(): string {
  return OpenAPI.BASE.replace(/\/+$/, "")
}

function normalizeAssistantPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null
  }

  const map = payload as Record<string, unknown>
  const direct = map.answer ?? map.reply ?? map.message ?? map.content
  if (typeof direct === "string" && direct.trim()) {
    return direct
  }

  const data = map.data
  if (data && typeof data === "object") {
    const nested = data as Record<string, unknown>
    const nestedText = nested.answer ?? nested.reply ?? nested.message ?? nested.content
    if (typeof nestedText === "string" && nestedText.trim()) {
      return nestedText
    }
  }

  return null
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price) + " ₫"
}

async function askAssistant(
  prompt: string,
  pathname: string,
): Promise<{ answer: string; meta: AssistantMeta; products?: AiProductItem[] }> {
  const endpoint = `${getApiBase()}/api/v1/ai/chat`
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: prompt,
      context: {
        source: "ai-widget",
        pathname,
      },
      mode: "auto",
    }),
  })

  if (!response.ok) {
    let detail = "Không thể gọi Trợ lý AI lúc này"
    try {
      const payload = (await response.json()) as { detail?: unknown }
      if (typeof payload.detail === "string" && payload.detail.trim()) {
        detail = payload.detail
      }
    } catch {
      // Ignore response parse error and keep default detail.
    }
    throw new Error(detail)
  }

  const payload = (await response.json()) as {
    answer?: unknown
    fallback_used?: unknown
    provider?: unknown
    model?: unknown
    products?: unknown
  }
  const normalized =
    typeof payload.answer === "string" && payload.answer.trim()
      ? payload.answer.trim()
      : normalizeAssistantPayload(payload)
  if (!normalized) {
    throw new Error("Phản hồi AI không hợp lệ")
  }
  const meta: AssistantMeta = {
    fallbackUsed: Boolean(payload.fallback_used),
    provider: typeof payload.provider === "string" ? payload.provider : undefined,
    model: typeof payload.model === "string" ? payload.model : undefined,
  }
  const products = Array.isArray(payload.products) ? (payload.products as AiProductItem[]) : undefined
  return { answer: normalized, meta, products }
}

function ProductCard({ product }: { product: AiProductItem }) {
  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="teal.100"
      borderRadius="lg"
      p={2.5}
      cursor="pointer"
      _hover={{ borderColor: "teal.300", boxShadow: "sm" }}
      transition="all 0.15s"
      onClick={() => window.open(`/listings/${product.listing_id}`, "_blank")}
      minW="180px"
      maxW="220px"
      flexShrink={0}
    >
      {product.image_url && (
        <Box
          borderRadius="md"
          overflow="hidden"
          mb={2}
          h="80px"
          bg="gray.50"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <img
            src={product.image_url}
            alt={product.title}
            style={{ maxHeight: "80px", maxWidth: "100%", objectFit: "cover" }}
          />
        </Box>
      )}
      <Text fontSize="xs" fontWeight="600" lineClamp={2} color="gray.800">
        {product.title}
      </Text>
      <Text fontSize="xs" fontWeight="bold" color="teal.600" mt={1}>
        {formatPrice(product.price)}
      </Text>
      <HStack mt={1} gap={1} flexWrap="wrap">
        <Text
          fontSize="2xs"
          bg="gray.100"
          px={1.5}
          py={0.5}
          borderRadius="sm"
          color="gray.600"
        >
          {product.condition_label}
        </Text>
        {product.category_name && (
          <Text
            fontSize="2xs"
            bg="teal.50"
            px={1.5}
            py={0.5}
            borderRadius="sm"
            color="teal.700"
          >
            {product.category_name}
          </Text>
        )}
      </HStack>
    </Box>
  )
}

export function AiAssistantWidget() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? false

  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [assistantMeta, setAssistantMeta] = useState<AssistantMeta | null>(null)
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: "assistant-welcome",
      role: "assistant",
      content:
        "Xin chào! Tôi là Trợ lý AI ReHub 🤖 Tôi có thể giúp bạn tìm sản phẩm, gợi ý giá bán, hoặc hướng dẫn sử dụng sàn.",
    },
  ])

  const messagesRef = useRef<HTMLDivElement | null>(null)

  const quickPrompts = useMemo(
    () => [
      "Cách đăng tin nhanh",
      "Escrow hoạt động thế nào",
      "Tìm iPhone đang bán",
    ],
    [],
  )

  const scrollToBottom = useCallback(() => {
    const node = messagesRef.current
    if (!node) {
      return
    }
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" })
  }, [])

  const submitQuestion = useCallback(
    async (raw: string) => {
      const question = raw.trim()
      if (!question || isLoading) {
        return
      }

      const userMessage: AssistantMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: question,
      }
      setMessages((prev) => [...prev, userMessage])
      setInput("")
      setIsLoading(true)

      try {
        const { answer, meta, products } = await askAssistant(question, pathname)
        const assistantMessage: AssistantMessage = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: answer,
          products,
        }
        setMessages((prev) => [...prev, assistantMessage])
        setAssistantMeta(meta)
      } catch (error: unknown) {
        const detail =
          error instanceof Error && error.message.trim()
            ? error.message
            : "Không thể kết nối Trợ lý AI. Vui lòng thử lại sau."
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: "assistant",
            content: `Mình gặp lỗi khi gọi AI: ${detail}`,
          },
        ])
        setAssistantMeta({ fallbackUsed: true })
      } finally {
        setIsLoading(false)
        window.setTimeout(scrollToBottom, 0)
      }
    },
    [isLoading, pathname, scrollToBottom],
  )

  return (
    <>
      {!isOpen && (
        <Box
          position="fixed"
          right={{ base: 3, md: 5 }}
          bottom={{ base: 20, md: 24 }}
          zIndex={1195}
        >
          <Button
            borderRadius="full"
            h="50px"
            px={4}
            colorPalette="teal"
            boxShadow="0 12px 26px rgba(0,124,124,0.32)"
            onClick={() => setIsOpen(true)}
          >
            <FiCpu style={{ marginRight: "0.5rem" }} />
            Trợ lý AI
          </Button>
        </Box>
      )}

      {isOpen && (
        <Box
          position="fixed"
          right={isMobile ? 0 : 5}
          bottom={isMobile ? 0 : 24}
          top={isMobile ? 0 : "auto"}
          left={isMobile ? 0 : "auto"}
          w={isMobile ? "100vw" : "min(92vw, 420px)"}
          h={isMobile ? "100vh" : "560px"}
          zIndex={1295}
          borderRadius={isMobile ? 0 : "xl"}
          bg="white"
          border={isMobile ? "none" : "1px solid"}
          borderColor="teal.100"
          boxShadow={isMobile ? "none" : "0 22px 60px rgba(0,0,0,0.2)"}
          display="flex"
          flexDirection="column"
        >
          <HStack
            px={4}
            py={3}
            borderBottom="1px"
            borderColor="teal.100"
            justify="space-between"
          >
            <VStack align="start" gap={0}>
              <Text fontWeight="bold" color="teal.700">
                Trợ lý AI ReHub
              </Text>
              <Text fontSize="xs" color="gray.500">
                Tìm sản phẩm, gợi ý giá, hướng dẫn sử dụng
              </Text>
              {(assistantMeta?.provider || assistantMeta?.model) && (
                <Text fontSize="xs" color="gray.500">
                  Nguồn: {assistantMeta?.provider ?? "unknown"}
                  {assistantMeta?.model ? ` • ${assistantMeta.model}` : ""}
                </Text>
              )}
              {assistantMeta?.fallbackUsed && (
                <Text fontSize="xs" color="orange.500">
                  Đang dùng chế độ trả lời nhanh (offline)
                </Text>
              )}
            </VStack>
            <HStack>
              {!isMobile && (
                <IconButton
                  aria-label="Thu gọn trợ lý"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <FiMinimize2 />
                </IconButton>
              )}
              <IconButton
                aria-label="Đóng trợ lý"
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <FiX />
              </IconButton>
            </HStack>
          </HStack>

          <Box px={3} py={2} borderBottom="1px" borderColor="gray.100">
            <HStack gap={2} flexWrap="wrap">
              {quickPrompts.map((prompt) => (
                <Button
                  key={prompt}
                  size="xs"
                  variant="subtle"
                  colorPalette="teal"
                  onClick={() => submitQuestion(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </HStack>
          </Box>

          <VStack
            ref={messagesRef}
            align="stretch"
            gap={2}
            flex={1}
            p={3}
            overflowY="auto"
          >
            {messages.map((item) => {
              const isUser = item.role === "user"
              return (
                <Box key={item.id}>
                  <Flex justify={isUser ? "flex-end" : "flex-start"}>
                    <Box
                      maxW="86%"
                      px={3}
                      py={2}
                      borderRadius="lg"
                      bg={isUser ? "teal.600" : "gray.100"}
                      color={isUser ? "white" : "gray.800"}
                    >
                      <Text fontSize="sm" whiteSpace="pre-wrap">
                        {item.content}
                      </Text>
                    </Box>
                  </Flex>
                  {/* Product cards */}
                  {item.products && item.products.length > 0 && (
                    <Box mt={2} ml={0}>
                      <Text fontSize="xs" color="gray.500" mb={1.5} fontWeight="500">
                        📦 Sản phẩm tìm thấy ({item.products.length})
                      </Text>
                      <Flex gap={2} overflowX="auto" pb={1}>
                        {item.products.map((product) => (
                          <ProductCard key={product.listing_id} product={product} />
                        ))}
                      </Flex>
                    </Box>
                  )}
                </Box>
              )
            })}

            {isLoading && (
              <Flex justify="flex-start">
                <HStack
                  px={3}
                  py={2}
                  borderRadius="lg"
                  bg="gray.100"
                  color="gray.700"
                >
                  <Spinner size="xs" />
                  <Text fontSize="sm">Trợ lý đang trả lời...</Text>
                </HStack>
              </Flex>
            )}
          </VStack>

          <HStack borderTop="1px" borderColor="gray.100" p={3}>
            <Input
              placeholder="Hỏi Trợ lý AI..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  submitQuestion(input)
                }
              }}
              disabled={isLoading}
            />
            <IconButton
              aria-label="Gửi câu hỏi"
              colorPalette="teal"
              onClick={() => submitQuestion(input)}
              disabled={!input.trim() || isLoading}
            >
              <FiSend />
            </IconButton>
          </HStack>
        </Box>
      )}
    </>
  )
}
