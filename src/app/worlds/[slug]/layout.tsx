import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { GlobalSearch } from "@/components/search/global-search"
import { notFound } from "next/navigation"

export default async function WorldLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Fetch world to provide context to GlobalSearch
  const world = await prisma.world.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      userId: true,
    },
  })

  // If world doesn't exist, let the page handle it
  if (!world) {
    return <>{children}</>
  }

  // Get current user to verify ownership
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Only provide search for authenticated users who own the world
  const canSearch = user && world.userId === user.id

  return (
    <>
      {children}
      {canSearch && <GlobalSearch worldId={world.id} worldSlug={world.slug} />}
    </>
  )
}
