import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getWorlds } from "@/app/worlds/actions"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch user's worlds
  const worldsResult = await getWorlds()
  const worlds = worldsResult.success ? worldsResult.data ?? [] : []

  // Get total location count across all worlds
  const { prisma } = await import("@/lib/prisma")
  const totalLocations = await prisma.location.count({
    where: {
      world: {
        userId: user.id,
      },
    },
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Manage your worlds and track your progress.
            </p>
          </div>
          <Link href="/worlds/new">
            <Button size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Create World
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Worlds</CardTitle>
              <svg
                className="h-4 w-4 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{worlds.length}</div>
              <p className="text-xs text-muted-foreground">
                {worlds.length === 0
                  ? "Create your first world to get started"
                  : "Active worldbuilding projects"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Locations</CardTitle>
              <svg
                className="h-4 w-4 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLocations}</div>
              <p className="text-xs text-muted-foreground">
                {totalLocations === 0
                  ? "Create locations in your worlds"
                  : "Across all your worlds"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <svg
                className="h-4 w-4 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Activity tracking enabled
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions / Empty State */}
        {worlds.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Get Started with WorldCrafter</CardTitle>
              <CardDescription>
                Create your first world to begin organizing your creative universe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex gap-4 rounded-lg border p-4">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center shrink-0">
                    <Plus className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Create a World</h3>
                    <p className="text-sm text-muted-foreground">
                      Start with a fantasy, sci-fi, or custom world
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 rounded-lg border p-4">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
                    <svg
                      className="h-5 w-5 text-blue-600 dark:text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Add Locations</h3>
                    <p className="text-sm text-muted-foreground">
                      Create your first world, then add locations
                    </p>
                  </div>
                </div>
              </div>
              <Link href="/worlds/new">
                <Button size="lg" className="w-full sm:w-auto">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Your First World
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Your Worlds</CardTitle>
              <CardDescription>
                Manage your worldbuilding projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {worlds.slice(0, 5).map((world) => (
                  <Link
                    key={world.id}
                    href={`/worlds/${world.slug}`}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div>
                      <h3 className="font-semibold">{world.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {world.genre} • {world.privacy.toLowerCase()}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Updated {new Date(world.updatedAt).toLocaleDateString()}
                    </div>
                  </Link>
                ))}
              </div>
              {worlds.length > 5 && (
                <div className="mt-4">
                  <Link href="/worlds">
                    <Button variant="outline" className="w-full">
                      View All Worlds ({worlds.length})
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
