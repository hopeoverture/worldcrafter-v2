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
import { createWorldSchema, type CreateWorldInput, type Genre, type Privacy } from "@/lib/schemas/world.schema"
import { createWorld, updateWorld } from "@/app/worlds/actions"
import type { World } from "@prisma/client"

// Import markdown editor dynamically to avoid SSR issues
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false })

// Import CSS for markdown editor
import "@uiw/react-md-editor/markdown-editor.css"
import "@uiw/react-markdown-preview/markdown.css"

interface WorldFormProps {
  world?: World
  mode: "create" | "edit"
}

const GENRE_OPTIONS: { value: Genre; label: string }[] = [
  { value: "FANTASY", label: "Fantasy" },
  { value: "SCIFI", label: "Sci-Fi" },
  { value: "MODERN", label: "Modern" },
  { value: "HISTORICAL", label: "Historical" },
  { value: "HORROR", label: "Horror" },
  { value: "CUSTOM", label: "Custom" },
]

const PRIVACY_OPTIONS: { value: Privacy; label: string; description: string }[] = [
  {
    value: "PRIVATE",
    label: "Private",
    description: "Only you can see this world",
  },
  {
    value: "UNLISTED",
    label: "Unlisted",
    description: "Anyone with the link can view",
  },
  {
    value: "PUBLIC",
    label: "Public",
    description: "Visible to everyone",
  },
]

export function WorldForm({ world, mode }: WorldFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<CreateWorldInput>({
    resolver: zodResolver(createWorldSchema),
    defaultValues: {
      name: world?.name ?? "",
      genre: (world?.genre as Genre) ?? "CUSTOM",
      description: world?.description ?? "",
      setting: world?.setting ?? "",
      coverUrl: world?.coverUrl ?? "",
      privacy: (world?.privacy as Privacy) ?? "PRIVATE",
    },
  })

  async function onSubmit(values: CreateWorldInput) {
    setIsSubmitting(true)
    setError(null)

    try {
      let result

      if (mode === "create") {
        result = await createWorld(values)
      } else if (world) {
        result = await updateWorld(world.id, values)
      }

      if (result?.success && result.data) {
        // Redirect to world detail page
        router.push(`/worlds/${result.data.slug}`)
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

        {/* Name Field */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>World Name *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your world's name..."
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                A unique name for your world (max 100 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Genre Field */}
        <FormField
          control={form.control}
          name="genre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Genre</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a genre" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {GENRE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Choose the primary genre of your world
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Setting Summary Field */}
        <FormField
          control={form.control}
          name="setting"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Setting Summary</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief overview of your world's setting..."
                  className="resize-none"
                  {...field}
                  value={field.value ?? ""}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                A short summary of your world's setting (max 500 characters)
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
                Detailed description of your world using Markdown (max 5000 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Cover Image URL Field */}
        <FormField
          control={form.control}
          name="coverUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cover Image URL</FormLabel>
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
                Optional cover image for your world (future: upload support)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Privacy Field */}
        <FormField
          control={form.control}
          name="privacy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Privacy</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select privacy level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PRIVACY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {option.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Control who can view your world
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create World" : "Update World"}
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
