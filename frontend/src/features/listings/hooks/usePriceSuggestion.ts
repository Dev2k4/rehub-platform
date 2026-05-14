import { useState } from "react"
import { OpenAPI } from "@/client"

export interface UsePriceSuggestionState {
  isLoading: boolean
  error: string | null
  data: number | null
}

export function usePriceSuggestion() {
  const [state, setState] = useState<UsePriceSuggestionState>({
    isLoading: false,
    error: null,
    data: null,
  })

  const suggestPrice = async (
    query: string,
    context?: Record<string, string>,
  ): Promise<number | null> => {
    setState({ isLoading: true, error: null, data: null })

    try {
      const base = OpenAPI.BASE.replace(/\/+$/, "")
      const response = await fetch(`${base}/api/v1/ai/price-suggestion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          context,
        }),
      })

      if (!response.ok) {
        let errorMsg = "Không thể gợi ý giá lúc này"
        try {
          const json = (await response.json()) as { detail?: string }
          if (json.detail) {
            errorMsg = json.detail
          }
        } catch {
          // Use default error message
        }
        setState({ isLoading: false, error: errorMsg, data: null })
        return null
      }

      const payload = (await response.json()) as unknown
      let price: number | null = null
      if (typeof payload === "number") {
        price = payload
      } else if (payload && typeof payload === "object") {
        const map = payload as { suggested_price?: unknown }
        if (typeof map.suggested_price === "number") {
          price = map.suggested_price
        }
      }

      if (price === null) {
        const errorMsg = "Dữ liệu gợi ý giá không hợp lệ"
        setState({ isLoading: false, error: errorMsg, data: null })
        return null
      }

      setState({ isLoading: false, error: null, data: price })
      return price
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Lỗi không xác định"
      setState({ isLoading: false, error: errorMsg, data: null })
      return null
    }
  }

  return {
    ...state,
    suggestPrice,
  }
}
