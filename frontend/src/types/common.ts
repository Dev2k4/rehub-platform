/**
 * Common Types
 * Reusable type definitions
 */

import type { ReactNode } from 'react'

// ============================================
// UTILITY TYPES
// ============================================

/** Make all properties optional recursively */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/** Extract the element type from an array */
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never

/** Make specific keys required */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>

/** Make specific keys optional */
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/** Exclude null and undefined from T */
export type NonNullable<T> = T extends null | undefined ? never : T

// ============================================
// COMPONENT TYPES
// ============================================

/** Common props for components with children */
export interface WithChildren {
  children?: ReactNode
}

/** Common props for components with className */
export interface WithClassName {
  className?: string
}

/** Combined common props */
export interface BaseProps extends WithChildren, WithClassName {}

/** Props for components that can be disabled */
export interface Disableable {
  disabled?: boolean
}

/** Props for form inputs */
export interface FormFieldProps extends Disableable {
  name: string
  label?: string
  placeholder?: string
  required?: boolean
  error?: string
  helperText?: string
}

// ============================================
// DATA TYPES
// ============================================

/** Standard ID type */
export type ID = string

/** Timestamp string (ISO 8601) */
export type Timestamp = string

/** URL string */
export type URLString = string

/** Email string */
export type Email = string

/** Phone number string */
export type Phone = string

// ============================================
// UI STATE TYPES
// ============================================

/** Loading state */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

/** Async state wrapper */
export interface AsyncState<T> {
  data: T | null
  status: LoadingState
  error: Error | null
}

/** Sort direction */
export type SortDirection = 'asc' | 'desc'

/** Sort configuration */
export interface SortConfig {
  field: string
  direction: SortDirection
}

// ============================================
// PAGINATION TYPES
// ============================================

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

// ============================================
// FILTER TYPES
// ============================================

export interface BaseFilters extends PaginationParams {
  search?: string
  sortBy?: string
  sortDir?: SortDirection
}

export interface ListingFilters extends BaseFilters {
  category?: string
  condition?: string
  priceMin?: number
  priceMax?: number
  province?: string
  status?: string
  sellerId?: string
}

export interface OfferFilters extends BaseFilters {
  status?: string
  listingId?: string
}

export interface OrderFilters extends BaseFilters {
  status?: string
  role?: 'buyer' | 'seller'
}

// ============================================
// SELECT/OPTION TYPES
// ============================================

export interface SelectOption<T = string> {
  value: T
  label: string
  disabled?: boolean
}

export interface GroupedSelectOptions<T = string> {
  label: string
  options: SelectOption<T>[]
}

// ============================================
// ACTION RESULT TYPES
// ============================================

export interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

export interface MutationResult<T = void> {
  data?: T
  error?: Error | null
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
}

// ============================================
// EVENT HANDLER TYPES
// ============================================

export type VoidFunction = () => void
export type AsyncVoidFunction = () => Promise<void>
export type ValueChangeHandler<T> = (value: T) => void
export type AsyncValueChangeHandler<T> = (value: T) => Promise<void>

// ============================================
// LOCATION TYPES
// ============================================

export interface Location {
  province?: string
  district?: string
  ward?: string
  address?: string
}

export interface Coordinates {
  lat: number
  lng: number
}
