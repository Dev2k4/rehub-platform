import { useEffect } from "react"
import { Dialog, Portal, Button, Input, Flex, VStack, Text, Box } from "@chakra-ui/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import type { CategoryRead } from "@/client"
import { useCreateCategory, useUpdateCategory } from "../hooks/useAdminCategories"

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

export function CategoryFormModal({ open, onOpenChange, category }: CategoryFormModalProps) {
  const isEdit = !!category
  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    // @ts-ignore
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      icon_url: "",
    },
  })

  // Reset form when category changes
  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        slug: category.slug || "",
        icon_url: category.icon_url || "",
      })
    } else {
      reset({ name: "", slug: "", icon_url: "" })
    }
  }, [category, reset])

  const onSubmit = (data: CategoryFormData) => {
    const payload = {
      name: data.name,
      slug: data.slug || null,
      icon_url: data.icon_url || null,
      parent_id: null, // Simple version without parent support
    }

    if (isEdit && category) {
      updateMutation.mutate(
        { categoryId: category.id, data: payload },
        {
          onSuccess: () => {
            onOpenChange(false)
            reset()
          },
        }
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

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => {
        onOpenChange(e.open)
        if (!e.open) reset()
      }}
    >
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.600" />
        <Dialog.Positioner>
          <Dialog.Content maxW="xl" borderRadius="xl">
            <Dialog.Header>
              <Dialog.Title fontSize="lg" fontWeight="semibold" color="gray.900">
                {isEdit ? "Sửa danh mục" : "Thêm danh mục mới"}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <form onSubmit={handleSubmit(onSubmit)}>
                <VStack gap={4} align="stretch">
                  {/* Name */}
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
                      Tên danh mục *
                    </Text>
                    <Input {...register("name")} placeholder="Điện thoại, Laptop, ..." size="md" />
                    {errors.name && (
                      <Text fontSize="sm" color="red.600" mt={1}>
                        {errors.name.message}
                      </Text>
                    )}
                  </Box>

                  {/* Slug */}
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
                      Slug (tùy chọn)
                    </Text>
                    <Input
                      {...register("slug")}
                      placeholder="dien-thoai, laptop, ..."
                      size="md"
                    />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Để trống để tự động tạo từ tên
                    </Text>
                  </Box>

                  {/* Icon URL */}
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
                      Icon URL (tùy chọn)
                    </Text>
                    <Input
                      {...register("icon_url")}
                      placeholder="https://example.com/icon.png"
                      size="md"
                    />
                    {errors.icon_url && (
                      <Text fontSize="sm" color="red.600" mt={1}>
                        {errors.icon_url.message}
                      </Text>
                    )}
                  </Box>
                </VStack>
              </form>
            </Dialog.Body>
            <Dialog.Footer>
              <Flex gap={3} justify="flex-end" w="full">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  Hủy
                </Button>
                <Button
                  colorPalette="blue"
                  onClick={handleSubmit(onSubmit)}
                  loading={createMutation.isPending || updateMutation.isPending}
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
