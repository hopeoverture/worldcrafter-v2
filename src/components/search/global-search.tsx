"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, MapPin, Globe } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { useDebounce } from "@/hooks/use-debounce"
import { searchLocations } from "@/app/worlds/[slug]/locations/actions"
import { cn } from "@/lib/utils"

interface GlobalSearchProps {
  /**
   * Current world context for scoped search
   * If not provided, search will be disabled until user navigates to a world
   */
  worldId?: string
  worldSlug?: string
}

interface SearchResult {
  id: string
  name: string
  slug: string
  type: string | null
  description: string | null
  rank: number
  parent: {
    id: string
    name: string
    slug: string
  } | null
}

const LOCATION_TYPE_COLORS: Record<string, string> = {
  City: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  Town: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  Village: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  Region: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  Country: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  Continent: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  Planet: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  Dungeon: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  Forest: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  Mountain: "bg-stone-100 text-stone-800 dark:bg-stone-900 dark:text-stone-300",
  Ocean: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
  Building: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300",
  Custom: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
}

/**
 * GlobalSearch component with ⌘K keyboard shortcut
 * Provides fast search across locations in the current world
 */
export function GlobalSearch({ worldId, worldSlug }: GlobalSearchProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const debouncedQuery = useDebounce(query, 300)

  // ⌘K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Search when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!worldId || !debouncedQuery || debouncedQuery.trim().length === 0) {
        setResults([])
        return
      }

      setIsSearching(true)

      try {
        const result = await searchLocations(worldId, debouncedQuery)

        if (result.success && result.data) {
          setResults(result.data as SearchResult[])
        } else {
          setResults([])
        }
      } catch (error) {
        console.error("Search error:", error)
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }

    performSearch()
  }, [worldId, debouncedQuery])

  // Handle selecting a search result
  const handleSelect = useCallback(
    (locationSlug: string) => {
      if (!worldSlug) return

      setOpen(false)
      setQuery("")
      setResults([])
      router.push(`/worlds/${worldSlug}/locations/${locationSlug}`)
    },
    [worldSlug, router]
  )

  // Handle "View all results" action
  const handleViewAllResults = useCallback(() => {
    if (!worldSlug || !query) return

    setOpen(false)
    router.push(`/worlds/${worldSlug}/search?q=${encodeURIComponent(query)}`)
  }, [worldSlug, query, router])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder={
          worldId
            ? "Search locations... (⌘K to open)"
            : "Navigate to a world to search..."
        }
        value={query}
        onValueChange={setQuery}
        disabled={!worldId}
      />
      <CommandList>
        {!worldId ? (
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 py-6">
              <Globe className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Navigate to a world to start searching
              </p>
            </div>
          </CommandEmpty>
        ) : query.trim().length === 0 ? (
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 py-6">
              <Search className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Type to search locations in this world
              </p>
              <p className="text-xs text-muted-foreground">
                Press ⌘K to open anytime
              </p>
            </div>
          </CommandEmpty>
        ) : isSearching ? (
          <CommandEmpty>
            <div className="flex items-center justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          </CommandEmpty>
        ) : results.length === 0 ? (
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 py-6">
              <Search className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm">No locations found</p>
              <p className="text-xs text-muted-foreground">
                Try a different search term
              </p>
            </div>
          </CommandEmpty>
        ) : (
          <>
            <CommandGroup heading={`Found ${results.length} location${results.length === 1 ? "" : "s"}`}>
              {results.slice(0, 8).map((location) => (
                <CommandItem
                  key={location.id}
                  value={location.slug}
                  onSelect={() => handleSelect(location.slug)}
                  className="flex items-start gap-3 py-3"
                >
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{location.name}</span>
                      {location.type && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs shrink-0",
                            LOCATION_TYPE_COLORS[location.type] ||
                              "bg-gray-100 text-gray-800"
                          )}
                        >
                          {location.type}
                        </Badge>
                      )}
                    </div>
                    {location.parent && (
                      <p className="text-xs text-muted-foreground truncate">
                        in {location.parent.name}
                      </p>
                    )}
                    {location.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                        {location.description}
                      </p>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>

            {results.length > 8 && (
              <CommandGroup>
                <CommandItem
                  onSelect={handleViewAllResults}
                  className="justify-center text-sm text-primary"
                >
                  View all {results.length} results
                </CommandItem>
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
