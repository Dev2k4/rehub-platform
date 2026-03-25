/**
 * API Endpoints Configuration
 * Centralized API paths - NO hard-coded endpoints in services
 */

const BASE = '/api/v1'

// ============================================
// AUTH ENDPOINTS
// ============================================
export const AUTH_API = {
  register: `${BASE}/auth/register`,
  login: `${BASE}/auth/login`,
  logout: `${BASE}/auth/logout`,
  refresh: `${BASE}/auth/refresh`,
  verifyEmail: `${BASE}/auth/verify-email`,
  forgotPassword: `${BASE}/auth/forgot-password`,
  resetPassword: `${BASE}/auth/reset-password`,
} as const

// ============================================
// USER ENDPOINTS
// ============================================
export const USER_API = {
  me: `${BASE}/users/me`,
  profile: (id: string) => `${BASE}/users/${id}/profile`,
  updateMe: `${BASE}/users/me`,
  uploadAvatar: `${BASE}/users/me/avatar`,
} as const

// ============================================
// LISTING ENDPOINTS
// ============================================
export const LISTING_API = {
  list: `${BASE}/listings`,
  detail: (id: string) => `${BASE}/listings/${id}`,
  create: `${BASE}/listings`,
  update: (id: string) => `${BASE}/listings/${id}`,
  delete: (id: string) => `${BASE}/listings/${id}`,
  mine: `${BASE}/listings/me`,

  // Images
  uploadImage: (id: string) => `${BASE}/listings/${id}/images`,
  deleteImage: (id: string, imageId: string) => `${BASE}/listings/${id}/images/${imageId}`,
  reorderImages: (id: string) => `${BASE}/listings/${id}/images/reorder`,
} as const

// ============================================
// CATEGORY ENDPOINTS
// ============================================
export const CATEGORY_API = {
  list: `${BASE}/categories`,
  detail: (slug: string) => `${BASE}/categories/${slug}`,
} as const

// ============================================
// OFFER ENDPOINTS
// ============================================
export const OFFER_API = {
  create: `${BASE}/offers`,
  detail: (id: string) => `${BASE}/offers/${id}`,
  mine: `${BASE}/offers/me`,
  sent: `${BASE}/offers/me/sent`,
  received: `${BASE}/offers/me/received`,
  forListing: (listingId: string) => `${BASE}/offers/listing/${listingId}`,
  accept: (id: string) => `${BASE}/offers/${id}/accept`,
  reject: (id: string) => `${BASE}/offers/${id}/reject`,
  counter: (id: string) => `${BASE}/offers/${id}/counter`,
} as const

// ============================================
// ORDER ENDPOINTS
// ============================================
export const ORDER_API = {
  create: `${BASE}/orders`,
  list: `${BASE}/orders`,
  detail: (id: string) => `${BASE}/orders/${id}`,
  mine: `${BASE}/orders/me`,
  complete: (id: string) => `${BASE}/orders/${id}/complete`,
  cancel: (id: string) => `${BASE}/orders/${id}/cancel`,
} as const

// ============================================
// REVIEW ENDPOINTS
// ============================================
export const REVIEW_API = {
  create: `${BASE}/reviews`,
  forUser: (userId: string) => `${BASE}/reviews/user/${userId}`,
} as const

// ============================================
// NOTIFICATION ENDPOINTS
// ============================================
export const NOTIFICATION_API = {
  list: `${BASE}/notifications`,
  unreadCount: `${BASE}/notifications/unread-count`,
  markRead: (id: string) => `${BASE}/notifications/${id}/read`,
  markAllRead: `${BASE}/notifications/read-all`,
} as const

// ============================================
// ADMIN ENDPOINTS
// ============================================
export const ADMIN_API = {
  // Listings
  pendingListings: `${BASE}/admin/listings/pending`,
  approveListing: (id: string) => `${BASE}/admin/listings/${id}/approve`,
  rejectListing: (id: string) => `${BASE}/admin/listings/${id}/reject`,

  // Users
  users: `${BASE}/admin/users`,
  userDetail: (id: string) => `${BASE}/admin/users/${id}`,
  banUser: (id: string) => `${BASE}/admin/users/${id}/ban`,
  unbanUser: (id: string) => `${BASE}/admin/users/${id}/unban`,

  // Categories
  categories: `${BASE}/admin/categories`,
  createCategory: `${BASE}/admin/categories`,
  updateCategory: (id: string) => `${BASE}/admin/categories/${id}`,
  deleteCategory: (id: string) => `${BASE}/admin/categories/${id}`,

  // Stats
  stats: `${BASE}/admin/stats`,
} as const

// ============================================
// WEBSOCKET
// ============================================
export const WS_ENDPOINTS = {
  notifications: '/ws/notifications',
} as const

// ============================================
// COMBINED API OBJECT
// ============================================
export const API = {
  auth: AUTH_API,
  user: USER_API,
  listing: LISTING_API,
  category: CATEGORY_API,
  offer: OFFER_API,
  order: ORDER_API,
  review: REVIEW_API,
  notification: NOTIFICATION_API,
  admin: ADMIN_API,
  ws: WS_ENDPOINTS,
} as const
