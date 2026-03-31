import {
  Box,
  Input as ChakraInput,
  Flex,
  IconButton,
  Image,
  NativeSelect,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FiCamera, FiTrash2 } from "react-icons/fi";
import { z } from "zod";
import type { CategoryTree } from "@/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { InputGroup } from "@/components/ui/input-group";

const listingSchema = z.object({
  title: z.string().min(5, "Tiêu đề ít nhất 5 ký tự").max(200),
  description: z.string().min(20, "Mô tả ít nhất 20 ký tự").max(2000),
  price: z.coerce.number().positive("Giá phải lớn hơn 0"),
  category_id: z.string().min(1, "Chọn danh mục"),
  condition_grade: z.string().min(1, "Chọn tình trạng"),
  is_negotiable: z.boolean().default(false),
});

type ListingFormData = z.infer<typeof listingSchema>;

export interface ListingFormSubmitPayload {
  data: ListingFormData;
  files: File[];
}

interface ListingFormProps {
  initialData?: Partial<ListingFormData>;
  categories?: CategoryTree[];
  onSubmit: (payload: ListingFormSubmitPayload) => Promise<void> | void;
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
    control,
    formState: { errors },
  } = useForm({
    // @ts-expect-error - zod resolver type coercion issue
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

  const onFormSubmit = async (data: ListingFormData) => {
    await onSubmit({ data, files: selectedFiles });
  };

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

        {/* Price */}
        <Field
          label="Giá (VNĐ)"
          invalid={!!errors.price}
          errorText={errors.price?.message}
        >
          <InputGroup
            width="full"
            startElement={
              <Box
                color="gray.400"
                display="flex"
                alignItems="center"
                ps={4}
              ></Box>
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
              ps="10"
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
          <NativeSelect.Root>
            <NativeSelect.Field
              {...register("category_id")}
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
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
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
    </Box>
  );
}
