"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import {
  createLocationSchema,
  updateLocationSchema,
  locationFiltersSchema,
  type CreateLocationFormInput,
  type UpdateLocationFormInput,
  type LocationFilters,
} from "@/lib/schemas/location.schema"
import type { Location, Prisma } from "@prisma/client"

/**
 * Server action response type
 */
type ActionResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * Generate a unique slug from a location name
 */
function generateSlug(name: string): string {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .substring(0, 50) // Limit length

  // Add random suffix to ensure uniqueness
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  return `${baseSlug}-${randomSuffix}`
}

/**
 * Check if setting parentId would create a circular hierarchy
 */
async function wouldCreateCircularHierarchy(
  locationId: string,
  parentId: string | null
): Promise<boolean> {
  if (!parentId) return false

  // Can't be parent of itself
  if (locationId === parentId) return true

  // Check if parentId is a descendant of locationId
  let currentParentId: string | null = parentId

  // Traverse up the tree to check for cycles
  const visited = new Set<string>([locationId])

  while (currentParentId) {
    if (visited.has(currentParentId)) {
      // Found a cycle
      return true
    }

    visited.add(currentParentId)

    const parent: { parentId: string | null } | null = await prisma.location.findUnique({
      where: { id: currentParentId },
      select: { parentId: true },
    })

    if (!parent) break

    currentParentId = parent.parentId
  }

  return false
}

/**
 * Create a new location
 */
export async function createLocation(
  input: CreateLocationFormInput
): Promise<ActionResponse<Location>> {
  try {
    // 1. Validate input
    const validated = createLocationSchema.parse(input)

    // 2. Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "You must be logged in to create a location" }
    }

    // 3. Verify world exists and user owns it
    const world = await prisma.world.findUnique({
      where: { id: validated.worldId },
      select: { userId: true, slug: true },
    })

    if (!world) {
      return { success: false, error: "World not found" }
    }

    if (world.userId !== user.id) {
      return { success: false, error: "You don't have permission to add locations to this world" }
    }

    // 4. If parentId is provided, verify it exists and belongs to the same world
    if (validated.parentId) {
      const parent = await prisma.location.findUnique({
        where: { id: validated.parentId },
        select: { worldId: true },
      })

      if (!parent) {
        return { success: false, error: "Parent location not found" }
      }

      if (parent.worldId !== validated.worldId) {
        return { success: false, error: "Parent location must be in the same world" }
      }
    }

    // 5. Generate unique slug
    const slug = generateSlug(validated.name)

    // 6. Create location in database
    const location = await prisma.location.create({
      data: {
        name: validated.name,
        slug,
        worldId: validated.worldId,
        type: validated.type,
        parentId: validated.parentId,
        description: validated.description,
        geography: validated.geography,
        climate: validated.climate,
        population: validated.population,
        government: validated.government,
        economy: validated.economy,
        culture: validated.culture,
        coordinates: (validated.coordinates ?? undefined) as Prisma.InputJsonValue | undefined,
        attributes: (validated.attributes ?? undefined) as Prisma.InputJsonValue | undefined,
        imageUrl: validated.imageUrl,
      },
    })

    // 7. Log activity
    await prisma.activity.create({
      data: {
        worldId: validated.worldId,
        userId: user.id,
        entityType: "LOCATION",
        entityId: location.id,
        action: "created",
        metadata: {
          locationName: location.name,
          parentId: location.parentId,
        },
      },
    })

    // 8. Revalidate relevant paths
    revalidatePath(`/worlds/${world.slug}`)
    revalidatePath(`/worlds/${world.slug}/locations`)

    return { success: true, data: location }
  } catch (error) {
    console.error("Create location error:", error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Failed to create location" }
  }
}

/**
 * Update an existing location
 */
export async function updateLocation(
  id: string,
  input: UpdateLocationFormInput
): Promise<ActionResponse<Location>> {
  try {
    // 1. Validate input
    const validated = updateLocationSchema.parse(input)

    // 2. Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "You must be logged in to update a location" }
    }

    // 3. Verify location exists and user owns it (through world)
    const existingLocation = await prisma.location.findUnique({
      where: { id },
      include: {
        world: {
          select: { userId: true, slug: true },
        },
      },
    })

    if (!existingLocation) {
      return { success: false, error: "Location not found" }
    }

    if (existingLocation.world.userId !== user.id) {
      return { success: false, error: "You don't have permission to update this location" }
    }

    // 4. If updating parentId, check for circular hierarchy
    if (validated.parentId !== undefined) {
      const wouldBeCircular = await wouldCreateCircularHierarchy(id, validated.parentId)

      if (wouldBeCircular) {
        return {
          success: false,
          error: "Cannot set parent: would create circular hierarchy",
        }
      }

      // If parentId is being set (not null), verify it exists and belongs to same world
      if (validated.parentId) {
        const parent = await prisma.location.findUnique({
          where: { id: validated.parentId },
          select: { worldId: true },
        })

        if (!parent) {
          return { success: false, error: "Parent location not found" }
        }

        if (parent.worldId !== existingLocation.worldId) {
          return { success: false, error: "Parent location must be in the same world" }
        }
      }
    }

    // 5. Update location in database
    const location = await prisma.location.update({
      where: { id },
      data: {
        name: validated.name,
        type: validated.type,
        parentId: validated.parentId,
        description: validated.description,
        geography: validated.geography,
        climate: validated.climate,
        population: validated.population,
        government: validated.government,
        economy: validated.economy,
        culture: validated.culture,
        coordinates: (validated.coordinates ?? undefined) as Prisma.InputJsonValue | undefined,
        attributes: (validated.attributes ?? undefined) as Prisma.InputJsonValue | undefined,
        imageUrl: validated.imageUrl,
      },
    })

    // 6. Log activity
    await prisma.activity.create({
      data: {
        worldId: existingLocation.worldId,
        userId: user.id,
        entityType: "LOCATION",
        entityId: location.id,
        action: "updated",
        metadata: {
          locationName: location.name,
          parentId: location.parentId,
        },
      },
    })

    // 7. Revalidate relevant paths
    revalidatePath(`/worlds/${existingLocation.world.slug}`)
    revalidatePath(`/worlds/${existingLocation.world.slug}/locations`)
    revalidatePath(`/worlds/${existingLocation.world.slug}/locations/${existingLocation.slug}`)

    return { success: true, data: location }
  } catch (error) {
    console.error("Update location error:", error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Failed to update location" }
  }
}

/**
 * Delete a location (cascade deletes children)
 */
export async function deleteLocation(id: string): Promise<ActionResponse<void>> {
  try {
    // 1. Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "You must be logged in to delete a location" }
    }

    // 2. Verify location exists and user owns it (through world)
    const existingLocation = await prisma.location.findUnique({
      where: { id },
      include: {
        world: {
          select: { userId: true, slug: true },
        },
      },
    })

    if (!existingLocation) {
      return { success: false, error: "Location not found" }
    }

    if (existingLocation.world.userId !== user.id) {
      return { success: false, error: "You don't have permission to delete this location" }
    }

    // 3. Delete location (Prisma cascade deletes children via onDelete: Cascade in schema)
    await prisma.location.delete({
      where: { id },
    })

    // 4. Revalidate relevant paths
    revalidatePath(`/worlds/${existingLocation.world.slug}`)
    revalidatePath(`/worlds/${existingLocation.world.slug}/locations`)

    return { success: true }
  } catch (error) {
    console.error("Delete location error:", error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Failed to delete location" }
  }
}

/**
 * Get all locations for a world with optional filters
 */
export async function getLocations(
  filters: LocationFilters
): Promise<ActionResponse<Location[]>> {
  try {
    // 1. Validate filters
    const validatedFilters = locationFiltersSchema.parse(filters)

    // 2. Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "You must be logged in to view locations" }
    }

    // 3. Verify world exists and user owns it
    const world = await prisma.world.findUnique({
      where: { id: validatedFilters.worldId },
      select: { userId: true },
    })

    if (!world) {
      return { success: false, error: "World not found" }
    }

    if (world.userId !== user.id) {
      return { success: false, error: "You don't have permission to view locations in this world" }
    }

    // 4. Build query filters
    const where: Prisma.LocationWhereInput = {
      worldId: validatedFilters.worldId,
    }

    if (validatedFilters.type) {
      where.type = validatedFilters.type
    }

    if (validatedFilters.parentId !== undefined) {
      where.parentId = validatedFilters.parentId
    }

    // 5. Fetch locations
    const locations = await prisma.location.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: validatedFilters.limit,
      skip: validatedFilters.offset,
      include: validatedFilters.includeHierarchy
        ? {
            parent: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            children: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          }
        : undefined,
    })

    return { success: true, data: locations }
  } catch (error) {
    console.error("Get locations error:", error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Failed to fetch locations" }
  }
}

/**
 * Get a single location by slug within a world
 */
export async function getLocation(
  worldId: string,
  slug: string
): Promise<ActionResponse<Location>> {
  try {
    // 1. Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "You must be logged in to view this location" }
    }

    // 2. Fetch location
    const location = await prisma.location.findUnique({
      where: {
        worldId_slug: {
          worldId,
          slug,
        },
      },
      include: {
        world: {
          select: { userId: true },
        },
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
          },
        },
      },
    })

    if (!location) {
      return { success: false, error: "Location not found" }
    }

    // 3. Verify user owns the world
    if (location.world.userId !== user.id) {
      return { success: false, error: "You don't have permission to view this location" }
    }

    return { success: true, data: location }
  } catch (error) {
    console.error("Get location error:", error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Failed to fetch location" }
  }
}

/**
 * Search for locations using PostgreSQL full-text search
 * Returns locations ranked by relevance with match highlighting
 */
export async function searchLocations(
  worldId: string,
  query: string
): Promise<
  ActionResponse<
    Array<
      Location & {
        rank: number
        parent: { id: string; name: string; slug: string } | null
      }
    >
  >
> {
  try {
    // 1. Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "You must be logged in to search" }
    }

    // 2. Verify user owns the world
    const world = await prisma.world.findUnique({
      where: { id: worldId },
      select: { userId: true },
    })

    if (!world) {
      return { success: false, error: "World not found" }
    }

    if (world.userId !== user.id) {
      return { success: false, error: "You don't have permission to search this world" }
    }

    // 3. Validate query
    if (!query || query.trim().length === 0) {
      return { success: true, data: [] }
    }

    // 4. Sanitize query for full-text search (replace special characters, add prefix matching)
    const sanitizedQuery = query
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0)
      .map((word) => `${word}:*`) // Add prefix matching
      .join(" & ") // AND operator

    // 5. Execute full-text search with relevance ranking
    const locations = await prisma.$queryRaw<
      Array<
        Location & {
          rank: number
          parent: { id: string; name: string; slug: string } | null
        }
      >
    >`
      SELECT
        l.id,
        l.name,
        l.slug,
        l."worldId",
        l.type,
        l."parentId",
        l.description,
        l.geography,
        l.climate,
        l.population,
        l.government,
        l.economy,
        l.culture,
        l.coordinates,
        l.attributes,
        l."imageUrl",
        l."createdAt",
        l."updatedAt",
        ts_rank(l.search_vector, to_tsquery('english', ${sanitizedQuery})) as rank,
        jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'slug', p.slug
        ) as parent
      FROM locations l
      LEFT JOIN locations p ON l."parentId" = p.id
      WHERE
        l."worldId" = ${worldId}::text
        AND l.search_vector @@ to_tsquery('english', ${sanitizedQuery})
      ORDER BY rank DESC, l.name ASC
      LIMIT 50
    `

    return { success: true, data: locations }
  } catch (error) {
    console.error("Search locations error:", error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Failed to search locations" }
  }
}
