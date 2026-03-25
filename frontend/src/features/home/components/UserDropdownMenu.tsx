import { useState } from "react"
import { Link } from "@tanstack/react-router"
import type { UserMe } from "@/client"

interface UserDropdownMenuProps {
  user: UserMe
  onLogout: () => void
}

export function UserDropdownMenu({ user, onLogout }: UserDropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      {/* Trigger Button: Avatar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white font-bold flex items-center justify-center cursor-pointer transition-all hover:shadow-md"
        title={user.full_name}
      >
        {user.full_name.charAt(0).toUpperCase()}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Menu Content */}
          <div className="absolute right-0 top-12 w-56 bg-white shadow-xl rounded-lg border border-gray-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* User Info Section */}
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="font-semibold text-gray-900 text-sm">{user.full_name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <Link
                to="/my-listings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span>📋</span>
                <span>Tin đăng của tôi</span>
              </Link>

              <Link
                to="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span>👤</span>
                <span>Hồ sơ</span>
              </Link>

              {/* Divider */}
              <div className="my-2 border-t border-gray-200" />

              {/* Logout */}
              <button
                onClick={() => {
                  setIsOpen(false)
                  onLogout()
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <span>🚪</span>
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
