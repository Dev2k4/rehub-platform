import { ApiError, AuthService, OpenAPI } from "@/client"
import type { AuthError, AuthResponse } from "@/features/auth/types/auth.types"
import { AuthErrorCode } from "@/features/auth/types/auth.types"
import { refreshAccessTokenIfPossible } from "@/features/auth/utils/auth.refresh"
import { getAccessToken } from "@/features/auth/utils/auth.storage"
import type { RegisterInput } from "../utils/auth.schemas"

export async function registerUser(
  data: RegisterInput,
): Promise<{ message: string }> {
  try {
    const response = await AuthService.registerApiV1AuthRegisterPost({
      requestBody: {
        email: data.email,
        phone: data.phone || undefined,
        password: data.password,
        full_name: data.fullName,
      },
    })

    return response as unknown as { message: string }
  } catch (error) {
    throw mapAuthError(error)
  }
}

export async function loginUser(
  email: string,
  password: string,
): Promise<AuthResponse> {
  try {
    const response = await AuthService.loginApiV1AuthLoginPost({
      formData: {
        username: email, // OAuth2PasswordRequestForm expects 'username'
        password: password,
      },
    })

    return response as AuthResponse
  } catch (error) {
    throw mapAuthError(error)
  }
}

export async function verifyEmailToken(
  token: string,
): Promise<{ message: string }> {
  try {
    return await postAuthJson<{ message: string }>(
      "/api/v1/auth/verify-email",
      { token },
    )
  } catch (error) {
    throw mapAuthError(error)
  }
}

export async function resendVerificationEmail(
  email: string,
): Promise<{ message: string }> {
  try {
    return await postAuthJson<{ message: string }>(
      "/api/v1/auth/resend-verification",
      { email },
    )
  } catch (error) {
    throw mapAuthError(error)
  }
}

export async function forgotPassword(
  email: string,
): Promise<{ message: string }> {
  try {
    return await postAuthJson<{ message: string }>(
      "/api/v1/auth/forgot-password",
      { email },
    )
  } catch (error) {
    throw mapAuthError(error)
  }
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<{ message: string }> {
  try {
    return await postAuthJson<{ message: string }>(
      "/api/v1/auth/reset-password",
      {
        token,
        new_password: newPassword,
      },
    )
  } catch (error) {
    throw mapAuthError(error)
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await AuthService.logoutApiV1AuthLogoutPost()
  } catch (error) {
    // Even if logout fails on server, clear local tokens
    throw mapAuthError(error)
  }
}

export async function sendPhoneOtp(phone?: string): Promise<{
  message: string
  debug_otp?: string | null
}> {
  return await postAuthJson<{ message: string; debug_otp?: string | null }>(
    "/api/v1/auth/send-phone-otp",
    { phone },
  )
}

export async function verifyPhoneOtp(otpCode: string): Promise<{
  message: string
}> {
  return await postAuthJson<{ message: string }>(
    "/api/v1/auth/verify-phone-otp",
    { otp_code: otpCode },
  )
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<AuthResponse> {
  try {
    return await postAuthJson<AuthResponse>("/api/v1/auth/refresh", {
      refresh_token: refreshToken,
    })
  } catch (error) {
    throw mapAuthError(error)
  }
}

function mapAuthError(error: unknown): AuthError {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 409:
        if (((error.body as any)?.detail || "").includes("not verified")) {
          return {
            code: AuthErrorCode.EMAIL_NOT_VERIFIED,
            message:
              "Email này đã được đăng ký nhưng chưa xác thực. Hệ thống đã gửi lại email xác thực, vui lòng kiểm tra hộp thư.",
            statusCode: 409,
          }
        }
        return {
          code: AuthErrorCode.EMAIL_ALREADY_EXISTS,
          message:
            "Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.",
          statusCode: 409,
        }
      case 401: {
        // Could be invalid credentials or invalid token
        const detail = (error.body as any)?.detail || ""
        if (detail.includes("Email") || detail.includes("password")) {
          return {
            code: AuthErrorCode.INVALID_CREDENTIALS,
            message: "Email hoặc mật khẩu không chính xác",
            statusCode: 401,
          }
        }
        return {
          code: AuthErrorCode.INVALID_TOKEN,
          message: "Token không hợp lệ. Vui lòng đăng nhập lại.",
          statusCode: 401,
        }
      }
      case 403:
        return {
          code: AuthErrorCode.EMAIL_NOT_VERIFIED,
          message: "Email chưa được xác thực. Vui lòng kiểm tra email của bạn.",
          statusCode: 403,
        }
      case 400: {
        const detail400 = (error.body as any)?.detail || ""
        if (detail400.includes("Inactive")) {
          return {
            code: AuthErrorCode.INACTIVE_USER,
            message:
              "Tài khoản của bạn đã bị vô hiệu hóa. Liên hệ hỗ trợ để được giúp đỡ.",
            statusCode: 400,
          }
        }
        if (detail400.includes("Invalid") || detail400.includes("expired")) {
          return {
            code: AuthErrorCode.INVALID_TOKEN,
            message: "Mã xác thực không hợp lệ hoặc đã hết hạn.",
            statusCode: 400,
          }
        }
        return {
          code: AuthErrorCode.UNKNOWN_ERROR,
          message: detail400 || "Lỗi xác thực. Vui lòng thử lại.",
          statusCode: 400,
        }
      }
      case 429:
        return {
          code: AuthErrorCode.RATE_LIMIT_EXCEEDED,
          message:
            "Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.",
          statusCode: 429,
        }
      case 422: {
        const validationErrors = (error.body as any)?.detail
        const firstError =
          Array.isArray(validationErrors) &&
          validationErrors[0] &&
          "msg" in validationErrors[0]
            ? validationErrors[0].msg
            : "Dữ liệu không hợp lệ"
        return {
          code: AuthErrorCode.UNKNOWN_ERROR,
          message: firstError,
          statusCode: 422,
        }
      }
      default: {
        const defaultDetail =
          (error.body as any)?.detail || "Có lỗi xảy ra. Vui lòng thử lại."
        return {
          code: AuthErrorCode.UNKNOWN_ERROR,
          message: defaultDetail,
          statusCode: error.status,
        }
      }
    }
  }

  // Network error
  if (error instanceof Error) {
    if (error.message.includes("fetch") || error.message.includes("network")) {
      return {
        code: AuthErrorCode.NETWORK_ERROR,
        message: "Lỗi mạng. Vui lòng kiểm tra kết nối internet của bạn.",
      }
    }
  }

  return {
    code: AuthErrorCode.UNKNOWN_ERROR,
    message: "Có lỗi không xác định xảy ra. Vui lòng thử lại.",
  }
}

async function postAuthJson<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const getHeaders = (tokenOverride?: string | null): HeadersInit => {
    const token = tokenOverride ?? getAccessToken()
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  }

  let response = await fetch(`${OpenAPI.BASE}${path}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  })

  if (response.status === 401) {
    const refreshedToken = await refreshAccessTokenIfPossible()
    if (refreshedToken) {
      response = await fetch(`${OpenAPI.BASE}${path}`, {
        method: "POST",
        headers: getHeaders(refreshedToken),
        body: JSON.stringify(body),
      })
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const fakeError = {
      status: response.status,
      body: errorData,
    } as unknown as ApiError
    throw fakeError
  }

  return await response.json()
}
