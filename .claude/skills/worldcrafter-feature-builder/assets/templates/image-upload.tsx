"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Upload, X } from "lucide-react"

/**
 * ImageUpload Component
 *
 * Handles image uploads to Supabase Storage with preview.
 *
 * Setup:
 * 1. Create bucket in Supabase Dashboard: Storage → New Bucket → "entity-images"
 * 2. Set bucket to public or configure RLS policies for images
 * 3. Configure CORS if needed for direct uploads
 *
 * Usage:
 * <FormField
 *   control={form.control}
 *   name="imageUrl"
 *   render={({ field }) => (
 *     <FormItem>
 *       <ImageUpload
 *         value={field.value}
 *         onChange={field.onChange}
 *         folder="characters"
 *       />
 *       <FormMessage />
 *     </FormItem>
 *   )}
 * />
 */
export function ImageUpload({
  value,
  onChange,
  bucket = "entity-images",
  folder = "general",
  label = "Image",
  maxSizeMB = 5,
}: {
  value?: string
  onChange: (url: string) => void
  bucket?: string
  folder?: string
  label?: string
  maxSizeMB?: number
}) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(value || null)
  const [error, setError] = useState<string | null>(null)

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file")
      return
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxSizeMB) {
      setError(`File size must be less than ${maxSizeMB}MB`)
      return
    }

    setUploading(true)
    try {
      const supabase = createClient()

      // Generate unique filename
      const fileExt = file.name.split(".").pop()
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(fileName)

      setPreview(publicUrl)
      onChange(publicUrl) // Update form field
    } catch (err) {
      console.error("Upload error:", err)
      setError(err instanceof Error ? err.message : "Failed to upload image")
    } finally {
      setUploading(false)
    }
  }

  function handleRemove() {
    setPreview(null)
    onChange("")
  }

  return (
    <div className="space-y-4">
      <Label htmlFor="image-upload">{label}</Label>

      {preview ? (
        <div className="space-y-2">
          <div className="relative h-48 w-48 overflow-hidden rounded-lg border">
            <Image src={preview} alt="Preview" fill className="object-cover" />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemove}
            disabled={uploading}
          >
            <X className="mr-2 h-4 w-4" />
            Remove Image
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="relative">
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="cursor-pointer"
            />
          </div>
          {uploading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Upload className="h-4 w-4 animate-pulse" />
              Uploading...
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <p className="text-xs text-muted-foreground">
        Recommended: Images under {maxSizeMB}MB in JPG, PNG, or WebP format
      </p>
    </div>
  )
}

/**
 * Alternative: ImageUploadWithCrop
 *
 * For applications that need image cropping before upload,
 * consider using react-image-crop or react-easy-crop:
 *
 * npm install react-easy-crop
 *
 * Then implement a cropping UI before calling handleImageUpload
 */
