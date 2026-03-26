import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
} from "@chakra-ui/react";
import { FiCamera, FiTrash2 } from "react-icons/fi";
import { useState } from "react";
import type { CategoryTree } from "@/client";

const listingSchema = z.object({
  title: z.string().min(5, "Tiêu đề ít nhất 5 ký tự").max(200),
  description: z.string().min(20, "Mô tả ít nhất 20 ký tự").max(2000),
  price: z.coerce.number().positive("Giá phải lớn hơn 0"),
  category_id: z.string().min(1, "Chọn danh mục"),
  condition_grade: z.string().min(1, "Chọn tình trạng"),
  is_negotiable: z.boolean().default(false),
});

type ListingFormData = z.infer<typeof listingSchema>;

interface ListingFormProps {
  initialData?: Partial<ListingFormData>;
  categories?: CategoryTree[];
  onSubmit: (data: ListingFormData) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

export function ListingForm({
  initialData,
  categories = [],
  onSubmit,
  isLoading = false,
  onCancel,
}: ListingFormProps) {
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

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
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles([...selectedFiles, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImages((prev) => [...prev, event.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit as any)}>
      <Stack gap={6}>
        {/* Title */}
        <Box>
          <Text
            display="block"
            fontSize="sm"
            fontWeight="semibold"
            mb={2}
            color="gray.700"
          >
            Tiêu đề
          </Text>
          <ChakraInput
            {...register("title")}
            type="text"
            placeholder="Ví dụ: Điện thoại iPhone 13 Pro Max"
            bg="gray.50"
            borderRadius="xl"
            border="1px solid"
            borderColor={errors.title ? "red.500" : "gray.200"}
            _focus={{
              bg: "white",
              borderColor: "blue.500",
              ring: "1px",
              ringColor: "blue.500",
            }}
          />
          {errors.title && (
            <Text color="red.500" fontSize="sm" mt={1}>
              {errors.title.message}
            </Text>
          )}
        </Box>

        {/* Description */}
        <Box>
          <Text
            display="block"
            fontSize="sm"
            fontWeight="semibold"
            mb={2}
            color="gray.700"
          >
            Mô tả
          </Text>
          <Textarea
            {...register("description")}
            placeholder="Mô tả chi tiết về sản phẩm..."
            minH="120px"
            bg="gray.50"
            borderRadius="xl"
            border="1px solid"
            borderColor={errors.description ? "red.500" : "gray.200"}
            _focus={{
              bg: "white",
              borderColor: "blue.500",
              ring: "1px",
              ringColor: "blue.500",
            }}
          />
          {errors.description && (
            <Text color="red.500" fontSize="sm" mt={1}>
              {errors.description.message}
            </Text>
          )}
        </Box>

        {/* Price */}
        <Box>
          <Text
            display="block"
            fontSize="sm"
            fontWeight="semibold"
            mb={2}
            color="gray.700"
          >
            Giá (VNĐ)
          </Text>
          <ChakraInput
            id="price"
            {...register("price")}
            type="number"
            placeholder="0"
            bg="gray.50"
            borderRadius="xl"
            border="1px solid"
            borderColor={errors.price ? "red.500" : "gray.200"}
            _focus={{
              bg: "white",
              borderColor: "blue.500",
              ring: "1px",
              ringColor: "blue.500",
            }}
          />
          {errors.price && (
            <Text color="red.500" fontSize="sm" mt={1}>
              {errors.price.message}
            </Text>
          )}
        </Box>

        {/* Category */}
        <Box>
          <Text
            display="block"
            fontSize="sm"
            fontWeight="semibold"
            mb={2}
            color="gray.700"
          >
            Danh mục
          </Text>
          <NativeSelect.Root>
            <NativeSelect.Field
              {...register("category_id")}
              bg="gray.50"
              borderRadius="xl"
              border="1px solid"
              borderColor={errors.category_id ? "red.500" : "gray.200"}
              _focus={{
                bg: "white",
                borderColor: "blue.500",
                ring: "1px",
                ringColor: "blue.500",
              }}
            >
              <option value="">Chọn danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
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
          <Text
            display="block"
            fontSize="sm"
            fontWeight="semibold"
            mb={2}
            color="gray.700"
          >
            Tình trạng
          </Text>
          <NativeSelect.Root>
            <NativeSelect.Field
              {...register("condition_grade")}
              bg="gray.50"
              borderRadius="xl"
              border="1px solid"
              borderColor={errors.condition_grade ? "red.500" : "gray.200"}
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
          {errors.condition_grade && (
            <Text color="red.500" fontSize="sm" mt={1}>
              {errors.condition_grade.message}
            </Text>
          )}
        </Box>

        {/* Negotiable */}
        <Box>
          <Flex align="center" gap={2} cursor="pointer" as="label">
            <input
              {...register("is_negotiable")}
              type="checkbox"
              style={{
                width: "16px",
                height: "16px",
                cursor: "pointer",
                accentColor: "#2563EB",
              }}
            />
            <Text fontSize="sm" fontWeight="medium" color="gray.700">
              Có thể thương lượng giá
            </Text>
          </Flex>
        </Box>

        {/* Images */}
        <Box>
          <Text
            display="block"
            fontSize="sm"
            fontWeight="semibold"
            mb={2}
            color="gray.700"
          >
            Hình ảnh
          </Text>
          <Box
            border="2px dashed"
            borderColor="gray.200"
            borderRadius="xl"
            p={8}
            bg="gray.50"
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
            bg="blue.600"
            color="white"
            _hover={{ bg: "blue.700" }}
            _disabled={{ opacity: 0.6, cursor: "not-allowed" }}
            borderRadius="xl"
            fontWeight="bold"
            px={10}
            h="48px"
            transition="all 0.2s"
            disabled={isLoading}
          >
            {initialData ? "Cập nhật" : "Đăng tin"}
          </Button>
        </Flex>
      </Stack>
    </Box>
  );
}
