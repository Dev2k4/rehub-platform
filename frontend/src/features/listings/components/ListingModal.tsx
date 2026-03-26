import {
  Dialog,
  Portal,
  CloseButton,
} from "@chakra-ui/react"
import { ListingForm } from "@/features/listings/components/ListingForm"
import type { ListingRead } from "@/client"

type ListingModalProps = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  editingListing?: ListingRead | null
  onSubmit: (data: any) => Promise<void>
  isLoading?: boolean
}

export function ListingModal({
  isOpen,
  onOpenChange,
  editingListing,
  onSubmit,
  isLoading = false,
}: ListingModalProps) {
  const handleFormSubmit = async (data: any) => {
    await onSubmit(data)
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => onOpenChange(e.open)} size="xl">
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.600" />
        <Dialog.Positioner>
          <Dialog.Content maxW="2xl" maxH="90vh" overflowY="auto" bg="white" borderRadius="lg">
            <Dialog.Header p={6} borderBottomWidth="1px" display="flex" justifyContent="space-between" alignItems="center">
              <Dialog.Title fontSize="xl" fontWeight="semibold">
                {editingListing ? "Sửa tin đăng" : "Đăng tin mới"}
              </Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" onClick={handleCancel} />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body p={6}>
              <ListingForm
                initialData={
                  editingListing
                    ? {
                        title: editingListing.title,
                        description: editingListing.description || "",
                        price: parseInt(editingListing.price),
                        category_id: parseInt(editingListing.category_id),
                        condition_grade: editingListing.condition_grade,
                        is_negotiable: editingListing.is_negotiable,
                      }
                    : undefined
                }
                onSubmit={handleFormSubmit}
                onCancel={handleCancel}
                isLoading={isLoading}
              />
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
