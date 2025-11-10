import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { LocationsList } from "@/components/locations/locations-list"

interface LocationsPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function LocationsPage({ params }: LocationsPageProps) {
  const { slug } = await params

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
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      userId: true,
    },
  })

  if (!world) {
    redirect("/worlds")
  }

  // Verify ownership
  if (world.userId !== user.id) {
    redirect(`/worlds/${slug}`)
  }

  // Fetch all locations with parent information
  const locations = await prisma.location.findMany({
    where: { worldId: world.id },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      parentId: true,
      parent: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: { name: "asc" },
  })

  return (
    <div className="container max-w-6xl py-10">
      <LocationsList locations={locations} worldSlug={world.slug} />
    </div>
  )
}
