import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  // Authentication check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold">Protected Page</h1>
      <p className="mt-4">Welcome, {user.email}</p>

      {/* Protected content */}
    </div>
  )
}
