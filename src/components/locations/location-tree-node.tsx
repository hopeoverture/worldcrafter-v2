"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ChevronDown, ChevronRight, MapPin, Eye, Edit, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { cn } from "@/lib/utils"

interface LocationTreeNodeProps {
  location: {
    id: string
    name: string
    slug: string
    type: string | null
    children?: LocationTreeNodeProps["location"][]
  }
  worldSlug: string
  depth?: number
  onDelete?: (id: string) => void
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

export function LocationTreeNode({
  location,
  worldSlug,
  depth = 0,
  onDelete,
}: LocationTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 2) // Auto-expand first 2 levels
  const hasChildren = location.children && location.children.length > 0

  const handleDelete = () => {
    if (onDelete) {
      onDelete(location.id)
    }
  }

  return (
    <div className="w-full">
      <div
        className={cn(
          "flex items-center gap-2 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors group",
          depth > 0 && "ml-6"
        )}
      >
        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "flex-shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-muted",
            !hasChildren && "invisible"
          )}
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          {hasChildren && (
            <>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </>
          )}
        </button>

        {/* Location Icon */}
        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />

        {/* Location Name */}
        <Link
          href={`/worlds/${worldSlug}/locations/${location.slug}`}
          className="flex-1 font-medium hover:underline min-w-0"
        >
          <span className="truncate block">{location.name}</span>
        </Link>

        {/* Type Badge */}
        {location.type && (
          <Badge
            variant="secondary"
            className={cn(
              "flex-shrink-0 text-xs",
              LOCATION_TYPE_COLORS[location.type] || "bg-gray-100 text-gray-800"
            )}
          >
            {location.type}
          </Badge>
        )}

        {/* Quick Actions */}
        <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-8 w-8 p-0"
          >
            <Link href={`/worlds/${worldSlug}/locations/${location.slug}`}>
              <Eye className="h-4 w-4" />
              <span className="sr-only">View</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-8 w-8 p-0"
          >
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
                  {hasChildren && (
                    <span className="block mt-2 text-destructive font-medium">
                      Warning: This will also delete all {location.children?.length} child location(s).
                    </span>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-1">
          {location.children?.map((child) => (
            <LocationTreeNode
              key={child.id}
              location={child}
              worldSlug={worldSlug}
              depth={depth + 1}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
