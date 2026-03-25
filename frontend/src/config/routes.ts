/**
 * Route Definitions
 * Centralized route paths - NO hard-coded paths in components
 */

// ============================================
// PUBLIC ROUTES
// ============================================
export const PUBLIC_ROUTES = {
  home: '/',
  browse: '/browse',
  search: '/search',
  categories: '/categories',
  categoryDetail: (slug: string) => `/categories/${slug}`,
  listing: (id: string) => `/listing/${id}`,
  seller: (id: string) => `/seller/${id}`,

  // Static pages
  howItWorks: '/how-it-works',
  help: '/help',
  about: '/about',
  terms: '/terms',
  privacy: '/privacy',
} as const

// ============================================
// AUTH ROUTES
// ============================================
export const AUTH_ROUTES = {
  login: '/login',
  register: '/register',
  verifyEmail: '/verify-email',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  sessionExpired: '/session-expired',
} as const

// ============================================
// DASHBOARD ROUTES
// ============================================
export const DASHBOARD_ROUTES = {
  root: '/dashboard',
  overview: '/dashboard/overview',
  profile: '/dashboard/profile',
  settings: '/dashboard/settings',

  // Listings
  listings: '/dashboard/listings',
  listingNew: '/dashboard/listings/new',
  listingEdit: (id: string) => `/dashboard/listings/${id}/edit`,
  listingImages: (id: string) => `/dashboard/listings/${id}/images`,
  listingOffers: (id: string) => `/dashboard/listings/${id}/offers`,

  // Offers
  offersSent: '/dashboard/offers/sent',
  offersReceived: '/dashboard/offers/received',
  offerDetail: (id: string) => `/dashboard/offers/${id}`,

  // Orders
  orders: '/dashboard/orders',
  orderDetail: (id: string) => `/dashboard/orders/${id}`,
  orderReview: (id: string) => `/dashboard/orders/${id}/review`,

  // Others
  notifications: '/dashboard/notifications',
  reviews: '/dashboard/reviews',
} as const

// ============================================
// TRANSACTION ROUTES
// ============================================
export const TRANSACTION_ROUTES = {
  checkout: (listingId: string) => `/checkout/${listingId}`,
  counterOffer: (offerId: string) => `/transactions/${offerId}/counter`,
  completeOrder: (orderId: string) => `/transactions/${orderId}/complete`,
  cancelOrder: (orderId: string) => `/transactions/${orderId}/cancel`,
} as const

// ============================================
// ADMIN ROUTES
// ============================================
export const ADMIN_ROUTES = {
  root: '/admin',
  dashboard: '/admin/dashboard',

  // Listings
  listingsPending: '/admin/listings/pending',
  listingReview: (id: string) => `/admin/listings/${id}/review`,

  // Users
  users: '/admin/users',
  userDetail: (id: string) => `/admin/users/${id}`,

  // Categories
  categories: '/admin/categories',

  // Settings
  settings: '/admin/settings',
} as const

// ============================================
// ROUTE HELPERS
// ============================================
export const ROUTES = {
  ...PUBLIC_ROUTES,
  auth: AUTH_ROUTES,
  dashboard: DASHBOARD_ROUTES,
  transaction: TRANSACTION_ROUTES,
  admin: ADMIN_ROUTES,
} as const

// ============================================
// ROUTE GUARDS CONFIG
// ============================================
export const ROUTE_CONFIG = {
  // Routes that require authentication
  protected: [
    '/dashboard',
    '/checkout',
    '/transactions',
  ],

  // Routes only for guests (redirect if logged in)
  guestOnly: [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
  ],

  // Routes that require admin role
  adminOnly: [
    '/admin',
  ],

  // Default redirect after login
  afterLogin: '/dashboard/overview',

  // Default redirect after logout
  afterLogout: '/',

  // Redirect when unauthorized
  unauthorized: '/login',

  // Redirect when forbidden (logged in but no permission)
  forbidden: '/',
} as const

// ============================================
// BREADCRUMB CONFIG
// ============================================
export const BREADCRUMB_MAP: Record<string, string> = {
  '/': 'Trang chủ',
  '/browse': 'Duyệt tin',
  '/search': 'Tìm kiếm',
  '/categories': 'Danh mục',
  '/dashboard': 'Dashboard',
  '/dashboard/overview': 'Tổng quan',
  '/dashboard/profile': 'Hồ sơ',
  '/dashboard/settings': 'Cài đặt',
  '/dashboard/listings': 'Tin đăng của tôi',
  '/dashboard/listings/new': 'Đăng tin mới',
  '/dashboard/offers/sent': 'Offers đã gửi',
  '/dashboard/offers/received': 'Offers nhận được',
  '/dashboard/orders': 'Đơn hàng',
  '/dashboard/notifications': 'Thông báo',
  '/dashboard/reviews': 'Đánh giá',
  '/admin': 'Quản trị',
  '/admin/dashboard': 'Dashboard',
  '/admin/listings/pending': 'Tin chờ duyệt',
  '/admin/users': 'Người dùng',
  '/admin/categories': 'Danh mục',
  '/admin/settings': 'Cài đặt',
}
