import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { WorldForm } from "@/components/forms/world-form"
import { getWorld } from "@/app/worlds/actions"

export default async function EditWorldPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Check authentication
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch the world
  const result = await getWorld(slug)

  if (!result.success || !result.data) {
    redirect("/dashboard")
  }

  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit World</h1>
        <p className="text-muted-foreground">
          Update your world's details below.
        </p>
      </div>

      <WorldForm mode="edit" world={result.data} />
    </div>
  )
}
