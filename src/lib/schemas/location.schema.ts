import { z } from "zod"

/**
 * Location validation schemas for WorldCrafter
 * Aligned with Prisma Location model
 */

/**
 * Base schema for location fields (used by forms)
 * No transforms - raw form data structure
 */
const locationFieldsBase = z.object({
  worldId: z.string().min(1, "World ID is required"),
  name: z
    .string()
    .min(1, "Location name is required")
    .max(100, "Location name must be 100 characters or less")
    .trim(),
  type: z
    .string()
    .max(50, "Location type must be 50 characters or less")
    .optional()
    .nullable(),
  parentId: z.string().optional().nullable(),
  description: z
    .string()
    .max(5000, "Description must be 5000 characters or less")
    .optional()
    .nullable(),
  geography: z.string().optional().nullable(),
  climate: z
    .string()
    .max(100, "Climate must be 100 characters or less")
    .optional()
    .nullable(),
  population: z
    .string()
    .max(50, "Population must be 50 characters or less")
    .optional()
    .nullable(),
  government: z
    .string()
    .max(100, "Government must be 100 characters or less")
    .optional()
    .nullable(),
  economy: z.string().optional().nullable(),
  culture: z.string().optional().nullable(),
  coordinates: z
    .object({
      x: z.number().optional(),
      y: z.number().optional(),
    })
    .optional()
    .nullable(),
  attributes: z.record(z.string(), z.unknown()).optional().nullable(),
  imageUrl: z
    .string()
    .url("Invalid image URL")
    .optional()
    .nullable()
    .or(z.literal("")),
})

/**
 * Schema for forms (no transforms)
 */
export const createLocationFormSchema = locationFieldsBase

/**
 * Schema for creating a new location (with transforms for Server Actions)
 * Supports hierarchical parent-child relationships
 */
export const createLocationSchema = locationFieldsBase.extend({
  coordinates: z
    .object({
      x: z.number().optional(),
      y: z.number().optional(),
    })
    .optional()
    .nullable()
    .transform((val) => {
      // If coordinates exist but either x or y is missing, return null
      if (val && (val.x === undefined || val.y === undefined)) {
        return null
      }
      // If both x and y exist, return as proper coordinates
      if (val && val.x !== undefined && val.y !== undefined) {
        return { x: val.x, y: val.y }
      }
      // Otherwise return null
      return null
    }),
  imageUrl: z
    .string()
    .url("Invalid image URL")
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((val) => (val === "" ? null : val)),
})

/**
 * Base schema for update form fields (no transforms)
 */
const updateLocationFieldsBase = z.object({
  name: z
    .string()
    .min(1, "Location name is required")
    .max(100, "Location name must be 100 characters or less")
    .trim()
    .optional(),
  type: z
    .string()
    .max(50, "Location type must be 50 characters or less")
    .optional()
    .nullable(),
  parentId: z.string().optional().nullable(),
  description: z
    .string()
    .max(5000, "Description must be 5000 characters or less")
    .optional()
    .nullable(),
  geography: z.string().optional().nullable(),
  climate: z
    .string()
    .max(100, "Climate must be 100 characters or less")
    .optional()
    .nullable(),
  population: z
    .string()
    .max(50, "Population must be 50 characters or less")
    .optional()
    .nullable(),
  government: z
    .string()
    .max(100, "Government must be 100 characters or less")
    .optional()
    .nullable(),
  economy: z.string().optional().nullable(),
  culture: z.string().optional().nullable(),
  coordinates: z
    .object({
      x: z.number().optional(),
      y: z.number().optional(),
    })
    .optional()
    .nullable(),
  attributes: z.record(z.string(), z.unknown()).optional().nullable(),
  imageUrl: z
    .string()
    .url("Invalid image URL")
    .optional()
    .nullable()
    .or(z.literal("")),
})

/**
 * Schema for update forms (no transforms)
 */
export const updateLocationFormSchema = updateLocationFieldsBase

/**
 * Schema for updating an existing location (with transforms for Server Actions)
 * All fields are optional except id
 */
export const updateLocationSchema = z.object({
  name: z
    .string()
    .min(1, "Location name is required")
    .max(100, "Location name must be 100 characters or less")
    .trim()
    .optional(),
  type: z
    .string()
    .max(50, "Location type must be 50 characters or less")
    .optional()
    .nullable(),
  parentId: z.string().optional().nullable(),
  description: z
    .string()
    .max(5000, "Description must be 5000 characters or less")
    .optional()
    .nullable(),
  geography: z.string().optional().nullable(),
  climate: z
    .string()
    .max(100, "Climate must be 100 characters or less")
    .optional()
    .nullable(),
  population: z
    .string()
    .max(50, "Population must be 50 characters or less")
    .optional()
    .nullable(),
  government: z
    .string()
    .max(100, "Government must be 100 characters or less")
    .optional()
    .nullable(),
  economy: z.string().optional().nullable(),
  culture: z.string().optional().nullable(),
  coordinates: z
    .object({
      x: z.number().optional(),
      y: z.number().optional(),
    })
    .optional()
    .nullable()
    .transform((val) => {
      // If coordinates exist but either x or y is missing, return null
      if (val && (val.x === undefined || val.y === undefined)) {
        return null
      }
      // If both x and y exist, return as proper coordinates
      if (val && val.x !== undefined && val.y !== undefined) {
        return { x: val.x, y: val.y }
      }
      // Otherwise return null
      return null
    }),
  attributes: z.record(z.string(), z.unknown()).optional().nullable(),
  imageUrl: z
    .string()
    .url("Invalid image URL")
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((val) => (val === "" ? null : val)),
})

/**
 * Schema for location filters (used in getLocations)
 */
export const locationFiltersSchema = z.object({
  worldId: z.string().min(1, "World ID is required"),
  type: z.string().optional(),
  parentId: z.string().optional().nullable(),
  includeHierarchy: z.boolean().default(false),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
})

// Type exports
export type CreateLocationInput = z.infer<typeof createLocationSchema>
export type CreateLocationFormInput = z.infer<typeof createLocationFormSchema>
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>
export type UpdateLocationFormInput = z.infer<typeof updateLocationFormSchema>
export type LocationFilters = z.infer<typeof locationFiltersSchema>
