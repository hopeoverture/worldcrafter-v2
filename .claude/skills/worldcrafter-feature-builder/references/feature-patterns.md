# WorldCrafter Feature Patterns

This document contains detailed architectural patterns and best practices for implementing features in WorldCrafter.

## Database Patterns

### Prisma Schema Conventions

**Naming**:
- Models: PascalCase (e.g., `User`, `BlogPost`)
- Fields: camelCase in model, snake_case in database
- Use `@@map("table_name")` for table names
- Use `@map("column_name")` for field names

**Example**:
```prisma
model BlogPost {
  id        String   @id @default(cuid())
  title     String
  content   String
  authorId  String   @map("author_id")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  author User @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@map("blog_posts")
}
```

**Relationships**:
- Use `@relation` with `fields` and `references`
- Always specify `onDelete` behavior: `Cascade`, `SetNull`, `Restrict`
- Use `@relation(name: "RelationName")` for disambiguation

**Common Field Types**:
```prisma
id        String   @id @default(cuid())        // Primary key
email     String   @unique                      // Unique constraint
isActive  Boolean  @default(true)               // Boolean with default
role      Role     @default(USER)               // Enum with default
metadata  Json?                                 // Optional JSON
createdAt DateTime @default(now())              // Auto timestamp
updatedAt DateTime @updatedAt                   // Auto-update timestamp
```

### Row-Level Security (RLS) Patterns

**Read Own Data**:
```sql
CREATE POLICY "Users can read own data"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);
```

**Update Own Data**:
```sql
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

**Insert Own Data**:
```sql
CREATE POLICY "Users can insert own data"
  ON public.blog_posts
  FOR INSERT
  WITH CHECK (auth.uid() = author_id);
```

**Delete Own Data**:
```sql
CREATE POLICY "Users can delete own posts"
  ON public.blog_posts
  FOR DELETE
  USING (auth.uid() = author_id);
```

**Public Read, Authenticated Write**:
```sql
-- Allow anyone to read
CREATE POLICY "Anyone can read posts"
  ON public.blog_posts
  FOR SELECT
  USING (true);

-- Only authenticated users can create
CREATE POLICY "Authenticated users can create posts"
  ON public.blog_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);
```

**Enable RLS**:
```sql
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;
```

### Migration Workflow

**Development** (quick iteration):
```bash
npx prisma db push
```

**Production** (with migration history):
```bash
# 1. Create migration
npx prisma migrate dev --name descriptive_name

# 2. Apply to production
npx prisma migrate deploy
```

**Adding RLS Policies**:
1. Create migration file in `prisma/migrations/<timestamp>_add_rls/migration.sql`
2. Add SQL for enabling RLS and creating policies
3. Run `npm run db:rls` to apply

## Server Actions Patterns

### Basic Server Action

```typescript
"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { schema } from "@/lib/schemas/feature"

export async function performAction(values: SchemaType) {
  try {
    const validated = schema.parse(values)
    const result = await prisma.model.create({ data: validated })
    revalidatePath("/route")
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: "Operation failed" }
  }
}
```

### Authenticated Server Action

```typescript
"use server"

export async function authenticatedAction(values: SchemaType) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  // Proceed with authenticated operation
  const result = await prisma.model.create({
    data: { ...values, userId: user.id }
  })

  return { success: true, data: result }
}
```

### Server Action with Validation

```typescript
"use server"

import { z } from "zod"

export async function validatedAction(values: unknown) {
  // Server-side validation
  const parseResult = schema.safeParse(values)

  if (!parseResult.success) {
    return {
      success: false,
      error: "Validation failed",
      errors: parseResult.error.flatten().fieldErrors
    }
  }

  // Proceed with validated data
  const result = await performOperation(parseResult.data)
  return { success: true, data: result }
}
```

### Server Action with Authorization

```typescript
"use server"

export async function updateResource(id: string, values: SchemaType) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  // Check if user owns the resource
  const resource = await prisma.resource.findUnique({
    where: { id },
    select: { userId: true }
  })

  if (!resource || resource.userId !== user.id) {
    return { success: false, error: "Forbidden" }
  }

  // User is authorized, proceed
  const result = await prisma.resource.update({
    where: { id },
    data: values
  })

  revalidatePath(`/resources/${id}`)
  return { success: true, data: result }
}
```

### Server Action with Transaction

```typescript
"use server"

export async function complexOperation(values: SchemaType) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const item1 = await tx.model1.create({ data: values.data1 })
      const item2 = await tx.model2.create({
        data: { ...values.data2, model1Id: item1.id }
      })
      return { item1, item2 }
    })

    revalidatePath("/route")
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: "Transaction failed" }
  }
}
```

## Client Component Patterns

### Form with React Hook Form

```typescript
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { schema, type SchemaType } from "@/lib/schemas/feature"
import { performAction } from "./actions"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

export default function FeatureForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<SchemaType>({
    resolver: zodResolver(schema),
    defaultValues: {
      field1: "",
      field2: "",
    }
  })

  async function onSubmit(values: SchemaType) {
    setIsSubmitting(true)
    try {
      const result = await performAction(values)

      if (result.success) {
        form.reset()
        // Show success message or redirect
      } else {
        // Show error message
        form.setError("root", { message: result.error })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="field1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Field 1</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>

        {form.formState.errors.root && (
          <p className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}
      </form>
    </Form>
  )
}
```

### Data Fetching with TanStack Query

```typescript
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchData, updateData } from "./actions"

export default function DataComponent() {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ["feature"],
    queryFn: () => fetchData(),
  })

  const mutation = useMutation({
    mutationFn: updateData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature"] })
    },
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error loading data</div>

  return (
    <div>
      {/* Render data */}
      <button onClick={() => mutation.mutate(newData)}>
        Update
      </button>
    </div>
  )
}
```

## Authentication Patterns

### Protect Server Component

```typescript
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function ProtectedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return <div>Protected content for {user.email}</div>
}
```

### Protect Client Component

```typescript
"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function ProtectedClient() {
  const [user, setUser] = useState(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
      } else {
        setUser(user)
      }
    }
    checkAuth()
  }, [])

  if (!user) return <div>Loading...</div>

  return <div>Protected content</div>
}
```

### Get User Profile

```typescript
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

export async function getUserProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get profile from database
  const profile = await prisma.user.findUnique({
    where: { id: user.id }
  })

  return profile
}
```

## Loading and Error States

### Loading State (Skeleton)

```typescript
export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-64 animate-pulse rounded bg-muted" />
      <div className="h-32 w-full animate-pulse rounded bg-muted" />
      <div className="h-10 w-32 animate-pulse rounded bg-muted" />
    </div>
  )
}
```

### Error Boundary

```typescript
"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="text-2xl font-bold">Something went wrong!</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <button onClick={reset} className="mt-4">
        Try again
      </button>
    </div>
  )
}
```

## Security Best Practices

### Input Validation

- Always validate on both client and server
- Use Zod schemas consistently
- Never trust client-side validation alone

### Authentication

- Check auth in Server Actions for mutations
- Use RLS policies as a second layer of defense
- Never expose user IDs in URLs for sensitive operations

### Authorization

- Verify resource ownership before updates/deletes
- Use RLS policies to enforce at database level
- Check permissions in Server Actions

### Data Exposure

- Only return necessary fields in responses
- Use Prisma `select` to limit fields
- Never expose passwords or sensitive tokens

### SQL Injection Prevention

- Always use Prisma parameterized queries
- Never construct raw SQL with user input
- If using raw queries, use `$queryRaw` with parameters
