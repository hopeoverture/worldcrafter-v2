import { type World } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ActivityFeed, type ActivityWithUser } from "@/components/activity/activity-feed"
import { Calendar, MapPin, Eye, Globe, Lock } from "lucide-react"
import ReactMarkdown from "react-markdown"

interface WorldDashboardProps {
  world: World
  activities: ActivityWithUser[]
  locationCount: number
}

const genreLabels: Record<string, string> = {
  FANTASY: "Fantasy",
  SCIFI: "Sci-Fi",
  MODERN: "Modern",
  HISTORICAL: "Historical",
  HORROR: "Horror",
  CUSTOM: "Custom",
}

const privacyIcons = {
  PRIVATE: <Lock className="w-3 h-3" />,
  UNLISTED: <Eye className="w-3 h-3" />,
  PUBLIC: <Globe className="w-3 h-3" />,
}

const privacyLabels = {
  PRIVATE: "Private",
  UNLISTED: "Unlisted",
  PUBLIC: "Public",
}

export function WorldDashboard({
  world,
  activities,
  locationCount,
}: WorldDashboardProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left Column: Stats and Info */}
      <div className="space-y-6 lg:col-span-2">
        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Locations</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{locationCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {locationCount === 0
                  ? "No locations yet"
                  : `${locationCount} location${locationCount === 1 ? "" : "s"}`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activity</CardTitle>
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
              <div className="text-2xl font-bold">{activities.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Recent changes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Date(world.updatedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Created {new Date(world.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* World Description */}
        {world.description && (
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{world.description}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* World Details */}
        <Card>
          <CardHeader>
            <CardTitle>World Details</CardTitle>
            <CardDescription>Metadata and settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Genre
                </p>
                <Badge variant="secondary">
                  {genreLabels[world.genre] || world.genre}
                </Badge>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Privacy
                </p>
                <Badge variant="outline" className="gap-1">
                  {privacyIcons[world.privacy]}
                  {privacyLabels[world.privacy]}
                </Badge>
              </div>
            </div>

            {world.metadata && typeof world.metadata === "object" && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Custom Metadata
                </p>
                <div className="space-y-1 text-sm">
                  {Object.entries(world.metadata as Record<string, unknown>).map(
                    ([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}:
                        </span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Activity Feed */}
      <div className="lg:col-span-1">
        <ActivityFeed activities={activities} worldId={world.id} />
      </div>
    </div>
  )
}
