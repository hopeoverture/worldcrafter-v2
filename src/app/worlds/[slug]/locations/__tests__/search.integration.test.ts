/**
 * Integration tests for Location Search functionality
 * Tests against real test database with mocked Supabase auth
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest"
import { prisma } from "@/lib/prisma"
import { searchLocations } from "../actions"
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

describe("Location Search Integration", () => {
  let testWorldId: string
  let testLocationIds: string[] = []

  beforeAll(async () => {
    // Create test user in database
    await prisma.user.upsert({
      where: { id: mockUserId },
      update: {},
      create: {
        id: mockUserId,
        email: "test-search@worldcrafter.test",
        name: "Test User for Search",
      },
    })

    // Create test world
    const world = await prisma.world.create({
      data: {
        name: "Test Search World",
        slug: `test-search-world-${Date.now()}`,
        userId: mockUserId,
        genre: "FANTASY",
        setting: "A world for testing search functionality",
      },
    })

    testWorldId = world.id

    // Create test locations with various content
    const locations = [
      {
        name: "Dragon Peak Mountain",
        slug: `dragon-peak-${Date.now()}`,
        worldId: testWorldId,
        type: "Mountain",
        description: "A towering mountain where ancient dragons once nested",
        geography: "Steep rocky cliffs with volcanic formations",
        culture: "Ancient draconic ruins scattered throughout",
      },
      {
        name: "Emerald Forest",
        slug: `emerald-forest-${Date.now()}`,
        worldId: testWorldId,
        type: "Forest",
        description: "A lush forest with emerald green leaves",
        geography: "Dense woodland with crystal-clear streams",
        culture: "Home to elven settlements",
      },
      {
        name: "Crystal City",
        slug: `crystal-city-${Date.now()}`,
        worldId: testWorldId,
        type: "City",
        description: "A magnificent city built from crystal and glass",
        geography: "Located at the base of Dragon Peak",
        economy: "Trade hub for magical crystals",
      },
      {
        name: "Forgotten Temple",
        slug: `forgotten-temple-${Date.now()}`,
        worldId: testWorldId,
        type: "Dungeon",
        description: "An ancient temple lost to time",
        geography: "Deep underground caverns",
        culture: "Ancient dragon worshippers once prayed here",
      },
      {
        name: "Riverside Village",
        slug: `riverside-village-${Date.now()}`,
        worldId: testWorldId,
        type: "Village",
        description: "A peaceful village by the river",
        geography: "Fertile plains alongside a wide river",
        population: "About 500 friendly villagers",
      },
    ]

    for (const locationData of locations) {
      const location = await prisma.location.create({
        data: locationData,
      })
      testLocationIds.push(location.id)
    }

    // Wait for search vectors to update (trigger runs on insert)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  })

  afterAll(async () => {
    // Clean up test data
    if (testLocationIds.length > 0) {
      await prisma.location.deleteMany({
        where: { id: { in: testLocationIds } },
      })
    }

    if (testWorldId) {
      await prisma.activity.deleteMany({ where: { worldId: testWorldId } })
      await prisma.world.delete({ where: { id: testWorldId } })
    }

    // Clean up test user
    await prisma.user.delete({
      where: { id: mockUserId },
    })
  })

  it("should find locations by name", async () => {
    const result = await searchLocations(testWorldId, "Dragon Peak")

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
    expect(result.data!.length).toBeGreaterThan(0)

    const location = result.data![0]
    expect(location.name).toBe("Dragon Peak Mountain")
  })

  it("should find locations by type", async () => {
    const result = await searchLocations(testWorldId, "forest")

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
    expect(result.data!.length).toBeGreaterThan(0)

    const location = result.data!.find((l) => l.type === "Forest")
    expect(location).toBeDefined()
    expect(location!.name).toBe("Emerald Forest")
  })

  it("should find locations by description content", async () => {
    const result = await searchLocations(testWorldId, "crystal")

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
    expect(result.data!.length).toBeGreaterThan(0)

    // Should find both Crystal City and locations mentioning crystal
    const crystalCity = result.data!.find((l) => l.name === "Crystal City")
    expect(crystalCity).toBeDefined()
  })

  it("should find locations by multiple related terms", async () => {
    const result = await searchLocations(testWorldId, "dragon ancient")

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
    expect(result.data!.length).toBeGreaterThan(0)

    // Should find locations with both "dragon" and "ancient"
    const relevantLocations = result.data!.filter(
      (l) =>
        l.name.toLowerCase().includes("dragon") ||
        l.description?.toLowerCase().includes("dragon") ||
        l.culture?.toLowerCase().includes("dragon")
    )
    expect(relevantLocations.length).toBeGreaterThan(0)
  })

  it("should rank results by relevance", async () => {
    const result = await searchLocations(testWorldId, "dragon")

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
    expect(result.data!.length).toBeGreaterThan(0)

    // Dragon Peak Mountain should rank higher (name match)
    // than locations only mentioning dragon in description
    const firstResult = result.data![0]
    expect(firstResult.name).toBe("Dragon Peak Mountain")
    expect(firstResult.rank).toBeGreaterThan(0)

    // Results should be ordered by rank descending
    for (let i = 1; i < result.data!.length; i++) {
      expect(result.data![i - 1].rank).toBeGreaterThanOrEqual(result.data![i].rank)
    }
  })

  it("should support prefix matching", async () => {
    const result = await searchLocations(testWorldId, "cryst")

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
    expect(result.data!.length).toBeGreaterThan(0)

    // Should find "Crystal City" even with partial word
    const crystalCity = result.data!.find((l) => l.name === "Crystal City")
    expect(crystalCity).toBeDefined()
  })

  it("should return empty array for no matches", async () => {
    const result = await searchLocations(testWorldId, "nonexistent12345")

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
    expect(result.data!.length).toBe(0)
  })

  it("should return empty array for empty query", async () => {
    const result = await searchLocations(testWorldId, "")

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
    expect(result.data!.length).toBe(0)
  })

  it(
    "should limit results to 50",
    async () => {
      // Create 60 locations with same search term
      const manyLocationIds: string[] = []

    for (let i = 0; i < 60; i++) {
      const location = await prisma.location.create({
        data: {
          name: `Test Location ${i}`,
          slug: `test-location-${Date.now()}-${i}`,
          worldId: testWorldId,
          type: "Village",
          description: "searchtest123 location",
        },
      })
      manyLocationIds.push(location.id)
    }

    // Wait for search vectors
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const result = await searchLocations(testWorldId, "searchtest123")

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
    expect(result.data!.length).toBeLessThanOrEqual(50)

      // Clean up
      await prisma.location.deleteMany({
        where: { id: { in: manyLocationIds } },
      })
    },
    15000
  ) // Increased timeout for creating 60 locations

  it("should not find locations from other worlds", async () => {
    // Create another world with a location
    const otherWorld = await prisma.world.create({
      data: {
        name: "Other World",
        slug: `other-world-${Date.now()}`,
        userId: mockUserId,
      },
    })

    const otherLocation = await prisma.location.create({
      data: {
        name: "Unique Location Name 12345",
        slug: `unique-location-${Date.now()}`,
        worldId: otherWorld.id,
        type: "City",
      },
    })

    // Search in original world should not find location from other world
    const result = await searchLocations(testWorldId, "Unique Location Name 12345")

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
    expect(result.data!.length).toBe(0)

    // Clean up
    await prisma.location.delete({ where: { id: otherLocation.id } })
    await prisma.world.delete({ where: { id: otherWorld.id } })
  })
})
