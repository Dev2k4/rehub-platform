import { createFileRoute } from "@tanstack/react-router"
import { VerifyEmailPage } from "@/features/auth/pages/VerifyEmailPage"

export const Route = createFileRoute("/auth/verify-email")({
  component: VerifyEmailPage,
})
