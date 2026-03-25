import { memo, useState, useCallback } from "react"
import { useNavigate } from "@tanstack/react-router"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks"
import { ROUTES } from "@/lib/constants"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface SearchBarProps {
  defaultValue?: string
  placeholder?: string
  autoFocus?: boolean
  onSearch?: (query: string) => void
  className?: string
}

/**
 * SearchBar - Search input with submit functionality
 */
export const SearchBar = memo(function SearchBar({
  defaultValue = "",
  placeholder = "Tìm kiếm sản phẩm...",
  autoFocus = false,
  onSearch,
  className,
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue)
  const navigate = useNavigate()

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const trimmedQuery = query.trim()

      if (trimmedQuery) {
        if (onSearch) {
          onSearch(trimmedQuery)
        } else {
          navigate({
            to: ROUTES.SEARCH,
            search: { q: trimmedQuery },
          })
        }
      }
    },
    [query, onSearch, navigate]
  )

  const handleClear = useCallback(() => {
    setQuery("")
  }, [])

  return (
    <form onSubmit={handleSubmit} className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 size-7"
            onClick={handleClear}
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
    </form>
  )
})
