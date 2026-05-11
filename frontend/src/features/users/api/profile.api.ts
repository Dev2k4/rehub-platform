import type { UserMe } from "@/client"
import { UsersService } from "@/client"

export interface UpdateProfileInput {
  full_name?: string
  email?: string
  phone?: string
  bio?: string
  province?: string
  district?: string
  ward?: string
  address_detail?: string
}

export async function getMyProfile(): Promise<UserMe> {
  return UsersService.getMyProfileApiV1UsersMeGet()
}

export async function updateMyProfile(
  data: UpdateProfileInput,
): Promise<UserMe> {
  return UsersService.updateMyProfileApiV1UsersMePut({
    requestBody: data as any,
  })
}
