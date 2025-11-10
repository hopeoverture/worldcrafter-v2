/**
 * Integration tests for World Server Actions
 * Tests against real test database with mocked Supabase auth
 */

import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from "vitest"
import { prisma } from "@/lib/prisma"
import {
  createWorld,
  updateWorld,
  deleteWorld,
  getWorlds,
  getWorld,
} from "@/app/worlds/actions"
import { createMockWorld, resetWorldFactory } from "@/test/factories/world"
import type { Genre, Privacy } from "@prisma/client"
import { randomUUID } from "crypto"

// Mock Supabase auth - use valid UUID format
const mockUserId = randomUUID()
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({
          data: { user: { id: mockUserId } },
          error: null,
        })
      ),
    },
  })),
}))

// Mock Next.js revalidatePath since we're not in a Next.js runtime
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

// Track created worlds for cleanup
const createdWorldIds: string[] = []

describe("World Server Actions Integration Tests", () => {
  beforeAll(async () => {
    // Create test user in database
    await prisma.user.upsert({
      where: { id: mockUserId },
      update: {},
      create: {
        id: mockUserId,
        email: "test-user@worldcrafter.test",
        name: "Test User",
      },
    })
  })

  beforeEach(() => {
    resetWorldFactory()
  })

  afterAll(async () => {
    // Clean up all test data
    if (createdWorldIds.length > 0) {
      await prisma.activity.deleteMany({
        where: { worldId: { in: createdWorldIds } },
      })
      await prisma.world.deleteMany({
        where: { id: { in: createdWorldIds } },
      })
    }

    // Clean up test user
    await prisma.user.delete({
      where: { id: mockUserId },
    }).catch(() => {
      // Ignore error if user doesn't exist
    })
  })

  describe("createWorld", () => {
    it("should create a world successfully with valid input", async () => {
      const input = {
        name: "Fantasy Kingdom",
        genre: "FANTASY" as Genre,
        description: "A medieval fantasy world with magic and dragons",
        setting: "Medieval era with magic",
        privacy: "PRIVATE" as Privacy,
      }

      const result = await createWorld(input)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.name).toBe(input.name)
      expect(result.data?.genre).toBe(input.genre)
      expect(result.data?.description).toBe(input.description)
      expect(result.data?.userId).toBe(mockUserId)
      expect(result.data?.slug).toBeDefined()
      expect(result.data?.slug).toContain("fantasy-kingdom")

      // Track for cleanup
      if (result.data) {
        createdWorldIds.push(result.data.id)
      }

      // Verify activity was logged
      const activity = await prisma.activity.findFirst({
        where: {
          worldId: result.data?.id,
          action: "created",
        },
      })
      expect(activity).toBeDefined()
      expect(activity?.entityType).toBe("WORLD")
    })

    it("should create a world with minimal fields", async () => {
      const input = {
        name: "Minimal World",
      }

      const result = await createWorld(input)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.name).toBe(input.name)
      expect(result.data?.genre).toBe("CUSTOM") // Default value
      expect(result.data?.privacy).toBe("PRIVATE") // Default value

      if (result.data) {
        createdWorldIds.push(result.data.id)
      }
    })

    it("should fail with empty name", async () => {
      const input = {
        name: "",
      }

      const result = await createWorld(input)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it("should fail with name exceeding max length", async () => {
      const input = {
        name: "A".repeat(101), // Max is 100
      }

      const result = await createWorld(input)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it("should create worlds with different genres", async () => {
      const genres: Genre[] = ["FANTASY", "SCIFI", "MODERN", "HISTORICAL", "HORROR", "CUSTOM"]

      for (const genre of genres) {
        const input = {
          name: `${genre} World`,
          genre,
        }

        const result = await createWorld(input)

        expect(result.success).toBe(true)
        expect(result.data?.genre).toBe(genre)

        if (result.data) {
          createdWorldIds.push(result.data.id)
        }
      }
    })
  })

  describe("updateWorld", () => {
    it("should update a world successfully", async () => {
      // First create a world
      const createResult = await createWorld({
        name: "Original Name",
        genre: "FANTASY" as Genre,
      })

      expect(createResult.success).toBe(true)
      const worldId = createResult.data!.id
      createdWorldIds.push(worldId)

      // Update the world
      const updateResult = await updateWorld(worldId, {
        name: "Updated Name",
        description: "Updated description",
        privacy: "PUBLIC" as Privacy,
      })

      expect(updateResult.success).toBe(true)
      expect(updateResult.data?.name).toBe("Updated Name")
      expect(updateResult.data?.description).toBe("Updated description")
      expect(updateResult.data?.privacy).toBe("PUBLIC")
      expect(updateResult.data?.genre).toBe("FANTASY") // Unchanged

      // Verify activity was logged
      const activity = await prisma.activity.findFirst({
        where: {
          worldId: worldId,
          action: "updated",
        },
      })
      expect(activity).toBeDefined()
    })

    it("should fail to update non-existent world", async () => {
      const result = await updateWorld("non-existent-id", {
        name: "Updated Name",
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain("not found")
    })

    it("should update only specified fields", async () => {
      // Create a world
      const createResult = await createWorld({
        name: "Test World",
        genre: "SCIFI" as Genre,
        description: "Original description",
        setting: "Original setting",
      })

      expect(createResult.success).toBe(true)
      const worldId = createResult.data!.id
      createdWorldIds.push(worldId)

      // Update only description
      const updateResult = await updateWorld(worldId, {
        description: "New description",
      })

      expect(updateResult.success).toBe(true)
      expect(updateResult.data?.description).toBe("New description")
      expect(updateResult.data?.name).toBe("Test World") // Unchanged
      expect(updateResult.data?.genre).toBe("SCIFI") // Unchanged
      expect(updateResult.data?.setting).toBe("Original setting") // Unchanged
    })
  })

  describe("deleteWorld", () => {
    it("should delete a world successfully", async () => {
      // Create a world
      const createResult = await createWorld({
        name: "World to Delete",
      })

      expect(createResult.success).toBe(true)
      const worldId = createResult.data!.id
      createdWorldIds.push(worldId)

      // Delete the world
      const deleteResult = await deleteWorld(worldId)

      expect(deleteResult.success).toBe(true)

      // Verify world is deleted
      const deletedWorld = await prisma.world.findUnique({
        where: { id: worldId },
      })
      expect(deletedWorld).toBeNull()

      // Remove from cleanup list since it's already deleted
      const index = createdWorldIds.indexOf(worldId)
      if (index > -1) {
        createdWorldIds.splice(index, 1)
      }
    })

    it("should fail to delete non-existent world", async () => {
      const result = await deleteWorld("non-existent-id")

      expect(result.success).toBe(false)
      expect(result.error).toContain("not found")
    })

    it("should cascade delete related activities", async () => {
      // Create a world
      const createResult = await createWorld({
        name: "World with Activities",
      })

      expect(createResult.success).toBe(true)
      const worldId = createResult.data!.id
      createdWorldIds.push(worldId)

      // Verify activity exists
      const activitiesBefore = await prisma.activity.findMany({
        where: { worldId },
      })
      expect(activitiesBefore.length).toBeGreaterThan(0)

      // Delete the world
      await deleteWorld(worldId)

      // Verify activities are deleted
      const activitiesAfter = await prisma.activity.findMany({
        where: { worldId },
      })
      expect(activitiesAfter.length).toBe(0)

      // Remove from cleanup list
      const index = createdWorldIds.indexOf(worldId)
      if (index > -1) {
        createdWorldIds.splice(index, 1)
      }
    })
  })

  describe("getWorlds", () => {
    beforeAll(async () => {
      // Create test worlds for filtering
      const testWorlds = [
        { name: "Fantasy World 1", genre: "FANTASY" as Genre, privacy: "PRIVATE" as Privacy },
        {
          name: "Sci-Fi World 1",
          genre: "SCIFI" as Genre,
          privacy: "PUBLIC" as Privacy,
          description: "A futuristic galaxy",
        },
        {
          name: "Fantasy World 2",
          genre: "FANTASY" as Genre,
          privacy: "UNLISTED" as Privacy,
        },
        {
          name: "Modern World",
          genre: "MODERN" as Genre,
          privacy: "PRIVATE" as Privacy,
          description: "Contemporary setting",
        },
      ]

      for (const world of testWorlds) {
        const result = await createWorld(world)
        if (result.data) {
          createdWorldIds.push(result.data.id)
        }
      }
    })

    it("should get all worlds for a user", async () => {
      const result = await getWorlds()

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.length).toBeGreaterThanOrEqual(4)
      expect(result.data!.every((w) => w.userId === mockUserId)).toBe(true)
    })

    it("should filter worlds by genre", async () => {
      const result = await getWorlds({ genre: "FANTASY" })

      expect(result.success).toBe(true)
      expect(result.data!.every((w) => w.genre === "FANTASY")).toBe(true)
      expect(result.data!.length).toBeGreaterThanOrEqual(2)
    })

    it("should filter worlds by privacy", async () => {
      const result = await getWorlds({ privacy: "PUBLIC" })

      expect(result.success).toBe(true)
      expect(result.data!.every((w) => w.privacy === "PUBLIC")).toBe(true)
    })

    it("should search worlds by name", async () => {
      const result = await getWorlds({ search: "Sci-Fi" })

      expect(result.success).toBe(true)
      expect(result.data!.length).toBeGreaterThan(0)
      expect(result.data!.some((w) => w.name.includes("Sci-Fi"))).toBe(true)
    })

    it("should search worlds by description", async () => {
      const result = await getWorlds({ search: "galaxy" })

      expect(result.success).toBe(true)
      expect(result.data!.length).toBeGreaterThan(0)
      expect(result.data!.some((w) => w.description?.includes("galaxy"))).toBe(true)
    })

    it("should paginate results", async () => {
      const result1 = await getWorlds({ limit: 2, offset: 0 })
      const result2 = await getWorlds({ limit: 2, offset: 2 })

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result1.data!.length).toBeLessThanOrEqual(2)
      expect(result2.data!.length).toBeGreaterThanOrEqual(0)

      // Results should be different
      if (result1.data!.length > 0 && result2.data!.length > 0) {
        expect(result1.data![0].id).not.toBe(result2.data![0].id)
      }
    })

    it("should return worlds ordered by updatedAt desc", async () => {
      const result = await getWorlds()

      expect(result.success).toBe(true)
      expect(result.data!.length).toBeGreaterThan(1)

      // Verify descending order
      for (let i = 0; i < result.data!.length - 1; i++) {
        const current = new Date(result.data![i].updatedAt)
        const next = new Date(result.data![i + 1].updatedAt)
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime())
      }
    })
  })

  describe("getWorld", () => {
    it("should get a world by slug", async () => {
      // Create a world
      const createResult = await createWorld({
        name: "Unique World",
        description: "A unique world for testing",
      })

      expect(createResult.success).toBe(true)
      const worldSlug = createResult.data!.slug
      createdWorldIds.push(createResult.data!.id)

      // Get the world by slug
      const getResult = await getWorld(worldSlug)

      expect(getResult.success).toBe(true)
      expect(getResult.data).toBeDefined()
      expect(getResult.data?.slug).toBe(worldSlug)
      expect(getResult.data?.name).toBe("Unique World")
      expect(getResult.data?.description).toBe("A unique world for testing")
    })

    it("should fail to get non-existent world", async () => {
      const result = await getWorld("non-existent-slug")

      expect(result.success).toBe(false)
      expect(result.error).toContain("not found")
    })

    it("should return complete world data", async () => {
      // Create a world with all fields
      const createResult = await createWorld({
        name: "Complete World",
        genre: "SCIFI" as Genre,
        description: "Full description",
        setting: "Space opera setting",
        privacy: "UNLISTED" as Privacy,
        coverUrl: "https://example.com/cover.jpg",
        metadata: { theme: "dystopian", year: 2157 },
      })

      expect(createResult.success).toBe(true)
      const worldSlug = createResult.data!.slug
      createdWorldIds.push(createResult.data!.id)

      // Get the world
      const getResult = await getWorld(worldSlug)

      expect(getResult.success).toBe(true)
      expect(getResult.data?.genre).toBe("SCIFI")
      expect(getResult.data?.description).toBe("Full description")
      expect(getResult.data?.setting).toBe("Space opera setting")
      expect(getResult.data?.privacy).toBe("UNLISTED")
      expect(getResult.data?.coverUrl).toBe("https://example.com/cover.jpg")
      expect(getResult.data?.metadata).toEqual({ theme: "dystopian", year: 2157 })
    })
  })
})
