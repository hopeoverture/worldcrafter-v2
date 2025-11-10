import { prisma } from "@/lib/prisma";
import type { Character, Prisma } from "@prisma/client";

/**
 * Character factory for generating test data
 */

export interface CharacterFactoryOptions {
  worldId: string;
  name?: string;
  role?: string | null;
  species?: string | null;
  age?: string | null;
  gender?: string | null;
  appearance?: string | null;
  personality?: string | null;
  backstory?: string | null;
  goals?: string | null;
  fears?: string | null;
  attributes?: Record<string, unknown> | null;
  imageUrl?: string | null;
}

/**
 * Generate a unique slug from a character name
 */
function generateSlug(name: string): string {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 50);

  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${randomSuffix}`;
}

/**
 * Create a character with default values
 */
export async function createCharacterFactory(
  options: CharacterFactoryOptions
): Promise<Character> {
  const slug = generateSlug(options.name || "Test Character");

  const character = await prisma.character.create({
    data: {
      worldId: options.worldId,
      name: options.name || "Test Character",
      slug,
      role: options.role ?? "Warrior",
      species: options.species ?? "Human",
      age: options.age ?? "25",
      gender: options.gender ?? "Non-binary",
      appearance: options.appearance ?? "A brave adventurer",
      personality: options.personality ?? "Courageous and kind",
      backstory: options.backstory ?? "Born in a small village",
      goals: options.goals ?? "Save the kingdom",
      fears: options.fears ?? "Losing loved ones",
      attributes: (options.attributes ?? undefined) as
        | Prisma.InputJsonValue
        | undefined,
      imageUrl: options.imageUrl ?? null,
    },
  });

  return character;
}

/**
 * Create multiple characters with different roles for testing
 */
export async function createCharacterSet(
  worldId: string
): Promise<{ warrior: Character; mage: Character; rogue: Character }> {
  const warrior = await createCharacterFactory({
    worldId,
    name: "Aldrin the Brave",
    role: "Warrior",
    species: "Human",
    age: "30",
    attributes: { strength: 18, dexterity: 12 },
  });

  const mage = await createCharacterFactory({
    worldId,
    name: "Elara the Wise",
    role: "Mage",
    species: "Elf",
    age: "387",
    attributes: { intelligence: 20, wisdom: 18, manaPoints: 100 },
  });

  const rogue = await createCharacterFactory({
    worldId,
    name: "Shadow",
    role: "Rogue",
    species: "Halfling",
    age: "Unknown",
    attributes: { dexterity: 19, stealth: 95 },
  });

  return { warrior, mage, rogue };
}
