import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"
import { openChatWidget } from "@/features/chat/chat-widget.events"

export const Route = createFileRoute("/chat")({
  component: ChatRoutePage,
})

function ChatRoutePage() {
  const navigate = Route.useNavigate()
  const search = Route.useSearch() as
    | { peer?: string; listingId?: string }
    | undefined

  useEffect(() => {
    openChatWidget(search?.peer, search?.listingId)
    navigate({ to: "/", replace: true })
  }, [search?.listingId, search?.peer, navigate])

  return null
}
