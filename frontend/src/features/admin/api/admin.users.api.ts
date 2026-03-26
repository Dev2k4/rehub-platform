import { AdminService } from "@/client"
import type { UserMe } from "@/client"

export async function getUsers(params?: {
  skip?: number
  limit?: number
}): Promise<UserMe[]> {
  return AdminService.listUsersApiV1AdminUsersGet(params || {})
}

export async function updateUserStatus(
  userId: string,
  isActive: boolean
): Promise<UserMe> {
  return AdminService.updateUserAccountStatusApiV1AdminUsersUserIdStatusPatch({
    userId,
    requestBody: { is_active: isActive },
  })
}
