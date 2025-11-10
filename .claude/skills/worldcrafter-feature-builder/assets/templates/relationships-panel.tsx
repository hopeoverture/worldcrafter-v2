"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"

/**
 * Relationships Panel Component
 *
 * Manages connections between entities (character-to-character relationships).
 *
 * Database Schema Required:
 * model CharacterRelationship {
 *   id               String    @id @default(uuid())
 *   fromCharacterId  String
 *   toCharacterId    String
 *   relationshipType String
 *   description      String?
 *   createdAt        DateTime  @default(now())
 *
 *   fromCharacter Character @relation("RelationshipsFrom", fields: [fromCharacterId], references: [id], onDelete: Cascade)
 *   toCharacter   Character @relation("RelationshipsTo", fields: [toCharacterId], references: [id], onDelete: Cascade)
 *
 *   @@map("character_relationships")
 * }
 *
 * model Character {
 *   id                String                    @id @default(uuid())
 *   name              String
 *   relationshipsFrom CharacterRelationship[]   @relation("RelationshipsFrom")
 *   relationshipsTo   CharacterRelationship[]   @relation("RelationshipsTo")
 *
 *   @@map("characters")
 * }
 *
 * Usage:
 * <RelationshipsPanel
 *   characterId={character.id}
 *   relationships={character.relationshipsFrom}
 * />
 */

const relationshipSchema = z.object({
  fromCharacterId: z.string().uuid(),
  toCharacterId: z.string().uuid(),
  relationshipType: z.string().min(1, "Relationship type is required"),
  description: z.string().optional(),
})

type RelationshipFormValues = z.infer<typeof relationshipSchema>

type Relationship = {
  id: string
  relationshipType: string
  description?: string | null
  toCharacter: {
    id: string
    name: string
    imageUrl?: string | null
  }
}

type Character = {
  id: string
  name: string
}

export function RelationshipsPanel({
  characterId,
  relationships,
  onAdd,
  onRemove,
}: {
  characterId: string
  relationships: Relationship[]
  onAdd?: () => void
  onRemove?: () => void
}) {
  const [isAddingRelationship, setIsAddingRelationship] = useState(false)

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Relationships</h3>
            <Button
              size="sm"
              onClick={() => setIsAddingRelationship(true)}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Relationship
            </Button>
          </div>

          {/* List existing relationships */}
          <div className="space-y-2">
            {relationships.map((rel) => (
              <RelationshipCard
                key={rel.id}
                relationship={rel}
                onRemove={onRemove}
              />
            ))}

            {relationships.length === 0 && (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No relationships yet. Click "Add Relationship" to create connections.
                </p>
              </div>
            )}
          </div>

          {/* Add relationship modal */}
          <AddRelationshipModal
            open={isAddingRelationship}
            onClose={() => setIsAddingRelationship(false)}
            characterId={characterId}
            onSuccess={onAdd}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function RelationshipCard({
  relationship,
  onRemove,
}: {
  relationship: Relationship
  onRemove?: () => void
}) {
  const [isRemoving, setIsRemoving] = useState(false)

  async function handleRemove() {
    if (!confirm("Are you sure you want to remove this relationship?")) {
      return
    }

    setIsRemoving(true)
    try {
      // TODO: Replace with your Server Action
      const result = await removeRelationship(relationship.id)

      if (result.success) {
        onRemove?.()
      } else {
        alert(result.error || "Failed to remove relationship")
      }
    } catch (error) {
      console.error("Error removing relationship:", error)
      alert("Failed to remove relationship")
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">{relationship.toCharacter.name}</p>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
            {relationship.relationshipType}
          </span>
        </div>
        {relationship.description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {relationship.description}
          </p>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRemove}
        disabled={isRemoving}
      >
        {isRemoving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <X className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}

function AddRelationshipModal({
  open,
  onClose,
  characterId,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  characterId: string
  onSuccess?: () => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableCharacters, setAvailableCharacters] = useState<Character[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<RelationshipFormValues>({
    resolver: zodResolver(relationshipSchema),
    defaultValues: {
      fromCharacterId: characterId,
      toCharacterId: "",
      relationshipType: "",
      description: "",
    },
  })

  // Fetch available characters when modal opens
  useState(() => {
    if (open) {
      fetchAvailableCharacters()
    }
  })

  async function fetchAvailableCharacters() {
    setIsLoading(true)
    try {
      // TODO: Replace with your data fetching method
      const response = await fetch(`/api/characters?exclude=${characterId}`)
      const data = await response.json()
      setAvailableCharacters(data)
    } catch (error) {
      console.error("Failed to fetch characters:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function onSubmit(values: RelationshipFormValues) {
    setIsSubmitting(true)
    try {
      // TODO: Replace with your Server Action
      const result = await addRelationship(values)

      if (result.success) {
        form.reset()
        onClose()
        onSuccess?.()
      } else {
        form.setError("root", { message: result.error })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Relationship</DialogTitle>
          <DialogDescription>
            Create a connection between this character and another.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="toCharacterId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Character</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isLoading
                              ? "Loading characters..."
                              : "Select a character"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableCharacters.map((char) => (
                        <SelectItem key={char.id} value={char.id}>
                          {char.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the character to create a relationship with
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="relationshipType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="friend">Friend</SelectItem>
                      <SelectItem value="enemy">Enemy</SelectItem>
                      <SelectItem value="family">Family</SelectItem>
                      <SelectItem value="ally">Ally</SelectItem>
                      <SelectItem value="rival">Rival</SelectItem>
                      <SelectItem value="mentor">Mentor</SelectItem>
                      <SelectItem value="apprentice">Apprentice</SelectItem>
                      <SelectItem value="lover">Lover</SelectItem>
                      <SelectItem value="acquaintance">Acquaintance</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the nature of their relationship..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide context about how they know each other
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <div className="rounded-md border border-destructive bg-destructive/10 p-3">
                <p className="text-sm text-destructive">
                  {form.formState.errors.root.message}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Relationship"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// TODO: Replace with actual Server Actions

async function addRelationship(values: RelationshipFormValues) {
  console.log("Adding relationship:", values)
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000))
  return { success: true, data: values }
}

async function removeRelationship(id: string) {
  console.log("Removing relationship:", id)
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500))
  return { success: true }
}

/**
 * Server Actions Example (create in actions.ts)
 *
 * "use server"
 *
 * import { revalidatePath } from "next/cache"
 * import { prisma } from "@/lib/prisma"
 * import { createClient } from "@/lib/supabase/server"
 * import { relationshipSchema } from "@/lib/schemas/relationship"
 *
 * export async function addRelationship(values: any) {
 *   const validated = relationshipSchema.parse(values)
 *
 *   const supabase = await createClient()
 *   const { data: { user } } = await supabase.auth.getUser()
 *   if (!user) return { success: false, error: "Unauthorized" }
 *
 *   // Verify user owns the character
 *   const character = await prisma.character.findUnique({
 *     where: { id: validated.fromCharacterId },
 *     select: { userId: true }
 *   })
 *
 *   if (!character || character.userId !== user.id) {
 *     return { success: false, error: "Forbidden" }
 *   }
 *
 *   const relationship = await prisma.characterRelationship.create({
 *     data: validated
 *   })
 *
 *   revalidatePath(`/characters/${validated.fromCharacterId}`)
 *   return { success: true, data: relationship }
 * }
 *
 * export async function removeRelationship(id: string) {
 *   const supabase = await createClient()
 *   const { data: { user } } = await supabase.auth.getUser()
 *   if (!user) return { success: false, error: "Unauthorized" }
 *
 *   // Verify ownership
 *   const relationship = await prisma.characterRelationship.findUnique({
 *     where: { id },
 *     include: { fromCharacter: { select: { userId: true } } }
 *   })
 *
 *   if (!relationship || relationship.fromCharacter.userId !== user.id) {
 *     return { success: false, error: "Forbidden" }
 *   }
 *
 *   await prisma.characterRelationship.delete({ where: { id } })
 *
 *   revalidatePath(`/characters/${relationship.fromCharacterId}`)
 *   return { success: true }
 * }
 */
