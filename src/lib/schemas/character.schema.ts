import { z } from "zod";

/**
 * Character validation schemas for WorldCrafter
 *
 * Supports flexible text fields for age (e.g., "25", "Ancient", "Unknown")
 * and long-form markdown fields for appearance, personality, backstory, etc.
 */

export const createCharacterSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  role: z.string().max(100, "Role must be 100 characters or less").optional(),
  species: z
    .string()
    .max(100, "Species must be 100 characters or less")
    .optional(),
  age: z.string().max(50, "Age must be 50 characters or less").optional(),
  gender: z.string().max(50, "Gender must be 50 characters or less").optional(),
  appearance: z
    .string()
    .max(10000, "Appearance must be 10,000 characters or less")
    .optional(),
  personality: z
    .string()
    .max(10000, "Personality must be 10,000 characters or less")
    .optional(),
  backstory: z
    .string()
    .max(10000, "Backstory must be 10,000 characters or less")
    .optional(),
  goals: z
    .string()
    .max(5000, "Goals must be 5,000 characters or less")
    .optional(),
  fears: z
    .string()
    .max(5000, "Fears must be 5,000 characters or less")
    .optional(),
  attributes: z.record(z.string(), z.unknown()).optional().nullable(),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export const updateCharacterSchema = createCharacterSchema.partial();

export const characterFiltersSchema = z.object({
  role: z.string().optional(),
  species: z.string().optional(),
  search: z.string().optional(),
});

// Type exports
export type CreateCharacterInput = z.infer<typeof createCharacterSchema>;
export type UpdateCharacterInput = z.infer<typeof updateCharacterSchema>;
export type CharacterFilters = z.infer<typeof characterFiltersSchema>;
