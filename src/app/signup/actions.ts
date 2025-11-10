"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

type SignupInput = z.infer<typeof signupSchema>;

export async function signupAction(values: SignupInput) {
  try {
    // Validate input
    const validated = signupSchema.parse(values);

    // Create Supabase client
    const supabase = await createClient();

    // Attempt to sign up
    const { data, error } = await supabase.auth.signUp({
      email: validated.email,
      password: validated.password,
      options: {
        data: {
          name: validated.name,
        },
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: "Signup failed",
      };
    }

    // Revalidate the layout to update the UI
    revalidatePath("/", "layout");

    // Redirect to dashboard after successful signup
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
