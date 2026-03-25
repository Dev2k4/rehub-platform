import { Link } from "@tanstack/react-router"

export function AuthButtons() {
  return (
    <div className="flex gap-2">
      <Link
        to="/auth/login"
        className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
      >
        Đăng nhập
      </Link>
      <Link
        to="/auth/register"
        className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Đăng ký
      </Link>
    </div>
  )
}
