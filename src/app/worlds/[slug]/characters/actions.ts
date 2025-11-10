"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import {
  createCharacterSchema,
  updateCharacterSchema,
  characterFiltersSchema,
  type CreateCharacterInput,
  type UpdateCharacterInput,
  type CharacterFilters,
} from "@/lib/schemas/character.schema";
import type { Character, Prisma } from "@prisma/client";

/**
 * Server action response type
 */
type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Generate a unique slug from a character name
 */
function generateSlug(name: string): string {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .substring(0, 50); // Limit length

  // Add random suffix to ensure uniqueness
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${randomSuffix}`;
}

/**
 * Create a new character in a world
 */
export async function createCharacter(
  worldId: string,
  input: CreateCharacterInput
): Promise<ActionResponse<Character>> {
  try {
    // 1. Validate input
    const validated = createCharacterSchema.parse(input);

    // 2. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "You must be logged in to create a character",
      };
    }

    // 3. Verify world exists and user owns it
    const world = await prisma.world.findUnique({
      where: { id: worldId },
      select: { userId: true, slug: true },
    });

    if (!world) {
      return { success: false, error: "World not found" };
    }

    if (world.userId !== user.id) {
      return {
        success: false,
        error: "You don't have permission to add characters to this world",
      };
    }

    // 4. Generate unique slug
    const slug = generateSlug(validated.name);

    // 5. Create character in database
    const character = await prisma.character.create({
      data: {
        name: validated.name,
        slug,
        worldId,
        role: validated.role,
        species: validated.species,
        age: validated.age,
        gender: validated.gender,
        appearance: validated.appearance,
        personality: validated.personality,
        backstory: validated.backstory,
        goals: validated.goals,
        fears: validated.fears,
        attributes: (validated.attributes ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
        imageUrl: validated.imageUrl,
      },
    });

    // 6. Log activity
    await prisma.activity.create({
      data: {
        worldId,
        userId: user.id,
        entityType: "CHARACTER",
        entityId: character.id,
        action: "created",
        metadata: {
          characterName: character.name,
          role: character.role,
          species: character.species,
        },
      },
    });

    // 7. Revalidate relevant paths
    revalidatePath(`/worlds/${world.slug}`);
    revalidatePath(`/worlds/${world.slug}/characters`);

    return { success: true, data: character };
  } catch (error) {
    console.error("Create character error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to create character" };
  }
}

/**
 * Update an existing character
 */
export async function updateCharacter(
  id: string,
  input: UpdateCharacterInput
): Promise<ActionResponse<Character>> {
  try {
    // 1. Validate input
    const validated = updateCharacterSchema.parse(input);

    // 2. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "You must be logged in to update a character",
      };
    }

    // 3. Verify character exists and user owns it (through world)
    const existingCharacter = await prisma.character.findUnique({
      where: { id },
      include: {
        world: {
          select: { userId: true, slug: true },
        },
      },
    });

    if (!existingCharacter) {
      return { success: false, error: "Character not found" };
    }

    if (existingCharacter.world.userId !== user.id) {
      return {
        success: false,
        error: "You don't have permission to update this character",
      };
    }

    // 4. Update character in database
    const character = await prisma.character.update({
      where: { id },
      data: {
        name: validated.name,
        role: validated.role,
        species: validated.species,
        age: validated.age,
        gender: validated.gender,
        appearance: validated.appearance,
        personality: validated.personality,
        backstory: validated.backstory,
        goals: validated.goals,
        fears: validated.fears,
        attributes: (validated.attributes ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
        imageUrl: validated.imageUrl,
      },
    });

    // 5. Log activity
    await prisma.activity.create({
      data: {
        worldId: existingCharacter.worldId,
        userId: user.id,
        entityType: "CHARACTER",
        entityId: character.id,
        action: "updated",
        metadata: {
          characterName: character.name,
          role: character.role,
          species: character.species,
        },
      },
    });

    // 6. Revalidate relevant paths
    revalidatePath(`/worlds/${existingCharacter.world.slug}`);
    revalidatePath(`/worlds/${existingCharacter.world.slug}/characters`);
    revalidatePath(
      `/worlds/${existingCharacter.world.slug}/characters/${existingCharacter.slug}`
    );

    return { success: true, data: character };
  } catch (error) {
    console.error("Update character error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to update character" };
  }
}

/**
 * Delete a character
 */
export async function deleteCharacter(
  id: string
): Promise<ActionResponse<void>> {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "You must be logged in to delete a character",
      };
    }

    // 2. Verify character exists and user owns it (through world)
    const existingCharacter = await prisma.character.findUnique({
      where: { id },
      include: {
        world: {
          select: { userId: true, slug: true },
        },
      },
    });

    if (!existingCharacter) {
      return { success: false, error: "Character not found" };
    }

    if (existingCharacter.world.userId !== user.id) {
      return {
        success: false,
        error: "You don't have permission to delete this character",
      };
    }

    // 3. Delete character (cascade deletes activity logs via Prisma onDelete: Cascade)
    await prisma.character.delete({
      where: { id },
    });

    // 4. Revalidate relevant paths
    revalidatePath(`/worlds/${existingCharacter.world.slug}`);
    revalidatePath(`/worlds/${existingCharacter.world.slug}/characters`);

    return { success: true };
  } catch (error) {
    console.error("Delete character error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to delete character" };
  }
}

/**
 * Get all characters for a world with optional filters
 */
export async function getCharacters(
  worldId: string,
  filters?: CharacterFilters
): Promise<ActionResponse<Character[]>> {
  try {
    // 1. Validate filters
    const validatedFilters = filters
      ? characterFiltersSchema.parse(filters)
      : {};

    // 2. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "You must be logged in to view characters",
      };
    }

    // 3. Verify world exists and user owns it
    const world = await prisma.world.findUnique({
      where: { id: worldId },
      select: { userId: true },
    });

    if (!world) {
      return { success: false, error: "World not found" };
    }

    if (world.userId !== user.id) {
      return {
        success: false,
        error: "You don't have permission to view characters in this world",
      };
    }

    // 4. Build query filters
    const where: Prisma.CharacterWhereInput = {
      worldId,
    };

    if (validatedFilters.role) {
      where.role = {
        contains: validatedFilters.role,
        mode: "insensitive",
      };
    }

    if (validatedFilters.species) {
      where.species = {
        contains: validatedFilters.species,
        mode: "insensitive",
      };
    }

    if (validatedFilters.search) {
      where.OR = [
        { name: { contains: validatedFilters.search, mode: "insensitive" } },
        { role: { contains: validatedFilters.search, mode: "insensitive" } },
        { species: { contains: validatedFilters.search, mode: "insensitive" } },
      ];
    }

    // 5. Fetch characters
    const characters = await prisma.character.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    return { success: true, data: characters };
  } catch (error) {
    console.error("Get characters error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to fetch characters" };
  }
}

/**
 * Get a single character by slug within a world
 */
export async function getCharacter(
  worldId: string,
  slug: string
): Promise<ActionResponse<Character>> {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "You must be logged in to view this character",
      };
    }

    // 2. Fetch character
    const character = await prisma.character.findUnique({
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
      },
    });

    if (!character) {
      return { success: false, error: "Character not found" };
    }

    // 3. Verify user owns the world
    if (character.world.userId !== user.id) {
      return {
        success: false,
        error: "You don't have permission to view this character",
      };
    }

    return { success: true, data: character };
  } catch (error) {
    console.error("Get character error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to fetch character" };
  }
}
