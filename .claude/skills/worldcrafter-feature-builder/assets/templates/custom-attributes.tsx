"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Base schema without genre-specific attributes
export const characterBaseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  worldId: z.string().uuid(),
  description: z.string().optional(),
  // Flexible attributes - validated at runtime based on genre
  attributes: z.record(z.any()).optional(),
})

// Genre-specific attribute schemas
export const fantasyAttributesSchema = z.object({
  manaPoints: z.number().min(0).max(100),
  magicSchool: z.enum(["fire", "water", "earth", "air"]),
  spellSlots: z.number().min(0).max(10),
  deity: z.string().optional(),
})

export const scifiAttributesSchema = z.object({
  techLevel: z.number().min(1).max(10),
  cybernetics: z.array(z.string()).default([]),
  faction: z.string(),
  shipClass: z.string().optional(),
})

export const modernAttributesSchema = z.object({
  occupation: z.string(),
  education: z.enum(["high_school", "bachelors", "masters", "phd"]).optional(),
  skills: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
})

export const horrorAttributesSchema = z.object({
  sanity: z.number().min(0).max(100).default(100),
  fearLevel: z.number().min(0).max(10).default(0),
  trauma: z.string().optional(),
  vulnerabilities: z.array(z.string()).default([]),
})

// Type for world with genre
type World = {
  id: string
  name: string
  genre: "fantasy" | "scifi" | "modern" | "horror" | "other"
}

type CharacterFormValues = z.infer<typeof characterBaseSchema>

export default function CharacterFormWithAttributes({ worldId }: { worldId: string }) {
  const [world, setWorld] = useState<World | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CharacterFormValues>({
    resolver: zodResolver(characterBaseSchema),
    defaultValues: {
      name: "",
      worldId,
      description: "",
      attributes: {},
    },
  })

  useEffect(() => {
    // Fetch world to get genre
    async function fetchWorld() {
      try {
        // TODO: Replace with your actual data fetching method
        const response = await fetch(`/api/worlds/${worldId}`)
        const data = await response.json()
        setWorld(data)
      } catch (error) {
        console.error("Failed to fetch world:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorld()
  }, [worldId])

  async function onSubmit(values: CharacterFormValues) {
    setIsSubmitting(true)
    try {
      // TODO: Replace with your Server Action
      const result = await createCharacter(values)

      if (result.success) {
        console.log("Success:", result.data)
        form.reset()
        // TODO: Redirect or show success message
      } else {
        form.setError("root", { message: result.error })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  function renderAttributeFields() {
    if (!world) return null

    switch (world.genre) {
      case "fantasy":
        return <FantasyAttributes form={form} />

      case "scifi":
        return <SciFiAttributes form={form} />

      case "modern":
        return <ModernAttributes form={form} />

      case "horror":
        return <HorrorAttributes form={form} />

      default:
        return (
          <div className="rounded-lg border border-dashed p-4">
            <p className="text-sm text-muted-foreground">
              No genre-specific attributes for this world type.
            </p>
          </div>
        )
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center">Loading world data...</div>
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create Character</h1>
        <p className="text-muted-foreground">
          World: {world?.name} ({world?.genre})
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Standard fields */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter character name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Brief description of the character"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Genre-specific attributes */}
          <div className="space-y-4 rounded-lg border p-6">
            <h3 className="text-lg font-semibold capitalize">
              {world?.genre} Attributes
            </h3>
            {renderAttributeFields()}
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={isSubmitting}
            >
              Reset
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Character"}
            </Button>
          </div>

          {form.formState.errors.root && (
            <div className="rounded-md border border-destructive bg-destructive/10 p-4">
              <p className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            </div>
          )}
        </form>
      </Form>
    </div>
  )
}

// Genre-specific attribute components

function FantasyAttributes({ form }: { form: any }) {
  return (
    <>
      <FormField
        control={form.control}
        name="attributes.manaPoints"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Mana Points (0-100)</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="0"
                max="100"
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value))}
              />
            </FormControl>
            <FormDescription>Character's magical energy capacity</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="attributes.magicSchool"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Magic School</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select magic school" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="fire">Fire</SelectItem>
                <SelectItem value="water">Water</SelectItem>
                <SelectItem value="earth">Earth</SelectItem>
                <SelectItem value="air">Air</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="attributes.spellSlots"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Spell Slots (0-10)</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="0"
                max="10"
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="attributes.deity"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Deity (Optional)</FormLabel>
            <FormControl>
              <Input placeholder="Enter deity name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}

function SciFiAttributes({ form }: { form: any }) {
  return (
    <>
      <FormField
        control={form.control}
        name="attributes.techLevel"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tech Level (1-10)</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="1"
                max="10"
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value))}
              />
            </FormControl>
            <FormDescription>
              1 = Pre-industrial, 10 = Post-singularity
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="attributes.faction"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Faction</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Galactic Federation" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="attributes.shipClass"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Ship Class (Optional)</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Corvette, Cruiser" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}

function ModernAttributes({ form }: { form: any }) {
  return (
    <>
      <FormField
        control={form.control}
        name="attributes.occupation"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Occupation</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Software Engineer" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="attributes.education"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Education Level</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select education level" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="high_school">High School</SelectItem>
                <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                <SelectItem value="masters">Master's Degree</SelectItem>
                <SelectItem value="phd">PhD</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}

function HorrorAttributes({ form }: { form: any }) {
  return (
    <>
      <FormField
        control={form.control}
        name="attributes.sanity"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Sanity (0-100)</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="0"
                max="100"
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value))}
              />
            </FormControl>
            <FormDescription>Character's mental stability</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="attributes.fearLevel"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Fear Level (0-10)</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="0"
                max="10"
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="attributes.trauma"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Trauma (Optional)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe traumatic experiences..."
                className="min-h-[80px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}

// TODO: Replace with actual Server Action
async function createCharacter(data: CharacterFormValues) {
  console.log("Creating character:", data)
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000))
  return { success: true, data }
}
