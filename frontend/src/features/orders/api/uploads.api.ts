import { getAccessToken } from "@/features/auth/utils/auth.storage"

export async function uploadProofImage(orderId: string, file: File): Promise<string> {
  const token = getAccessToken()
  const formData = new FormData()
  formData.append("order_id", orderId)
  formData.append("file", file)

  // Use absolute URL since this bypassing OpenAPI
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"
  
  const response = await fetch(`${baseUrl}/api/v1/uploads/proof-image`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || "Failed to upload image")
  }

  const data = await response.json()
  return data.url
}
