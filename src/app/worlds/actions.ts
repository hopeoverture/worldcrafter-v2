"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import {
  createWorldSchema,
  updateWorldSchema,
  worldFiltersSchema,
  type CreateWorldInput,
  type UpdateWorldInput,
  type WorldFilters,
} from "@/lib/schemas/world.schema"
import type { World, Prisma } from "@prisma/client"

/**
 * Server action response type
 */
type ActionResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * Generate a unique slug from a world name
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
 * Create a new world
 */
export async function createWorld(
  input: CreateWorldInput
): Promise<ActionResponse<World>> {
  try {
    // 1. Validate input
    const validated = createWorldSchema.parse(input)

    // 2. Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "You must be logged in to create a world" }
    }

    // 3. Generate unique slug
    const slug = generateSlug(validated.name)

    // 4. Create world in database
    const world = await prisma.world.create({
      data: {
        name: validated.name,
        slug,
        userId: user.id,
        genre: validated.genre,
        description: validated.description,
        setting: validated.setting,
        metadata: (validated.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        coverUrl: validated.coverUrl,
        privacy: validated.privacy,
      },
    })

    // 5. Log activity
    await prisma.activity.create({
      data: {
        worldId: world.id,
        userId: user.id,
        entityType: "WORLD",
        entityId: world.id,
        action: "created",
        metadata: { worldName: world.name },
      },
    })

    // 6. Revalidate relevant paths
    revalidatePath("/dashboard")
    revalidatePath("/worlds")

    return { success: true, data: world }
  } catch (error) {
    console.error("Create world error:", error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Failed to create world" }
  }
}

/**
 * Update an existing world
 */
export async function updateWorld(
  id: string,
  input: UpdateWorldInput
): Promise<ActionResponse<World>> {
  try {
    // 1. Validate input
    const validated = updateWorldSchema.parse(input)

    // 2. Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "You must be logged in to update a world" }
    }

    // 3. Verify world exists and user owns it
    const existingWorld = await prisma.world.findUnique({
      where: { id },
      select: { userId: true, slug: true },
    })

    if (!existingWorld) {
      return { success: false, error: "World not found" }
    }

    if (existingWorld.userId !== user.id) {
      return { success: false, error: "You don't have permission to update this world" }
    }

    // 4. Update world in database
    const world = await prisma.world.update({
      where: { id },
      data: {
        name: validated.name,
        genre: validated.genre,
        description: validated.description,
        setting: validated.setting,
        metadata: (validated.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        coverUrl: validated.coverUrl,
        privacy: validated.privacy,
      },
    })

    // 5. Log activity
    await prisma.activity.create({
      data: {
        worldId: world.id,
        userId: user.id,
        entityType: "WORLD",
        entityId: world.id,
        action: "updated",
        metadata: { worldName: world.name },
      },
    })

    // 6. Revalidate relevant paths
    revalidatePath("/dashboard")
    revalidatePath("/worlds")
    revalidatePath(`/worlds/${existingWorld.slug}`)

    return { success: true, data: world }
  } catch (error) {
    console.error("Update world error:", error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Failed to update world" }
  }
}

/**
 * Delete a world (soft delete by removing from database)
 */
export async function deleteWorld(id: string): Promise<ActionResponse<void>> {
  try {
    // 1. Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "You must be logged in to delete a world" }
    }

    // 2. Verify world exists and user owns it
    const existingWorld = await prisma.world.findUnique({
      where: { id },
      select: { userId: true, name: true },
    })

    if (!existingWorld) {
      return { success: false, error: "World not found" }
    }

    if (existingWorld.userId !== user.id) {
      return { success: false, error: "You don't have permission to delete this world" }
    }

    // 3. Delete world (cascades to locations and activities via Prisma)
    await prisma.world.delete({
      where: { id },
    })

    // 4. Revalidate relevant paths
    revalidatePath("/dashboard")
    revalidatePath("/worlds")

    return { success: true }
  } catch (error) {
    console.error("Delete world error:", error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Failed to delete world" }
  }
}

/**
 * Get all worlds for a user with optional filters
 */
export async function getWorlds(
  filters?: WorldFilters
): Promise<ActionResponse<World[]>> {
  try {
    // 1. Validate filters
    const validatedFilters = filters
      ? worldFiltersSchema.parse(filters)
      : worldFiltersSchema.parse({})

    // 2. Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "You must be logged in to view worlds" }
    }

    // 3. Build query filters
    const where: any = {
      userId: user.id,
    }

    if (validatedFilters.genre) {
      where.genre = validatedFilters.genre
    }

    if (validatedFilters.privacy) {
      where.privacy = validatedFilters.privacy
    }

    if (validatedFilters.search) {
      where.OR = [
        { name: { contains: validatedFilters.search, mode: "insensitive" } },
        { description: { contains: validatedFilters.search, mode: "insensitive" } },
        { setting: { contains: validatedFilters.search, mode: "insensitive" } },
      ]
    }

    // 4. Fetch worlds with pagination
    const worlds = await prisma.world.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: validatedFilters.limit,
      skip: validatedFilters.offset,
    })

    return { success: true, data: worlds }
  } catch (error) {
    console.error("Get worlds error:", error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Failed to fetch worlds" }
  }
}

/**
 * Get a single world by slug
 */
export async function getWorld(slug: string): Promise<ActionResponse<World>> {
  try {
    // 1. Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "You must be logged in to view this world" }
    }

    // 2. Fetch world
    const world = await prisma.world.findUnique({
      where: { slug },
    })

    if (!world) {
      return { success: false, error: "World not found" }
    }

    // 3. Verify user owns the world (privacy check can be added later)
    if (world.userId !== user.id) {
      return { success: false, error: "You don't have permission to view this world" }
    }

    return { success: true, data: world }
  } catch (error) {
    console.error("Get world error:", error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Failed to fetch world" }
  }
}
