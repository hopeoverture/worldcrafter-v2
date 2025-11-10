import { type Character } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Briefcase, Dna, Cake } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface CharacterDetailProps {
  character: Character;
  worldSlug: string;
}

export function CharacterDetail({ character }: CharacterDetailProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left Column: Main Details */}
      <div className="space-y-6 lg:col-span-2">
        {/* Info Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Role</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {character.role ? (
                <Badge variant="secondary" className="text-sm">
                  {character.role}
                </Badge>
              ) : (
                <p className="text-sm text-muted-foreground">No role set</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Species</CardTitle>
              <Dna className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {character.species ? (
                <Badge variant="outline" className="text-sm">
                  {character.species}
                </Badge>
              ) : (
                <p className="text-sm text-muted-foreground">No species set</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Age</CardTitle>
              <Cake className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {character.age || "Unknown"}
              </div>
              {character.gender && (
                <p className="text-xs text-muted-foreground mt-1">
                  {character.gender}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Appearance */}
        {character.appearance && (
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Physical description and visual traits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{character.appearance}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Personality */}
        {character.personality && (
          <Card>
            <CardHeader>
              <CardTitle>Personality</CardTitle>
              <CardDescription>
                Traits, mannerisms, and temperament
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{character.personality}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Backstory */}
        {character.backstory && (
          <Card>
            <CardHeader>
              <CardTitle>Backstory</CardTitle>
              <CardDescription>History and origin story</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{character.backstory}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Goals & Fears */}
        {(character.goals || character.fears) && (
          <Card>
            <CardHeader>
              <CardTitle>Motivations</CardTitle>
              <CardDescription>What drives this character</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {character.goals && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <span className="text-green-600 dark:text-green-400">
                      Goals
                    </span>
                  </h4>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{character.goals}</ReactMarkdown>
                  </div>
                </div>
              )}
              {character.fears && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <span className="text-red-600 dark:text-red-400">
                      Fears
                    </span>
                  </h4>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{character.fears}</ReactMarkdown>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Custom Attributes */}
        {character.attributes && typeof character.attributes === "object" && (
          <Card>
            <CardHeader>
              <CardTitle>Custom Attributes</CardTitle>
              <CardDescription>Additional character details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {Object.entries(
                  character.attributes as Record<string, unknown>
                ).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <span className="text-muted-foreground capitalize font-medium">
                      {key.replace(/([A-Z])/g, " $1").trim()}:
                    </span>
                    <span className="font-semibold">{String(value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Column: Metadata & Image */}
      <div className="space-y-6 lg:col-span-1">
        {/* Character Image */}
        {character.imageUrl && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Portrait</CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={character.imageUrl}
                alt={character.name}
                className="w-full h-auto rounded-lg"
              />
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="font-medium">
                  {new Date(character.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Last Updated</p>
                <p className="font-medium">
                  {new Date(character.updatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats (if available) */}
        {(character.role ||
          character.species ||
          character.age ||
          character.gender) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {character.role && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role:</span>
                  <span className="font-medium">{character.role}</span>
                </div>
              )}
              {character.species && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Species:</span>
                  <span className="font-medium">{character.species}</span>
                </div>
              )}
              {character.age && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Age:</span>
                  <span className="font-medium">{character.age}</span>
                </div>
              )}
              {character.gender && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gender:</span>
                  <span className="font-medium">{character.gender}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
