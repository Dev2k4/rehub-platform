import { UsersService } from "@/client"
import type { UserMe } from "@/client"

export async function getMyProfile(): Promise<UserMe> {
  return UsersService.getMyProfileApiV1UsersMeGet() as Promise<UserMe>
}
