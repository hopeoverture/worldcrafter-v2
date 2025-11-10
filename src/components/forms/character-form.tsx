"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createCharacterSchema,
  type CreateCharacterInput,
} from "@/lib/schemas/character.schema";
import {
  createCharacter,
  updateCharacter,
} from "@/app/worlds/[slug]/characters/actions";
import type { Character } from "@prisma/client";

// Import markdown editor dynamically to avoid SSR issues
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

// Import CSS for markdown editor
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

interface CharacterFormProps {
  worldId: string;
  worldSlug: string;
  character?: Character;
  mode: "create" | "edit";
}

export function CharacterForm({
  worldId,
  worldSlug,
  character,
  mode,
}: CharacterFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    character?.imageUrl ?? null
  );

  const form = useForm<CreateCharacterInput>({
    resolver: zodResolver(createCharacterSchema),
    defaultValues: {
      name: character?.name ?? "",
      role: character?.role ?? "",
      species: character?.species ?? "",
      age: character?.age ?? "",
      gender: character?.gender ?? "",
      appearance: character?.appearance ?? "",
      personality: character?.personality ?? "",
      backstory: character?.backstory ?? "",
      goals: character?.goals ?? "",
      fears: character?.fears ?? "",
      attributes: character?.attributes
        ? (character.attributes as Record<string, unknown>)
        : null,
      imageUrl: character?.imageUrl ?? "",
    },
  });

  // Watch imageUrl field for preview
  const imageUrl = form.watch("imageUrl");

  // Update preview when URL changes
  useState(() => {
    if (imageUrl && imageUrl !== imagePreview) {
      setImagePreview(imageUrl);
    }
  });

  async function onSubmit(values: CreateCharacterInput) {
    setIsSubmitting(true);
    setError(null);

    try {
      let result;

      if (mode === "create") {
        result = await createCharacter(worldId, values);
      } else if (character) {
        result = await updateCharacter(character.id, values);
      }

      if (result?.success && result.data) {
        // Redirect to character detail page
        router.push(`/worlds/${worldSlug}/characters/${result.data.slug}`);
        router.refresh();
      } else {
        setError(result?.error ?? "An error occurred");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsSubmitting(false);
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basics">Basics</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="personality">Personality</TabsTrigger>
            <TabsTrigger value="backstory">Backstory</TabsTrigger>
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
                  <FormLabel>Character Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter character name..."
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    A unique name for this character (max 100 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role Field */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Warrior, Merchant, King..."
                      {...field}
                      value={field.value ?? ""}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    The character&apos;s role or occupation (max 100 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Species Field */}
            <FormField
              control={form.control}
              name="species"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Species</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Human, Elf, Dragon..."
                      {...field}
                      value={field.value ?? ""}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    The character&apos;s species or race (max 100 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Age Field */}
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 25, Ancient, Unknown..."
                      {...field}
                      value={field.value ?? ""}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Flexible text format for age (max 50 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Gender Field */}
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Male, Female, Non-binary..."
                      {...field}
                      value={field.value ?? ""}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    The character&apos;s gender (max 50 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            {/* Image URL Field with Preview */}
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Character Portrait URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com/portrait.jpg"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        field.onChange(e);
                        // Update preview when URL changes
                        const url = e.target.value;
                        if (url && url.startsWith("http")) {
                          setImagePreview(url);
                        } else {
                          setImagePreview(null);
                        }
                      }}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional image URL for this character&apos;s portrait
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative w-48 h-48 border rounded-lg overflow-hidden">
                <Image
                  src={imagePreview}
                  alt="Character portrait preview"
                  fill
                  className="object-cover"
                  onError={() => setImagePreview(null)}
                />
              </div>
            )}

            {/* Appearance Field (Markdown) */}
            <FormField
              control={form.control}
              name="appearance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Appearance</FormLabel>
                  <FormControl>
                    <div
                      data-color-mode="light"
                      className="dark:data-[color-mode=dark]"
                    >
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
                    Physical appearance and distinctive features using Markdown
                    (max 10,000 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          {/* Personality Tab */}
          <TabsContent value="personality" className="space-y-6">
            {/* Personality Field (Markdown) */}
            <FormField
              control={form.control}
              name="personality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personality</FormLabel>
                  <FormControl>
                    <div
                      data-color-mode="light"
                      className="dark:data-[color-mode=dark]"
                    >
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
                    Personality traits, temperament, and behavior using Markdown
                    (max 10,000 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Goals Field (Markdown) */}
            <FormField
              control={form.control}
              name="goals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goals</FormLabel>
                  <FormControl>
                    <div
                      data-color-mode="light"
                      className="dark:data-[color-mode=dark]"
                    >
                      <MDEditor
                        value={field.value ?? ""}
                        onChange={(val) => field.onChange(val ?? "")}
                        preview="edit"
                        height={200}
                        enableScroll={true}
                        visibleDragbar={false}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Motivations, ambitions, and objectives using Markdown (max
                    5,000 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fears Field (Markdown) */}
            <FormField
              control={form.control}
              name="fears"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fears</FormLabel>
                  <FormControl>
                    <div
                      data-color-mode="light"
                      className="dark:data-[color-mode=dark]"
                    >
                      <MDEditor
                        value={field.value ?? ""}
                        onChange={(val) => field.onChange(val ?? "")}
                        preview="edit"
                        height={200}
                        enableScroll={true}
                        visibleDragbar={false}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Fears, weaknesses, and vulnerabilities using Markdown (max
                    5,000 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          {/* Backstory Tab */}
          <TabsContent value="backstory" className="space-y-6">
            {/* Backstory Field (Markdown) */}
            <FormField
              control={form.control}
              name="backstory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Backstory</FormLabel>
                  <FormControl>
                    <div
                      data-color-mode="light"
                      className="dark:data-[color-mode=dark]"
                    >
                      <MDEditor
                        value={field.value ?? ""}
                        onChange={(val) => field.onChange(val ?? "")}
                        preview="edit"
                        height={400}
                        enableScroll={true}
                        visibleDragbar={false}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    The character&apos;s history, origin, and past experiences
                    using Markdown (max 10,000 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Custom Attributes
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Custom attributes are JSON key-value pairs for genre-specific
                  stats or additional metadata. This feature will be expanded in
                  future updates to support a rich JSON editor.
                </p>
              </div>

              <FormField
                control={form.control}
                name="attributes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Attributes (JSON)</FormLabel>
                    <FormControl>
                      <textarea
                        className="w-full min-h-[200px] p-3 border rounded-md font-mono text-sm"
                        placeholder={`{\n  "strength": 18,\n  "dexterity": 14,\n  "magicAffinity": "Fire"\n}`}
                        value={
                          field.value
                            ? JSON.stringify(field.value, null, 2)
                            : ""
                        }
                        onChange={(e) => {
                          try {
                            const parsed = e.target.value
                              ? JSON.parse(e.target.value)
                              : null;
                            field.onChange(parsed);
                          } catch {
                            // Invalid JSON - don't update
                          }
                        }}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional JSON object for custom character attributes
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
            {mode === "create" ? "Create Character" : "Update Character"}
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
  );
}
