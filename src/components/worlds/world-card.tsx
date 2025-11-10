import Link from "next/link"
import Image from "next/image"
import { type World } from "@prisma/client"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Globe, Lock, Eye, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface WorldCardProps {
  world: World
}

const genreColors: Record<string, string> = {
  FANTASY: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  SCIFI: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  MODERN: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  HISTORICAL: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  HORROR: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  CUSTOM: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
}

const privacyIcons = {
  PRIVATE: <Lock className="w-3 h-3" />,
  UNLISTED: <Eye className="w-3 h-3" />,
  PUBLIC: <Globe className="w-3 h-3" />,
}

function formatDate(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

export function WorldCard({ world }: WorldCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-shadow overflow-hidden">
      <Link href={`/worlds/${world.slug}`} className="block">
        {/* Cover Image */}
        <div className="relative h-48 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900">
          {world.coverUrl ? (
            <Image
              src={world.coverUrl}
              alt={world.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Globe className="w-16 h-16 text-purple-300 dark:text-purple-700" />
            </div>
          )}
          {/* Privacy Badge Overlay */}
          <div className="absolute top-2 right-2">
            <Badge
              variant="secondary"
              className="bg-white/90 dark:bg-black/90 backdrop-blur-sm"
            >
              {privacyIcons[world.privacy]}
              <span className="ml-1 capitalize">{world.privacy.toLowerCase()}</span>
            </Badge>
          </div>
        </div>

        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                {world.name}
              </h3>
              <Badge className={genreColors[world.genre]} variant="secondary">
                {world.genre}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {world.setting && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {world.setting}
            </p>
          )}
        </CardContent>
      </Link>

      <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>Updated {formatDate(world.updatedAt)}</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="w-4 h-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/worlds/${world.slug}`}>View</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/worlds/${world.slug}/edit`}>Edit</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/worlds/${world.slug}/settings`}>Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  )
}
