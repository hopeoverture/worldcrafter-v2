"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type LoginInput = z.infer<typeof loginSchema>;

export async function loginAction(values: LoginInput) {
  try {
    // Validate input
    const validated = loginSchema.parse(values);

    // Create Supabase client
    const supabase = await createClient();

    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validated.email,
      password: validated.password,
    });

    if (error) {
      return {
        success: false,
        error: `Invalid login credentials. Please check your email and password.`,
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: "Login failed. Please try again.",
      };
    }

    // Revalidate the layout to update the UI
    revalidatePath("/", "layout");

    // Redirect to dashboard after successful login
    redirect("/dashboard");
  } catch (error) {
    // Re-throw redirect errors (they should not be caught)
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid input data",
      };
    }

    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}
