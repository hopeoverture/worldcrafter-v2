"use server"

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function protectedAction(data: any) {
  try {
    // 1. Authentication check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // 2. Optional: Authorization check (resource ownership)
    // const resource = await prisma.resource.findUnique({
    //   where: { id: data.id },
    //   select: { userId: true }
    // })
    //
    // if (!resource || resource.userId !== user.id) {
    //   return { success: false, error: 'Forbidden' }
    // }

    // 3. Perform operation
    const result = await prisma.yourModel.create({
      data: {
        ...data,
        userId: user.id
      }
    })

    // 4. Revalidate
    revalidatePath('/your-route')

    return { success: true, data: result }
  } catch (error) {
    console.error('Protected action error:', error)
    return { success: false, error: 'Operation failed' }
  }
}
