'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

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
        error: error.message,
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: 'Login failed',
      };
    }

    // Revalidate the layout to update the UI
    revalidatePath('/', 'layout');

    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input data',
      };
    }

    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}
