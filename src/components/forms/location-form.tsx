"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LocationParentSelector } from "@/components/forms/location-parent-selector"
import {
  createLocationFormSchema,
  type CreateLocationFormInput,
} from "@/lib/schemas/location.schema"
import { createLocation, updateLocation } from "@/app/worlds/[slug]/locations/actions"
import type { Location } from "@prisma/client"

// Import markdown editor dynamically to avoid SSR issues
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false })

// Import CSS for markdown editor
import "@uiw/react-md-editor/markdown-editor.css"
import "@uiw/react-markdown-preview/markdown.css"

interface LocationFormProps {
  worldId: string
  worldSlug: string
  location?: Location
  mode: "create" | "edit"
}

const LOCATION_TYPES = [
  { value: "City", label: "City" },
  { value: "Town", label: "Town" },
  { value: "Village", label: "Village" },
  { value: "Region", label: "Region" },
  { value: "Country", label: "Country" },
  { value: "Continent", label: "Continent" },
  { value: "Planet", label: "Planet" },
  { value: "Dungeon", label: "Dungeon" },
  { value: "Forest", label: "Forest" },
  { value: "Mountain", label: "Mountain" },
  { value: "Ocean", label: "Ocean" },
  { value: "Building", label: "Building" },
  { value: "Custom", label: "Custom" },
]

export function LocationForm({ worldId, worldSlug, location, mode }: LocationFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<CreateLocationFormInput>({
    resolver: zodResolver(createLocationFormSchema),
    defaultValues: {
      worldId,
      name: location?.name ?? "",
      type: location?.type ?? "City",
      parentId: location?.parentId ?? null,
      description: location?.description ?? "",
      geography: location?.geography ?? "",
      climate: location?.climate ?? "",
      population: location?.population ?? "",
      government: location?.government ?? "",
      economy: location?.economy ?? "",
      culture: location?.culture ?? "",
      coordinates: location?.coordinates
        ? (location.coordinates as { x: number; y: number })
        : null,
      attributes: location?.attributes ? (location.attributes as Record<string, unknown>) : null,
      imageUrl: location?.imageUrl ?? "",
    },
  })

  async function onSubmit(values: CreateLocationFormInput) {
    setIsSubmitting(true)
    setError(null)

    try {
      let result

      if (mode === "create") {
        result = await createLocation(values)
      } else if (location) {
        result = await updateLocation(location.id, values)
      }

      if (result?.success && result.data) {
        // Redirect to location detail page
        router.push(`/worlds/${worldSlug}/locations/${result.data.slug}`)
        router.refresh()
      } else {
        setError(result?.error ?? "An error occurred")
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="basics" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basics">Basics</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="attributes">Attributes</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* Basics Tab */}
          <TabsContent value="basics" className="space-y-6">
            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter location name..."
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    A unique name for this location (max 100 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type Field */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value ?? undefined}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a location type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LOCATION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The type or category of this location
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Parent Location Field */}
            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Location</FormLabel>
                  <FormControl>
                    <LocationParentSelector
                      worldId={worldId}
                      value={field.value}
                      onChange={field.onChange}
                      currentLocationId={location?.id}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional parent location for hierarchical organization
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description Field (Markdown) */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <div data-color-mode="light" className="dark:data-[color-mode=dark]">
                      <MDEditor
                        value={field.value ?? ""}
                        onChange={(val) => field.onChange(val ?? "")}
                        preview="edit"
                        height={300}
                        enableScroll={true}
                        visibleDragbar={false}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Detailed description using Markdown (max 5000 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            {/* Geography Field */}
            <FormField
              control={form.control}
              name="geography"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Geography</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the physical geography..."
                      className="resize-none min-h-[100px]"
                      {...field}
                      value={field.value ?? ""}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Physical features, terrain, landmarks
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Climate Field */}
            <FormField
              control={form.control}
              name="climate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Climate</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Temperate, Tropical, Arctic..."
                      {...field}
                      value={field.value ?? ""}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Weather patterns and climate type (max 100 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Population Field */}
            <FormField
              control={form.control}
              name="population"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Population</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 10,000, Small village, Uninhabited..."
                      {...field}
                      value={field.value ?? ""}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Population size or description (max 50 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Culture Field */}
            <FormField
              control={form.control}
              name="culture"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Culture</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe cultural characteristics..."
                      className="resize-none min-h-[100px]"
                      {...field}
                      value={field.value ?? ""}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Cultural traditions, customs, beliefs
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          {/* Attributes Tab */}
          <TabsContent value="attributes" className="space-y-6">
            {/* Government Field */}
            <FormField
              control={form.control}
              name="government"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Government</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Democracy, Monarchy, Theocracy..."
                      {...field}
                      value={field.value ?? ""}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Type of government or leadership (max 100 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Economy Field */}
            <FormField
              control={form.control}
              name="economy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Economy</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe economic systems, trade, resources..."
                      className="resize-none min-h-[100px]"
                      {...field}
                      value={field.value ?? ""}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Economic systems, trade, primary industries
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6">
            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="coordinates.x"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>X Coordinate</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value
                          field.onChange(val === "" ? undefined : parseFloat(val))
                        }}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional X coordinate for map positioning
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="coordinates.y"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Y Coordinate</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value
                          field.onChange(val === "" ? undefined : parseFloat(val))
                        }}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional Y coordinate for map positioning
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Image URL Field */}
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      {...field}
                      value={field.value ?? ""}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional image for this location (future: upload support)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create Location" : "Update Location"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
