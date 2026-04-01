import type { NotificationRead } from "@/client"
import { NotificationsService } from "@/client"

export async function getMyNotifications(): Promise<NotificationRead[]> {
  return NotificationsService.getMyNotificationsApiV1NotificationsGet()
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
