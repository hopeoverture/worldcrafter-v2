import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { LocationForm } from "@/components/forms/location-form"

interface EditLocationPageProps {
  params: Promise<{
    slug: string
    locationSlug: string
  }>
}

export default async function EditLocationPage({ params }: EditLocationPageProps) {
  const { slug, locationSlug } = await params

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

  // Fetch location
  const location = await prisma.location.findUnique({
    where: {
      worldId_slug: {
        worldId: world.id,
        slug: locationSlug,
      },
    },
  })

  if (!location) {
    redirect(`/worlds/${slug}/locations`)
  }

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Edit Location</h1>
        <p className="text-muted-foreground mt-2">
          Update details for <span className="font-medium">{location.name}</span>
        </p>
      </div>

      <LocationForm
        worldId={world.id}
        worldSlug={world.slug}
        location={location}
        mode="edit"
      />
    </div>
  )
}
