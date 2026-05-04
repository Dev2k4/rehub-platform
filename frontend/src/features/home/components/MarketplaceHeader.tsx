// import {
//   Box,
//   Button,
//   Link as ChakraLink,
//   Flex,
//   IconButton,
//   Input,
//   Menu,
//   Portal,
//   Separator,
//   Spinner,
//   Text,
// } from "@chakra-ui/react"
// import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
// import { Link, useNavigate } from "@tanstack/react-router"
// import {
//   FiBell,
//   FiMenu,
//   FiPackage,
//   FiPlusCircle,
//   FiSearch,
// } from "react-icons/fi"
// import type { NotificationRead } from "@/client"
// import { InputGroup } from "@/components/ui/input-group"
// import { toaster } from "@/components/ui/toaster"
// import { logoutUser } from "@/features/auth/api/auth.api"
// import { useAuthUser } from "@/features/auth/hooks/useAuthUser"
// import { clearTokens } from "@/features/auth/utils/auth.storage"
// import {
//   getMyNotifications,
//   getUnreadNotificationsCount,
//   markAllNotificationsAsRead,
//   markNotificationAsRead,
// } from "@/features/notifications/api/notifications.api"
// import { getNotificationDestination } from "@/features/notifications/utils/notificationNavigation"
// import { AuthButtons } from "./AuthButtons"
// import { UserDropdownMenu } from "./UserDropdownMenu"

// type MarketplaceHeaderProps = {
//   keyword?: string
//   onKeywordChange?: (value: string) => void
//   onOpenCategoryMenu?: () => void
//   onOpenListingModal?: () => void
// }

// export function MarketplaceHeader({
//   keyword = "",
//   onKeywordChange,
//   onOpenCategoryMenu,
//   onOpenListingModal,
// }: MarketplaceHeaderProps) {
//   const { user, isAuthenticated, isLoading } = useAuthUser()
//   const queryClient = useQueryClient()
//   const navigate = useNavigate()
//   const notificationsQuery = useQuery({
//     queryKey: ["notifications"],
//     queryFn: () => getMyNotifications(),
//     enabled: isAuthenticated,
//   })
//   const unreadCountQuery = useQuery({
//     queryKey: ["notifications", "unread-count"],
//     queryFn: () => getUnreadNotificationsCount(),
//     enabled: isAuthenticated,
//   })

//   const markNotificationMutation = useMutation({
//     mutationFn: markNotificationAsRead,
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["notifications"] })
//       queryClient.invalidateQueries({
//         queryKey: ["notifications", "unread-count"],
//       })
//     },
//   })

//   const markAllNotificationsMutation = useMutation({
//     mutationFn: markAllNotificationsAsRead,
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["notifications"] })
//       queryClient.invalidateQueries({
//         queryKey: ["notifications", "unread-count"],
//       })
//     },
//   })

//   const handleLogout = async () => {
//     try {
//       await logoutUser()
//     } catch (error) {
//       console.error("Logout error:", error)
//     } finally {
//       clearTokens()
//       queryClient.setQueryData(["auth", "user"], null)
//       queryClient.removeQueries({ queryKey: ["auth", "user"] })
//       queryClient.invalidateQueries({ queryKey: ["auth"] })
//       toaster.create({ title: "Đã đăng xuất thành công", type: "info" })
//       navigate({ to: "/" })
//     }
//   }

//   const unreadCount = unreadCountQuery.data ?? 0

//   const handleNotificationClick = async (notification: NotificationRead) => {
//     if (!notification.is_read && !markNotificationMutation.isPending) {
//       try {
//         await markNotificationMutation.mutateAsync(notification.id)
//       } catch (error) {
//         console.error("Failed to mark notification as read:", error)
//       }
//     }

//     const destination = getNotificationDestination(notification)
//     navigate(destination as never)
//   }

//   const handleMarkAllAsRead = async () => {
//     if (unreadCount === 0 || markAllNotificationsMutation.isPending) {
//       return
//     }

//     try {
//       await markAllNotificationsMutation.mutateAsync()
//     } catch (error) {
//       console.error("Failed to mark all notifications as read:", error)
//     }
//   }

//   return (
//     <Box
//       as="header"
//       position="sticky"
//       top={0}
//       zIndex={50}
//       borderBottom="1px"
//       borderColor="whiteAlpha.300"
//       bg="whiteAlpha.700"
//       backdropFilter="blur(20px)"
//       px={{ base: 4, md: 6 }}
//       py={{ base: 3, md: 4 }}
//       boxShadow="0 4px 30px rgba(0,0,0,0.06)"
//     >
//       <Flex
//         mx="auto"
//         maxW="1400px"
//         direction={{ base: "column", sm: "row" }}
//         gap={{ base: 3, sm: 6, md: 8 }}
//         align={{ sm: "center" }}
//         justify={{ sm: "space-between" }}
//       >
//         {/* Top Header Mobile / Full Header Left Desktop */}
//         <Flex
//           align="center"
//           justify="space-between"
//           w={{ base: "full", sm: "auto" }}
//         >
//           <Flex align="center" gap={{ base: 3, md: 4 }}>
//             <IconButton
//               display={{
//                 base: onOpenCategoryMenu ? "inline-flex" : "none",
//                 lg: "none",
//               }}
//               aria-label="Open category menu"
//               onClick={onOpenCategoryMenu}
//               h={10}
//               w={10}
//               borderRadius="xl"
//               bg="gray.100"
//               color="gray.700"
//               _hover={{ bg: "gray.200" }}
//             >
//               <FiMenu size={20} />
//             </IconButton>

//             <ChakraLink asChild>
//               <Link to="/">
//                 <Flex align="center" gap={2}>
//                   <Box
//                     display="flex"
//                     h={10}
//                     w={10}
//                     alignItems="center"
//                     justifyContent="center"
//                     borderRadius="xl"
//                     bg="linear-gradient(135deg, #02457A 0%, #018ABE 100%)"
//                   >
//                     <Box as={FiPackage} w={6} h={6} color="white" />
//                   </Box>
//                   <Text fontSize="xl" fontWeight="semibold" color="gray.900">
//                     ReHub
//                   </Text>
//                 </Flex>
//               </Link>
//             </ChakraLink>
//           </Flex>

//           {/* Mobile Right Icons (hidden on sm+) */}
//           <Flex display={{ base: "flex", sm: "none" }} align="center" gap={2}>
//             <IconButton
//               aria-label="Post listing"
//               onClick={() => {
//                 if (onOpenListingModal) {
//                   onOpenListingModal()
//                   return
//                 }
//                 navigate({ to: "/" })
//               }}
//               borderRadius="full"
//               bg="blue.600"
//               color="white"
//               h={10}
//               w={10}
//               _hover={{ bg: "blue.700" }}
//             >
//               <FiPlusCircle size={20} />
//             </IconButton>
//           </Flex>
//         </Flex>

//         {/* Search Input */}
//         <Box flex={1} w="full" maxW="2xl">
//           <InputGroup
//             width="full"
//             startElement={
//               <Box color="gray.400" display="flex" alignItems="center" ps={4}>
//                 <FiSearch size={18} />
//               </Box>
//             }
//           >
//             <Input
//               value={keyword}
//               onChange={(event) => onKeywordChange?.(event.target.value)}
//               placeholder="Tìm kiếm sản phẩm, danh mục, hoặc người bán..."
//               w="full"
//               borderRadius="full"
//               border="1px solid"
//               borderColor="gray.400"
//               bg="whiteAlpha.600"
//               backdropFilter="blur(8px)"
//               py={3}
//               ps="10"
//               pr={4}
//               fontSize="sm"
//               color="gray.900"
//               transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
//               _placeholder={{ color: "gray.500" }}
//               _focus={{
//                 bg: "white",
//                 ring: "2",
//                 ringColor: "blue.500",
//                 ringOffset: "2",
//                 ringOffsetColor: "transparent",
//                 borderColor: "blue.200",
//               }}
//             />
//           </InputGroup>
//         </Box>

//         {/* Desktop Right Icons (hidden on mobile) */}
//         <Flex display={{ base: "none", sm: "flex" }} align="center" gap={2}>
//           {isAuthenticated ? (
//             <Menu.Root>
//               <Menu.Trigger asChild>
//                 <IconButton
//                   aria-label="Notifications"
//                   position="relative"
//                   borderRadius="full"
//                   p={2.5}
//                   color="gray.600"
//                   variant="ghost"
//                   _hover={{ bg: "gray.100" }}
//                 >
//                   <FiBell size={20} />
//                   {unreadCount > 0 && (
//                     <Box
//                       position="absolute"
//                       right="6px"
//                       top="6px"
//                       minW={4}
//                       h={4}
//                       px={1}
//                       borderRadius="full"
//                       bg="red.500"
//                       color="white"
//                       fontSize="10px"
//                       fontWeight="bold"
//                       display="flex"
//                       alignItems="center"
//                       justifyContent="center"
//                       lineHeight={1}
//                     >
//                       {unreadCount > 9 ? "9+" : unreadCount}
//                     </Box>
//                   )}
//                 </IconButton>
//               </Menu.Trigger>
//               <Portal>
//                 <Menu.Positioner>
//                   <Menu.Content
//                     w="96"
//                     bg="white"
//                     boxShadow="xl"
//                     borderRadius="lg"
//                     border="1px"
//                     borderColor="gray.200"
//                     overflow="hidden"
//                   >
//                     <Flex align="center" justify="space-between" px={4} py={3}>
//                       <Text fontWeight="semibold" color="gray.900">
//                         Thông báo
//                       </Text>
//                       <Button
//                         size="xs"
//                         variant="ghost"
//                         colorPalette="blue"
//                         onClick={handleMarkAllAsRead}
//                         loading={markAllNotificationsMutation.isPending}
//                         disabled={unreadCount === 0}
//                       >
//                         Đánh dấu tất cả
//                       </Button>
//                     </Flex>
//                     <Separator />
//                     <Box maxH="340px" overflowY="auto">
//                       {notificationsQuery.isLoading ? (
//                         <Flex py={6} justify="center">
//                           <Spinner size="sm" color="blue.500" />
//                         </Flex>
//                       ) : notificationsQuery.data &&
//                         notificationsQuery.data.length > 0 ? (
//                         notificationsQuery.data.map((notification) => (
//                           <Menu.Item
//                             key={notification.id}
//                             value={`notification-${notification.id}`}
//                             py={0}
//                             px={0}
//                             onClick={() =>
//                               handleNotificationClick(notification)
//                             }
//                           >
//                             <Box
//                               w="full"
//                               px={4}
//                               py={3}
//                               bg={notification.is_read ? "white" : "blue.50"}
//                               borderBottom="1px"
//                               borderColor="gray.100"
//                             >
//                               <Text
//                                 fontSize="sm"
//                                 fontWeight="semibold"
//                                 color="gray.900"
//                                 lineClamp={1}
//                               >
//                                 {notification.title}
//                               </Text>
//                               <Text
//                                 fontSize="xs"
//                                 color="gray.600"
//                                 mt={0.5}
//                                 lineClamp={2}
//                               >
//                                 {notification.message}
//                               </Text>
//                               <Text fontSize="xs" color="gray.500" mt={1}>
//                                 {new Date(
//                                   notification.created_at,
//                                 ).toLocaleString("vi-VN")}
//                               </Text>
//                             </Box>
//                           </Menu.Item>
//                         ))
//                       ) : (
//                         <Box px={4} py={8} textAlign="center">
//                           <Text fontSize="sm" color="gray.500">
//                             Bạn chưa có thông báo nào.
//                           </Text>
//                         </Box>
//                       )}
//                     </Box>
//                     <Separator />
//                     <Menu.Item value="notifications-page" asChild>
//                       <ChakraLink asChild w="full" px={4} py={3}>
//                         <Link to="/notifications">Xem tất cả thông báo</Link>
//                       </ChakraLink>
//                     </Menu.Item>
//                   </Menu.Content>
//                 </Menu.Positioner>
//               </Portal>
//             </Menu.Root>
//           ) : (
//             <IconButton
//               aria-label="Notifications"
//               borderRadius="full"
//               p={2.5}
//               color="gray.600"
//               variant="ghost"
//               _hover={{ bg: "gray.100" }}
//             >
//               <FiBell size={20} />
//             </IconButton>
//           )}

//           {isAuthenticated && (
//             <ChakraLink asChild>
//               <Link to="/offers">
//                 <Button
//                   borderRadius="full"
//                   variant="outline"
//                   bg="whiteAlpha.600"
//                   backdropFilter="blur(8px)"
//                   borderColor="whiteAlpha.400"
//                   color="gray.700"
//                   px={4}
//                   py={2.5}
//                   fontSize="sm"
//                   fontWeight="medium"
//                   transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
//                   _hover={{
//                     bg: "whiteAlpha.800",
//                     boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
//                     transform: "translateY(-1px)",
//                   }}
//                 >
//                   Offers
//                 </Button>
//               </Link>
//             </ChakraLink>
//           )}

//           <ChakraLink asChild>
//             <Link to="/">
//               <Button
//                 onClick={(e) => {
//                   if (onOpenListingModal) {
//                     e.preventDefault()
//                     onOpenListingModal()
//                   }
//                 }}
//                 borderRadius="full"
//                 bg="linear-gradient(135deg, #02457A 0%, #018ABE 100%)"
//                 color="white"
//                 px={4}
//                 py={2.5}
//                 fontSize="sm"
//                 fontWeight="medium"
//                 transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
//                 boxShadow="0 4px 15px rgba(2,69,122,0.3)"
//                 _hover={{
//                   bg: "linear-gradient(135deg, #013A67 0%, #017AAA 100%)",
//                   transform: "translateY(-1px)",
//                   boxShadow: "0 6px 20px rgba(2,69,122,0.4)",
//                 }}
//               >
//                 <Flex align="center" gap={2}>
//                   <FiPlusCircle size={16} />
//                   <span>Đăng tin</span>
//                 </Flex>
//               </Button>
//             </Link>
//           </ChakraLink>

//           {/* Auth Section: Login buttons OR User menu */}
//           {isLoading ? (
//             <Box
//               w={10}
//               h={10}
//               bg="gray.200"
//               borderRadius="full"
//               animation="pulse 2s infinite"
//             />
//           ) : isAuthenticated && user ? (
//             <UserDropdownMenu user={user} onLogout={handleLogout} />
//           ) : (
//             <AuthButtons />
//           )}
//         </Flex>
//       </Flex>
//     </Box>
//   )
// }

import {
  Box,
  Button,
  Link as ChakraLink,
  Container,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  Menu,
  Portal,
  Separator,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  FiBell,
  FiCheckCircle,
  FiHeart,
  FiMenu,
  FiPlusCircle,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiStar,
  FiTrendingUp,
  FiTruck,
  FiX,
} from "react-icons/fi";
import type { NotificationRead } from "@/client";
import { InputGroup } from "@/components/ui/input-group";
import { logoutUser } from "@/features/auth/api/auth.api";
import { useAuthUser } from "@/features/auth/hooks/useAuthUser";
import { clearTokens } from "@/features/auth/utils/auth.storage";
import {
  getMyNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/features/notifications/api/notifications.api";
import { getNotificationDestination } from "@/features/notifications/utils/notificationNavigation";
import { translateNotification } from "@/features/notifications/utils/notificationTranslation";
import { AuthButtons } from "./AuthButtons";
import { UserDropdownMenu } from "./UserDropdownMenu";
import { ListingModal } from "@/features/listings/components/ListingModal";
import { useCreateListing, useUploadListingImage } from "@/features/listings/hooks/useMyListings";
import type { ListingFormSubmitPayload } from "@/features/listings/components/ListingForm";
import { toaster } from "@/components/ui/toaster";
import { useState } from "react";

type MarketplaceHeaderProps = {
  keyword?: string;
  onKeywordChange?: (value: string) => void;
  onOpenCategoryMenu?: () => void;
  onOpenListingModal?: () => void;
  showMarquee?: boolean;
};

export function MarketplaceHeader({
  keyword = "",
  onKeywordChange,
  onOpenCategoryMenu,
  onOpenListingModal,
  showMarquee = false,
}: MarketplaceHeaderProps) {
  const { user, isAuthenticated, isLoading } = useAuthUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Local listing modal state for global posting
  const [isLocalModalOpen, setIsLocalModalOpen] = useState(false);
  const createMutation = useCreateListing();
  const uploadImageMutation = useUploadListingImage();

  const handleCreateListing = async (payload: ListingFormSubmitPayload) => {
    try {
      const created = await createMutation.mutateAsync(payload.data);
      if (payload.files.length > 0) {
        for (let i = 0; i < payload.files.length; i++) {
          await uploadImageMutation.mutateAsync({
            listingId: created.id,
            file: payload.files[i],
            isPrimary: i === 0,
          });
        }
      }
      setIsLocalModalOpen(false);
      toaster.create({ title: "Đăng tin thành công!", type: "success" });
      navigate({ to: "/" }); // Navigate to home to see the listing
    } catch (error: any) {
      toaster.create({
        title: error?.message || "Đăng tin thất bại",
        type: "error",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.error(e);
    } finally {
      clearTokens();
      queryClient.clear();
      navigate({ to: "/auth/login", replace: true });
    }
  };

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getMyNotifications(),
    enabled: isAuthenticated,
  });
  const unreadCountQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => getUnreadNotificationsCount(),
    enabled: isAuthenticated,
  });
  const markNotificationMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    },
  });
  const markAllNotificationsMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    },
  });
  const unreadCount = unreadCountQuery.data ?? 0;

  const handleNotificationClick = async (notification: NotificationRead) => {
    if (!notification.is_read && !markNotificationMutation.isPending) {
      try {
        await markNotificationMutation.mutateAsync(notification.id);
      } catch {}
    }
    const destination = getNotificationDestination(notification);
    navigate(destination as never);
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || markAllNotificationsMutation.isPending) return;
    try {
      await markAllNotificationsMutation.mutateAsync();
    } catch {}
  };

  const tickerItems = [
    { text: "Chào mừng đến ReHub Marketplace!", icon: FiTrendingUp },
    { text: "Hàng nghìn sản phẩm đang chờ bạn", icon: FiTrendingUp },
    { text: "Thanh toán an toàn & bảo mật", icon: FiShield },
    { text: "Giao hàng toàn quốc", icon: FiTruck },
    { text: "Mua bán đồ cũ – Lan tỏa giá trị mới", icon: FiRefreshCw },
    { text: "Bảo vệ người mua với hệ thống escrow", icon: FiCheckCircle },
    { text: "Hàng triệu người tin dùng mỗi ngày", icon: FiStar },
  ];
  // Duplicate the items so the marquee loops seamlessly
  const allItems = [...tickerItems, ...tickerItems];

  return (
    <Box
      as="header"
      w="100%"
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={1000}
    >
      {/* Main header */}
      <Box
        w="100%"
        h={{ base: "auto", md: "5.5rem" }}
        bg="rgba(221, 237, 250, 1)"
        backdropFilter="blur(1.25rem)"
        css={{ WebkitBackdropFilter: "blur(1.25rem)" }}
        borderBottom="1px solid"
        borderColor="gray.200"
        boxShadow="0 2px 20px rgba(0, 0, 0, 0.05)"
        py={{ base: "0.75rem", md: 0 }}
      >
        <Container maxW="1440px" h="100%" px="2%" mx="auto">
          <Flex
            align="center"
            justify="space-between"
            h="100%"
            gap={{ base: "0.5rem", md: "2%" }}
            direction="row"
            wrap="nowrap"
          >
            <HStack gap={{ base: "0.5rem", md: "1.5rem" }} flexShrink={0}>
              <IconButton
                variant="ghost"
                onClick={onOpenCategoryMenu}
                aria-label="Menu"
                borderRadius="0.75rem"
                h="2.5rem"
                w="2.5rem"
                border="1px solid"
                borderColor="gray.200"
                bg="white"
                display={{ base: "flex", lg: "none" }}
              >
                <FiMenu size={20} />
              </IconButton>

              <ChakraLink asChild _hover={{ textDecoration: "none" }}>
                <Link to="/">
                  <Heading
                    fontSize={{ base: "1.3rem", md: "1.75rem" }}
                    fontWeight="900"
                    bg="linear-gradient(135deg, #02457A 0%, #018ABE 100%)"
                    bgClip="text"
                    color="transparent"
                    letterSpacing="-0.02em"
                  >
                    ReHub
                  </Heading>
                </Link>
              </ChakraLink>
            </HStack>

            <Box flex="1" maxW={{ base: "100%", md: "45%" }}>
              <InputGroup
                w="100%"
                startElement={
                  <Box pl="0.85rem">
                    <FiSearch color="#9CA3AF" />
                  </Box>
                }
                endElement={
                  keyword ? (
                    <IconButton
                      size="xs"
                      variant="ghost"
                      onClick={() => onKeywordChange?.("")}
                    >
                      <FiX />
                    </IconButton>
                  ) : null
                }
              >
                <Input
                  placeholder="Bạn đang tìm gì?"
                  value={keyword}
                  onChange={(e) => onKeywordChange?.(e.target.value)}
                  bg="white"
                  border="1px solid"
                  borderColor="gray.300"
                  borderRadius="2rem"
                  _focus={{
                    borderColor: "blue.400",
                    boxShadow: "0 0 0 3px rgba(66, 153, 225, 0.1)",
                  }}
                  transition="all 0.2s ease"
                  ps={{ base: "2.75rem", md: "2.75rem" }}
                  h={{ base: "2.4rem", md: "2.75rem" }}
                  fontSize={{ base: "0.85rem", md: "1rem" }}
                />
              </InputGroup>
            </Box>

            <HStack
              gap="0.75rem"
              flexShrink={0}
              display={{ base: "none", md: "flex" }}
            >
              {/* Notification Bell */}
              {isAuthenticated ? (
                <Menu.Root>
                  <Menu.Trigger asChild>
                    <IconButton
                      aria-label="Thông báo"
                      position="relative"
                      borderRadius="full"
                      variant="ghost"
                      color="gray.700"
                      bg="whiteAlpha.700"
                      _hover={{ bg: "whiteAlpha.900" }}
                      h="2.5rem"
                      w="2.5rem"
                    >
                      <FiBell size={20} />
                      {unreadCount > 0 && (
                        <Box
                          position="absolute"
                          right="6px"
                          top="6px"
                          minW={4}
                          h={4}
                          px={1}
                          borderRadius="full"
                          bg="red.500"
                          color="white"
                          fontSize="10px"
                          fontWeight="bold"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          lineHeight={1}
                        >
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </Box>
                      )}
                    </IconButton>
                  </Menu.Trigger>
                  <Portal>
                    <Menu.Positioner>
                      <Menu.Content
                        minW="360px"
                        bg="white"
                        boxShadow="xl"
                        borderRadius="lg"
                        border="1px"
                        borderColor="gray.200"
                        overflow="hidden"
                        zIndex={2000}
                      >
                        <Flex
                          align="center"
                          justify="space-between"
                          px={4}
                          py={3}
                        >
                          <Text fontWeight="700" color="gray.900" fontSize="sm">
                            Thông báo
                          </Text>
                          <Button
                            size="xs"
                            variant="ghost"
                            colorPalette="blue"
                            onClick={handleMarkAllAsRead}
                            loading={markAllNotificationsMutation.isPending}
                            disabled={unreadCount === 0}
                          >
                            Đánh dấu tất cả
                          </Button>
                        </Flex>
                        <Separator />
                        <Box maxH="340px" overflowY="auto">
                          {notificationsQuery.isLoading ? (
                            <Flex py={6} justify="center">
                              <Spinner size="sm" color="blue.500" />
                            </Flex>
                          ) : notificationsQuery.data &&
                            notificationsQuery.data.length > 0 ? (
                            notificationsQuery.data.map((notification) => {
                              const { title, message } = translateNotification(
                                notification.title,
                                notification.message,
                              );

                              return (
                                <Menu.Item
                                  key={notification.id}
                                  value={`notification-${notification.id}`}
                                  py={0}
                                  px={0}
                                  onClick={() =>
                                    handleNotificationClick(notification)
                                  }
                                >
                                  <Box
                                    w="full"
                                    px={4}
                                    py={3}
                                    bg={
                                      notification.is_read ? "white" : "blue.50"
                                    }
                                    borderBottom="1px"
                                    borderColor="gray.100"
                                  >
                                    <Text
                                      fontSize="sm"
                                      fontWeight="semibold"
                                      color="gray.900"
                                      lineClamp={1}
                                    >
                                      {title}
                                    </Text>
                                    <Text
                                      fontSize="xs"
                                      color="gray.600"
                                      mt={0.5}
                                      lineClamp={2}
                                    >
                                      {message}
                                    </Text>
                                    <Text fontSize="xs" color="gray.500" mt={1}>
                                      {new Date(
                                        notification.created_at,
                                      ).toLocaleString("vi-VN")}
                                    </Text>
                                  </Box>
                                </Menu.Item>
                              );
                            })
                          ) : (
                            <Box px={4} py={8} textAlign="center">
                              <Text fontSize="sm" color="gray.500">
                                Bạn chưa có thông báo nào.
                              </Text>
                            </Box>
                          )}
                        </Box>
                        <Separator />
                        <Menu.Item value="notifications-page" asChild>
                          <ChakraLink asChild w="full" px={4} py={3}>
                            <Link to="/notifications">
                              Xem tất cả thông báo
                            </Link>
                          </ChakraLink>
                        </Menu.Item>
                      </Menu.Content>
                    </Menu.Positioner>
                  </Portal>
                </Menu.Root>
              ) : (
                <IconButton
                  aria-label="Thông báo"
                  borderRadius="full"
                  variant="ghost"
                  color="gray.700"
                  bg="whiteAlpha.700"
                  _hover={{ bg: "whiteAlpha.900" }}
                  h="2.5rem"
                  w="2.5rem"
                >
                  <FiBell size={20} />
                </IconButton>
              )}

              {/* Offers Button */}
              {isAuthenticated && (
                <ChakraLink asChild _hover={{ textDecoration: "none" }}>
                  <Link to="/offers">
                    <Button
                      borderRadius="2rem"
                      variant="outline"
                      bg="whiteAlpha.700"
                      borderColor="gray.300"
                      color="gray.800"
                      px="1rem"
                      h="2.5rem"
                      fontSize="0.875rem"
                      fontWeight="600"
                      _hover={{
                        bg: "whiteAlpha.900",
                        transform: "translateY(-1px)",
                      }}
                    >
                      Đề xuất giá
                    </Button>
                  </Link>
                </ChakraLink>
              )}

              {/* Post Listing button */}
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  if (onOpenListingModal) {
                    onOpenListingModal();
                  } else if (isAuthenticated) {
                    setIsLocalModalOpen(true);
                  } else {
                    toaster.create({ title: "Vui lòng đăng nhập để đăng tin", type: "info" });
                    navigate({ to: "/auth/login" });
                  }
                }}
                borderRadius="2rem"
                bg="linear-gradient(135deg, #02457A 0%, #018ABE 100%)"
                color="white"
                px="1.5rem"
                h="2.75rem"
                fontSize="0.9rem"
                fontWeight="700"
                className="animate-pulse-ring"
                _hover={{
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 15px rgba(2, 69, 122, 0.4)",
                }}
              >
                <FiPlusCircle style={{ marginRight: "0.5rem" }} />
                Đăng tin
              </Button>

              {isLoading ? (
                <Box w="2.5rem" h="2.5rem" bg="gray.100" borderRadius="50%" />
              ) : isAuthenticated && user ? (
                <UserDropdownMenu user={user} onLogout={handleLogout} />
              ) : (
                <AuthButtons />
              )}
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Marquee Ticker Bar */}
      {showMarquee && (
        <Box
          w="100%"
          bg="linear-gradient(90deg, #F97316 0%, #FB923C 50%, #F97316 100%)"
          py="0.35rem"
          overflow="hidden"
          boxShadow="0 2px 8px rgba(249,115,22,0.3)"
        >
          <Box
            className="marquee-wrapper"
            overflow="hidden"
            position="relative"
            w="100%"
          >
            <Box
              className="marquee-track"
              display="flex"
              gap="0"
              as="div"
              w="max-content"
              animation="marquee 30s linear infinite"
              _hover={{ animationPlayState: "paused" }}
            >
              {allItems.map((item, i) => {
                const Icon = item.icon;
                return (
                  <Box
                    key={i}
                    as="span"
                    fontSize={{ base: "0.7rem", md: "0.78rem" }}
                    fontWeight="600"
                    color="white"
                    whiteSpace="nowrap"
                    px="2rem"
                    display="inline-flex"
                    alignItems="center"
                    gap="0.5rem"
                  >
                    <Icon opacity={0.9} />
                    {item.text}
                    <Box as="span" opacity={0.6} mx="0.5rem">
                      •
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      )}

      {/* Global Listing Modal when not on home page */}
      {!onOpenListingModal && (
        <ListingModal
          isOpen={isLocalModalOpen}
          onOpenChange={setIsLocalModalOpen}
          onSubmit={handleCreateListing}
          isLoading={createMutation.isPending || uploadImageMutation.isPending}
        />
      )}
    </Box>
  );
}
