import {
  Dialog,
  Flex,
  Input,
  Portal,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { FiEdit3, FiLink, FiPlus, FiSlash, FiTag } from "react-icons/fi"
import { z } from "zod"
import type { CategoryRead } from "@/client"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { InputGroup } from "@/components/ui/input-group"
import {
  useAdminCategoryDetail,
  useCreateCategory,
  useUpdateCategory,
} from "../hooks/useAdminCategories"

const categorySchema = z.object({
  name: z.string().min(1, "Tên danh mục là bắt buộc").max(100),
  slug: z.string().optional(),
  icon_url: z.string().url("URL không hợp lệ").optional().or(z.literal("")),
})

type CategoryFormData = z.infer<typeof categorySchema>

interface CategoryFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: CategoryRead | null
}

export function CategoryFormModal({
  open,
  onOpenChange,
  category,
}: CategoryFormModalProps) {
  const isEdit = !!category
  const categoryDetailQuery = useAdminCategoryDetail(category?.id)
  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema) as any,
    defaultValues: { name: "", slug: "", icon_url: "" },
  })

  useEffect(() => {
    const latestCategory = categoryDetailQuery.data ?? category
    if (latestCategory) {
      reset({
        name: latestCategory.name,
        slug: latestCategory.slug || "",
        icon_url: latestCategory.icon_url || "",
      })
    } else {
      reset({ name: "", slug: "", icon_url: "" })
    }
  }, [category, categoryDetailQuery.data, reset])

  const onSubmit = (data: CategoryFormData) => {
    const payload = {
      name: data.name,
      slug: data.slug || null,
      icon_url: data.icon_url || null,
      parent_id: null,
    }

    if (isEdit && category) {
      updateMutation.mutate(
        { categoryId: category.id, data: payload },
        {
          onSuccess: () => {
            onOpenChange(false)
            reset()
          },
        },
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          onOpenChange(false)
          reset()
        },
      })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => {
        onOpenChange(e.open)
        if (!e.open) reset()
      }}
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content
            maxW="lg"
            borderRadius="1.5rem"
            overflow="hidden"
            boxShadow="0 25px 60px rgba(0,0,0,0.15)"
            border="1px solid"
            borderColor="gray.100"
            p={0}
          >
            {/* Gradient Header */}
            <Flex
              px={7}
              py={5}
              align="center"
              gap={3}
              style={{
                background: "linear-gradient(135deg, #02457A 0%, #018ABE 100%)",
              }}
            >
              <Flex
                w={9}
                h={9}
                align="center"
                justify="center"
                borderRadius="lg"
                bg="whiteAlpha.200"
              >
                {isEdit ? (
                  <FiEdit3 color="white" size={18} />
                ) : (
                  <FiPlus color="white" size={18} />
                )}
              </Flex>
              <VStack align="start" gap={0}>
                <Dialog.Title fontSize="md" fontWeight="700" color="white">
                  {isEdit ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
                </Dialog.Title>
                <Text fontSize="xs" color="whiteAlpha.800">
                  {isEdit
                    ? "Cập nhật thông tin danh mục"
                    : "Điền thông tin để tạo danh mục"}
                </Text>
              </VStack>
            </Flex>

            <Dialog.Body bg="white" px={7} py={6}>
              <form onSubmit={handleSubmit(onSubmit)}>
                <Stack gap={5}>
                  <Field
                    label="Tên danh mục *"
                    invalid={!!errors.name}
                    errorText={errors.name?.message}
                  >
                    <InputGroup
                      width="full"
                      startElement={<FiTag color="#9CA3AF" />}
                    >
                      <Input
                        {...register("name")}
                        placeholder="Điện thoại, Laptop, Thời trang..."
                        ps="10"
                        borderRadius="xl"
                      />
                    </InputGroup>
                  </Field>

                  <Field
                    label="Slug (tùy chọn)"
                    helperText="Để trống để tự động tạo từ tên"
                  >
                    <InputGroup
                      width="full"
                      startElement={<FiSlash color="#9CA3AF" />}
                    >
                      <Input
                        {...register("slug")}
                        placeholder="dien-thoai, laptop, thoi-trang..."
                        ps="10"
                        borderRadius="xl"
                      />
                    </InputGroup>
                  </Field>

                  <Field
                    label="Đường dẫn icon (tùy chọn)"
                    invalid={!!errors.icon_url}
                    errorText={errors.icon_url?.message}
                  >
                    <InputGroup
                      width="full"
                      startElement={<FiLink color="#9CA3AF" />}
                    >
                      <Input
                        {...register("icon_url")}
                        placeholder="https://example.com/icon.png"
                        ps="10"
                        borderRadius="xl"
                      />
                    </InputGroup>
                  </Field>
                </Stack>
              </form>
            </Dialog.Body>

            <Dialog.Footer
              bg="gray.50"
              borderTop="1px solid"
              borderColor="gray.100"
              px={7}
              py={4}
            >
              <Flex gap={3} justify="flex-end" w="full">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                  borderRadius="xl"
                >
                  Hủy
                </Button>
                <Button
                  colorPalette="blue"
                  onClick={handleSubmit(onSubmit)}
                  loading={isPending}
                  loadingText={isEdit ? "Đang cập nhật..." : "Đang tạo..."}
                  borderRadius="xl"
                  px={6}
                >
                  {isEdit ? "Cập nhật" : "Tạo mới"}
                </Button>
              </Flex>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
