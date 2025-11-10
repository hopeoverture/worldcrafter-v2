"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { List, Network, Plus, Eye, Edit, Trash2, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { LocationTreeNode } from "./location-tree-node"
import { deleteLocation } from "@/app/worlds/[slug]/locations/actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Location {
  id: string
  name: string
  slug: string
  type: string | null
  parentId: string | null
  parent?: {
    id: string
    name: string
    slug: string
  } | null
  children?: Location[]
}

interface LocationsListProps {
  locations: Location[]
  worldSlug: string
}

type ViewMode = "tree" | "table"
type FilterType = "all" | string

const LOCATION_TYPES = [
  "City",
  "Town",
  "Village",
  "Region",
  "Country",
  "Continent",
  "Planet",
  "Dungeon",
  "Forest",
  "Mountain",
  "Ocean",
  "Building",
  "Custom",
]

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

export function LocationsList({ locations, worldSlug }: LocationsListProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>("tree")
  const [filterType, setFilterType] = useState<FilterType>("all")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Filter locations by type
  const filteredLocations = useMemo(() => {
    if (filterType === "all") return locations
    return locations.filter((loc) => loc.type === filterType)
  }, [locations, filterType])

  // Build hierarchical tree structure for tree view
  const buildTree = (items: Location[], parentId: string | null = null): Location[] => {
    const children = items.filter((item) => item.parentId === parentId)
    return children.map((child) => ({
      ...child,
      children: buildTree(items, child.id),
    }))
  }

  const treeLocations = useMemo(() => {
    return buildTree(filteredLocations)
  }, [filteredLocations])

  // Handle delete location
  const handleDelete = async (id: string) => {
    setDeletingId(id)
    const result = await deleteLocation(id)

    if (result.success) {
      toast.success("Location deleted successfully")
      router.refresh()
    } else {
      toast.error(result.error || "Failed to delete location")
    }
    setDeletingId(null)
  }

  // Empty state
  if (locations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No locations yet</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Start building your world by adding locations. Create cities, regions, dungeons, and more.
        </p>
        <Button asChild>
          <Link href={`/worlds/${worldSlug}/locations/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Create First Location
          </Link>
        </Button>
      </div>
    )
  }

  // Filtered but empty state
  if (filteredLocations.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Locations</h2>
            <p className="text-muted-foreground">
              {locations.length} location{locations.length !== 1 ? "s" : ""} total
            </p>
          </div>
          <Button asChild>
            <Link href={`/worlds/${worldSlug}/locations/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Link>
          </Button>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={viewMode === "tree" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("tree")}
            >
              <Network className="mr-2 h-4 w-4" />
              Tree View
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              <List className="mr-2 h-4 w-4" />
              Table View
            </Button>
          </div>

          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">Filter by type:</span>
            <Select value={filterType} onValueChange={(value) => setFilterType(value as FilterType)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {LOCATION_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Empty filtered state */}
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center border rounded-lg">
          <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No locations found</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            No locations match the current filter. Try selecting a different type.
          </p>
          <Button variant="outline" onClick={() => setFilterType("all")}>
            Clear Filter
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Locations</h2>
          <p className="text-muted-foreground">
            {filteredLocations.length} of {locations.length} location{locations.length !== 1 ? "s" : ""}
            {filterType !== "all" && ` (filtered by ${filterType})`}
          </p>
        </div>
        <Button asChild>
          <Link href={`/worlds/${worldSlug}/locations/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Add Location
          </Link>
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={viewMode === "tree" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("tree")}
          >
            <Network className="mr-2 h-4 w-4" />
            Tree View
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
          >
            <List className="mr-2 h-4 w-4" />
            Table View
          </Button>
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-sm text-muted-foreground">Filter by type:</span>
          <Select value={filterType} onValueChange={(value) => setFilterType(value as FilterType)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {LOCATION_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tree View */}
      {viewMode === "tree" && (
        <div className="border rounded-lg p-4 bg-card">
          {treeLocations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No top-level locations. All locations have parents.
            </div>
          ) : (
            <div className="space-y-1">
              {treeLocations.map((location) => (
                <LocationTreeNode
                  key={location.id}
                  location={location}
                  worldSlug={worldSlug}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLocations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/worlds/${worldSlug}/locations/${location.slug}`}
                      className="hover:underline flex items-center gap-2"
                    >
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      {location.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {location.type ? (
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          LOCATION_TYPE_COLORS[location.type] || "bg-gray-100 text-gray-800"
                        )}
                      >
                        {location.type}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {location.parent ? (
                      <Link
                        href={`/worlds/${worldSlug}/locations/${location.parent.slug}`}
                        className="text-muted-foreground hover:underline text-sm"
                      >
                        {location.parent.name}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground text-sm">None</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                        <Link href={`/worlds/${worldSlug}/locations/${location.slug}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                        <Link href={`/worlds/${worldSlug}/locations/${location.slug}/edit`}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            disabled={deletingId === location.id}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Location</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete <strong>{location.name}</strong>?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(location.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
