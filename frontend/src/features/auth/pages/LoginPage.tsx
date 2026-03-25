import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { getAccessToken } from "@/features/auth/utils/auth.storage";
import { LoginForm } from "@/features/auth/components/LoginForm";

export function LoginPage() {
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (getAccessToken()) {
      navigate({ to: "/" });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ReHub</h1>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Đăng nhập</h2>
          <p className="mt-2 text-sm text-gray-600">
            Hoặc{" "}
            <Link to="/auth/register" className="text-blue-600 hover:text-blue-700 font-medium">
              tạo tài khoản mới
            </Link>
          </p>
        </div>

        {/* Form */}
        <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
          <LoginForm />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-8">
          Nếu bạn gặp sự cố với việc đăng nhập,{" "}
          <a href="#" className="text-blue-600 hover:text-blue-700">
            liên hệ hỗ trợ
          </a>
        </p>
      </div>
    </div>
  );
}
