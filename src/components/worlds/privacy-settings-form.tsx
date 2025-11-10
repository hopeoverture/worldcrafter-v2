"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Lock, Eye, Globe } from "lucide-react"
import { type World } from "@prisma/client"
import { updateWorld } from "@/app/worlds/actions"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"

const privacySchema = z.object({
  privacy: z.enum(["PRIVATE", "UNLISTED", "PUBLIC"]),
})

type PrivacyFormValues = z.infer<typeof privacySchema>

interface PrivacySettingsFormProps {
  world: World
}

const privacyOptions = [
  {
    value: "PRIVATE" as const,
    label: "Private",
    description: "Only you can see this world",
    icon: Lock,
  },
  {
    value: "UNLISTED" as const,
    label: "Unlisted",
    description: "Anyone with the link can view",
    icon: Eye,
  },
  {
    value: "PUBLIC" as const,
    label: "Public",
    description: "Visible to everyone and searchable",
    icon: Globe,
  },
]

export function PrivacySettingsForm({ world }: PrivacySettingsFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<PrivacyFormValues>({
    resolver: zodResolver(privacySchema),
    defaultValues: {
      privacy: world.privacy,
    },
  })

  const selectedPrivacy = form.watch("privacy")
  const hasChanges = selectedPrivacy !== world.privacy

  async function onSubmit(values: PrivacyFormValues) {
    if (!hasChanges) {
      toast.info("No changes to save")
      return
    }

    setIsSubmitting(true)

    try {
      const result = await updateWorld(world.id, {
        name: world.name,
        genre: world.genre,
        description: world.description,
        setting: world.setting,
        metadata: world.metadata as Record<string, unknown> | null,
        coverUrl: world.coverUrl,
        privacy: values.privacy,
      })

      if (result.success) {
        toast.success("Privacy settings updated")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to update privacy settings")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
      console.error("Update privacy error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <RadioGroup
        value={selectedPrivacy}
        onValueChange={(value) =>
          form.setValue("privacy", value as PrivacyFormValues["privacy"], {
            shouldDirty: true,
          })
        }
        className="space-y-3"
      >
        {privacyOptions.map((option) => {
          const Icon = option.icon
          return (
            <div
              key={option.value}
              className={`flex items-start space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedPrivacy === option.value
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted/50"
              }`}
              onClick={() =>
                form.setValue("privacy", option.value, { shouldDirty: true })
              }
            >
              <RadioGroupItem value={option.value} id={option.value} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4" />
                  <Label
                    htmlFor={option.value}
                    className="font-medium cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  {option.description}
                </p>
              </div>
            </div>
          )
        })}
      </RadioGroup>

      <div className="flex justify-end">
        <Button type="submit" disabled={!hasChanges || isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  )
}
