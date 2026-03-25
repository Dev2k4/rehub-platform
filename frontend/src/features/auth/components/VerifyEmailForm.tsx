import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { verifyEmailSchema, type VerifyEmailInput } from "@/features/auth/utils/auth.schemas";
import { useVerifyEmailMutation } from "@/features/auth/hooks/useVerifyEmailMutation";
import { useSearch } from "@tanstack/react-router";
import { useEffect } from "react";

interface VerifyEmailFormProps {
  onError?: (error: string) => void;
}

export function VerifyEmailForm({ onError }: VerifyEmailFormProps) {
  const verifyMutation = useVerifyEmailMutation();
  const search = useSearch({ from: "/auth/verify-email" });
  const tokenFromUrl = (search as any)?.token as string | undefined;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<VerifyEmailInput>({
    resolver: zodResolver(verifyEmailSchema),
    mode: "onBlur",
  });

  // Auto-verify if token in URL
  useEffect(() => {
    if (tokenFromUrl) {
      setValue("token", tokenFromUrl);
      verifyMutation.mutate(tokenFromUrl);
    }
  }, [tokenFromUrl, setValue]);

  function onSubmit(data: VerifyEmailInput) {
    verifyMutation.mutate(data.token, {
      onError: (error: any) => {
        if (onError) {
          onError(error?.message || "Xác thực email thất bại");
        }
      },
    });
  }

  if (verifyMutation.isSuccess) {
    return (
      <div className="text-center space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <p className="text-green-800 font-medium">✓ Email xác thực thành công!</p>
          <p className="text-sm text-green-700 mt-2">
            Bạn sẽ được chuyển về trang chủ trong giây lát...
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Token Input */}
      <div>
        <label htmlFor="token" className="block text-sm font-medium text-gray-700">
          Mã xác thực từ email
        </label>
        <input
          {...register("token")}
          type="text"
          placeholder="Dán mã xác thực từ email của bạn"
          className={`w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center tracking-widest ${
            errors.token ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.token && <p className="text-sm text-red-500 mt-1">{errors.token.message}</p>}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p>
          Bạn sẽ nhận được email chứa mã xác thực. Sao chép mã đó và dán vào trường trên, hoặc
          nhấp vào link trong email để xác thực ngay.
        </p>
      </div>

      {/* Error Message */}
      {verifyMutation.isError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            {(verifyMutation.error as any)?.message ||
              "Xác thực email thất bại. Vui lòng thử lại."}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || verifyMutation.isPending}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting || verifyMutation.isPending ? "Đang xác thực..." : "Xác thực Email"}
      </button>

      {/* Resend Email Link */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Không nhận được email?{" "}
          <a
            href="#"
            className="text-blue-600 hover:text-blue-700"
            onClick={(e) => {
              e.preventDefault();
              // TODO: Implement resend email
              alert("Tính năng gửi lại email sẽ được thêm sau");
            }}
          >
            Gửi lại
          </a>
        </p>
      </div>
    </form>
  );
}
