export type ChatOpenPayload = {
  peerId?: string
  listingId?: string
}

const OPEN_EVENT = "chat:open-widget"

export function openChatWidget(peerId?: string, listingId?: string) {
  window.dispatchEvent(
    new CustomEvent<ChatOpenPayload>(OPEN_EVENT, {
      detail: {
        ...(peerId ? { peerId } : {}),
        ...(listingId ? { listingId } : {}),
      },
    }),
  )
}

export function onChatWidgetOpenRequest(
  handler: (payload: ChatOpenPayload) => void,
) {
  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<ChatOpenPayload>
    handler(customEvent.detail ?? {})
  }

  window.addEventListener(OPEN_EVENT, listener)
  return () => window.removeEventListener(OPEN_EVENT, listener)
}
