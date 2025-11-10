"use client"

import React, { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Location {
  id: string
  name: string
  type: string | null
  parentId: string | null
}

interface LocationParentSelectorProps {
  worldId: string
  value?: string | null
  onChange: (value: string | null) => void
  currentLocationId?: string
  disabled?: boolean
}

/**
 * Hierarchical location parent selector
 * Shows locations in a tree structure and prevents circular hierarchies
 */
export function LocationParentSelector({
  worldId,
  value,
  onChange,
  currentLocationId,
  disabled = false,
}: LocationParentSelectorProps) {
  const [open, setOpen] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLocations() {
      try {
        setLoading(true)
        const response = await fetch(`/api/worlds/${worldId}/locations`)
        if (!response.ok) throw new Error("Failed to fetch locations")
        const data = await response.json()
        setLocations(data.locations || [])
      } catch (error) {
        console.error("Error fetching locations:", error)
        setLocations([])
      } finally {
        setLoading(false)
      }
    }

    if (worldId) {
      fetchLocations()
    }
  }, [worldId])

  // Build hierarchical tree structure
  function buildTree(items: Location[], parentId: string | null = null, depth = 0): React.ReactNode[] {
    const children = items.filter((item) => item.parentId === parentId)

    return children.map((child) => {
      // Don't show current location or its descendants (prevents circular hierarchy)
      if (currentLocationId && child.id === currentLocationId) {
        return null
      }

      const indent = "  ".repeat(depth)
      const prefix = depth > 0 ? "└─ " : ""

      return (
        <div key={child.id}>
          <CommandItem
            value={child.id}
            onSelect={() => {
              onChange(child.id === value ? null : child.id)
              setOpen(false)
            }}
          >
            <Check
              className={cn(
                "mr-2 h-4 w-4",
                value === child.id ? "opacity-100" : "opacity-0"
              )}
            />
            <span className="font-mono text-xs text-muted-foreground">
              {indent}{prefix}
            </span>
            <span className="flex-1">
              {child.name}
              {child.type && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({child.type})
                </span>
              )}
            </span>
          </CommandItem>
          {buildTree(items, child.id, depth + 1)}
        </div>
      )
    })
  }

  const selectedLocation = locations.find((loc) => loc.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled || loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading locations...
            </>
          ) : selectedLocation ? (
            <>
              {selectedLocation.name}
              {selectedLocation.type && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({selectedLocation.type})
                </span>
              )}
            </>
          ) : (
            "None (top-level location)"
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Search locations..." />
          <CommandList>
            <CommandEmpty>No locations found.</CommandEmpty>
            <CommandGroup>
              {/* None option */}
              <CommandItem
                value="none"
                onSelect={() => {
                  onChange(null)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    !value ? "opacity-100" : "opacity-0"
                  )}
                />
                None (top-level location)
              </CommandItem>

              {/* Hierarchical tree */}
              {buildTree(locations)}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
