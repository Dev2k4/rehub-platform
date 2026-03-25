import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/features/auth/utils/auth.schemas";
import { useLoginMutation } from "@/features/auth/hooks/useLoginMutation";
import { AuthErrorCode } from "@/features/auth/types/auth.types";

interface LoginFormProps {
  onError?: (error: string) => void;
}

export function LoginForm({ onError }: LoginFormProps) {
  const loginMutation = useLoginMutation();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    // @ts-ignore - Zod + React Hook Form type mismatch with default values
  } = useForm<LoginInput>({
    // @ts-ignore
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  function onSubmit(data: LoginInput) {
    loginMutation.mutate(data, {
      onError: (error: any) => {
        if (
          error?.code === AuthErrorCode.RATE_LIMIT_EXCEEDED ||
          error?.code === AuthErrorCode.EMAIL_NOT_VERIFIED
        ) {
          if (onError) {
            onError(error.message);
          }
        }
      },
    });
  }

  const getErrorMessage = () => {
    const error = loginMutation.error as any;
    if (error?.code === AuthErrorCode.EMAIL_NOT_VERIFIED) {
      return "Email của bạn chưa được xác thực. Vui lòng kiểm tra email để xác thực tài khoản.";
    }
    if (error?.code === AuthErrorCode.RATE_LIMIT_EXCEEDED) {
      return "Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.";
    }
    return error?.message || "Đã xảy ra lỗi. Vui lòng thử lại.";
  };

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          {...register("email")}
          type="email"
          placeholder="example@email.com"
          className={`w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.email ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Mật khẩu
        </label>
        <input
          {...register("password")}
          type="password"
          placeholder="••••••••"
          className={`w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.password ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
      </div>

      {/* Remember Me */}
      <div className="flex items-center">
        <input
          {...register("rememberMe")}
          type="checkbox"
          id="rememberMe"
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        />
        <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700">
          Giữ tôi đăng nhập
        </label>
      </div>

      {/* Error Message */}
      {loginMutation.isError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{getErrorMessage()}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || loginMutation.isPending}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting || loginMutation.isPending ? "Đang xử lý..." : "Đăng nhập"}
      </button>

      {/* Forgot Password Link */}
      <div className="text-center">
        <a
          href="#"
          className="text-sm text-blue-600 hover:text-blue-700"
          onClick={(e) => {
            e.preventDefault();
            // TODO: Implement forgot password
            alert("Tính năng quên mật khẩu sẽ được thêm sau");
          }}
        >
          Quên mật khẩu?
        </a>
      </div>
    </form>
  );
}
