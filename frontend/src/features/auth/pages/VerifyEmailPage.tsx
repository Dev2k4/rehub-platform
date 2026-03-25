import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { getAccessToken } from "@/features/auth/utils/auth.storage";
import { VerifyEmailForm } from "@/features/auth/components/VerifyEmailForm";

export function VerifyEmailPage() {
  const navigate = useNavigate();

  // Redirect if not logged in (no access token)
  useEffect(() => {
    if (!getAccessToken()) {
      navigate({ to: "/auth/login" });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ReHub</h1>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Xác thực Email</h2>
          <p className="mt-2 text-sm text-gray-600">
            Chúng tôi đã gửi một email xác thực đến bạn
          </p>
        </div>

        {/* Form */}
        <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
          <VerifyEmailForm />
        </div>

        {/* Footer */}
        <div className="text-center mt-8 space-y-4">
          <p className="text-xs text-gray-500">
            Các vấn đề về xác thực?{" "}
            <Link to="/auth/login" className="text-blue-600 hover:text-blue-700">
              Quay lại đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
