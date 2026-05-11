import type { NotificationRead } from "@/client"
import { NotificationsService, OpenAPI } from "@/client"

export type NotificationsHistoryParams = {
  readFilter?: "all" | "unread" | "read"
  typeFilter?: "all" | "offer" | "order" | "escrow" | "listing" | "review"
  skip?: number
  limit?: number
}

export type NotificationsHistoryResponse = {
  items: NotificationRead[]
  total: number
  page: number
  size: number
}

export async function getMyNotifications(): Promise<NotificationRead[]> {
  return NotificationsService.getMyNotificationsApiV1NotificationsGet()
}

export async function getMyNotificationsHistory(
  params: NotificationsHistoryParams = {},
): Promise<NotificationsHistoryResponse> {
  const searchParams = new URLSearchParams()
  if (params.readFilter) {
    searchParams.set("read_filter", params.readFilter)
  }
  if (params.typeFilter) {
    searchParams.set("type_filter", params.typeFilter)
  }
  if (typeof params.skip === "number") {
    searchParams.set("skip", String(params.skip))
  }
  if (typeof params.limit === "number") {
    searchParams.set("limit", String(params.limit))
  }

  const token = localStorage.getItem("access_token")
  const url = `${OpenAPI.BASE}/api/v1/notifications/history?${searchParams.toString()}`
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  if (response.ok) {
    return (await response.json()) as NotificationsHistoryResponse
  }

  // Backward compatibility: if backend is not deployed with /history yet,
  // fallback to legacy endpoint and filter/paginate on client side.
  if (response.status === 404) {
    const all = await getMyNotifications()
    const readFilter = params.readFilter ?? "all"
    const typeFilter = params.typeFilter ?? "all"
    const skip = params.skip ?? 0
    const limit = params.limit ?? 20

    const filtered = all
      .filter((item) => {
        if (readFilter === "read" && !item.is_read) {
          return false
        }
        if (readFilter === "unread" && item.is_read) {
          return false
        }
        if (typeFilter !== "all" && !item.type.startsWith(`${typeFilter}_`)) {
          return false
        }
        return true
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )

    return {
      items: filtered.slice(skip, skip + limit),
      total: filtered.length,
      page: Math.floor(skip / limit) + 1,
      size: limit,
    }
  }

  if (!response.ok) {
    throw new Error("Khong the tai lich su thong bao")
  }

  return (await response.json()) as NotificationsHistoryResponse
}

export async function getUnreadNotificationsCount(): Promise<number> {
  const result =
    await NotificationsService.getUnreadNotificationsCountApiV1NotificationsUnreadCountGet()
  const normalized = result as { count?: number; unread_count?: number }
  return normalized.unread_count ?? normalized.count ?? 0
}

export async function markNotificationAsRead(
  notificationId: string,
): Promise<NotificationRead> {
  return NotificationsService.markNotificationAsReadApiV1NotificationsNotificationIdReadPut(
    {
      notificationId,
    },
  )
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await NotificationsService.markAllNotificationsAsReadApiV1NotificationsReadAllPut()
}
