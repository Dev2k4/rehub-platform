import {
  Box,
  Input as ChakraInput,
  Dialog,
  Flex,
  IconButton,
  Image,
  NativeSelect,
  Portal,
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
import { FiCamera, FiStar, FiTrash2 } from "react-icons/fi"
import { usePriceSuggestion, PriceSuggestionResponse } from "@/features/listings/hooks/usePriceSuggestion"
import { z } from "zod"
import type { CategoryTree } from "@/client"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field } from "@/components/ui/field"
import { InputGroup } from "@/components/ui/input-group"

const listingSchema = z.object({
  title: z.string().min(5, "Tiêu đề ít nhất 5 ký tự").max(200),
  description: z.string().min(20, "Mô tả ít nhất 20 ký tự").max(2000),
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
  onSubmit: (payload: ListingFormSubmitPayload) => Promise<void> | void
  isLoading?: boolean
  onCancel?: () => void
}

export function ListingForm({
  initialData,
  categories = [],
  onSubmit,
  isLoading = false,
  onCancel,
}: ListingFormProps) {
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedParentId, setSelectedParentId] = useState<string>("")
  const [hasSuggestedPrice, setHasSuggestedPrice] = useState(false)
  const [suggestionData, setSuggestionData] = useState<PriceSuggestionResponse | null>(null)
  const [priceModalOpen, setPriceModalOpen] = useState(false)
  const { isLoading: isLoadingPrice, error: priceError, suggestPrice } = usePriceSuggestion()

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
  const watchDescription = watch("description")
  const watchCondition = watch("condition_grade")

  const canShowPriceIcon = useMemo(() => {
    return (
      !hasSuggestedPrice &&
      (watchTitle || "").length >= 5 &&
      (watchDescription || "").length >= 20 &&
      !!watchCondition &&
      !isLoadingPrice
    )
  }, [watchTitle, watchDescription, watchCondition, hasSuggestedPrice, isLoadingPrice])

  const handlePriceSuggestion = async () => {
    const query = `${watchTitle} - ${watchDescription}`
    const context = {
      category: selectedParent?.name || "",
      condition: watchCondition || "",
    }

    const result = await suggestPrice(query, context)
    if (result && (result.price_low || result.price_high)) {
      setSuggestionData(result)
      setHasSuggestedPrice(true)
      setPriceModalOpen(true)
      console.log("Gợi ý giá thành công:", result.summary)
    } else if (priceError) {
      console.warn("Không thể gợi ý giá:", priceError)
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

  return (
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
                  disabled={isLoadingPrice || hasSuggestedPrice}
                  size="sm"
                  colorPalette="blue"
                  variant="ghost"
                  me={2}
                  title="Gợi ý giá dựa trên sản phẩm tương tự"
                >
                  {isLoadingPrice ? <Spinner size="sm" /> : <FiStar size={18} />}
                </IconButton>
              )
            }
          >
            <ChakraInput
              id="price"
              {...register("price")}
              type="number"
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

          {!suggestionData && (
            <Box
              borderRadius="lg"
              border="1px dashed"
              borderColor="gray.200"
              bg="transparent"
              px={4}
              py={3}
              mt={3}
            >
              <Text fontSize="sm" color="gray.600">
                Chưa có gợi ý giá. Điền tiêu đề, mô tả và chọn tình trạng, sau đó bấm biểu tượng để lấy khoảng giá.
              </Text>
            </Box>
          )}
          {hasSuggestedPrice && (
            <Text fontSize="xs" color="green.600" mt={1}>
              ✓ Đã nhận gợi ý giá từ AI. Đóng và mở lại modal để yêu cầu gợi ý mới.
            </Text>
          )}
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
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={() => {
                    setSelectedParentId("")
                    setValue("category_id", "", { shouldValidate: true })
                  }}
                >
                  Chọn lại
                </Button>
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

            {selectedParent && (selectedParent.children?.length ?? 0) === 0 ? (
              <Text fontSize="sm" color="gray.500">
                Danh mục này không có danh mục con. Hệ thống sẽ dùng trực tiếp
                danh mục mẹ đã chọn.
              </Text>
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
                  size="sm"
                  colorPalette="red"
                  variant="solid"
                  borderRadius="full"
                  opacity={0}
                  _groupHover={{ opacity: 1 }}
                  transition="opacity 0.2s"
                  onClick={() => removeImage(idx)}
                >
                  <FiTrash2 />
                </IconButton>
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

      <Dialog.Root
        open={priceModalOpen}
        onOpenChange={(e) => setPriceModalOpen(e.open)}
        placement="center"
      >
        <Portal>
          <Dialog.Backdrop bg="blackAlpha.400" backdropFilter="blur(2px)" />
          <Dialog.Positioner justifyContent="flex-end" px={6}>
            <Dialog.Content
              maxW="sm"
              borderRadius="1.25rem"
              p={0}
              overflow="hidden"
              boxShadow="0 20px 50px rgba(0,0,0,0.15)"
              border="1px solid"
              borderColor="gray.100"
            >
              <Flex
                justify="space-between"
                align="center"
                px={6}
                py={4}
                bg="blue.600"
              >
                <Text fontSize="md" fontWeight="700" color="white">
                  Khoảng giá gợi ý
                </Text>
                <Dialog.CloseTrigger asChild>
                  <IconButton
                    aria-label="Đóng"
                    variant="ghost"
                    size="sm"
                    color="white"
                  >
                    ×
                  </IconButton>
                </Dialog.CloseTrigger>
              </Flex>

              <Dialog.Body px={6} py={5} bg="white">
                {suggestionData ? (
                  <Box>
                    <Text fontSize="sm" color="gray.600">
                      Sản phẩm tương tự từ nhiều cửa hàng.
                    </Text>
                    <Text
                      fontSize="2xl"
                      fontWeight="800"
                      color="gray.800"
                      mt={2}
                    >
                      {suggestionData.price_low?.toLocaleString("vi-VN")} - {suggestionData.price_high?.toLocaleString("vi-VN")} VND
                    </Text>
                    <Box mt={4}>
                      <Box position="relative" h="10px" borderRadius="full" bg="gray.200">
                        <Box
                          position="absolute"
                          left="45%"
                          top="-6px"
                          w="2px"
                          h="22px"
                          bg="blue.500"
                          borderRadius="full"
                        />
                      </Box>
                      <Flex justify="space-between" mt={2} fontSize="xs" color="gray.600">
                        <Text>{suggestionData.price_low?.toLocaleString("vi-VN")} VND</Text>
                        <Text>{suggestionData.price_high?.toLocaleString("vi-VN")} VND</Text>
                      </Flex>
                    </Box>
                    <Text fontSize="sm" color="gray.600" mt={3}>
                      Độ tin cậy: {Math.round(suggestionData.confidence * 100)}% • Nguồn: {suggestionData.matched_count} shop
                    </Text>
                  </Box>
                ) : (
                  <Text fontSize="sm" color="gray.600">
                    Chưa có dữ liệu gợi ý. Vui lòng thử lại sau.
                  </Text>
                )}
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Box>
  )
}
