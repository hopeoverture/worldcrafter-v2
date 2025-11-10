"use client"

import dynamic from "next/dynamic"
import "@uiw/react-md-editor/markdown-editor.css"
import "@uiw/react-markdown-preview/markdown.css"

/**
 * Markdown Editor Component
 *
 * Uses @uiw/react-md-editor for rich text editing with live preview.
 *
 * Installation:
 * npm install @uiw/react-md-editor
 *
 * Features:
 * - Live markdown preview
 * - Toolbar with formatting buttons
 * - Code highlighting
 * - Dark mode support
 *
 * Usage with React Hook Form:
 * <FormField
 *   control={form.control}
 *   name="backstory"
 *   render={({ field }) => (
 *     <FormItem>
 *       <MarkdownField
 *         value={field.value}
 *         onChange={field.onChange}
 *         label="Backstory"
 *         height={400}
 *       />
 *       <FormDescription>
 *         Use Markdown formatting for rich text
 *       </FormDescription>
 *       <FormMessage />
 *     </FormItem>
 *   )}
 * />
 */

// Import dynamically to avoid SSR issues
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false })

export function MarkdownField({
  value,
  onChange,
  label,
  height = 300,
  preview = "edit",
  placeholder,
}: {
  value?: string
  onChange: (value: string) => void
  label: string
  height?: number
  preview?: "edit" | "live" | "preview"
  placeholder?: string
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
      </label>
      <div data-color-mode="light" className="dark:hidden">
        <MDEditor
          value={value}
          onChange={(val) => onChange(val || "")}
          height={height}
          preview={preview}
          textareaProps={{
            placeholder: placeholder || "Enter text here...",
          }}
        />
      </div>
      <div data-color-mode="dark" className="hidden dark:block">
        <MDEditor
          value={value}
          onChange={(val) => onChange(val || "")}
          height={height}
          preview={preview}
          textareaProps={{
            placeholder: placeholder || "Enter text here...",
          }}
        />
      </div>
    </div>
  )
}

/**
 * Markdown Preview Component
 *
 * For displaying rendered markdown (read-only).
 *
 * Usage:
 * <MarkdownPreview content={character.backstory} />
 */
const MDPreview = dynamic(
  () => import("@uiw/react-markdown-preview"),
  { ssr: false }
)

export function MarkdownPreview({
  content,
  className,
}: {
  content: string
  className?: string
}) {
  return (
    <div className={className}>
      <div data-color-mode="light" className="dark:hidden">
        <MDPreview source={content} />
      </div>
      <div data-color-mode="dark" className="hidden dark:block">
        <MDPreview source={content} />
      </div>
    </div>
  )
}

/**
 * Alternative: Using react-markdown for simple preview
 *
 * npm install react-markdown
 *
 * import ReactMarkdown from "react-markdown"
 *
 * export function SimpleMarkdownPreview({ content }: { content: string }) {
 *   return (
 *     <div className="prose dark:prose-invert max-w-none">
 *       <ReactMarkdown>{content}</ReactMarkdown>
 *     </div>
 *   )
 * }
 */

/**
 * Complete Example: Form with Markdown Editor
 */

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

const characterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  backstory: z.string().optional(),
  lore: z.string().optional(),
})

type CharacterFormValues = z.infer<typeof characterSchema>

export function CharacterFormWithMarkdown() {
  const form = useForm<CharacterFormValues>({
    resolver: zodResolver(characterSchema),
    defaultValues: {
      name: "",
      backstory: "",
      lore: "",
    },
  })

  async function onSubmit(values: CharacterFormValues) {
    console.log("Submitting:", values)
    // TODO: Call Server Action
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <h1 className="mb-6 text-3xl font-bold">Create Character</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
            name="backstory"
            render={({ field }) => (
              <FormItem>
                <MarkdownField
                  value={field.value}
                  onChange={field.onChange}
                  label="Backstory"
                  height={300}
                  preview="live"
                  placeholder="Write the character's backstory using Markdown..."
                />
                <FormDescription>
                  Use Markdown formatting: **bold**, *italic*, # Headers, etc.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lore"
            render={({ field }) => (
              <FormItem>
                <MarkdownField
                  value={field.value}
                  onChange={field.onChange}
                  label="Lore & History"
                  height={250}
                  preview="edit"
                  placeholder="Additional lore, historical notes, etc."
                />
                <FormDescription>
                  Optional extended lore and historical information
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => form.reset()}>
              Reset
            </Button>
            <Button type="submit">Create Character</Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

/**
 * Markdown Cheat Sheet Component
 *
 * Optional helper component to show users common Markdown syntax
 */
export function MarkdownCheatSheet() {
  return (
    <div className="rounded-lg border bg-muted/50 p-4 text-sm">
      <h4 className="mb-2 font-semibold">Markdown Formatting</h4>
      <ul className="space-y-1 text-muted-foreground">
        <li>**bold** or __bold__</li>
        <li>*italic* or _italic_</li>
        <li># Heading 1, ## Heading 2, ### Heading 3</li>
        <li>[Link text](url)</li>
        <li>![Image alt](image-url)</li>
        <li>- Bullet list or 1. Numbered list</li>
        <li>&gt; Blockquote</li>
        <li>`code` or ```code block```</li>
      </ul>
    </div>
  )
}
