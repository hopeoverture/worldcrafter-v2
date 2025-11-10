import { prisma } from "@/lib/prisma"
import type { Location, Prisma } from "@prisma/client"

/**
 * Location factory for generating test data
 */

export interface LocationFactoryOptions {
  worldId: string
  name?: string
  type?: string | null
  parentId?: string | null
  description?: string | null
  geography?: string | null
  climate?: string | null
  population?: string | null
  government?: string | null
  economy?: string | null
  culture?: string | null
  coordinates?: { x: number; y: number } | null
  attributes?: Record<string, unknown> | null
  imageUrl?: string | null
}

/**
 * Generate a unique slug from a location name
 */
function generateSlug(name: string): string {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 50)

  const randomSuffix = Math.random().toString(36).substring(2, 8)
  return `${baseSlug}-${randomSuffix}`
}

/**
 * Create a location with default values
 */
export async function createLocationFactory(
  options: LocationFactoryOptions
): Promise<Location> {
  const slug = generateSlug(options.name || "Test Location")

  const location = await prisma.location.create({
    data: {
      worldId: options.worldId,
      name: options.name || "Test Location",
      slug,
      type: options.type ?? "City",
      parentId: options.parentId ?? null,
      description: options.description ?? "A test location",
      geography: options.geography ?? null,
      climate: options.climate ?? "Temperate",
      population: options.population ?? "10,000",
      government: options.government ?? "Democracy",
      economy: options.economy ?? "Trade-based economy",
      culture: options.culture ?? "Diverse culture",
      coordinates: (options.coordinates ?? undefined) as Prisma.InputJsonValue | undefined,
      attributes: (options.attributes ?? undefined) as Prisma.InputJsonValue | undefined,
      imageUrl: options.imageUrl ?? null,
    },
  })

  return location
}

/**
 * Create multiple locations for testing hierarchies
 */
export async function createLocationHierarchy(
  worldId: string
): Promise<{ parent: Location; child1: Location; child2: Location }> {
  const parent = await createLocationFactory({
    worldId,
    name: "Parent City",
    type: "City",
  })

  const child1 = await createLocationFactory({
    worldId,
    name: "Child District 1",
    type: "District",
    parentId: parent.id,
  })

  const child2 = await createLocationFactory({
    worldId,
    name: "Child District 2",
    type: "District",
    parentId: parent.id,
  })

  return { parent, child1, child2 }
}
