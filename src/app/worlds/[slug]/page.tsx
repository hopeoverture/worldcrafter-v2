import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getWorld } from "../actions"
import { prisma } from "@/lib/prisma"
import { WorldDashboard } from "@/components/worlds/world-dashboard"
import { Button } from "@/components/ui/button"
import { Settings, Edit, Plus, Search } from "lucide-react"

export default async function WorldDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const result = await getWorld(slug)

  if (!result.success || !result.data) {
    notFound()
  }

  const world = result.data

  // Verify user owns this world
  if (world.userId !== user.id) {
    notFound()
  }

  // Fetch recent activities for this world
  const activities = await prisma.activity.findMany({
    where: { worldId: world.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  // Get location count (Phase 1 Week 3)
  const locationCount = await prisma.location.count({
    where: { worldId: world.id },
  })

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex-1 min-w-0">
          <Link
            href="/worlds"
            className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block"
          >
            ← Back to Worlds
          </Link>
          <h1 className="text-3xl font-bold tracking-tight truncate">{world.name}</h1>
          {world.setting && (
            <p className="text-muted-foreground mt-2">{world.setting}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/worlds/${world.slug}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/worlds/${world.slug}/settings`}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Dashboard with Activities */}
      <WorldDashboard
        world={world}
        activities={activities}
        locationCount={locationCount}
      />

      {/* Quick Actions Section */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href={`/worlds/${world.slug}/locations/new`}
          className="flex items-center gap-4 p-6 rounded-lg border hover:bg-accent transition-colors"
        >
          <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
            <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold">Add Location</h3>
            <p className="text-sm text-muted-foreground">
              Create a new place in your world
            </p>
          </div>
        </Link>

        <Link
          href={`/worlds/${world.slug}/locations`}
          className="flex items-center gap-4 p-6 rounded-lg border hover:bg-accent transition-colors"
        >
          <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center shrink-0">
            <Search className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold">Browse Locations</h3>
            <p className="text-sm text-muted-foreground">
              View all locations in this world
            </p>
          </div>
        </Link>

        <Link
          href={`/worlds/${world.slug}/search`}
          className="flex items-center gap-4 p-6 rounded-lg border hover:bg-accent transition-colors"
        >
          <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0">
            <Search className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold">Search World</h3>
            <p className="text-sm text-muted-foreground">
              Find content across locations
            </p>
          </div>
        </Link>
      </div>
    </div>
  )
}
