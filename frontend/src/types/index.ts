/**
 * Shared TypeScript types for ReHub
 */

// ============================================
// User Types
// ============================================

export type UserRole = "user" | "admin"

export interface User {
  id: string
  email: string
  full_name: string
  phone?: string
  avatar_url?: string
  bio?: string
  province?: string
  district?: string
  ward?: string
  address_detail?: string
  role: UserRole
  is_active: boolean
  is_verified: boolean
  trust_score: number
  rating_avg: number
  rating_count: number
  completed_orders: number
  created_at: string
  updated_at: string
}

export interface UserPublicProfile {
  id: string
  full_name: string
  avatar_url?: string
  bio?: string
  province?: string
  district?: string
  trust_score: number
  rating_avg: number
  rating_count: number
  completed_orders: number
  created_at: string
}

// ============================================
// Listing Types
// ============================================

export type ConditionGrade = "new" | "like_new" | "good" | "fair"
export type ListingStatus = "pending" | "active" | "hidden" | "sold" | "rejected"

export interface ListingImage {
  id: string
  image_url: string
  is_primary: boolean
  order: number
}

export interface Listing {
  id: string
  seller_id: string
  category_id: string
  title: string
  slug: string
  description: string
  price: number
  is_negotiable: boolean
  condition_grade: ConditionGrade
  status: ListingStatus
  view_count: number
  province?: string
  district?: string
  ward?: string
  address_detail?: string
  rejection_reason?: string
  created_at: string
  updated_at: string
  images: ListingImage[]
  seller?: UserPublicProfile
  category?: Category
}

export interface ListingCard {
  id: string
  title: string
  price: number
  is_negotiable: boolean
  condition_grade: ConditionGrade
  status: ListingStatus
  province?: string
  primary_image_url?: string
  created_at: string
  seller?: {
    id: string
    full_name: string
    avatar_url?: string
    rating_avg: number
  }
}

// ============================================
// Category Types
// ============================================

export interface Category {
  id: string
  name: string
  slug: string
  icon?: string
  description?: string
  parent_id?: string
  is_active: boolean
  listing_count: number
  children?: Category[]
}

// ============================================
// Offer Types
// ============================================

export type OfferStatus = "pending" | "accepted" | "rejected" | "countered" | "expired"

export interface Offer {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  offer_price: number
  message?: string
  status: OfferStatus
  parent_offer_id?: string
  created_at: string
  updated_at: string
  listing?: Listing
  buyer?: UserPublicProfile
  seller?: UserPublicProfile
}

// ============================================
// Order Types
// ============================================

export type OrderStatus = "pending" | "completed" | "cancelled"

export interface Order {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  offer_id?: string
  final_price: number
  status: OrderStatus
  cancellation_reason?: string
  created_at: string
  updated_at: string
  listing?: Listing
  buyer?: UserPublicProfile
  seller?: UserPublicProfile
}

// ============================================
// Review Types
// ============================================

export interface Review {
  id: string
  order_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment?: string
  created_at: string
  reviewer?: UserPublicProfile
}

// ============================================
// Notification Types
// ============================================

export type NotificationType =
  | "offer_received"
  | "offer_accepted"
  | "offer_rejected"
  | "offer_countered"
  | "offer_expired"
  | "order_created"
  | "order_completed"
  | "order_cancelled"
  | "listing_approved"
  | "listing_rejected"
  | "review_received"

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, unknown>
  is_read: boolean
  created_at: string
}

// ============================================
// API Types
// ============================================

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

export interface ApiError {
  detail: string | { msg: string; type: string }[]
}

// ============================================
// Component Props Types
// ============================================

export type Size = "xs" | "sm" | "md" | "lg" | "xl"
export type Variant = "default" | "primary" | "secondary" | "destructive" | "outline" | "ghost"
export type ColorVariant = "default" | "success" | "warning" | "destructive" | "info" | "muted"
