import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { WorldForm } from "@/components/forms/world-form"

export default async function NewWorldPage() {
  // Check authentication
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create a New World</h1>
        <p className="text-muted-foreground">
          Start building your universe. Fill in the details below to create your world.
        </p>
      </div>

      <WorldForm mode="create" />
    </div>
  )
}
