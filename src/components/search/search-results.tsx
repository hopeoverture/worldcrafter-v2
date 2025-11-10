"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, MapPin, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useDebounce } from "@/hooks/use-debounce"
import { searchLocations } from "@/app/worlds/[slug]/locations/actions"
import { cn } from "@/lib/utils"

interface SearchResultsProps {
  worldId: string
  worldSlug: string
  initialQuery?: string
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

export function SearchResults({
  worldId,
  worldSlug,
  initialQuery = "",
}: SearchResultsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const debouncedQuery = useDebounce(query, 300)

  // Update query when URL search params change
  useEffect(() => {
    const urlQuery = searchParams.get("q")
    if (urlQuery && urlQuery !== query) {
      setQuery(urlQuery)
    }
  }, [searchParams, query])

  // Perform search when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery || debouncedQuery.trim().length === 0) {
        setResults([])
        setHasSearched(false)
        return
      }

      setIsSearching(true)
      setHasSearched(true)

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

  // Update URL when query changes
  const handleQueryChange = (value: string) => {
    setQuery(value)
    if (value.trim().length > 0) {
      router.replace(`/worlds/${worldSlug}/search?q=${encodeURIComponent(value)}`, {
        scroll: false,
      })
    } else {
      router.replace(`/worlds/${worldSlug}/search`, { scroll: false })
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search locations..."
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          className="pl-9"
          autoFocus
        />
      </div>

      {/* Search Status */}
      {isSearching && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty States */}
      {!isSearching && !hasSearched && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Start searching</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Enter a search term to find locations in this world. You can search by name,
            type, description, or any other text content.
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            Tip: Press ⌘K anywhere to quickly open the search dialog
          </p>
        </div>
      )}

      {!isSearching && hasSearched && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No results found</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            We couldn&apos;t find any locations matching &quot;{query}&quot;. Try a
            different search term.
          </p>
        </div>
      )}

      {/* Search Results */}
      {!isSearching && results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Found {results.length} result{results.length === 1 ? "" : "s"}
            </h2>
          </div>

          <div className="grid gap-4">
            {results.map((location) => (
              <Link
                key={location.id}
                href={`/worlds/${worldSlug}/locations/${location.slug}`}
              >
                <Card className="hover:bg-accent transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg truncate">
                            {location.name}
                          </h3>
                          {location.type && (
                            <Badge
                              variant="secondary"
                              className={cn(
                                "shrink-0",
                                LOCATION_TYPE_COLORS[location.type] ||
                                  "bg-gray-100 text-gray-800"
                              )}
                            >
                              {location.type}
                            </Badge>
                          )}
                        </div>

                        {location.parent && (
                          <p className="text-sm text-muted-foreground mb-2">
                            in {location.parent.name}
                          </p>
                        )}

                        {location.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {location.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
