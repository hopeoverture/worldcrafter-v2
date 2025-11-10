"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { featureSchema, type FeatureFormValues } from "@/lib/schemas/feature"

export async function submitFeature(values: FeatureFormValues) {
  try {
    // 1. Server-side validation (ALWAYS validate)
    const validated = featureSchema.parse(values)

    // 2. Authentication check (uncomment if needed)
    // const supabase = await createClient()
    // const { data: { user } } = await supabase.auth.getUser()
    //
    // if (!user) {
    //   return { success: false, error: "Unauthorized" }
    // }

    // 3. Database operation (TODO: Update model name)
    const result = await prisma.yourModel.create({
      data: {
        ...validated,
        // userId: user.id,  // If authenticated
      },
    })

    // 4. Revalidate cached pages
    revalidatePath("/your-route")

    // 5. Return typed response
    return { success: true, data: result }
  } catch (error) {
    console.error("Error in submitFeature:", error)

    // Handle Zod validation errors
    if (error instanceof Error && error.name === "ZodError") {
      return { success: false, error: "Validation failed" }
    }

    // Generic error
    return { success: false, error: "Operation failed" }
  }
}

export async function updateFeature(id: string, values: FeatureFormValues) {
  try {
    const validated = featureSchema.parse(values)

    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Unauthorized" }
    }

    // Check authorization (verify user owns the resource)
    const existing = await prisma.yourModel.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!existing || existing.userId !== user.id) {
      return { success: false, error: "Forbidden" }
    }

    // Update
    const result = await prisma.yourModel.update({
      where: { id },
      data: validated,
    })

    revalidatePath("/your-route")
    revalidatePath(`/your-route/${id}`)

    return { success: true, data: result }
  } catch (error) {
    console.error("Error in updateFeature:", error)
    return { success: false, error: "Update failed" }
  }
}

export async function deleteFeature(id: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Unauthorized" }
    }

    // Check authorization
    const existing = await prisma.yourModel.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!existing || existing.userId !== user.id) {
      return { success: false, error: "Forbidden" }
    }

    // Delete
    await prisma.yourModel.delete({
      where: { id },
    })

    revalidatePath("/your-route")

    return { success: true }
  } catch (error) {
    console.error("Error in deleteFeature:", error)
    return { success: false, error: "Delete failed" }
  }
}
