import { CloseButton, Dialog, Portal } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import type { ListingRead } from "@/client";
import { getCategoriesTree } from "@/features/home/api/marketplace.api";
import { flattenCategories } from "@/features/home/utils/marketplace.utils";
import {
  ListingForm,
  type ListingFormSubmitPayload,
} from "@/features/listings/components/ListingForm";

type ListingModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingListing?: ListingRead | null;
  onSubmit: (payload: ListingFormSubmitPayload) => Promise<void>;
  isLoading?: boolean;
};

export function ListingModal({
  isOpen,
  onOpenChange,
  editingListing,
  onSubmit,
  isLoading = false,
}: ListingModalProps) {
  const categoriesQuery = useQuery({
    queryKey: ["categories", "tree"],
    queryFn: () => getCategoriesTree(),
    enabled: isOpen,
  });

  const flatCategories = categoriesQuery.data
    ? flattenCategories(categoriesQuery.data)
    : [];
  const handleFormSubmit = async (payload: ListingFormSubmitPayload) => {
    await onSubmit(payload);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

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
            maxW="2xl"
            maxH="90vh"
            overflow="hidden"
            display="flex"
            flexDirection="column"
            bg="white"
            borderRadius="2xl"
            boxShadow="0 20px 60px rgba(0,0,0,0.12)"
          >
            <Dialog.Header
              p={6}
              pb={4}
              borderBottomWidth="1px"
              borderColor="gray.100"
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              flexShrink={0}
            >
              <Dialog.Title fontSize="xl" fontWeight="bold" color="gray.900">
                {editingListing ? "Sửa tin đăng" : "Đăng tin mới"}
              </Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" onClick={handleCancel} />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body p={6} pt={5} overflowY="auto" flex="1">
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
                categories={flatCategories}
                onSubmit={handleFormSubmit}
                onCancel={handleCancel}
                isLoading={isLoading}
              />
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
