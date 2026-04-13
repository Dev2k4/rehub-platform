import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { LoginPage } from "@/features/auth/pages/LoginPage"

export const Route = createFileRoute("/auth/login")({
  validateSearch: z.object({
    reset_token: z.string().optional(),
  }),
  component: LoginPage,
})
