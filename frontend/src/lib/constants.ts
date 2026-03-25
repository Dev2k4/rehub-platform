/**
 * Application constants
 */

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || "/api/v1"

// Pagination
export const DEFAULT_PAGE_SIZE = 20
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

// File upload
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
export const MAX_LISTING_IMAGES = 10

// Listing
export const MIN_LISTING_PRICE = 10000 // 10,000 VND
export const MAX_LISTING_PRICE = 1000000000 // 1 tỷ VND
export const MIN_DESCRIPTION_LENGTH = 50
export const MAX_DESCRIPTION_LENGTH = 2000
export const MAX_TITLE_LENGTH = 100

// Trust Score
export const INITIAL_TRUST_SCORE = 50
export const MAX_TRUST_SCORE = 100

// Condition grades with labels
export const CONDITION_GRADES = {
  new: { label: "Mới", description: "Chưa sử dụng, còn nguyên seal", color: "success" },
  like_new: { label: "Như mới", description: "Sử dụng ít, không lỗi", color: "info" },
  good: { label: "Tốt", description: "Sử dụng bình thường, hoạt động tốt", color: "warning" },
  fair: { label: "Khá", description: "Có dấu hiệu sử dụng, cần sửa nhỏ", color: "muted" },
} as const

// Listing statuses
export const LISTING_STATUSES = {
  pending: { label: "Chờ duyệt", color: "warning" },
  active: { label: "Đang hiện", color: "success" },
  hidden: { label: "Đã ẩn", color: "muted" },
  sold: { label: "Đã bán", color: "info" },
  rejected: { label: "Bị từ chối", color: "destructive" },
} as const

// Offer statuses
export const OFFER_STATUSES = {
  pending: { label: "Chờ phản hồi", color: "warning" },
  accepted: { label: "Đã chấp nhận", color: "success" },
  rejected: { label: "Đã từ chối", color: "destructive" },
  countered: { label: "Đã counter", color: "info" },
  expired: { label: "Đã hết hạn", color: "muted" },
} as const

// Order statuses
export const ORDER_STATUSES = {
  pending: { label: "Đang xử lý", color: "warning" },
  completed: { label: "Hoàn thành", color: "success" },
  cancelled: { label: "Đã hủy", color: "destructive" },
} as const

// Notification types
export const NOTIFICATION_TYPES = {
  offer_received: { label: "Offer mới", icon: "MessageSquare" },
  offer_accepted: { label: "Offer được chấp nhận", icon: "CheckCircle" },
  offer_rejected: { label: "Offer bị từ chối", icon: "XCircle" },
  offer_countered: { label: "Counter offer", icon: "RefreshCw" },
  order_created: { label: "Đơn hàng mới", icon: "ShoppingBag" },
  order_completed: { label: "Đơn hoàn thành", icon: "PackageCheck" },
  order_cancelled: { label: "Đơn bị hủy", icon: "PackageX" },
  listing_approved: { label: "Tin được duyệt", icon: "CheckCircle" },
  listing_rejected: { label: "Tin bị từ chối", icon: "XCircle" },
  review_received: { label: "Đánh giá mới", icon: "Star" },
} as const

// User roles
export const USER_ROLES = {
  user: { label: "Người dùng", level: 1 },
  admin: { label: "Quản trị viên", level: 10 },
} as const

// Routes for navigation
export const ROUTES = {
  // Public
  HOME: "/",
  BROWSE: "/browse",
  SEARCH: "/search",
  CATEGORIES: "/categories",
  CATEGORY: (slug: string) => `/categories/${slug}`,
  LISTING: (id: string) => `/listing/${id}`,
  SELLER: (id: string) => `/seller/${id}`,

  // Auth
  LOGIN: "/login",
  REGISTER: "/signup",
  VERIFY_EMAIL: "/verify-email",
  FORGOT_PASSWORD: "/recover-password",
  RESET_PASSWORD: "/reset-password",

  // Dashboard
  DASHBOARD: "/dashboard",
  DASHBOARD_OVERVIEW: "/dashboard/overview",
  DASHBOARD_PROFILE: "/dashboard/profile",
  DASHBOARD_SETTINGS: "/dashboard/settings",
  DASHBOARD_LISTINGS: "/dashboard/listings",
  DASHBOARD_LISTING_NEW: "/dashboard/listings/new",
  DASHBOARD_LISTING_EDIT: (id: string) => `/dashboard/listings/${id}/edit`,
  DASHBOARD_OFFERS_SENT: "/dashboard/offers/sent",
  DASHBOARD_OFFERS_RECEIVED: "/dashboard/offers/received",
  DASHBOARD_ORDERS: "/dashboard/orders",
  DASHBOARD_ORDER: (id: string) => `/dashboard/orders/${id}`,
  DASHBOARD_NOTIFICATIONS: "/dashboard/notifications",
  DASHBOARD_REVIEWS: "/dashboard/reviews",

  // Admin
  ADMIN: "/admin",
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_LISTINGS_PENDING: "/admin/listings/pending",
  ADMIN_USERS: "/admin/users",
  ADMIN_CATEGORIES: "/admin/categories",
  ADMIN_SETTINGS: "/admin/settings",
} as const

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: "rehub_auth_token",
  REFRESH_TOKEN: "rehub_refresh_token",
  USER: "rehub_user",
  THEME: "rehub_theme",
  RECENT_SEARCHES: "rehub_recent_searches",
  DRAFT_LISTING: "rehub_draft_listing",
} as const
