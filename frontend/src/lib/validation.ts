/**
 * Validation Utilities
 * Common validation functions and Zod schemas
 */

import { z } from 'zod'
import { LISTING, VALIDATION_MESSAGES } from '@/config/constants'

// ============================================
// COMMON VALIDATION FUNCTIONS
// ============================================

/** Check if value is a valid email */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/** Check if value is a valid Vietnamese phone number */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^(0|\+84)[0-9]{9,10}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

/** Check if password meets requirements */
export const isValidPassword = (password: string): boolean => {
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
  return passwordRegex.test(password)
}

/** Check if URL is valid */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// ============================================
// ZOD SCHEMAS - COMMON
// ============================================

export const emailSchema = z
  .string()
  .min(1, VALIDATION_MESSAGES.required)
  .email(VALIDATION_MESSAGES.email)

export const passwordSchema = z
  .string()
  .min(8, VALIDATION_MESSAGES.minLength(8))
  .regex(/[A-Z]/, 'Phải có ít nhất 1 chữ hoa')
  .regex(/[a-z]/, 'Phải có ít nhất 1 chữ thường')
  .regex(/[0-9]/, 'Phải có ít nhất 1 số')

export const phoneSchema = z
  .string()
  .optional()
  .refine((val) => !val || isValidPhone(val), VALIDATION_MESSAGES.phone)

export const urlSchema = z
  .string()
  .optional()
  .refine((val) => !val || isValidUrl(val), VALIDATION_MESSAGES.url)

// ============================================
// ZOD SCHEMAS - AUTH
// ============================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, VALIDATION_MESSAGES.required),
})

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, VALIDATION_MESSAGES.required),
    full_name: z
      .string()
      .min(2, VALIDATION_MESSAGES.minLength(2))
      .max(100, VALIDATION_MESSAGES.maxLength(100)),
    phone: phoneSchema,
    terms: z.boolean().refine((val) => val === true, 'Bạn phải đồng ý với điều khoản'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })

// ============================================
// ZOD SCHEMAS - LISTING
// ============================================

export const createListingSchema = z.object({
  title: z
    .string()
    .min(LISTING.title.minLength, VALIDATION_MESSAGES.minLength(LISTING.title.minLength))
    .max(LISTING.title.maxLength, VALIDATION_MESSAGES.maxLength(LISTING.title.maxLength)),
  description: z
    .string()
    .min(LISTING.description.minLength, VALIDATION_MESSAGES.minLength(LISTING.description.minLength))
    .max(LISTING.description.maxLength, VALIDATION_MESSAGES.maxLength(LISTING.description.maxLength)),
  price: z
    .number()
    .min(LISTING.price.min, VALIDATION_MESSAGES.min(LISTING.price.min))
    .max(LISTING.price.max, VALIDATION_MESSAGES.max(LISTING.price.max)),
  is_negotiable: z.boolean().default(true),
  condition_grade: z.enum(['new', 'like_new', 'good', 'fair']),
  category_id: z.string().min(1, 'Vui lòng chọn danh mục'),
  province: z.string().optional(),
  district: z.string().optional(),
})

// ============================================
// ZOD SCHEMAS - OFFER
// ============================================

export const createOfferSchema = z.object({
  listing_id: z.string().min(1, VALIDATION_MESSAGES.required),
  offer_price: z.number().min(1000, VALIDATION_MESSAGES.min(1000)),
  message: z.string().max(500, VALIDATION_MESSAGES.maxLength(500)).optional(),
})

export const counterOfferSchema = z.object({
  counter_price: z.number().min(1000, VALIDATION_MESSAGES.min(1000)),
  message: z.string().max(500, VALIDATION_MESSAGES.maxLength(500)).optional(),
})

// ============================================
// ZOD SCHEMAS - REVIEW
// ============================================

export const createReviewSchema = z.object({
  order_id: z.string().min(1, VALIDATION_MESSAGES.required),
  rating: z.number().min(1).max(5),
  comment: z.string().max(500, VALIDATION_MESSAGES.maxLength(500)).optional(),
})

// ============================================
// ZOD SCHEMAS - USER PROFILE
// ============================================

export const updateProfileSchema = z.object({
  full_name: z
    .string()
    .min(2, VALIDATION_MESSAGES.minLength(2))
    .max(100, VALIDATION_MESSAGES.maxLength(100)),
  phone: phoneSchema,
  bio: z.string().max(500, VALIDATION_MESSAGES.maxLength(500)).optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  ward: z.string().optional(),
  address_detail: z.string().max(200, VALIDATION_MESSAGES.maxLength(200)).optional(),
})

// ============================================
// TYPE INFERENCE
// ============================================

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type CreateListingFormData = z.infer<typeof createListingSchema>
export type CreateOfferFormData = z.infer<typeof createOfferSchema>
export type CounterOfferFormData = z.infer<typeof counterOfferSchema>
export type CreateReviewFormData = z.infer<typeof createReviewSchema>
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>
