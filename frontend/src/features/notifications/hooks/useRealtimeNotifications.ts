import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import type { NotificationRead } from "@/client"
import { toaster } from "@/components/ui/toaster"
import { wsClient } from "@/features/shared/realtime/ws.client"

const seenToastIds = new Set<string>()

type NotificationPayload = {
  notification?: NotificationRead
}

type NotificationReadEventPayload = {
  notification_id?: string
  unread_count?: number
}

type NotificationReadAllEventPayload = {
  unread_count?: number
}

export function useRealtimeNotifications(enabled: boolean) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) {
      return
    }

    const unsubscribe = wsClient.on("notification:created", (data) => {
      const payload = data as NotificationPayload
      const incoming = payload.notification

      if (!incoming) {
        return
      }

      const authUser = queryClient.getQueryData<{ id?: string }>([
        "auth",
        "user",
      ])
      if (authUser?.id && incoming.user_id !== authUser.id) {
        return
      }

      queryClient.setQueryData<NotificationRead[]>(["notifications"], (old) => {
        const current = old ?? []
        const withoutDuplicate = current.filter(
          (item) => item.id !== incoming.id,
        )
        return [incoming, ...withoutDuplicate]
      })

      queryClient.setQueryData<number>(
        ["notifications", "unread-count"],
        (old) => {
          const current = old ?? 0
          return current + (incoming.is_read ? 0 : 1)
        },
      )

      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      })

      if (incoming.title && incoming.id && !seenToastIds.has(incoming.id)) {
        seenToastIds.add(incoming.id)
        window.setTimeout(() => {
          seenToastIds.delete(incoming.id)
        }, 60_000)

        toaster.create({
          title: incoming.title,
          description: incoming.message,
          type: "info",
        })
      }
    })

    const unsubscribeRead = wsClient.on("notification:read", (data) => {
      const payload = data as NotificationReadEventPayload
      if (payload.notification_id) {
        queryClient.setQueryData<NotificationRead[]>(
          ["notifications"],
          (old) => {
            if (!old) {
              return old
            }
            return old.map((item) =>
              item.id === payload.notification_id
                ? { ...item, is_read: true }
                : item,
            )
          },
        )
      }
      if (typeof payload.unread_count === "number") {
        queryClient.setQueryData(
          ["notifications", "unread-count"],
          payload.unread_count,
        )
      }
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      })
    })

    const unsubscribeReadAll = wsClient.on("notification:read-all", (data) => {
      const payload = data as NotificationReadAllEventPayload
      queryClient.setQueryData<NotificationRead[]>(["notifications"], (old) => {
        if (!old) {
          return old
        }
        return old.map((item) => ({ ...item, is_read: true }))
      })
      queryClient.setQueryData(
        ["notifications", "unread-count"],
        payload.unread_count ?? 0,
      )
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      })
    })

    return () => {
      unsubscribe()
      unsubscribeRead()
      unsubscribeReadAll()
    }
  }, [enabled, queryClient])
}
