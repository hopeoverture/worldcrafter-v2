"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { featureSchema, type FeatureFormValues } from "@/lib/schemas/feature"
import { submitFeature } from "./actions"
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

export default function FeaturePage() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FeatureFormValues>({
    resolver: zodResolver(featureSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  })

  async function onSubmit(values: FeatureFormValues) {
    setIsSubmitting(true)
    try {
      const result = await submitFeature(values)

      if (result.success) {
        form.reset()
        // TODO: Show success message (toast, alert, etc.)
        console.log("Success:", result.data)
      } else {
        // Set form-level error
        form.setError("root", { message: result.error })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <h1 className="mb-6 text-3xl font-bold">Feature Name</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter title" {...field} />
                </FormControl>
                <FormDescription>
                  A descriptive title for your item
                </FormDescription>
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
                    placeholder="Enter description"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Optional description with more details
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={isSubmitting}
            >
              Reset
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
