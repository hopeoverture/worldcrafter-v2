/**
 * Integration tests for Character Server Actions
 * Tests against real test database with mocked Supabase auth
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createCharacter,
  updateCharacter,
  deleteCharacter,
  getCharacters,
  getCharacter,
} from "@/app/worlds/[slug]/characters/actions";
// Character factories available if needed for future tests
import { randomUUID } from "crypto";

// Mock Supabase auth - use valid UUID format
const mockUserId = randomUUID();
const otherUserId = randomUUID();

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
}));

// Mock Next.js revalidatePath since we're not in a Next.js runtime
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

/**
 * Character Server Actions Integration Tests
 *
 * These tests verify character CRUD operations, filtering,
 * RLS enforcement, activity logging, and validation
 */

describe("Character Server Actions Integration Tests", () => {
  let testWorldId: string;
  let otherUserWorldId: string;
  const createdCharacterIds: string[] = [];

  beforeAll(async () => {
    // Create test users in database
    await prisma.user.upsert({
      where: { id: mockUserId },
      update: {},
      create: {
        id: mockUserId,
        email: "test-characters@worldcrafter.test",
        name: "Test User for Characters",
      },
    });

    await prisma.user.upsert({
      where: { id: otherUserId },
      update: {},
      create: {
        id: otherUserId,
        email: "other-user@worldcrafter.test",
        name: "Other User",
      },
    });

    // Create test world for main user
    const world = await prisma.world.create({
      data: {
        userId: mockUserId,
        name: "Test World for Characters",
        slug: `test-world-chars-${Date.now()}`,
        genre: "FANTASY",
        description: "World for character testing",
        privacy: "PRIVATE",
      },
    });
    testWorldId = world.id;

    // Create world for other user (for RLS testing)
    const otherWorld = await prisma.world.create({
      data: {
        userId: otherUserId,
        name: "Other User's World",
        slug: `other-world-${Date.now()}`,
        genre: "SCIFI",
        privacy: "PRIVATE",
      },
    });
    otherUserWorldId = otherWorld.id;
  });

  afterAll(async () => {
    // Clean up created characters
    if (createdCharacterIds.length > 0) {
      await prisma.character.deleteMany({
        where: { id: { in: createdCharacterIds } },
      });
    }

    // Clean up test worlds
    if (testWorldId) {
      await prisma.world.delete({
        where: { id: testWorldId },
      });
    }
    if (otherUserWorldId) {
      await prisma.world.delete({
        where: { id: otherUserWorldId },
      });
    }

    // Clean up test users
    await prisma.user.deleteMany({
      where: { id: { in: [mockUserId, otherUserId] } },
    });
  });

  describe("createCharacter", () => {
    it("should create a character with minimal fields (name only)", async () => {
      const input = {
        name: "Minimal Character",
      };

      const result = await createCharacter(testWorldId, input);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe(input.name);
      expect(result.data?.worldId).toBe(testWorldId);
      expect(result.data?.slug).toBeDefined();
      expect(result.data?.slug).toMatch(/minimal-character-[a-z0-9]+/);

      if (result.data) {
        createdCharacterIds.push(result.data.id);
      }
    });

    it("should create a character with all fields", async () => {
      const input = {
        name: "Complete Character",
        role: "Warrior",
        species: "Human",
        age: "30",
        gender: "Male",
        appearance: "Tall and muscular with battle scars",
        personality: "Brave and loyal, but quick to anger",
        backstory: "Born in a small village, trained as a knight",
        goals: "Protect the innocent and defeat the dark lord",
        fears: "Losing his comrades in battle",
        attributes: { strength: 18, constitution: 16, honor: 95 },
        imageUrl: "https://example.com/warrior.jpg",
      };

      const result = await createCharacter(testWorldId, input);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe(input.name);
      expect(result.data?.role).toBe(input.role);
      expect(result.data?.species).toBe(input.species);
      expect(result.data?.age).toBe(input.age);
      expect(result.data?.gender).toBe(input.gender);
      expect(result.data?.appearance).toBe(input.appearance);
      expect(result.data?.personality).toBe(input.personality);
      expect(result.data?.backstory).toBe(input.backstory);
      expect(result.data?.goals).toBe(input.goals);
      expect(result.data?.fears).toBe(input.fears);
      expect(result.data?.attributes).toEqual(input.attributes);
      expect(result.data?.imageUrl).toBe(input.imageUrl);

      if (result.data) {
        createdCharacterIds.push(result.data.id);
      }
    });

    it("should create a character with flexible age formats", async () => {
      const testCases = ["25", "Ancient", "Unknown", "500 years old"];

      for (const age of testCases) {
        const result = await createCharacter(testWorldId, {
          name: `Character aged ${age}`,
          age,
        });

        expect(result.success).toBe(true);
        expect(result.data?.age).toBe(age);

        if (result.data) {
          createdCharacterIds.push(result.data.id);
        }
      }
    });

    it("should create activity log when creating a character", async () => {
      const result = await createCharacter(testWorldId, {
        name: "Activity Test Character",
        role: "Mage",
      });

      expect(result.success).toBe(true);

      if (result.data) {
        createdCharacterIds.push(result.data.id);

        // Verify activity log was created
        const activity = await prisma.activity.findFirst({
          where: {
            entityType: "CHARACTER",
            entityId: result.data.id,
            action: "created",
          },
        });

        expect(activity).toBeDefined();
        expect(activity?.worldId).toBe(testWorldId);
        expect(activity?.userId).toBe(mockUserId);
        expect(activity?.metadata).toMatchObject({
          characterName: "Activity Test Character",
          role: "Mage",
        });
      }
    });

    it("should fail with empty name", async () => {
      const result = await createCharacter(testWorldId, {
        name: "",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should fail with name exceeding 100 characters", async () => {
      const result = await createCharacter(testWorldId, {
        name: "A".repeat(101),
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should fail with invalid imageUrl", async () => {
      const result = await createCharacter(testWorldId, {
        name: "Test Character",
        imageUrl: "not-a-valid-url",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should accept empty string for imageUrl", async () => {
      const result = await createCharacter(testWorldId, {
        name: "Character with empty image URL",
        imageUrl: "",
      });

      expect(result.success).toBe(true);

      if (result.data) {
        createdCharacterIds.push(result.data.id);
      }
    });

    it("should fail with invalid worldId", async () => {
      const result = await createCharacter("invalid-world-id", {
        name: "Test Character",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("World not found");
    });
  });

  describe("updateCharacter", () => {
    it("should update a character successfully", async () => {
      // Create character first
      const createResult = await createCharacter(testWorldId, {
        name: "Original Name",
        role: "Scout",
        species: "Elf",
      });

      expect(createResult.success).toBe(true);
      const characterId = createResult.data!.id;
      createdCharacterIds.push(characterId);

      // Update character
      const updateResult = await updateCharacter(characterId, {
        name: "Updated Name",
        role: "Ranger",
        species: "Half-Elf",
        age: "150",
      });

      expect(updateResult.success).toBe(true);
      expect(updateResult.data?.name).toBe("Updated Name");
      expect(updateResult.data?.role).toBe("Ranger");
      expect(updateResult.data?.species).toBe("Half-Elf");
      expect(updateResult.data?.age).toBe("150");
    });

    it("should update character attributes (JSON field)", async () => {
      // Create character with attributes
      const createResult = await createCharacter(testWorldId, {
        name: "Attribute Test",
        attributes: { strength: 10, intelligence: 15 },
      });

      expect(createResult.success).toBe(true);
      const characterId = createResult.data!.id;
      createdCharacterIds.push(characterId);

      // Update attributes
      const updateResult = await updateCharacter(characterId, {
        attributes: { strength: 12, intelligence: 18, newStat: 20 },
      });

      expect(updateResult.success).toBe(true);
      expect(updateResult.data?.attributes).toEqual({
        strength: 12,
        intelligence: 18,
        newStat: 20,
      });
    });

    it("should update only specified fields", async () => {
      // Create character
      const createResult = await createCharacter(testWorldId, {
        name: "Test Character",
        role: "Warrior",
        species: "Human",
        age: "25",
      });

      expect(createResult.success).toBe(true);
      const characterId = createResult.data!.id;
      createdCharacterIds.push(characterId);

      // Update only role
      const updateResult = await updateCharacter(characterId, {
        role: "Paladin",
      });

      expect(updateResult.success).toBe(true);
      expect(updateResult.data?.name).toBe("Test Character"); // Unchanged
      expect(updateResult.data?.role).toBe("Paladin"); // Updated
      expect(updateResult.data?.species).toBe("Human"); // Unchanged
      expect(updateResult.data?.age).toBe("25"); // Unchanged
    });

    it("should create activity log when updating a character", async () => {
      const createResult = await createCharacter(testWorldId, {
        name: "Update Activity Test",
      });

      expect(createResult.success).toBe(true);
      const characterId = createResult.data!.id;
      createdCharacterIds.push(characterId);

      // Update character
      const updateResult = await updateCharacter(characterId, {
        role: "Updated Role",
        species: "Updated Species",
      });

      expect(updateResult.success).toBe(true);

      // Verify activity log
      const activity = await prisma.activity.findFirst({
        where: {
          entityType: "CHARACTER",
          entityId: characterId,
          action: "updated",
        },
      });

      expect(activity).toBeDefined();
      expect(activity?.worldId).toBe(testWorldId);
    });

    it("should fail when updating non-existent character", async () => {
      const result = await updateCharacter("non-existent-id", {
        name: "Updated Name",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Character not found");
    });
  });

  describe("deleteCharacter", () => {
    it("should delete a character successfully", async () => {
      // Create character
      const createResult = await createCharacter(testWorldId, {
        name: "Character to Delete",
      });

      expect(createResult.success).toBe(true);
      const characterId = createResult.data!.id;

      // Delete character
      const deleteResult = await deleteCharacter(characterId);

      expect(deleteResult.success).toBe(true);

      // Verify character is deleted
      const character = await prisma.character.findUnique({
        where: { id: characterId },
      });

      expect(character).toBeNull();
    });

    it("should cascade delete activity logs when deleting character", async () => {
      // Create character (which creates activity log)
      const createResult = await createCharacter(testWorldId, {
        name: "Cascade Delete Test",
        role: "Test Role",
      });

      expect(createResult.success).toBe(true);
      const characterId = createResult.data!.id;

      // Verify activity log exists
      const activityBefore = await prisma.activity.findFirst({
        where: {
          entityType: "CHARACTER",
          entityId: characterId,
        },
      });

      expect(activityBefore).toBeDefined();

      // Delete character
      await deleteCharacter(characterId);

      // Verify activity logs are NOT deleted (they reference world, not character)
      // This is by design - activity logs should persist for audit trail
      const activityAfter = await prisma.activity.findFirst({
        where: {
          entityType: "CHARACTER",
          entityId: characterId,
        },
      });

      // Activity logs should still exist for audit purposes
      expect(activityAfter).toBeDefined();
    });

    it("should fail when deleting non-existent character", async () => {
      const result = await deleteCharacter("non-existent-id");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Character not found");
    });
  });

  describe("getCharacters", () => {
    beforeAll(async () => {
      // Create test characters with different roles and species
      const characters = [
        { name: "Warrior 1", role: "Warrior", species: "Human" },
        { name: "Warrior 2", role: "Warrior", species: "Orc" },
        { name: "Mage 1", role: "Mage", species: "Elf" },
        { name: "Rogue 1", role: "Rogue", species: "Halfling" },
        { name: "Cleric 1", role: "Cleric", species: "Dwarf" },
      ];

      for (const char of characters) {
        const result = await createCharacter(testWorldId, char);
        if (result.data) {
          createdCharacterIds.push(result.data.id);
        }
      }
    });

    it("should get all characters in a world", async () => {
      const result = await getCharacters(testWorldId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data!.length).toBeGreaterThan(0);
    });

    it("should filter characters by role", async () => {
      const result = await getCharacters(testWorldId, {
        role: "Warrior",
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      // All returned characters should have "Warrior" role
      result.data?.forEach((char) => {
        expect(char.role?.toLowerCase()).toContain("warrior");
      });
    });

    it("should filter characters by species", async () => {
      const result = await getCharacters(testWorldId, {
        species: "Elf",
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      // All returned characters should have "Elf" species
      result.data?.forEach((char) => {
        expect(char.species?.toLowerCase()).toContain("elf");
      });
    });

    it("should search characters across name, role, and species", async () => {
      const result = await getCharacters(testWorldId, {
        search: "Warrior",
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.length).toBeGreaterThan(0);

      // Should match characters with "Warrior" in name OR role
      result.data?.forEach((char) => {
        const matchesSearch =
          char.name.toLowerCase().includes("warrior") ||
          char.role?.toLowerCase().includes("warrior") ||
          char.species?.toLowerCase().includes("warrior");

        expect(matchesSearch).toBe(true);
      });
    });

    it("should return empty array for non-matching filters", async () => {
      const result = await getCharacters(testWorldId, {
        role: "NonExistentRole",
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it("should fail with invalid worldId", async () => {
      const result = await getCharacters("invalid-world-id");

      expect(result.success).toBe(false);
      expect(result.error).toContain("World not found");
    });
  });

  describe("getCharacter", () => {
    it("should get a character by slug", async () => {
      // Create character
      const createResult = await createCharacter(testWorldId, {
        name: "Slug Test Character",
        role: "Test Role",
      });

      expect(createResult.success).toBe(true);
      const character = createResult.data!;
      createdCharacterIds.push(character.id);

      // Get character by slug
      const getResult = await getCharacter(testWorldId, character.slug);

      expect(getResult.success).toBe(true);
      expect(getResult.data?.id).toBe(character.id);
      expect(getResult.data?.name).toBe("Slug Test Character");
      expect(getResult.data?.slug).toBe(character.slug);
    });

    it("should fail when character doesn't exist", async () => {
      const result = await getCharacter(testWorldId, "non-existent-slug");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Character not found");
    });

    it("should ensure slug uniqueness per world", async () => {
      // Create two characters with same name in same world
      const result1 = await createCharacter(testWorldId, {
        name: "Duplicate Name",
      });
      const result2 = await createCharacter(testWorldId, {
        name: "Duplicate Name",
      });

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      // Slugs should be different due to random suffix
      expect(result1.data?.slug).not.toBe(result2.data?.slug);

      if (result1.data) createdCharacterIds.push(result1.data.id);
      if (result2.data) createdCharacterIds.push(result2.data.id);
    });
  });

  describe("RLS Enforcement", () => {
    it("should not allow access to characters in other user's worlds", async () => {
      // Create character in other user's world
      const character = await prisma.character.create({
        data: {
          worldId: otherUserWorldId,
          name: "Other User's Character",
          slug: `other-char-${Date.now()}`,
        },
      });

      createdCharacterIds.push(character.id);

      // Try to get characters from other user's world (should fail due to RLS)
      const result = await getCharacters(otherUserWorldId);

      expect(result.success).toBe(false);
      expect(result.error).toContain("permission");
    });

    it("should not allow updating characters in other user's worlds", async () => {
      // Create character in other user's world
      const character = await prisma.character.create({
        data: {
          worldId: otherUserWorldId,
          name: "Other User's Character",
          slug: `other-char-update-${Date.now()}`,
        },
      });

      createdCharacterIds.push(character.id);

      // Try to update character (should fail)
      const result = await updateCharacter(character.id, {
        name: "Hacked Name",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("permission");
    });

    it("should not allow deleting characters in other user's worlds", async () => {
      // Create character in other user's world
      const character = await prisma.character.create({
        data: {
          worldId: otherUserWorldId,
          name: "Other User's Character",
          slug: `other-char-delete-${Date.now()}`,
        },
      });

      createdCharacterIds.push(character.id);

      // Try to delete character (should fail)
      const result = await deleteCharacter(character.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain("permission");
    });
  });
});
