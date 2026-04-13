import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { VerifyEmailPage } from "@/features/auth/pages/VerifyEmailPage"

export const Route = createFileRoute("/auth/verify-email")({
  validateSearch: z.object({
    token: z.string().optional(),
    email: z.string().optional(),
  }),
  component: VerifyEmailPage,
})
