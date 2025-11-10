"use client"

import { useState } from "react"
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

// Define step type
type WizardStep = "basics" | "appearance" | "personality" | "backstory" | "attributes"

// Schemas for each step
const basicsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.number().min(0).max(999),
  occupation: z.string().optional(),
})

const appearanceSchema = z.object({
  height: z.string().optional(),
  build: z.enum(["slim", "average", "muscular", "heavy"]).optional(),
  hairColor: z.string().optional(),
  eyeColor: z.string().optional(),
})

const personalitySchema = z.object({
  traits: z.array(z.string()).optional(),
  alignment: z.enum(["good", "neutral", "evil"]).optional(),
  motivation: z.string().optional(),
})

const backstorySchema = z.object({
  background: z.string().optional(),
  history: z.string().optional(),
})

const attributesSchema = z.object({
  strength: z.number().min(0).max(20).default(10),
  dexterity: z.number().min(0).max(20).default(10),
  intelligence: z.number().min(0).max(20).default(10),
  wisdom: z.number().min(0).max(20).default(10),
})

// Map steps to schemas
const stepSchemas = {
  basics: basicsSchema,
  appearance: appearanceSchema,
  personality: personalitySchema,
  backstory: backstorySchema,
  attributes: attributesSchema,
}

// Combined type for all form data
type FormData = z.infer<typeof basicsSchema> &
  z.infer<typeof appearanceSchema> &
  z.infer<typeof personalitySchema> &
  z.infer<typeof backstorySchema> &
  z.infer<typeof attributesSchema>

export default function MultiStepWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>("basics")
  const [formData, setFormData] = useState<Partial<FormData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const steps: WizardStep[] = ["basics", "appearance", "personality", "backstory", "attributes"]
  const currentIndex = steps.indexOf(currentStep)
  const progress = ((currentIndex + 1) / steps.length) * 100

  const form = useForm({
    resolver: zodResolver(stepSchemas[currentStep]),
    defaultValues: formData,
  })

  async function handleNext(values: any) {
    // Merge values into accumulated form data
    const updatedData = { ...formData, ...values }
    setFormData(updatedData)

    if (currentIndex < steps.length - 1) {
      // Move to next step
      setCurrentStep(steps[currentIndex + 1])
      form.reset(updatedData) // Reset with accumulated data
    } else {
      // Final step - submit all data
      setIsSubmitting(true)
      try {
        // TODO: Replace with your Server Action
        const result = await submitCharacter(updatedData)

        if (result.success) {
          console.log("Success:", result.data)
          // TODO: Redirect or show success message
        } else {
          form.setError("root", { message: result.error })
        }
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  function handleBack() {
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
      form.reset(formData) // Reset to accumulated data
    }
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <h1 className="mb-6 text-3xl font-bold">Character Wizard</h1>

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="mb-2 flex justify-between">
          {steps.map((step, i) => (
            <div
              key={step}
              className={`text-sm capitalize ${
                i <= currentIndex ? "text-primary font-semibold" : "text-muted-foreground"
              }`}
            >
              {step}
            </div>
          ))}
        </div>
        <div className="h-2 w-full rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleNext)} className="space-y-6">
          {currentStep === "basics" && <BasicsStep form={form} />}
          {currentStep === "appearance" && <AppearanceStep form={form} />}
          {currentStep === "personality" && <PersonalityStep form={form} />}
          {currentStep === "backstory" && <BackstoryStep form={form} />}
          {currentStep === "attributes" && <AttributesStep form={form} />}

          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentIndex === 0 || isSubmitting}
            >
              Back
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : currentIndex === steps.length - 1
                ? "Save Character"
                : "Next"}
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

// Step Components

function BasicsStep({ form }: { form: any }) {
  return (
    <>
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
        name="age"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Age</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="Enter age"
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
        name="occupation"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Occupation</FormLabel>
            <FormControl>
              <Input placeholder="Enter occupation" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}

function AppearanceStep({ form }: { form: any }) {
  return (
    <>
      <FormField
        control={form.control}
        name="height"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Height</FormLabel>
            <FormControl>
              <Input placeholder="e.g., 5'10\"" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="build"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Build</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select build" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="slim">Slim</SelectItem>
                <SelectItem value="average">Average</SelectItem>
                <SelectItem value="muscular">Muscular</SelectItem>
                <SelectItem value="heavy">Heavy</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="hairColor"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Hair Color</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Brown" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="eyeColor"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Eye Color</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Blue" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}

function PersonalityStep({ form }: { form: any }) {
  return (
    <>
      <FormField
        control={form.control}
        name="alignment"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Alignment</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select alignment" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="evil">Evil</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="motivation"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Motivation</FormLabel>
            <FormControl>
              <Textarea
                placeholder="What drives this character?"
                className="min-h-[100px]"
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

function BackstoryStep({ form }: { form: any }) {
  return (
    <>
      <FormField
        control={form.control}
        name="background"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Background</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Noble, Commoner, Exile" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="history"
        render={({ field }) => (
          <FormItem>
            <FormLabel>History</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe the character's backstory..."
                className="min-h-[150px]"
                {...field}
              />
            </FormControl>
            <FormDescription>
              Provide details about the character's past
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}

function AttributesStep({ form }: { form: any }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="strength"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Strength (0-20)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  max="20"
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
          name="dexterity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dexterity (0-20)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  max="20"
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
          name="intelligence"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Intelligence (0-20)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  max="20"
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
          name="wisdom"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Wisdom (0-20)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  max="20"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  )
}

// TODO: Replace with actual Server Action
async function submitCharacter(data: Partial<FormData>) {
  console.log("Submitting character:", data)
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000))
  return { success: true, data }
}
