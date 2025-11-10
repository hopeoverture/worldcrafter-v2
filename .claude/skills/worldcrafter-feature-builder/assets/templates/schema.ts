import { z } from "zod"

export const featureSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  description: z.string().optional(),
  isPublished: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

export type FeatureFormValues = z.infer<typeof featureSchema>

// Example: More complex validation
export const advancedSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
  age: z.number().min(18, "Must be at least 18").max(120, "Invalid age"),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  role: z.enum(["user", "admin", "moderator"]),
  agreedToTerms: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the terms" }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export type AdvancedFormValues = z.infer<typeof advancedSchema>
