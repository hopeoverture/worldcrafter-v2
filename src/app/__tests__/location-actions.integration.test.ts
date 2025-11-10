/**
 * Integration tests for Location Server Actions
 * Tests against real test database with mocked Supabase auth
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest"
import { prisma } from "@/lib/prisma"
import {
  createLocation,
  updateLocation,
  deleteLocation,
  getLocations,
  getLocation,
} from "@/app/worlds/[slug]/locations/actions"
import {
  createLocationFactory,
  createLocationHierarchy,
} from "@/test/factories/location"
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

/**
 * Location Server Actions Integration Tests
 *
 * These tests verify location CRUD operations, hierarchy management,
 * circular hierarchy prevention, and cascade deletes
 */

describe("Location Server Actions Integration Tests", () => {
  let testWorldId: string
  const createdLocationIds: string[] = []

  beforeAll(async () => {
    // Create test user in database
    await prisma.user.upsert({
      where: { id: mockUserId },
      update: {},
      create: {
        id: mockUserId,
        email: "test-locations@worldcrafter.test",
        name: "Test User for Locations",
      },
    })

    // Create test world directly via Prisma
    const world = await prisma.world.create({
      data: {
        userId: mockUserId,
        name: "Test World for Locations",
        slug: `test-world-${Date.now()}`,
        genre: "FANTASY",
        description: "World for location testing",
        privacy: "PRIVATE",
      },
    })

    testWorldId = world.id
  })

  afterAll(async () => {
    // Clean up created locations
    if (createdLocationIds.length > 0) {
      await prisma.location.deleteMany({
        where: { id: { in: createdLocationIds } },
      })
    }

    // Clean up test world
    if (testWorldId) {
      await prisma.world.delete({
        where: { id: testWorldId },
      })
    }

    // Clean up test user
    await prisma.user.delete({
      where: { id: mockUserId },
    })
  })

  describe("createLocation", () => {
    it("should create a location successfully with minimal fields", async () => {
      const input = {
        worldId: testWorldId,
        name: "Test City",
      }

      const result = await createLocation(input)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.name).toBe(input.name)
      expect(result.data?.worldId).toBe(testWorldId)
      expect(result.data?.slug).toBeDefined()

      if (result.data) {
        createdLocationIds.push(result.data.id)
      }
    })

    it("should create a location with all fields", async () => {
      const input = {
        worldId: testWorldId,
        name: "Complete City",
        type: "City",
        description: "A fully detailed test city",
        geography: "Located in a valley",
        climate: "Temperate",
        population: "50,000",
        government: "Republic",
        economy: "Trade and agriculture",
        culture: "Diverse and welcoming",
        coordinates: { x: 100, y: 200 },
        attributes: { founded: "1200 AD", walls: true },
        imageUrl: "https://example.com/city.jpg",
      }

      const result = await createLocation(input)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.name).toBe(input.name)
      expect(result.data?.type).toBe(input.type)
      expect(result.data?.climate).toBe(input.climate)
      expect(result.data?.population).toBe(input.population)
      expect(result.data?.coordinates).toEqual(input.coordinates)
      expect(result.data?.attributes).toEqual(input.attributes)

      if (result.data) {
        createdLocationIds.push(result.data.id)
      }
    })

    it("should create a location with a parent", async () => {
      // Create parent first
      const parentResult = await createLocation({
        worldId: testWorldId,
        name: "Parent Region",
        type: "Region",
      })

      expect(parentResult.success).toBe(true)
      const parentId = parentResult.data!.id
      createdLocationIds.push(parentId)

      // Create child
      const childResult = await createLocation({
        worldId: testWorldId,
        name: "Child Town",
        type: "Town",
        parentId,
      })

      expect(childResult.success).toBe(true)
      expect(childResult.data?.parentId).toBe(parentId)

      if (childResult.data) {
        createdLocationIds.push(childResult.data.id)
      }
    })

    it("should fail with empty name", async () => {
      const input = {
        worldId: testWorldId,
        name: "",
      }

      const result = await createLocation(input)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it("should fail with invalid worldId", async () => {
      const input = {
        worldId: "invalid-world-id",
        name: "Test Location",
      }

      const result = await createLocation(input)

      expect(result.success).toBe(false)
      expect(result.error).toContain("World not found")
    })

    it("should fail with invalid parentId", async () => {
      const input = {
        worldId: testWorldId,
        name: "Test Location",
        parentId: "invalid-parent-id",
      }

      const result = await createLocation(input)

      expect(result.success).toBe(false)
      expect(result.error).toContain("Parent location not found")
    })
  })

  describe("updateLocation", () => {
    it("should update a location successfully", async () => {
      // Create location first
      const createResult = await createLocation({
        worldId: testWorldId,
        name: "Original Name",
        type: "Village",
      })

      expect(createResult.success).toBe(true)
      const locationId = createResult.data!.id
      createdLocationIds.push(locationId)

      // Update location
      const updateResult = await updateLocation(locationId, {
        name: "Updated Name",
        type: "Town",
        population: "5,000",
      })

      expect(updateResult.success).toBe(true)
      expect(updateResult.data?.name).toBe("Updated Name")
      expect(updateResult.data?.type).toBe("Town")
      expect(updateResult.data?.population).toBe("5,000")
    })

    it("should update only specified fields", async () => {
      // Create location
      const createResult = await createLocation({
        worldId: testWorldId,
        name: "Test Location",
        type: "City",
        climate: "Tropical",
      })

      expect(createResult.success).toBe(true)
      const locationId = createResult.data!.id
      createdLocationIds.push(locationId)

      // Update only population
      const updateResult = await updateLocation(locationId, {
        population: "100,000",
      })

      expect(updateResult.success).toBe(true)
      expect(updateResult.data?.name).toBe("Test Location") // Unchanged
      expect(updateResult.data?.type).toBe("City") // Unchanged
      expect(updateResult.data?.climate).toBe("Tropical") // Unchanged
      expect(updateResult.data?.population).toBe("100,000") // Updated
    })

    it("should prevent circular hierarchy (self-parent)", async () => {
      // Create location
      const createResult = await createLocation({
        worldId: testWorldId,
        name: "Test Location",
      })

      expect(createResult.success).toBe(true)
      const locationId = createResult.data!.id
      createdLocationIds.push(locationId)

      // Try to set itself as parent
      const updateResult = await updateLocation(locationId, {
        parentId: locationId,
      })

      expect(updateResult.success).toBe(false)
      expect(updateResult.error).toContain("circular hierarchy")
    })

    it("should prevent circular hierarchy (grandparent loop)", async () => {
      // Create hierarchy: A -> B -> C
      const resultA = await createLocation({
        worldId: testWorldId,
        name: "Location A",
      })
      const locationA = resultA.data!.id
      createdLocationIds.push(locationA)

      const resultB = await createLocation({
        worldId: testWorldId,
        name: "Location B",
        parentId: locationA,
      })
      const locationB = resultB.data!.id
      createdLocationIds.push(locationB)

      const resultC = await createLocation({
        worldId: testWorldId,
        name: "Location C",
        parentId: locationB,
      })
      const locationC = resultC.data!.id
      createdLocationIds.push(locationC)

      // Try to make A a child of C (would create loop: A -> B -> C -> A)
      const updateResult = await updateLocation(locationA, {
        parentId: locationC,
      })

      expect(updateResult.success).toBe(false)
      expect(updateResult.error).toContain("circular hierarchy")
    })

    it("should fail to update non-existent location", async () => {
      const result = await updateLocation("non-existent-id", {
        name: "Updated Name",
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain("Location not found")
    })
  })

  describe("deleteLocation", () => {
    it("should delete a location successfully", async () => {
      // Create location
      const createResult = await createLocation({
        worldId: testWorldId,
        name: "To Be Deleted",
      })

      expect(createResult.success).toBe(true)
      const locationId = createResult.data!.id

      // Delete location
      const deleteResult = await deleteLocation(locationId)

      expect(deleteResult.success).toBe(true)

      // Verify deleted
      const getResult = await getLocation(testWorldId, createResult.data!.slug)
      expect(getResult.success).toBe(false)
      expect(getResult.error).toContain("not found")
    })

    it("should cascade delete children", async () => {
      // Create hierarchy
      const hierarchy = await createLocationHierarchy(testWorldId)
      createdLocationIds.push(hierarchy.parent.id)

      // Delete parent
      const deleteResult = await deleteLocation(hierarchy.parent.id)
      expect(deleteResult.success).toBe(true)

      // Verify children were also deleted
      const child1 = await prisma.location.findUnique({
        where: { id: hierarchy.child1.id },
      })
      const child2 = await prisma.location.findUnique({
        where: { id: hierarchy.child2.id },
      })

      expect(child1).toBeNull()
      expect(child2).toBeNull()
    })

    it("should fail to delete non-existent location", async () => {
      const result = await deleteLocation("non-existent-id")

      expect(result.success).toBe(false)
      expect(result.error).toContain("Location not found")
    })
  })

  describe("getLocations", () => {
    it("should get all locations for a world", async () => {
      // Create multiple locations
      await createLocation({ worldId: testWorldId, name: "Location 1" })
      await createLocation({ worldId: testWorldId, name: "Location 2" })
      await createLocation({ worldId: testWorldId, name: "Location 3" })

      const result = await getLocations({ worldId: testWorldId })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.length).toBeGreaterThanOrEqual(3)

      // Add all created locations to cleanup array
      result.data!.forEach((loc) => {
        if (!createdLocationIds.includes(loc.id)) {
          createdLocationIds.push(loc.id)
        }
      })
    })

    it("should filter locations by type", async () => {
      // Create locations of different types
      await createLocation({ worldId: testWorldId, name: "City A", type: "City" })
      await createLocation({ worldId: testWorldId, name: "Village B", type: "Village" })
      await createLocation({ worldId: testWorldId, name: "City C", type: "City" })

      const result = await getLocations({
        worldId: testWorldId,
        type: "City",
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.every((loc) => loc.type === "City")).toBe(true)

      result.data!.forEach((loc) => {
        if (!createdLocationIds.includes(loc.id)) {
          createdLocationIds.push(loc.id)
        }
      })
    })

    it("should filter locations by parentId (root level)", async () => {
      // Create root location
      const rootResult = await createLocation({
        worldId: testWorldId,
        name: "Root Location",
      })
      createdLocationIds.push(rootResult.data!.id)

      // Create child location
      const childResult = await createLocation({
        worldId: testWorldId,
        name: "Child Location",
        parentId: rootResult.data!.id,
      })
      createdLocationIds.push(childResult.data!.id)

      // Get root locations (parentId = null)
      const result = await getLocations({
        worldId: testWorldId,
        parentId: null,
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.every((loc) => loc.parentId === null)).toBe(true)
    })

    it("should include hierarchy when requested", async () => {
      // Create hierarchy
      const hierarchy = await createLocationHierarchy(testWorldId)
      createdLocationIds.push(hierarchy.parent.id)

      const result = await getLocations({
        worldId: testWorldId,
        includeHierarchy: true,
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()

      // Find parent in results
      const parent = result.data!.find((loc) => loc.id === hierarchy.parent.id)
      expect(parent).toBeDefined()

      // Check that hierarchy data is included
      if ("children" in parent!) {
        expect((parent as any).children).toBeDefined()
      }
    })

    it("should paginate results", async () => {
      // Get first page
      const page1 = await getLocations({
        worldId: testWorldId,
        limit: 5,
        offset: 0,
      })

      expect(page1.success).toBe(true)
      expect(page1.data).toBeDefined()
      expect(page1.data!.length).toBeLessThanOrEqual(5)

      // Get second page
      const page2 = await getLocations({
        worldId: testWorldId,
        limit: 5,
        offset: 5,
      })

      expect(page2.success).toBe(true)
      expect(page2.data).toBeDefined()

      // Verify different results
      if (page1.data!.length > 0 && page2.data!.length > 0) {
        expect(page1.data![0].id).not.toBe(page2.data![0].id)
      }
    })
  })

  describe("getLocation", () => {
    it("should get a location by slug", async () => {
      // Create location
      const createResult = await createLocation({
        worldId: testWorldId,
        name: "Findable Location",
      })

      expect(createResult.success).toBe(true)
      const slug = createResult.data!.slug
      createdLocationIds.push(createResult.data!.id)

      // Get location by slug
      const getResult = await getLocation(testWorldId, slug)

      expect(getResult.success).toBe(true)
      expect(getResult.data).toBeDefined()
      expect(getResult.data?.slug).toBe(slug)
      expect(getResult.data?.name).toBe("Findable Location")
    })

    it("should include parent and children in result", async () => {
      // Create hierarchy
      const hierarchy = await createLocationHierarchy(testWorldId)
      createdLocationIds.push(hierarchy.parent.id)

      // Get parent location
      const result = await getLocation(testWorldId, hierarchy.parent.slug)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()

      // Check for parent and children fields
      if ("children" in result.data!) {
        expect((result.data as any).children).toBeDefined()
        expect((result.data as any).children.length).toBeGreaterThanOrEqual(2)
      }
    })

    it("should fail to get non-existent location", async () => {
      const result = await getLocation(testWorldId, "non-existent-slug")

      expect(result.success).toBe(false)
      expect(result.error).toContain("not found")
    })
  })
})
