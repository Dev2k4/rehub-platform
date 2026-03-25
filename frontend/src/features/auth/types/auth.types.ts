// Auth types and interfaces

export interface LocalUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  role: "user" | "seller" | "admin";
  trust_score: number;
  rating_avg: number;
  rating_count: number;
  completed_orders: number;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AuthResponse extends AuthTokens {
  user: LocalUser;
}

export enum AuthErrorCode {
  EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED",
  INACTIVE_USER = "INACTIVE_USER",
  INVALID_TOKEN = "INVALID_TOKEN",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  NETWORK_ERROR = "NETWORK_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  statusCode?: number;
}
