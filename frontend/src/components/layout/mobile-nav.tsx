import { memo } from "react"
import { Link } from "@tanstack/react-router"
import {
  X,
  Home,
  Grid3X3,
  PlusCircle,
  User,
  LogIn,
  UserPlus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Avatar } from "@/components/common/avatar"
import { SearchBar } from "./search-bar"

interface MobileNavProps {
  open: boolean
  onClose: () => void
  user?: {
    id: string
    full_name: string
    avatar_url?: string | null
  } | null
}

const navItems = [
  { label: "Trang chủ", href: ROUTES.HOME, icon: Home },
  { label: "Danh mục", href: ROUTES.CATEGORIES, icon: Grid3X3 },
  { label: "Đăng tin", href: ROUTES.DASHBOARD_LISTING_NEW, icon: PlusCircle, requireAuth: true },
]

/**
 * MobileNav - Mobile navigation drawer
 */
export const MobileNav = memo(function MobileNav({
  open,
  onClose,
  user,
}: MobileNavProps) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center justify-between">
            <Link
              to={ROUTES.HOME}
              onClick={onClose}
              className="flex items-center gap-2"
            >
              <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground font-bold">
                R
              </div>
              <span className="font-bold text-xl">ReHub</span>
            </Link>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100vh-65px)]">
          {/* Search */}
          <div className="p-4 border-b">
            <SearchBar placeholder="Tìm kiếm..." />
          </div>

          {/* User Section */}
          {user ? (
            <Link
              to={ROUTES.DASHBOARD}
              onClick={onClose}
              className="flex items-center gap-3 p-4 border-b hover:bg-accent"
            >
              <Avatar
                src={user.avatar_url}
                name={user.full_name}
                size="md"
              />
              <div>
                <p className="font-medium">{user.full_name}</p>
                <p className="text-sm text-muted-foreground">Xem tài khoản</p>
              </div>
            </Link>
          ) : (
            <div className="flex gap-2 p-4 border-b">
              <Button asChild variant="outline" className="flex-1">
                <Link to={ROUTES.LOGIN} onClick={onClose}>
                  <LogIn className="size-4 mr-2" />
                  Đăng nhập
                </Link>
              </Button>
              <Button asChild className="flex-1">
                <Link to={ROUTES.REGISTER} onClick={onClose}>
                  <UserPlus className="size-4 mr-2" />
                  Đăng ký
                </Link>
              </Button>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-2">
            {navItems.map((item) => {
              if (item.requireAuth && !user) return null

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg",
                    "text-foreground hover:bg-accent transition-colors"
                  )}
                >
                  <item.icon className="size-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
})
