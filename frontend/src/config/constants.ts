/**
 * Application Constants
 * Centralized configuration - NO hard-coded values in components
 */

// ============================================
// APP CONFIG
// ============================================
export const APP_CONFIG = {
  name: 'ReHub',
  tagline: 'Mua bán đồ cũ, trao đi giá trị',
  version: '1.0.0',
  locale: 'vi-VN',
  currency: 'VND',
  timezone: 'Asia/Ho_Chi_Minh',
} as const

// ============================================
// API CONFIG
// ============================================
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
} as const

// ============================================
// PAGINATION
// ============================================
export const PAGINATION = {
  defaultPage: 1,
  defaultLimit: 12,
  limits: [12, 24, 48] as const,
  maxLimit: 100,
} as const

// ============================================
// LISTING CONSTANTS
// ============================================
export const LISTING = {
  images: {
    min: 1,
    max: 10,
    maxSizeMB: 5,
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  title: {
    minLength: 10,
    maxLength: 100,
  },
  description: {
    minLength: 50,
    maxLength: 2000,
  },
  price: {
    min: 10000,
    max: 1000000000,
  },
} as const

export const CONDITION_GRADES = {
  new: { label: 'Mới', description: 'Chưa sử dụng, còn nguyên seal', color: 'success' },
  like_new: { label: 'Như mới', description: 'Sử dụng ít, không lỗi', color: 'info' },
  good: { label: 'Tốt', description: 'Sử dụng bình thường, hoạt động tốt', color: 'warning' },
  fair: { label: 'Khá', description: 'Có dấu hiệu sử dụng', color: 'muted' },
} as const

export const LISTING_STATUS = {
  pending: { label: 'Chờ duyệt', color: 'warning' },
  active: { label: 'Đang hiện', color: 'success' },
  sold: { label: 'Đã bán', color: 'info' },
  hidden: { label: 'Đã ẩn', color: 'muted' },
  rejected: { label: 'Bị từ chối', color: 'destructive' },
} as const

// ============================================
// OFFER CONSTANTS
// ============================================
export const OFFER_STATUS = {
  pending: { label: 'Chờ phản hồi', color: 'warning' },
  accepted: { label: 'Đã chấp nhận', color: 'success' },
  rejected: { label: 'Đã từ chối', color: 'destructive' },
  countered: { label: 'Đã counter', color: 'info' },
  expired: { label: 'Hết hạn', color: 'muted' },
} as const

// ============================================
// ORDER CONSTANTS
// ============================================
export const ORDER_STATUS = {
  pending: { label: 'Đang xử lý', color: 'warning' },
  completed: { label: 'Hoàn thành', color: 'success' },
  cancelled: { label: 'Đã hủy', color: 'destructive' },
} as const

// ============================================
// USER CONSTANTS
// ============================================
export const USER_ROLES = {
  user: { label: 'Người dùng', level: 1 },
  admin: { label: 'Quản trị viên', level: 10 },
} as const

export const TRUST_SCORE = {
  min: 0,
  max: 100,
  thresholds: {
    low: 30,
    medium: 60,
    high: 80,
  },
} as const

// ============================================
// NOTIFICATION TYPES
// ============================================
export const NOTIFICATION_TYPES = {
  offer_received: { icon: 'MessageSquare', color: 'info' },
  offer_accepted: { icon: 'CheckCircle', color: 'success' },
  offer_rejected: { icon: 'XCircle', color: 'destructive' },
  offer_countered: { icon: 'RefreshCw', color: 'warning' },
  order_created: { icon: 'ShoppingBag', color: 'info' },
  order_completed: { icon: 'CheckCircle', color: 'success' },
  order_cancelled: { icon: 'XCircle', color: 'destructive' },
  listing_approved: { icon: 'CheckCircle', color: 'success' },
  listing_rejected: { icon: 'XCircle', color: 'destructive' },
  review_received: { icon: 'Star', color: 'warning' },
  system: { icon: 'Bell', color: 'muted' },
} as const

// ============================================
// UI CONSTANTS
// ============================================
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export const Z_INDEX = {
  dropdown: 50,
  sticky: 100,
  modal: 200,
  popover: 300,
  tooltip: 400,
  toast: 500,
} as const

// ============================================
// VALIDATION MESSAGES
// ============================================
export const VALIDATION_MESSAGES = {
  required: 'Trường này bắt buộc',
  email: 'Email không hợp lệ',
  minLength: (min: number) => `Tối thiểu ${min} ký tự`,
  maxLength: (max: number) => `Tối đa ${max} ký tự`,
  min: (min: number) => `Giá trị tối thiểu là ${min}`,
  max: (max: number) => `Giá trị tối đa là ${max}`,
  password: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số',
  phone: 'Số điện thoại không hợp lệ',
  url: 'URL không hợp lệ',
} as const

// ============================================
// STORAGE KEYS
// ============================================
export const STORAGE_KEYS = {
  accessToken: 'rehub_access_token',
  refreshToken: 'rehub_refresh_token',
  user: 'rehub_user',
  theme: 'rehub_theme',
  locale: 'rehub_locale',
  recentSearches: 'rehub_recent_searches',
  savedListings: 'rehub_saved_listings',
} as const

// ============================================
// QUERY KEYS (for TanStack Query)
// ============================================
export const QUERY_KEYS = {
  // Auth
  currentUser: ['user', 'current'] as const,

  // Users
  user: (id: string) => ['user', id] as const,
  userProfile: (id: string) => ['user', id, 'profile'] as const,
  userListings: (id: string) => ['user', id, 'listings'] as const,
  userReviews: (id: string) => ['user', id, 'reviews'] as const,

  // Listings
  listings: (filters?: Record<string, unknown>) => ['listings', filters] as const,
  listing: (id: string) => ['listing', id] as const,
  myListings: (filters?: Record<string, unknown>) => ['listings', 'mine', filters] as const,

  // Categories
  categories: ['categories'] as const,
  category: (slug: string) => ['category', slug] as const,

  // Offers
  offers: (filters?: Record<string, unknown>) => ['offers', filters] as const,
  offer: (id: string) => ['offer', id] as const,
  myOffersSent: ['offers', 'sent'] as const,
  myOffersReceived: ['offers', 'received'] as const,
  listingOffers: (listingId: string) => ['listing', listingId, 'offers'] as const,

  // Orders
  orders: (filters?: Record<string, unknown>) => ['orders', filters] as const,
  order: (id: string) => ['order', id] as const,
  myOrders: (role?: 'buyer' | 'seller') => ['orders', 'mine', role] as const,

  // Notifications
  notifications: ['notifications'] as const,
  unreadCount: ['notifications', 'unread-count'] as const,

  // Reviews
  reviews: (userId: string) => ['reviews', userId] as const,
} as const

// Type exports
export type ConditionGrade = keyof typeof CONDITION_GRADES
export type ListingStatus = keyof typeof LISTING_STATUS
export type OfferStatus = keyof typeof OFFER_STATUS
export type OrderStatus = keyof typeof ORDER_STATUS
export type UserRole = keyof typeof USER_ROLES
export type NotificationType = keyof typeof NOTIFICATION_TYPES
