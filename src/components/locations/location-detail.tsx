import { type Location } from "@prisma/client"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Navigation, Users, Building, Leaf, Mountain } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { cn } from "@/lib/utils"

interface LocationDetailProps {
  location: Location & {
    parent?: {
      id: string
      name: string
      slug: string
    } | null
    children?: {
      id: string
      name: string
      slug: string
      type: string | null
    }[]
  }
  worldSlug: string
}

const LOCATION_TYPE_COLORS: Record<string, string> = {
  City: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  Town: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  Village: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  Region: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  Country: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  Continent: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  Planet: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  Dungeon: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  Forest: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  Mountain: "bg-stone-100 text-stone-800 dark:bg-stone-900 dark:text-stone-300",
  Ocean: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
  Building: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300",
  Custom: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
}

const getLocationIcon = (type: string | null) => {
  switch (type) {
    case "City":
    case "Town":
    case "Village":
      return <Building className="h-4 w-4" />
    case "Forest":
      return <Leaf className="h-4 w-4" />
    case "Mountain":
      return <Mountain className="h-4 w-4" />
    case "Region":
    case "Country":
    case "Continent":
    case "Planet":
      return <Navigation className="h-4 w-4" />
    default:
      return <MapPin className="h-4 w-4" />
  }
}

export function LocationDetail({ location, worldSlug }: LocationDetailProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left Column: Details */}
      <div className="space-y-6 lg:col-span-2">
        {/* Info Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Type</CardTitle>
              {getLocationIcon(location.type)}
            </CardHeader>
            <CardContent>
              {location.type ? (
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-sm",
                    LOCATION_TYPE_COLORS[location.type] || "bg-gray-100 text-gray-800"
                  )}
                >
                  {location.type}
                </Badge>
              ) : (
                <p className="text-sm text-muted-foreground">No type set</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Population</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {location.population || "Unknown"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {new Date(location.updatedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Created {new Date(location.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        {location.description && (
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{location.description}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Geography */}
        {location.geography && (
          <Card>
            <CardHeader>
              <CardTitle>Geography</CardTitle>
              <CardDescription>Physical features and terrain</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{location.geography}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Culture & Society */}
        {(location.culture || location.government || location.economy) && (
          <Card>
            <CardHeader>
              <CardTitle>Culture & Society</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {location.culture && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Culture</h4>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{location.culture}</ReactMarkdown>
                  </div>
                </div>
              )}
              {location.government && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Government</h4>
                  <p className="text-sm text-muted-foreground">
                    {location.government}
                  </p>
                </div>
              )}
              {location.economy && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Economy</h4>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{location.economy}</ReactMarkdown>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Additional Details */}
        {(location.climate || location.coordinates || location.attributes) && (
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {location.climate && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Climate
                  </p>
                  <p className="text-sm">{location.climate}</p>
                </div>
              )}

              {location.coordinates && typeof location.coordinates === "object" && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Coordinates
                  </p>
                  <p className="text-sm font-mono">
                    {JSON.stringify(location.coordinates)}
                  </p>
                </div>
              )}

              {location.attributes && typeof location.attributes === "object" && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Custom Attributes
                  </p>
                  <div className="space-y-1 text-sm">
                    {Object.entries(location.attributes as Record<string, unknown>).map(
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
        )}
      </div>

      {/* Right Column: Hierarchy & Related */}
      <div className="space-y-6 lg:col-span-1">
        {/* Parent Location */}
        {location.parent && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Parent Location</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/worlds/${worldSlug}/locations/${location.parent.slug}`}
                className="flex items-center gap-2 text-sm hover:underline"
              >
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{location.parent.name}</span>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Child Locations */}
        {location.children && location.children.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Child Locations ({location.children.length})
              </CardTitle>
              <CardDescription>Locations within this area</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {location.children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/worlds/${worldSlug}/locations/${child.slug}`}
                    className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {child.name}
                      </span>
                    </div>
                    {child.type && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs flex-shrink-0",
                          LOCATION_TYPE_COLORS[child.type] ||
                            "bg-gray-100 text-gray-800"
                        )}
                      >
                        {child.type}
                      </Badge>
                    )}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cover Image */}
        {location.imageUrl && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Location Image</CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={location.imageUrl}
                alt={location.name}
                className="w-full h-auto rounded-lg"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
