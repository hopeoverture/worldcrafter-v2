import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { LocationDetail } from "@/components/locations/location-detail"
import { Button } from "@/components/ui/button"
import { Edit, ArrowLeft, Trash2 } from "lucide-react"

interface LocationDetailPageProps {
  params: Promise<{
    slug: string
    locationSlug: string
  }>
}

export default async function LocationDetailPage({
  params,
}: LocationDetailPageProps) {
  const { slug: worldSlug, locationSlug } = await params

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

  // Fetch location with parent and children
  const location = await prisma.location.findFirst({
    where: {
      slug: locationSlug,
      worldId: world.id,
    },
    include: {
      parent: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      children: {
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
        },
        orderBy: {
          name: "asc",
        },
      },
    },
  })

  if (!location) {
    notFound()
  }

  return (
    <div className="container max-w-6xl py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex-1 min-w-0">
          <Link
            href={`/worlds/${worldSlug}/locations`}
            className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Locations
          </Link>
          <h1 className="text-3xl font-bold tracking-tight truncate mt-2">
            {location.name}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/worlds/${worldSlug}/locations/${location.slug}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Location Details */}
      <LocationDetail location={location} worldSlug={worldSlug} />
    </div>
  )
}
