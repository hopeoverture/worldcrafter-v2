import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getWorlds } from "./actions"
import { WorldsList } from "@/components/worlds/worlds-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function WorldsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const worldsResult = await getWorlds()
  const worlds = worldsResult.success ? worldsResult.data ?? [] : []

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Worlds</h1>
          <p className="text-muted-foreground mt-2">
            Manage and explore your worldbuilding projects
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/worlds/new">
            <Plus className="w-4 h-4 mr-2" />
            Create World
          </Link>
        </Button>
      </div>

      <WorldsList worlds={worlds} />
    </div>
  )
}
