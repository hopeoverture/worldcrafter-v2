"use client"

import { useState, useMemo } from "react"
import { type World, type Genre, type Privacy } from "@prisma/client"
import { WorldCard } from "./world-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  LayoutGrid,
  LayoutList,
  Search,
  SortAsc,
  Filter,
  X,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface WorldsListProps {
  worlds: World[]
}

type ViewMode = "grid" | "list"
type SortBy = "name" | "updated" | "created"
type FilterGenre = Genre | "ALL"
type FilterPrivacy = Privacy | "ALL"

export function WorldsList({ worlds }: WorldsListProps) {
  // View and interaction state
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortBy>("updated")
  const [filterGenre, setFilterGenre] = useState<FilterGenre>("ALL")
  const [filterPrivacy, setFilterPrivacy] = useState<FilterPrivacy>("ALL")
  const [currentPage, setCurrentPage] = useState(1)

  const itemsPerPage = 20

  // Filter, sort, and paginate worlds
  const processedWorlds = useMemo(() => {
    let filtered = worlds

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (world) =>
          world.name.toLowerCase().includes(query) ||
          world.setting?.toLowerCase().includes(query) ||
          world.description?.toLowerCase().includes(query)
      )
    }

    // Apply genre filter
    if (filterGenre !== "ALL") {
      filtered = filtered.filter((world) => world.genre === filterGenre)
    }

    // Apply privacy filter
    if (filterPrivacy !== "ALL") {
      filtered = filtered.filter((world) => world.privacy === filterPrivacy)
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "updated":
          return b.updatedAt.getTime() - a.updatedAt.getTime()
        case "created":
          return b.createdAt.getTime() - a.createdAt.getTime()
        default:
          return 0
      }
    })

    return sorted
  }, [worlds, searchQuery, filterGenre, filterPrivacy, sortBy])

  // Pagination
  const totalPages = Math.ceil(processedWorlds.length / itemsPerPage)
  const paginatedWorlds = processedWorlds.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1)
  }

  const hasActiveFilters =
    searchQuery || filterGenre !== "ALL" || filterPrivacy !== "ALL"

  const clearFilters = () => {
    setSearchQuery("")
    setFilterGenre("ALL")
    setFilterPrivacy("ALL")
    setCurrentPage(1)
  }

  if (worlds.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          You haven&apos;t created any worlds yet.
        </p>
        <Button asChild>
          <Link href="/worlds/new">Create Your First World</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <Label htmlFor="search" className="sr-only">
            Search
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search worlds..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                handleFilterChange()
              }}
              className="pl-9"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("")
                  handleFilterChange()
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filters and View Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Genre Filter */}
          <Select
            value={filterGenre}
            onValueChange={(value) => {
              setFilterGenre(value as FilterGenre)
              handleFilterChange()
            }}
          >
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Genres</SelectItem>
              <SelectItem value="FANTASY">Fantasy</SelectItem>
              <SelectItem value="SCIFI">Sci-Fi</SelectItem>
              <SelectItem value="MODERN">Modern</SelectItem>
              <SelectItem value="HISTORICAL">Historical</SelectItem>
              <SelectItem value="HORROR">Horror</SelectItem>
              <SelectItem value="CUSTOM">Custom</SelectItem>
            </SelectContent>
          </Select>

          {/* Privacy Filter */}
          <Select
            value={filterPrivacy}
            onValueChange={(value) => {
              setFilterPrivacy(value as FilterPrivacy)
              handleFilterChange()
            }}
          >
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Privacy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Privacy</SelectItem>
              <SelectItem value="PRIVATE">Private</SelectItem>
              <SelectItem value="UNLISTED">Unlisted</SelectItem>
              <SelectItem value="PUBLIC">Public</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
            <SelectTrigger className="w-[140px]">
              <SortAsc className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated">Last Updated</SelectItem>
              <SelectItem value="created">Date Created</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}

          {/* View Toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="sr-only">Grid view</span>
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <LayoutList className="w-4 h-4" />
              <span className="sr-only">List view</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {paginatedWorlds.length} of {processedWorlds.length} worlds
        {processedWorlds.length !== worlds.length && " (filtered)"}
      </div>

      {/* Empty State (filtered) */}
      {processedWorlds.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No worlds match your search or filters.
          </p>
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && processedWorlds.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginatedWorlds.map((world) => (
            <WorldCard key={world.id} world={world} />
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && processedWorlds.length > 0 && (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Genre</TableHead>
                <TableHead>Privacy</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedWorlds.map((world) => (
                <TableRow key={world.id}>
                  <TableCell>
                    <Link
                      href={`/worlds/${world.slug}`}
                      className="font-medium hover:text-primary"
                    >
                      {world.name}
                    </Link>
                    {world.setting && (
                      <p className="text-sm text-muted-foreground truncate max-w-md">
                        {world.setting}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{world.genre}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {world.privacy.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(world.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          •••
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/worlds/${world.slug}`}>View</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/worlds/${world.slug}/edit`}>Edit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/worlds/${world.slug}/settings`}>Settings</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first page, last page, current page, and pages around current
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                )
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <span key={page} className="px-2 text-muted-foreground">
                    ...
                  </span>
                )
              }
              return null
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
