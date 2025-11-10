import { z } from "zod";

/**
 * World validation schemas for WorldCrafter
 * Aligned with Prisma World model and Genre/Privacy enums
 */

// Genre enum matching Prisma schema
export const genreEnum = z.enum([
  "FANTASY",
  "SCIFI",
  "MODERN",
  "HISTORICAL",
  "HORROR",
  "CUSTOM",
]);

// Privacy enum matching Prisma schema
export const privacyEnum = z.enum(["PRIVATE", "UNLISTED", "PUBLIC"]);

/**
 * Schema for creating a new world (API/Server Actions)
 * Has defaults for genre and privacy to handle minimal API calls
 */
export const createWorldSchema = z.object({
  name: z
    .string()
    .min(1, "World name is required")
    .max(100, "World name must be 100 characters or less")
    .trim(),
  genre: genreEnum.default("CUSTOM"),
  description: z
    .string()
    .max(5000, "Description must be 5000 characters or less")
    .optional()
    .nullable(),
  setting: z
    .string()
    .max(500, "Setting summary must be 500 characters or less")
    .optional()
    .nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  coverUrl: z
    .string()
    .url("Invalid image URL")
    .or(z.literal(""))
    .optional()
    .nullable(),
  privacy: privacyEnum.default("PRIVATE"),
});

/**
 * Schema for world forms (UI)
 * Requires genre and privacy to be explicitly set (no defaults)
 */
export const createWorldFormSchema = z.object({
  name: z
    .string()
    .min(1, "World name is required")
    .max(100, "World name must be 100 characters or less")
    .trim(),
  genre: genreEnum,
  description: z
    .string()
    .max(5000, "Description must be 5000 characters or less")
    .optional()
    .nullable(),
  setting: z
    .string()
    .max(5000, "Setting summary must be 500 characters or less")
    .optional()
    .nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  coverUrl: z
    .string()
    .url("Invalid image URL")
    .or(z.literal(""))
    .optional()
    .nullable(),
  privacy: privacyEnum,
});

/**
 * Schema for updating an existing world
 * All fields are optional except id
 */
export const updateWorldSchema = z.object({
  name: z
    .string()
    .min(1, "World name is required")
    .max(100, "World name must be 100 characters or less")
    .trim()
    .optional(),
  genre: genreEnum.optional(),
  description: z
    .string()
    .max(5000, "Description must be 5000 characters or less")
    .optional()
    .nullable(),
  setting: z
    .string()
    .max(500, "Setting summary must be 500 characters or less")
    .optional()
    .nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  coverUrl: z
    .string()
    .url("Invalid image URL")
    .or(z.literal(""))
    .optional()
    .nullable(),
  privacy: privacyEnum.optional(),
});

/**
 * Schema for world filters (used in getWorlds)
 */
export const worldFiltersSchema = z.object({
  genre: genreEnum.optional(),
  privacy: privacyEnum.optional(),
  search: z.string().optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
});

// Type exports
export type CreateWorldInput = z.infer<typeof createWorldSchema>;
export type UpdateWorldInput = z.infer<typeof updateWorldSchema>;
export type WorldFilters = z.infer<typeof worldFiltersSchema>;
export type Genre = z.infer<typeof genreEnum>;
export type Privacy = z.infer<typeof privacyEnum>;
