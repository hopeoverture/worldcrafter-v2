"use client"

import { useState } from "react"
import { type Activity, type User, type EntityType } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Clock, Globe, MapPin, FileEdit, Trash2, Plus } from "lucide-react"

export type ActivityWithUser = Activity & {
  user: {
    name: string | null
    email: string
  }
}

interface ActivityFeedProps {
  activities: ActivityWithUser[]
  worldId: string
}

const entityIcons: Record<EntityType, React.ReactNode> = {
  WORLD: <Globe className="w-4 h-4" />,
  LOCATION: <MapPin className="w-4 h-4" />,
}

const actionIcons: Record<string, React.ReactNode> = {
  created: <Plus className="w-4 h-4 text-green-600" />,
  updated: <FileEdit className="w-4 h-4 text-blue-600" />,
  deleted: <Trash2 className="w-4 h-4 text-red-600" />,
}

const actionLabels: Record<string, string> = {
  created: "Created",
  updated: "Updated",
  deleted: "Deleted",
}

function formatActivityTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })
}

export function ActivityFeed({ activities, worldId }: ActivityFeedProps) {
  const [showAll, setShowAll] = useState(false)

  const displayedActivities = showAll ? activities : activities.slice(0, 5)

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Track changes to your world</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              No activity yet. Start creating locations to see updates here!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          {activities.length} recent change{activities.length === 1 ? "" : "s"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {displayedActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                {/* Icon */}
                <div className="flex items-start">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    {actionIcons[activity.action] || entityIcons[activity.entityType]}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-medium">
                      {actionLabels[activity.action] || activity.action}{" "}
                      {activity.entityType.toLowerCase()}
                    </p>
                    <Badge variant="outline" className="shrink-0">
                      {entityIcons[activity.entityType]}
                      <span className="ml-1 capitalize">
                        {activity.entityType.toLowerCase()}
                      </span>
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground mb-2">
                    by {activity.user.name || activity.user.email}
                  </p>

                  {activity.metadata &&
                    typeof activity.metadata === "object" &&
                    Object.keys(activity.metadata as Record<string, unknown>).length > 0 && (
                      <div className="text-xs text-muted-foreground mt-2">
                        {Object.entries(activity.metadata as Record<string, unknown>).map(
                          ([key, value]) => (
                            <div key={key}>
                              <span className="capitalize">{key}:</span>{" "}
                              {String(value)}
                            </div>
                          )
                        )}
                      </div>
                    )}

                  <p className="text-xs text-muted-foreground mt-2">
                    {formatActivityTime(activity.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {activities.length > 5 && !showAll && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAll(true)}
                className="w-full"
              >
                Show All ({activities.length})
              </Button>
            </div>
          )}

          {showAll && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAll(false)}
                className="w-full"
              >
                Show Less
              </Button>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
