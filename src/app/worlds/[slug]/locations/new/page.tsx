import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { LocationForm } from "@/components/forms/location-form"

interface NewLocationPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function NewLocationPage({ params }: NewLocationPageProps) {
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

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create Location</h1>
        <p className="text-muted-foreground mt-2">
          Add a new location to <span className="font-medium">{world.name}</span>
        </p>
      </div>

      <LocationForm
        worldId={world.id}
        worldSlug={world.slug}
        mode="create"
      />
    </div>
  )
}
