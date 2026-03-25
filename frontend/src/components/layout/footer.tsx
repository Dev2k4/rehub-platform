import { memo } from "react"
import { Link } from "@tanstack/react-router"
import { Facebook, Mail, Phone } from "lucide-react"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/lib/constants"
import { Container } from "./container"

interface FooterProps {
  className?: string
}

const footerLinks = {
  about: [
    { label: "Giới thiệu", href: "/about" },
    { label: "Cách hoạt động", href: "/how-it-works" },
    { label: "Liên hệ", href: "/contact" },
  ],
  support: [
    { label: "Trung tâm trợ giúp", href: "/help" },
    { label: "An toàn mua bán", href: "/safety" },
    { label: "Báo cáo vi phạm", href: "/report" },
  ],
  legal: [
    { label: "Điều khoản sử dụng", href: "/terms" },
    { label: "Chính sách bảo mật", href: "/privacy" },
    { label: "Quy chế hoạt động", href: "/policy" },
  ],
}

/**
 * Footer - Main site footer
 */
export const Footer = memo(function Footer({ className }: FooterProps) {
  return (
    <footer className={cn("border-t bg-muted/30", className)}>
      <Container>
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to={ROUTES.HOME} className="flex items-center gap-2">
              <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground font-bold">
                R
              </div>
              <span className="font-bold text-xl">ReHub</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Nền tảng mua bán đồ cũ uy tín, an toàn và tiện lợi nhất Việt Nam.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Facebook className="size-5" />
              </a>
              <a
                href="mailto:support@rehub.vn"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="size-5" />
              </a>
            </div>
          </div>

          {/* About */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Về ReHub</h3>
            <ul className="space-y-2">
              {footerLinks.about.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Hỗ trợ</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Pháp lý</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="py-6 border-t text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} ReHub. Bảo lưu mọi quyền.
          </p>
        </div>
      </Container>
    </footer>
  )
})
