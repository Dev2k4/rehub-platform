/**
 * API Response Types
 * Types for API responses - aligned with backend schemas
 */

import type {
  ConditionGrade,
  ListingStatus,
  NotificationType,
  OfferStatus,
  OrderStatus,
  UserRole,
} from '@/config/constants'
import type { ID, Location, Timestamp, URLString } from './common'

// ============================================
// USER TYPES
// ============================================

export interface User {
  id: ID
  email: string
  full_name: string
  phone?: string
  avatar_url?: URLString
  bio?: string
  role: UserRole
  is_active: boolean
  is_verified: boolean
  trust_score: number
  rating_avg: number
  rating_count: number
  completed_orders: number
  created_at: Timestamp
  updated_at: Timestamp

  // Address
  province?: string
  district?: string
  ward?: string
  address_detail?: string
}

export interface UserPublicProfile {
  id: ID
  full_name: string
  avatar_url?: URLString
  bio?: string
  trust_score: number
  rating_avg: number
  rating_count: number
  completed_orders: number
  created_at: Timestamp
}

// ============================================
// AUTH TYPES
// ============================================

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  full_name: string
  phone?: string
}

export interface AuthResponse extends AuthTokens {
  user: User
}

// ============================================
// CATEGORY TYPES
// ============================================

export interface Category {
  id: ID
  name: string
  slug: string
  icon?: string
  parent_id?: ID
  listing_count: number
  children?: Category[]
}

export interface CategoryTree extends Category {
  children: Category[]
}

// ============================================
// LISTING TYPES
// ============================================

export interface ListingImage {
  id: ID
  image_url: URLString
  is_primary: boolean
  order: number
}

export interface Listing {
  id: ID
  seller_id: ID
  title: string
  slug: string
  description: string
  price: number
  is_negotiable: boolean
  condition_grade: ConditionGrade
  status: ListingStatus
  category_id: ID
  view_count: number
  created_at: Timestamp
  updated_at: Timestamp

  // Relations (optional, included when needed)
  images?: ListingImage[]
  seller?: UserPublicProfile
  category?: Category

  // Location
  province?: string
  district?: string
}

export interface ListingDetail extends Listing {
  images: ListingImage[]
  seller: UserPublicProfile
  category: Category
}

export interface CreateListingRequest {
  title: string
  description: string
  price: number
  is_negotiable: boolean
  condition_grade: ConditionGrade
  category_id: ID
  province?: string
  district?: string
}

export interface UpdateListingRequest extends Partial<CreateListingRequest> {
  status?: ListingStatus
}

// ============================================
// OFFER TYPES
// ============================================

export interface Offer {
  id: ID
  listing_id: ID
  buyer_id: ID
  seller_id: ID
  offer_price: number
  message?: string
  status: OfferStatus
  counter_price?: number
  created_at: Timestamp
  updated_at: Timestamp

  // Relations
  listing?: Listing
  buyer?: UserPublicProfile
  seller?: UserPublicProfile
}

export interface CreateOfferRequest {
  listing_id: ID
  offer_price: number
  message?: string
}

export interface CounterOfferRequest {
  counter_price: number
  message?: string
}

// ============================================
// ORDER TYPES
// ============================================

export interface Order {
  id: ID
  listing_id: ID
  buyer_id: ID
  seller_id: ID
  offer_id?: ID
  final_price: number
  status: OrderStatus
  notes?: string
  created_at: Timestamp
  updated_at: Timestamp
  completed_at?: Timestamp
  cancelled_at?: Timestamp
  cancel_reason?: string

  // Relations
  listing?: Listing
  buyer?: UserPublicProfile
  seller?: UserPublicProfile
}

export interface CreateOrderRequest {
  listing_id: ID
  notes?: string
}

// ============================================
// REVIEW TYPES
// ============================================

export interface Review {
  id: ID
  order_id: ID
  reviewer_id: ID
  reviewee_id: ID
  rating: number
  comment?: string
  created_at: Timestamp

  // Relations
  reviewer?: UserPublicProfile
  order?: Order
}

export interface CreateReviewRequest {
  order_id: ID
  rating: number
  comment?: string
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export interface Notification {
  id: ID
  user_id: ID
  type: NotificationType
  title: string
  message: string
  data?: Record<string, unknown>
  is_read: boolean
  created_at: Timestamp
}

// ============================================
// API ERROR TYPES
// ============================================

export interface ApiErrorDetail {
  loc: (string | number)[]
  msg: string
  type: string
}

export interface ApiErrorResponse {
  detail: string | ApiErrorDetail[]
}

// ============================================
// API RESPONSE WRAPPERS
// ============================================

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiListResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  total_pages: number
}
