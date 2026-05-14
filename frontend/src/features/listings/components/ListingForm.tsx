import {
  Box,
  Input as ChakraInput,
  Flex,
  IconButton,
  Image,
  NativeSelect,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { FiCamera, FiChevronDown, FiStar, FiX } from "react-icons/fi"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { z } from "zod"
import { OpenAPI, type CategoryTree } from "@/client"
import { getListingImageUrl } from "@/features/home/utils/marketplace.utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field } from "@/components/ui/field"
import { InputGroup } from "@/components/ui/input-group"

const listingSchema = z.object({
  title: z.string().min(5, "Tiêu đề ít nhất 5 ký tự").max(200),
  description: z.string().max(2000),
  price: z.coerce.number().positive("Giá phải lớn hơn 0"),
  category_id: z.string().min(1, "Chọn danh mục"),
  condition_grade: z.string().min(1, "Chọn tình trạng"),
  is_negotiable: z.boolean().default(false),
})

type ListingFormData = z.infer<typeof listingSchema>

export interface ListingFormSubmitPayload {
  data: ListingFormData
  files: File[]
}

interface ListingFormProps {
  initialData?: Partial<ListingFormData>
  categories?: CategoryTree[]
  existingImages?: { id: string; image_url: string | null }[]
  onDeleteExistingImage?: (imageId: string) => void
  onSubmit: (payload: ListingFormSubmitPayload) => Promise<void> | void
  isLoading?: boolean
  onCancel?: () => void
  title?: string
  showAiPanel?: boolean
  setShowAiPanel?: (show: boolean) => void
}

export function ListingForm({
  initialData,
  categories = [],
  existingImages = [],
  onDeleteExistingImage,
  onSubmit,
  isLoading = false,
  onCancel,
  title,
  showAiPanel: externalShowAiPanel,
  setShowAiPanel: externalSetShowAiPanel,
}: ListingFormProps) {
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedParentId, setSelectedParentId] = useState<string>("")
  const [priceAiAnswer, setPriceAiAnswer] = useState<string | null>(null)
  const [isPriceAiLoading, setIsPriceAiLoading] = useState(false)
  const [priceAiError, setPriceAiError] = useState<string | null>(null)
  
  const [internalShowAiPanel, setInternalShowAiPanel] = useState(false)
  const showAiPanel = externalShowAiPanel ?? internalShowAiPanel
  const setShowAiPanel = externalSetShowAiPanel ?? setInternalShowAiPanel

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    // @ts-expect-error - zod resolver type coercion issue
    resolver: zodResolver(listingSchema),
    defaultValues: initialData || {
      condition_grade: "GOOD",
      is_negotiable: false,
    },
  })

  const selectedCategoryId = watch("category_id")
  const watchTitle = watch("title")
  const watchCondition = watch("condition_grade")

  const canShowPriceIcon = useMemo(() => {
    return (
      (watchTitle || "").length >= 5 &&
      !!watchCondition &&
      !isPriceAiLoading
    )
  }, [watchTitle, watchCondition, isPriceAiLoading])

  const conditionLabel = useMemo(() => {
    const value = (watchCondition || "").toLowerCase()
    const mapping: Record<string, string> = {
      brand_new: "mới 100%",
      like_new: "như mới",
      good: "tốt",
      fair: "trung bình",
      poor: "cũ",
    }
    return mapping[value] || "không rõ"
  }, [watchCondition])

  const handlePriceSuggestion = async () => {
    setShowAiPanel(true)
    const currentTitle = (watchTitle || "").trim()
    const currentDescription = (watch("description") || "").trim()
    const prompt =
      `Tôi muốn bạn đưa ra mức giá phù hợp cho sản phẩm sau:` +
      `\nTiêu đề: ${currentTitle || "(chưa có)"}` +
      `\nMô tả: ${currentDescription || "(chưa có)"}` +
      `\nTình trạng: ${conditionLabel}.`

    setIsPriceAiLoading(true)
    setPriceAiError(null)

    try {
      const base = OpenAPI.BASE.replace(/\/+$/, "")
      const response = await fetch(`${base}/api/v1/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: prompt,
          context: {
            source: "listing-price",
            pathname: "/listings/new",
          },
          mode: "price",
        }),
      })

      if (!response.ok) {
        let errorMsg = "Không thể gợi ý giá lúc này"
        try {
          const json = (await response.json()) as { detail?: string }
          if (json.detail) {
            errorMsg = json.detail
          }
        } catch {
          // ignore
        }
        setPriceAiError(errorMsg)
        setPriceAiAnswer(null)
        return
      }

      const payload = (await response.json()) as { answer?: unknown }
      const answer = typeof payload.answer === "string" ? payload.answer.trim() : ""
      if (!answer) {
        setPriceAiError("Phản hồi AI không hợp lệ")
        setPriceAiAnswer(null)
        return
      }

      setPriceAiAnswer(answer)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Lỗi không xác định"
      setPriceAiError(errorMsg)
      setPriceAiAnswer(null)
    } finally {
      setIsPriceAiLoading(false)
    }
  }

  const selectedParent = useMemo(() => {
    return categories.find((item) => item.id === selectedParentId) ?? null
  }, [categories, selectedParentId])

  useEffect(() => {
    if (!categories.length) return

    if (selectedParentId) return

    const initialCategoryId = initialData?.category_id ?? selectedCategoryId
    if (!initialCategoryId) return

    const direct = categories.find((root) => root.id === initialCategoryId)
    const byChild = categories.find((root) =>
      (root.children ?? []).some((child) => child.id === initialCategoryId),
    )
    const parentId = direct?.id ?? byChild?.id ?? ""

    if (parentId) {
      setSelectedParentId(parentId)
    }
  }, [
    categories,
    initialData?.category_id,
    selectedCategoryId,
    selectedParentId,
  ])

  useEffect(() => {
    if (!selectedParent) return

    const children = selectedParent.children ?? []
    if (children.length === 0) {
      if (selectedCategoryId !== selectedParent.id) {
        setValue("category_id", selectedParent.id, { shouldValidate: true })
      }
      return
    }

    const isValidChild = children.some(
      (child) => child.id === selectedCategoryId,
    )
    if (!isValidChild) {
      setValue("category_id", "", { shouldValidate: false })
    }
  }, [selectedParent, selectedCategoryId, setValue])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles([...selectedFiles, ...files])

    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        setPreviewImages((prev) => [...prev, event.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviewImages((prev) => prev.filter((_, i) => i !== index))
  }

  const onFormSubmit = async (data: ListingFormData) => {
    await onSubmit({ data, files: selectedFiles })
  }

  const pricePanel = showAiPanel ? (
    <>
      <style>{`
        @keyframes customFadeIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .ai-markdown-content { font-size: 0.875rem; color: #374151; }
        .ai-markdown-content p { margin-bottom: 0.75rem; }
        .ai-markdown-content ul { padding-left: 1.25rem; margin-bottom: 0.75rem; list-style-type: disc; }
        .ai-markdown-content ol { padding-left: 1.25rem; margin-bottom: 0.75rem; list-style-type: decimal; }
        .ai-markdown-content li { margin-bottom: 0.35rem; }
        .ai-markdown-content strong { font-weight: 700; color: #1f2937; }
      `}</style>
      <Box
        w={{ base: "full", lg: "360px" }}
        bg="white"
        borderRadius="2xl"
        boxShadow="0 20px 60px rgba(0,0,0,0.12)"
        overflow="hidden"
        display="flex"
        flexDirection="column"
        style={{ animation: "customFadeIn 0.3s ease-out" }}
      >
        <Flex align="center" gap={2} px={5} py={4} bg="gray.50" borderBottom="1px solid" borderColor="gray.100" flexShrink={0}>
          <Box w="10px" h="10px" borderRadius="full" bg="blue.500" />
          <Text fontSize="sm" fontWeight="700" color="gray.700" flex="1">
            Tư vấn giá từ Rehub AI
          </Text>
          <IconButton
            aria-label="Đóng"
            variant="ghost"
            size="xs"
            onClick={() => setShowAiPanel(false)}
          >
            <FiX />
          </IconButton>
        </Flex>
        <Box px={5} py={4} flex="1" overflowY="auto">
          {isPriceAiLoading ? (
            <VStack gap={4} align="stretch" py={8}>
              <Flex align="center" justify="center" direction="column" gap={3}>
                <Spinner size="md" color="blue.500" />
                <Text fontSize="sm" fontWeight="600" color="blue.600" textAlign="center">
                  Rehub AI đang phân tích giá...
                </Text>
                <Text fontSize="xs" color="gray.500" textAlign="center">
                  Đang đánh giá theo thị trường và tình trạng sản phẩm
                </Text>
              </Flex>
              <Stack gap={2} mt={4}>
                <Box h="12px" bg="gray.100" borderRadius="md" animation="pulse 1.5s infinite" w="90%" />
                <Box h="12px" bg="gray.100" borderRadius="md" animation="pulse 1.5s infinite" w="100%" />
                <Box h="12px" bg="gray.100" borderRadius="md" animation="pulse 1.5s infinite" w="75%" />
              </Stack>
            </VStack>
          ) : priceAiError ? (
            <VStack gap={3} py={6} textAlign="center">
              <Text fontSize="sm" fontWeight="600" color="red.500">
                {priceAiError}
              </Text>
              <Button size="xs" variant="outline" onClick={handlePriceSuggestion}>
                Thử lại
              </Button>
            </VStack>
          ) : priceAiAnswer ? (
            <Box className="ai-markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{priceAiAnswer}</ReactMarkdown>
            </Box>
          ) : (
            <Text fontSize="sm" color="gray.500">
              Bấm biểu tượng ngôi sao để nhận tư vấn giá chi tiết cho tin đăng này.
            </Text>
          )}
        </Box>
      </Box>
    </>
  ) : null

  return (
    <>
      {/* Box 1: Main Form Box */}
      <Box
        flex="1"
        maxW="2xl"
        w="full"
        bg="white"
        borderRadius="2xl"
        boxShadow="0 20px 60px rgba(0,0,0,0.12)"
        display="flex"
        flexDirection="column"
        overflow="hidden"
      >
        {/* Main Header */}
        <Flex
          p={6}
          pb={4}
          borderBottomWidth="1px"
          borderColor="gray.100"
          justify="space-between"
          align="center"
          flexShrink={0}
        >
          <Text fontSize="xl" fontWeight="bold" color="gray.900">
            {title || (initialData ? "Sửa tin đăng" : "Đăng tin mới")}
          </Text>
          {onCancel && (
            <IconButton
              aria-label="Đóng"
              variant="ghost"
              size="sm"
              color="gray.500"
              onClick={onCancel}
            >
              <FiX size={20} />
            </IconButton>
          )}
        </Flex>

        {/* Main Body */}
        <Box p={6} pt={5} overflowY="auto" flex="1">
          <Box as="form" onSubmit={handleSubmit(onFormSubmit as any)}>
            <Stack gap={6}>
            {/* Title */}
            <Field
              label="Tiêu đề"
              invalid={!!errors.title}
              errorText={errors.title?.message}
            >
              <ChakraInput
                {...register("title")}
                type="text"
                placeholder="Ví dụ: Điện thoại iPhone 13 Pro Max"
                bg="gray.50"
                borderRadius="xl"
                border="1px solid"
                borderColor="gray.200"
                px={4}
                py={2}
                _focus={{
                  bg: "white",
                  borderColor: "blue.500",
                  ring: "1px",
                  ringColor: "blue.500",
                }}
              />
            </Field>

            {/* Description */}
            <Field
              label="Mô tả"
              invalid={!!errors.description}
              errorText={errors.description?.message}
            >
              <Textarea
                {...register("description")}
                placeholder="Mô tả chi tiết về sản phẩm..."
                minH="150px"
                bg="gray.50"
                borderRadius="xl"
                border="1px solid"
                borderColor="gray.200"
                px={4}
                py={3}
                _focus={{
                  bg: "white",
                  borderColor: "blue.500",
                  ring: "1px",
                  ringColor: "blue.500",
                }}
              />
            </Field>

            {/* Condition */}
            <Field
              label="Tình trạng"
              invalid={!!errors.condition_grade}
              errorText={errors.condition_grade?.message}
            >
              <NativeSelect.Root>
                <NativeSelect.Field
                  {...register("condition_grade")}
                  bg="gray.50"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="gray.200"
                  px={4}
                  py={2}
                  _focus={{
                    bg: "white",
                    borderColor: "blue.500",
                    ring: "1px",
                    ringColor: "blue.500",
                  }}
                >
                  <option value="brand_new">Mới (Chưa khui seal)</option>
                  <option value="like_new">Như mới (Đã khui seal, ít dùng)</option>
                  <option value="good">Tốt (Có chút trầy xước nhẹ)</option>
                  <option value="fair">
                    Trung bình (Ngoại hình cũ, hiệu năng tốt)
                  </option>
                  <option value="poor">Cũ (Trầy xước nhiều hoặc có lỗi nhẹ)</option>
                </NativeSelect.Field>
              </NativeSelect.Root>
            </Field>

            {/* Price */}
            <Field
              label="Giá (VNĐ)"
              invalid={!!errors.price}
              errorText={errors.price?.message}
            >
              <InputGroup
                width="full"
                endElement={
                  canShowPriceIcon && (
                    <IconButton
                      aria-label="Gợi ý giá từ AI"
                      onClick={handlePriceSuggestion}
                      disabled={isPriceAiLoading}
                      size="sm"
                      colorPalette="blue"
                      variant="ghost"
                      me={2}
                      title="Gợi ý giá dựa trên sản phẩm tương tự"
                    >
                      {isPriceAiLoading ? <Spinner size="sm" /> : <FiStar size={18} />}
                    </IconButton>
                  )
                }
              >
                <ChakraInput
                  id="price"
                  {...register("price")}
                  type="number"
                  className="price-input"
                  placeholder="0"
                  bg="gray.50"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="gray.200"
                  px={4}
                  _focus={{
                    bg: "white",
                    borderColor: "blue.500",
                    ring: "1px",
                    ringColor: "blue.500",
                  }}
                />
              </InputGroup>
            </Field>

            {/* Category */}
            <Field
              label="Danh mục"
              invalid={!!errors.category_id}
              errorText={errors.category_id?.message}
            >
              <VStack align="stretch" gap={3}>
                <input type="hidden" {...register("category_id")} />

                {!selectedParent ? (
                  <NativeSelect.Root>
                    <NativeSelect.Field
                      value={selectedParentId}
                      onChange={(e) => {
                        const nextParentId = e.target.value
                        setSelectedParentId(nextParentId)
                        setValue("category_id", "", { shouldValidate: true })
                      }}
                      bg="gray.50"
                      borderRadius="xl"
                      border="1px solid"
                      borderColor="gray.200"
                      px={4}
                      py={2}
                      _focus={{
                        bg: "white",
                        borderColor: "blue.500",
                        ring: "1px",
                        ringColor: "blue.500",
                      }}
                    >
                      <option value="">Chọn danh mục</option>
                      {categories.map((root) => (
                        <option key={root.id} value={root.id}>
                          {root.name}
                        </option>
                      ))}
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                ) : (
                  <Flex
                    align="center"
                    justify="space-between"
                    bg="blue.50"
                    border="1px solid"
                    borderColor="blue.200"
                    borderRadius="xl"
                    px={4}
                    py={2.5}
                  >
                    <Text fontSize="sm" color="blue.700" fontWeight="medium">
                      Danh mục: {selectedParent.name}
                    </Text>
                    <IconButton
                      aria-label="Chọn lại danh mục"
                      size="xs"
                      variant="ghost"
                      onClick={() => {
                        setSelectedParentId("")
                        setValue("category_id", "", { shouldValidate: true })
                      }}
                    >
                      <FiChevronDown />
                    </IconButton>
                  </Flex>
                )}

                {selectedParent && (selectedParent.children?.length ?? 0) > 0 ? (
                  <NativeSelect.Root>
                    <NativeSelect.Field
                      value={selectedCategoryId || ""}
                      onChange={(e) => {
                        setValue("category_id", e.target.value, {
                          shouldValidate: true,
                        })
                      }}
                      bg="gray.50"
                      borderRadius="xl"
                      border="1px solid"
                      borderColor="gray.200"
                      px={4}
                      py={2}
                      _focus={{
                        bg: "white",
                        borderColor: "blue.500",
                        ring: "1px",
                        ringColor: "blue.500",
                      }}
                    >
                      <option value="">Chọn danh mục con</option>
                      {selectedParent.children?.map((child) => (
                        <option key={child.id} value={child.id}>
                          {child.name}
                        </option>
                      ))}
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                ) : null}
              </VStack>
            </Field>

            {/* Negotiable */}
            <Box pl={1}>
              <Controller
                control={control}
                name="is_negotiable"
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(e) => field.onChange(!!e.checked)}
                  >
                    <Text fontSize="sm" fontWeight="medium" color="gray.700">
                      Có thể thương lượng giá
                    </Text>
                  </Checkbox>
                )}
              />
            </Box>

            {/* Images */}
            <Field label="Hình ảnh sản phẩm">
              <Box
                border="2px dashed"
                borderColor="blue.200"
                borderRadius="2xl"
                p={10}
                bg="blue.50"
                textAlign="center"
                cursor="pointer"
                _hover={{ borderColor: "blue.500", bg: "#EBF5FF" }}
                transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                onClick={() => document.getElementById("image-input")?.click()}
              >
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  gap={3}
                  color="gray.500"
                >
                  <FiCamera size={32} />
                  <VStack gap={1}>
                    <Text fontWeight="medium" color="gray.600">
                      Chọn ảnh hoặc kéo thả vào đây
                    </Text>
                    <Text fontSize="xs">Hỗ trợ JPG, PNG, WEBP (Tối đa 10 ảnh)</Text>
                  </VStack>
                </Flex>
                <input
                  id="image-input"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: "none" }}
                />
              </Box>
            </Field>

            {/* Image preview */}
            {previewImages.length > 0 && (
              <SimpleGrid columns={4} gap={4}>
                {previewImages.map((image, idx) => (
                  <Box key={idx} position="relative" role="group">
                    <Image
                      src={image}
                      alt={`Preview ${idx}`}
                      w="full"
                      h={32}
                      objectFit="cover"
                      borderRadius="lg"
                    />
                    <IconButton
                      aria-label="Xóa ảnh"
                      position="absolute"
                      top={1}
                      right={1}
                      size="xs"
                      colorPalette="red"
                      variant="solid"
                      borderRadius="full"
                      onClick={() => removeImage(idx)}
                    >
                      <FiX />
                    </IconButton>
                  </Box>
                ))}
              </SimpleGrid>
            )}

            {existingImages.length > 0 && (
              <SimpleGrid columns={4} gap={4}>
                {existingImages.map((image) => (
                  <Box key={image.id} position="relative">
                    <Image
                      src={getListingImageUrl(image.image_url)}
                      alt="Current"
                      w="full"
                      h={32}
                      objectFit="cover"
                      borderRadius="lg"
                    />
                    {onDeleteExistingImage && (
                      <IconButton
                        aria-label="Xóa ảnh hiện có"
                        position="absolute"
                        top={1}
                        right={1}
                        size="xs"
                        colorPalette="red"
                        variant="solid"
                        borderRadius="full"
                        onClick={() => onDeleteExistingImage(image.id)}
                      >
                        <FiX />
                      </IconButton>
                    )}
                  </Box>
                ))}
              </SimpleGrid>
            )}

            {/* Actions */}
            <Flex gap={3} justify="flex-end" pt={4}>
              {onCancel && (
                <Button
                  type="button"
                  onClick={onCancel}
                  variant="outline"
                  px={8}
                  h="48px"
                  borderRadius="xl"
                  fontWeight="medium"
                  disabled={isLoading}
                >
                  Hủy
                </Button>
              )}
              <Button
                type="submit"
                bg="linear-gradient(135deg, #02457A 0%, #018ABE 100%)"
                color="white"
                _hover={{
                  bg: "linear-gradient(135deg, #013A67 0%, #017AAA 100%)",
                  boxShadow: "0 6px 20px rgba(2,69,122,0.4)",
                  transform: "translateY(-1px)",
                }}
                transition="all 0.2s"
                borderRadius="xl"
                fontWeight="bold"
                px={10}
                h="48px"
                loading={isLoading}
                loadingText={initialData ? "Đang cập nhật..." : "Đang đăng..."}
                boxShadow="0 4px 15px rgba(2,69,122,0.3)"
              >
                {initialData ? "Cập nhật" : "Đăng tin mới"}
              </Button>
            </Flex>
            </Stack>
          </Box>
        </Box>
      </Box>
      {pricePanel}
    </>
  )
}
