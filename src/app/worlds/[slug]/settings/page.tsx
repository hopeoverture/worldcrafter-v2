import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getWorld } from "@/app/worlds/actions"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { PrivacySettingsForm } from "@/components/worlds/privacy-settings-form"
import { DeleteWorldSection } from "@/components/worlds/delete-world-section"

export default async function WorldSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Check authentication
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch world
  const result = await getWorld(slug)

  if (!result.success || !result.data) {
    notFound()
  }

  const world = result.data

  // Verify user owns this world
  if (world.userId !== user.id) {
    notFound()
  }

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={`/worlds/${slug}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to World
          </Link>
        </Button>

        <h1 className="text-3xl font-bold tracking-tight">World Settings</h1>
        <p className="text-muted-foreground mt-2">{world.name}</p>
      </div>

      <div className="space-y-6">
        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Privacy Settings</CardTitle>
            <CardDescription>
              Control who can view and discover your world
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PrivacySettingsForm world={world} />
          </CardContent>
        </Card>

        <Separator />

        {/* Danger Zone - Delete World */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteWorldSection worldId={world.id} worldName={world.name} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
