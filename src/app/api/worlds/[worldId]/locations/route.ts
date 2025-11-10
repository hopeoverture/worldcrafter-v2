import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/worlds/[worldId]/locations
 * Fetch all locations for a world (for parent selector dropdown)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ worldId: string }> }
) {
  try {
    const { worldId } = await params

    // Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify world exists and user owns it
    const world = await prisma.world.findUnique({
      where: { id: worldId },
      select: { userId: true },
    })

    if (!world) {
      return NextResponse.json({ error: "World not found" }, { status: 404 })
    }

    if (world.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch locations
    const locations = await prisma.location.findMany({
      where: { worldId },
      select: {
        id: true,
        name: true,
        type: true,
        parentId: true,
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ locations })
  } catch (error) {
    console.error("Error fetching locations:", error)
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    )
  }
}
