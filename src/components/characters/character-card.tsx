import Link from "next/link";
import Image from "next/image";
import { type Character } from "@prisma/client";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CharacterCardProps {
  character: Character;
  worldSlug: string;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/[#*_~`]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function CharacterCard({ character, worldSlug }: CharacterCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-shadow overflow-hidden">
      <Link
        href={`/worlds/${worldSlug}/characters/${character.slug}`}
        className="block"
      >
        {/* Character Image */}
        <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
          {character.imageUrl ? (
            <Image
              src={character.imageUrl}
              alt={character.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <User className="w-16 h-16 text-blue-300 dark:text-blue-700" />
            </div>
          )}
        </div>

        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                {character.name}
              </h3>
              <div className="flex flex-wrap gap-1 mt-2">
                {character.role && (
                  <Badge variant="secondary" className="text-xs">
                    {character.role}
                  </Badge>
                )}
                {character.species && (
                  <Badge variant="outline" className="text-xs">
                    {character.species}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {character.appearance && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {stripMarkdown(character.appearance)}
            </p>
          )}
          {!character.appearance && character.personality && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {stripMarkdown(character.personality)}
            </p>
          )}
        </CardContent>
      </Link>

      <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>Updated {formatDate(character.updatedAt)}</span>
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
              <Link href={`/worlds/${worldSlug}/characters/${character.slug}`}>
                View
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={`/worlds/${worldSlug}/characters/${character.slug}/edit`}
              >
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}
