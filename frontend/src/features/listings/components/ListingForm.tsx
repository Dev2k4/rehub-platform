import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Box,
  Button,
  Stack,
  Text,
  Input as ChakraInput,
  Textarea,
  NativeSelect,
  Flex,
  SimpleGrid,
  IconButton,
  Image,
} from "@chakra-ui/react"
import { FiCamera, FiTrash2 } from "react-icons/fi"
import { useState } from "react"

const listingSchema = z.object({
  title: z.string().min(5, "Tiêu đề ít nhất 5 ký tự").max(200),
  description: z.string().min(20, "Mô tả ít nhất 20 ký tự").max(2000),
  price: z.coerce.number().positive("Giá phải lớn hơn 0"),
  category_id: z.coerce.number().positive("Chọn danh mục"),
  condition_grade: z.string().min(1, "Chọn tình trạng"),
  is_negotiable: z.boolean().default(false),
})

type ListingFormData = z.infer<typeof listingSchema>

interface ListingFormProps {
  initialData?: Partial<ListingFormData>
  onSubmit: (data: ListingFormData) => void
  isLoading?: boolean
  onCancel?: () => void
}

export function ListingForm({
  initialData,
  onSubmit,
  isLoading = false,
  onCancel,
}: ListingFormProps) {
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    // @ts-ignore - zod resolver type coercion issue
    resolver: zodResolver(listingSchema),
    defaultValues: initialData || {
      condition_grade: "GOOD",
      is_negotiable: false,
    },
  })

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

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit as any)}>
      <Stack gap={6}>
        {/* Title */}
        <Box>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.5rem" }}>
            Tiêu đề
          </label>
          <ChakraInput
            {...register("title")}
            type="text"
            placeholder="Ví dụ: Điện thoại iPhone 13 Pro Max"
            borderColor={errors.title ? "red.500" : "gray.300"}
          />
          {errors.title && (
            <Text color="red.500" fontSize="sm" mt={1}>
              {errors.title.message}
            </Text>
          )}
        </Box>

        {/* Description */}
        <Box>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.5rem" }}>
            Mô tả
          </label>
          <Textarea
            {...register("description")}
            placeholder="Mô tả chi tiết về sản phẩm..."
            minH="120px"
            borderColor={errors.description ? "red.500" : "gray.300"}
          />
          {errors.description && (
            <Text color="red.500" fontSize="sm" mt={1}>
              {errors.description.message}
            </Text>
          )}
        </Box>

        {/* Price */}
        <Box>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.5rem" }}>
            Giá (VNĐ)
          </label>
          <ChakraInput
            {...register("price")}
            type="number"
            placeholder="0"
            borderColor={errors.price ? "red.500" : "gray.300"}
          />
          {errors.price && (
            <Text color="red.500" fontSize="sm" mt={1}>
              {errors.price.message}
            </Text>
          )}
        </Box>

        {/* Category */}
        <Box>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.5rem" }}>
            Danh mục
          </label>
          <NativeSelect.Root>
            <NativeSelect.Field
              {...register("category_id")}
              borderColor={errors.category_id ? "red.500" : "gray.300"}
            >
              <option value="">Chọn danh mục</option>
              <option value="1">Điện tử</option>
              <option value="2">Quần áo</option>
              <option value="3">Sách</option>
              <option value="4">Đồ gia dụng</option>
            </NativeSelect.Field>
          </NativeSelect.Root>
          {errors.category_id && (
            <Text color="red.500" fontSize="sm" mt={1}>
              {errors.category_id.message}
            </Text>
          )}
        </Box>

        {/* Condition */}
        <Box>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.5rem" }}>
            Tình trạng
          </label>
          <NativeSelect.Root>
            <NativeSelect.Field
              {...register("condition_grade")}
              borderColor={errors.condition_grade ? "red.500" : "gray.300"}
            >
              <option value="NEW">Mới</option>
              <option value="LIKE_NEW">Như mới</option>
              <option value="GOOD">Tốt</option>
              <option value="FAIR">Trung bình</option>
            </NativeSelect.Field>
          </NativeSelect.Root>
          {errors.condition_grade && (
            <Text color="red.500" fontSize="sm" mt={1}>
              {errors.condition_grade.message}
            </Text>
          )}
        </Box>

        {/* Negotiable */}
        <Box>
          <label style={{ fontSize: "0.875rem" }}>
            <input
              {...register("is_negotiable")}
              type="checkbox"
              style={{ marginRight: "0.5rem" }}
            />
            Có thể thương lượng giá
          </label>
        </Box>

        {/* Images */}
        <Box>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.5rem" }}>
            Hình ảnh
          </label>
          <Box
            border="2px dashed"
            borderColor="gray.300"
            borderRadius="lg"
            p={6}
            textAlign="center"
            cursor="pointer"
            _hover={{ borderColor: "blue.500", bg: "blue.50" }}
            transition="all 0.2s"
            onClick={() => document.getElementById("image-input")?.click()}
          >
            <Flex align="center" justify="center" gap={2} color="gray.600">
              <FiCamera size={20} />
              <Text>Chọn ảnh hoặc kéo thả</Text>
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

          {/* Image preview */}
          {previewImages.length > 0 && (
            <SimpleGrid columns={4} gap={4} mt={4}>
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
                    colorScheme="red"
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
        </Box>

        {/* Actions */}
        <Flex gap={3} justify="flex-end" pt={4}>
          {onCancel && (
            <Button type="button" onClick={onCancel} variant="outline" disabled={isLoading}>
              Hủy
            </Button>
          )}
          <Button type="submit" colorScheme="blue" disabled={isLoading}>
            {initialData ? "Cập nhật" : "Đăng tin"}
          </Button>
        </Flex>
      </Stack>
    </Box>
  )
}
