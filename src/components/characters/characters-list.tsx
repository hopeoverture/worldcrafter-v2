"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Grid3x3, List, Plus, Eye, Edit, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CharacterCard } from "./character-card";
import { deleteCharacter } from "@/app/worlds/[slug]/characters/actions";
import { toast } from "sonner";

interface Character {
  id: string;
  name: string;
  slug: string;
  worldId: string;
  role: string | null;
  species: string | null;
  age: string | null;
  gender: string | null;
  imageUrl: string | null;
  appearance: string | null;
  personality: string | null;
  backstory: string | null;
  goals: string | null;
  fears: string | null;
  attributes: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CharactersListProps {
  characters: Character[];
  worldSlug: string;
}

type ViewMode = "card" | "table";
type FilterType = "all" | string;

export function CharactersList({ characters, worldSlug }: CharactersListProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [filterRole, setFilterRole] = useState<FilterType>("all");
  const [filterSpecies, setFilterSpecies] = useState<FilterType>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Extract unique roles and species for filters
  const uniqueRoles = useMemo(() => {
    const roles = characters
      .map((c) => c.role)
      .filter((role): role is string => role !== null && role !== "");
    return Array.from(new Set(roles)).sort();
  }, [characters]);

  const uniqueSpecies = useMemo(() => {
    const species = characters
      .map((c) => c.species)
      .filter((s): s is string => s !== null && s !== "");
    return Array.from(new Set(species)).sort();
  }, [characters]);

  // Filter characters by role and species
  const filteredCharacters = useMemo(() => {
    return characters.filter((character) => {
      const roleMatch = filterRole === "all" || character.role === filterRole;
      const speciesMatch =
        filterSpecies === "all" || character.species === filterSpecies;
      return roleMatch && speciesMatch;
    });
  }, [characters, filterRole, filterSpecies]);

  // Handle delete character
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const result = await deleteCharacter(id);

    if (result.success) {
      toast.success("Character deleted successfully");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete character");
    }
    setDeletingId(null);
  };

  // Empty state
  if (characters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <User className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No characters yet</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Start populating your world by creating characters. Add heroes,
          villains, NPCs, and more.
        </p>
        <Button asChild>
          <Link href={`/worlds/${worldSlug}/characters/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Create First Character
          </Link>
        </Button>
      </div>
    );
  }

  // Filtered but empty state
  if (filteredCharacters.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Characters</h2>
            <p className="text-muted-foreground">
              {characters.length} character{characters.length !== 1 ? "s" : ""}{" "}
              total
            </p>
          </div>
          <Button asChild>
            <Link href={`/worlds/${worldSlug}/characters/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Character
            </Link>
          </Button>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={viewMode === "card" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("card")}
            >
              <Grid3x3 className="mr-2 h-4 w-4" />
              Card View
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              <List className="mr-2 h-4 w-4" />
              Table View
            </Button>
          </div>

          <div className="flex gap-2 items-center flex-wrap">
            {uniqueRoles.length > 0 && (
              <>
                <span className="text-sm text-muted-foreground">Role:</span>
                <Select
                  value={filterRole}
                  onValueChange={(value) => setFilterRole(value as FilterType)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {uniqueRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}

            {uniqueSpecies.length > 0 && (
              <>
                <span className="text-sm text-muted-foreground">Species:</span>
                <Select
                  value={filterSpecies}
                  onValueChange={(value) =>
                    setFilterSpecies(value as FilterType)
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Species</SelectItem>
                    {uniqueSpecies.map((species) => (
                      <SelectItem key={species} value={species}>
                        {species}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>

        {/* Empty filtered state */}
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center border rounded-lg">
          <User className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No characters found</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            No characters match the current filters. Try adjusting your
            selection.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setFilterRole("all");
              setFilterSpecies("all");
            }}
          >
            Clear Filters
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Characters</h2>
          <p className="text-muted-foreground">
            {filteredCharacters.length} of {characters.length} character
            {characters.length !== 1 ? "s" : ""}
            {(filterRole !== "all" || filterSpecies !== "all") && " (filtered)"}
          </p>
        </div>
        <Button asChild>
          <Link href={`/worlds/${worldSlug}/characters/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Add Character
          </Link>
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={viewMode === "card" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("card")}
          >
            <Grid3x3 className="mr-2 h-4 w-4" />
            Card View
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
          >
            <List className="mr-2 h-4 w-4" />
            Table View
          </Button>
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          {uniqueRoles.length > 0 && (
            <>
              <span className="text-sm text-muted-foreground">Role:</span>
              <Select
                value={filterRole}
                onValueChange={(value) => setFilterRole(value as FilterType)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {uniqueRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}

          {uniqueSpecies.length > 0 && (
            <>
              <span className="text-sm text-muted-foreground">Species:</span>
              <Select
                value={filterSpecies}
                onValueChange={(value) => setFilterSpecies(value as FilterType)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Species</SelectItem>
                  {uniqueSpecies.map((species) => (
                    <SelectItem key={species} value={species}>
                      {species}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      </div>

      {/* Card View */}
      {viewMode === "card" && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCharacters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              worldSlug={worldSlug}
            />
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Species</TableHead>
                <TableHead>Age</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCharacters.map((character) => (
                <TableRow key={character.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/worlds/${worldSlug}/characters/${character.slug}`}
                      className="hover:underline flex items-center gap-2"
                    >
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      {character.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {character.role ? (
                      <Badge variant="secondary" className="text-xs">
                        {character.role}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {character.species ? (
                      <Badge variant="outline" className="text-xs">
                        {character.species}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {character.age || (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-8 w-8 p-0"
                      >
                        <Link
                          href={`/worlds/${worldSlug}/characters/${character.slug}`}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-8 w-8 p-0"
                      >
                        <Link
                          href={`/worlds/${worldSlug}/characters/${character.slug}/edit`}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            disabled={deletingId === character.id}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete Character
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete{" "}
                              <strong>{character.name}</strong>? This action
                              cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(character.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
