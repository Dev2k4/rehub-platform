import { useState } from "react"
import { OpenAPI } from "@/client"

export interface PriceComparable {
  title: string
  price: number
  category?: string | null
  brand?: string | null
  condition?: string | null
  score: number
}

export interface PriceSuggestionResponse {
  query: string
  suggested_price?: number | null
  price_low?: number | null
  price_high?: number | null
  confidence: number
  matched_count: number
  provider: string
  model: string
  comparables: PriceComparable[]
  summary: string
}

export interface UsePriceSuggestionState {
  isLoading: boolean
  error: string | null
  data: PriceSuggestionResponse | null
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
  ): Promise<PriceSuggestionResponse | null> => {
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

      const data = (await response.json()) as PriceSuggestionResponse
      setState({ isLoading: false, error: null, data })
      return data
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
