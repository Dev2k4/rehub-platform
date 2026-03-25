import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { getAccessToken } from "@/features/auth/utils/auth.storage";
import { RegisterForm } from "@/features/auth/components/RegisterForm";

export function RegisterPage() {
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
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Tạo tài khoản</h2>
          <p className="mt-2 text-sm text-gray-600">
            Hoặc{" "}
            <Link to="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
              đăng nhập nếu đã có tài khoản
            </Link>
          </p>
        </div>

        {/* Form */}
        <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
          <RegisterForm />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-8">
          Bằng cách đăng ký, bạn đồng ý với{" "}
          <a href="#" className="text-gray-700 hover:text-gray-900">
            Điều khoản dịch vụ
          </a>{" "}
          và{" "}
          <a href="#" className="text-gray-700 hover:text-gray-900">
            Chính sách bảo mật
          </a>
        </p>
      </div>
    </div>
  );
}
