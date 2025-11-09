"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { userFormSchema, type UserFormValues } from "@/lib/schemas/user";
import { createClient } from "@/lib/supabase/server";

/**
 * Server Action example: Submit user form
 *
 * This demonstrates the recommended pattern for Server Actions:
 * 1. Server-side validation with Zod schema
 * 2. Authentication check with Supabase
 * 3. Database operation with Prisma
 * 4. Error handling with typed responses
 * 5. Cache revalidation
 *
 * @param values - Form data from client
 * @returns Success response with data or error response
 */
export async function submitUserForm(values: UserFormValues) {
  try {
    // Step 1: Server-side validation (never trust client input)
    const validated = userFormSchema.parse(values);

    // Step 2: Check authentication (if required for your use case)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "You must be logged in to submit this form",
      };
    }

    // Step 3: Database operation
    // In a real app, you might create/update a user profile here
    // For this example, we'll just validate and return the data
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: validated.name,
        email: validated.email,
      },
    });

    // Step 4: Revalidate any pages that display this data
    revalidatePath("/example-form");

    // Step 5: Return success response
    return {
      success: true,
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
      },
    };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof Error && error.name === "ZodError") {
      return {
        success: false,
        error: "Invalid form data. Please check your inputs.",
      };
    }

    // Handle database errors
    if (error instanceof Error) {
      console.error("Server Action error:", error);
      return {
        success: false,
        error: "An error occurred while submitting the form. Please try again.",
      };
    }

    // Unexpected errors
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Alternative Server Action example: Create user (without auth requirement)
 *
 * This shows a simpler pattern for public forms that don't require authentication
 */
export async function createUserPublic(values: UserFormValues) {
  try {
    // Validate input
    const validated = userFormSchema.parse(values);

    // For demo purposes, we'll just return the validated data
    // In production, you'd create the user in the database
    return {
      success: true,
      message: "User data validated successfully",
      data: validated,
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to process user data",
    };
  }
}
