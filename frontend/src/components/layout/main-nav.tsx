import { memo, useState } from "react"
import { Link } from "@tanstack/react-router"
import {
  Search,
  Bell,
  Plus,
  User,
  LogOut,
  Settings,
  Package,
  Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar } from "@/components/common/avatar"
import { Container } from "./container"
import { SearchBar } from "./search-bar"
import { MobileNav } from "./mobile-nav"

interface MainNavProps {
  user?: {
    id: string
    full_name: string
    email: string
    avatar_url?: string | null
  } | null
  notificationCount?: number
  onLogout?: () => void
  className?: string
}

/**
 * MainNav - Main navigation header for public pages
 */
export const MainNav = memo(function MainNav({
  user,
  notificationCount = 0,
  onLogout,
  className,
}: MainNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link
            to={ROUTES.HOME}
            className="flex items-center gap-2 shrink-0"
          >
            <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground font-bold">
              R
            </div>
            <span className="font-bold text-xl hidden sm:inline-block">
              ReHub
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <SearchBar />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Search - Mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              asChild
            >
              <Link to={ROUTES.SEARCH}>
                <Search className="size-5" />
              </Link>
            </Button>

            {user ? (
              <>
                {/* Create Listing Button */}
                <Button asChild className="hidden sm:flex">
                  <Link to={ROUTES.DASHBOARD_LISTING_NEW}>
                    <Plus className="size-4 mr-1" />
                    Đăng tin
                  </Link>
                </Button>

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative" asChild>
                  <Link to={ROUTES.DASHBOARD_NOTIFICATIONS}>
                    <Bell className="size-5" />
                    {notificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex items-center justify-center size-5 rounded-full bg-destructive text-destructive-foreground text-xs font-medium">
                        {notificationCount > 9 ? "9+" : notificationCount}
                      </span>
                    )}
                  </Link>
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar
                        src={user.avatar_url}
                        name={user.full_name}
                        size="sm"
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="font-medium text-sm">{user.full_name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={ROUTES.DASHBOARD}>
                        <User className="size-4 mr-2" />
                        Tài khoản
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={ROUTES.DASHBOARD_LISTINGS}>
                        <Package className="size-4 mr-2" />
                        Tin đăng của tôi
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={ROUTES.DASHBOARD_SETTINGS}>
                        <Settings className="size-4 mr-2" />
                        Cài đặt
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onLogout}>
                      <LogOut className="size-4 mr-2" />
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                {/* Login Button */}
                <Button variant="ghost" asChild className="hidden sm:flex">
                  <Link to={ROUTES.LOGIN}>Đăng nhập</Link>
                </Button>

                {/* Register Button */}
                <Button asChild>
                  <Link to={ROUTES.REGISTER}>Đăng ký</Link>
                </Button>
              </>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
          </div>
        </div>
      </Container>

      {/* Mobile Navigation */}
      <MobileNav
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        user={user}
      />
    </header>
  )
})
