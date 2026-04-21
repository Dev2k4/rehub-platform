import { type CategoryTree, OpenAPI } from "@/client"

const ABSOLUTE_URL_REGEX = /^https?:\/\//i

export function flattenCategories(tree: CategoryTree[]): CategoryTree[] {
  const result: CategoryTree[] = []

  const walk = (nodes: CategoryTree[]) => {
    for (const node of nodes) {
      result.push(node)
      if (node.children && node.children.length > 0) {
        walk(node.children)
      }
    }
  }

  walk(tree)
  return result
}

export function formatCurrencyVnd(value: string | number): string {
  const numeric = typeof value === "number" ? value : Number.parseFloat(value)
  if (!Number.isFinite(numeric)) {
    return "0 đ"
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(numeric)
}

export function formatPostedTime(value: string): string {
  // If the backend returns a naive datetime string (no timezone info), treat it as UTC.
  const dateString =
    value.endsWith("Z") || value.includes("+") ? value : `${value}Z`
  const date = new Date(dateString)
  const diffMs = Date.now() - date.getTime()

  if (Number.isNaN(diffMs) || diffMs < 0) {
    return "Vừa đăng"
  }

  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 60) {
    return `${minutes} phút trước`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours} giờ trước`
  }

  const days = Math.floor(hours / 24)
  return `${days} ngày trước`
}

export function getListingImageUrl(url?: string | null): string {
  if (!url) {
    return ""
  }

  if (ABSOLUTE_URL_REGEX.test(url)) {
    return url
  }

  const base = OpenAPI.BASE.replace(/\/$/, "")
  const path = url.startsWith("/") ? url : `/${url}`
  return `${base}${path}`
}
