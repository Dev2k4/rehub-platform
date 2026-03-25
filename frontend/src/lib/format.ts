/**
 * Format number as Vietnamese currency (VND)
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price)
}

/**
 * Format number with thousand separators
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("vi-VN").format(num)
}

/**
 * Format compact number (1K, 1M, etc.)
 */
export function formatCompactNumber(num: number): string {
  return new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(num)
}

/**
 * Format date as relative time (e.g., "2 giờ trước")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const then = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000)

  const intervals = [
    { label: "năm", seconds: 31536000 },
    { label: "tháng", seconds: 2592000 },
    { label: "tuần", seconds: 604800 },
    { label: "ngày", seconds: 86400 },
    { label: "giờ", seconds: 3600 },
    { label: "phút", seconds: 60 },
  ]

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds)
    if (count >= 1) {
      return `${count} ${interval.label} trước`
    }
  }

  return "Vừa xong"
}

/**
 * Format date as Vietnamese date string
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = new Date(date)
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...options,
  })
}

/**
 * Format date and time
 */
export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Format phone number (Vietnamese)
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`
  }
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`
  }
  return phone
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 3)}...`
}

/**
 * Slugify text
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"]
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}

/**
 * Parse price from string (remove currency symbols and separators)
 */
export function parsePrice(priceString: string): number {
  return Number.parseInt(priceString.replace(/[^\d]/g, ""), 10) || 0
}
