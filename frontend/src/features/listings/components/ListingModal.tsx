import { Dialog, Portal } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import type { ListingRead } from "@/client"
import { getCategoriesTree } from "@/features/home/api/marketplace.api"
import {
  ListingForm,
  type ListingFormSubmitPayload,
} from "@/features/listings/components/ListingForm"
import { useListingDetails } from "@/features/listings/hooks/useMyListings"

type ListingModalProps = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  editingListing?: ListingRead | null
  onDeleteExistingImage?: (imageId: string) => void
  onSubmit: (payload: ListingFormSubmitPayload) => Promise<void>
  isLoading?: boolean
}

export function ListingModal({
  isOpen,
  onOpenChange,
  editingListing,
  onDeleteExistingImage,
  onSubmit,
  isLoading = false,
}: ListingModalProps) {
  const [showAiPanel, setShowAiPanel] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setShowAiPanel(false)
    }
  }, [isOpen])

  const categoriesQuery = useQuery({
    queryKey: ["categories", "tree"],
    queryFn: () => getCategoriesTree(),
    enabled: isOpen,
  })

  const listingDetailsQuery = useListingDetails(editingListing?.id ?? "")

  const categoryTree = categoriesQuery.data ?? []
  const handleFormSubmit = async (payload: ListingFormSubmitPayload) => {
    await onSubmit(payload)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(e) => onOpenChange(e.open)}
      size="xl"
      placement="center"
      motionPreset="slide-in-bottom"
    >
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.600" />
        <Dialog.Positioner>
          <Dialog.Content
            maxW={showAiPanel ? "1080px" : "2xl"}
            w="full"
            maxH="90vh"
            bg="transparent"
            boxShadow="none"
            borderRadius="none"
            overflow="visible"
            display="flex"
            flexDirection={{ base: "column", lg: "row" }}
            alignItems="stretch"
            justifyContent="center"
            gap={6}
            transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          >
            <ListingForm
              initialData={
                editingListing
                  ? {
                      title: editingListing.title,
                      description: editingListing.description || "",
                      price: parseInt(editingListing.price, 10),
                      category_id: editingListing.category_id,
                      condition_grade: editingListing.condition_grade,
                      is_negotiable: editingListing.is_negotiable,
                    }
                  : undefined
              }
              existingImages={listingDetailsQuery.data?.images ?? []}
              onDeleteExistingImage={onDeleteExistingImage}
              categories={categoryTree}
              onSubmit={handleFormSubmit}
              onCancel={handleCancel}
              isLoading={isLoading}
              title={editingListing ? "Sửa tin đăng" : "Đăng tin mới"}
              showAiPanel={showAiPanel}
              setShowAiPanel={setShowAiPanel}
            />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
