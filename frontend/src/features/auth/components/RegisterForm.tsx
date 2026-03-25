import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/features/auth/utils/auth.schemas";
import { useRegisterMutation } from "@/features/auth/hooks/useRegisterMutation";
import { AuthErrorCode } from "@/features/auth/types/auth.types";

interface RegisterFormProps {
  onError?: (error: string) => void;
}

export function RegisterForm({ onError }: RegisterFormProps) {
  const registerMutation = useRegisterMutation();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    // @ts-ignore - Zod + React Hook Form type mismatch with default values
  } = useForm<RegisterInput>({
    // @ts-ignore
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      rememberMe: false,
    },
  });

  const password = watch("password");

  function onSubmit(data: RegisterInput) {
    registerMutation.mutate(data, {
      onError: (error: any) => {
        if (error?.code === AuthErrorCode.EMAIL_ALREADY_EXISTS && onError) {
          onError(error.message);
        }
      },
    });
  }

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

      {/* Full Name */}
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
          Họ và tên
        </label>
        <input
          {...register("fullName")}
          type="text"
          placeholder="Nguyễn Văn A"
          className={`w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.fullName ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.fullName && <p className="text-sm text-red-500 mt-1">{errors.fullName.message}</p>}
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

        {/* Password requirements */}
        {password && (
          <div className="mt-2 text-sm space-y-1">
            <div className={password.length >= 8 ? "text-green-600" : "text-gray-500"}>
              ✓ Ít nhất 8 ký tự
            </div>
            <div className={/[A-Z]/.test(password) ? "text-green-600" : "text-gray-500"}>
              ✓ Chứa chữ hoa
            </div>
            <div className={/[a-z]/.test(password) ? "text-green-600" : "text-gray-500"}>
              ✓ Chứa chữ thường
            </div>
            <div className={/[0-9]/.test(password) ? "text-green-600" : "text-gray-500"}>
              ✓ Chứa chữ số
            </div>
          </div>
        )}
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
      {registerMutation.isError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            {(registerMutation.error as any)?.message ||
              "Đã xảy ra lỗi. Vui lòng thử lại."}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || registerMutation.isPending}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting || registerMutation.isPending ? "Đang xử lý..." : "Đăng ký"}
      </button>
    </form>
  );
}
