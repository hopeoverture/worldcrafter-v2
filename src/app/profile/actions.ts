'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

const profileSchema = z.object({
  name: z.string().min(2),
});

type ProfileInput = z.infer<typeof profileSchema>;

export async function updateProfileAction(values: ProfileInput) {
  try {
    // Validate input
    const validated = profileSchema.parse(values);

    // Get current user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: validated.name,
      },
    });

    // Revalidate the profile page
    revalidatePath('/profile');

    return {
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
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
