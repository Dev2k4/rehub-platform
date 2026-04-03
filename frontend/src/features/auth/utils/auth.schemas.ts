import { z } from "zod"

export const registerSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().max(20, "Số điện thoại không hợp lệ").optional().or(z.literal("")),
  password: z
    .string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
    .regex(/[A-Z]/, "Mật khẩu phải chứa ít nhất một chữ hoa")
    .regex(/[a-z]/, "Mật khẩu phải chứa ít nhất một chữ thường")
    .regex(/[0-9]/, "Mật khẩu phải chứa ít nhất một chữ số"),
  fullName: z
    .string()
    .min(2, "Tên phải có ít nhất 2 ký tự")
    .max(255, "Tên không được vượt quá 255 ký tự"),
  rememberMe: z.boolean().default(false),
})

export type RegisterInput = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
  rememberMe: z.boolean().default(false),
})

export type LoginInput = z.infer<typeof loginSchema>

export const verifyEmailSchema = z.object({
  token: z
    .string()
    .min(1, "Vui lòng nhập mã xác thực hoặc sử dụng link từ email"),
})

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>

export const resendVerificationSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
})

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Thiếu token khôi phục mật khẩu"),
  newPassword: z
    .string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
    .regex(/[A-Z]/, "Mật khẩu phải chứa ít nhất một chữ hoa")
    .regex(/[a-z]/, "Mật khẩu phải chứa ít nhất một chữ thường")
    .regex(/[0-9]/, "Mật khẩu phải chứa ít nhất một chữ số"),
})

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
