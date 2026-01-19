/**
 * SearchBar Component
 *
 * A search input for finding sessions by content.
 * Currently navigates to /search?q=query on submit.
 *
 * Note: Search functionality is prepared but the /search page
 * may not be fully implemented yet.
 *
 * Features:
 * - Controlled input with local state
 * - Form submission with Enter key or button click
 * - URL-encodes the search query
 * - Customizable width via className prop
 *
 * Used by: Could be added to header/navigation for global search
 */

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Props for the SearchBar component
 */
type SearchBarProps = {
  /** Optional additional CSS classes for the container */
  className?: string
}

export const SearchBar: React.FC<SearchBarProps> = ({ className }) => {
  // Local state for the search query
  const [query, setQuery] = useState("")
  const router = useRouter()

  /**
   * Handle form submission - navigate to search page with query
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn("w-full max-w-md", className)}>
      <div className="relative">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search sessions..."
          className="pr-10"
        />
        {/* Search icon button */}
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-10 w-10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </Button>
      </div>
    </form>
  )
}
