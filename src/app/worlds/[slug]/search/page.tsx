import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { SearchResults } from "@/components/search/search-results"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface SearchPageProps {
  params: Promise<{
    slug: string
  }>
  searchParams: Promise<{
    q?: string
  }>
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { slug: worldSlug } = await params
  const { q: query } = await searchParams

  // Authenticate user
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch world
  const world = await prisma.world.findUnique({
    where: { slug: worldSlug },
    select: {
      id: true,
      slug: true,
      name: true,
      userId: true,
    },
  })

  if (!world) {
    notFound()
  }

  // Verify ownership
  if (world.userId !== user.id) {
    notFound()
  }

  return (
    <div className="container max-w-6xl py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex-1 min-w-0">
          <Link
            href={`/worlds/${worldSlug}`}
            className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {world.name}
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mt-2">
            Search {world.name}
          </h1>
          <p className="text-muted-foreground mt-2">
            Search across all locations in this world
          </p>
        </div>
      </div>

      {/* Search Results */}
      <SearchResults worldId={world.id} worldSlug={world.slug} initialQuery={query} />
    </div>
  )
}
