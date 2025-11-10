# WorldCrafter Feature Builder v2.0 - Quick Start Guide

This guide helps you quickly implement advanced entity features in your WorldCrafter application.

## Table of Contents

1. [Multi-Step Character Wizard](#multi-step-character-wizard)
2. [Add Image Upload](#add-image-upload)
3. [Add Custom Attributes](#add-custom-attributes)
4. [Add Markdown Editor](#add-markdown-editor)
5. [Add Relationship Management](#add-relationship-management)
6. [Complete Example](#complete-example)

---

## Multi-Step Character Wizard

**When to use:** Complex entity creation that would overwhelm users in a single form.

### Quick Setup

1. **Copy the template:**
   ```
   .claude/skills/worldcrafter-feature-builder/assets/templates/multi-step-wizard.tsx
   → src/app/characters/new/page.tsx
   ```

2. **Customize steps:**
   ```typescript
   type WizardStep = "basics" | "appearance" | "personality" | "backstory" | "attributes"
   ```

3. **Update step schemas:**
   ```typescript
   const stepSchemas = {
     basics: z.object({ name: z.string().min(1), age: z.number() }),
     appearance: z.object({ height: z.string(), build: z.enum([...]) }),
     // ... etc
   }
   ```

4. **Connect to Server Action:**
   ```typescript
   import { createCharacter } from "./actions"

   // In final step submission:
   const result = await createCharacter(updatedData)
   ```

### Key Customization Points

- **Number of steps:** Modify the `steps` array
- **Step names:** Update `WizardStep` type
- **Validation:** Modify `stepSchemas` object
- **UI:** Customize step components (BasicsStep, AppearanceStep, etc.)

---

## Add Image Upload

**When to use:** Entity images (character portraits, location maps, item icons).

### Quick Setup

1. **Create Supabase Storage bucket:**
   - Go to Supabase Dashboard → Storage
   - Create new bucket: `entity-images`
   - Set to public or configure RLS

2. **Copy the component:**
   ```
   .claude/skills/worldcrafter-feature-builder/assets/templates/image-upload.tsx
   → src/components/image-upload.tsx
   ```

3. **Use in your form:**
   ```typescript
   import { ImageUpload } from "@/components/image-upload"

   <FormField
     control={form.control}
     name="imageUrl"
     render={({ field }) => (
       <FormItem>
         <ImageUpload
           value={field.value}
           onChange={field.onChange}
           folder="characters"
         />
         <FormMessage />
       </FormItem>
     )}
   />
   ```

4. **Add to schema:**
   ```typescript
   export const characterSchema = z.object({
     name: z.string().min(1),
     imageUrl: z.string().url().optional(),
   })
   ```

### Storage Configuration

**Public bucket (simplest):**
- No additional RLS needed
- All images publicly accessible

**Authenticated uploads (recommended):**
```sql
-- Allow authenticated users to upload
CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'entity-images');

-- Public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'entity-images');
```

---

## Add Custom Attributes

**When to use:** Dynamic fields that change based on context (e.g., genre-specific character stats).

### Quick Setup

1. **Update Prisma schema:**
   ```prisma
   model Character {
     id         String   @id @default(uuid())
     name       String
     worldId    String
     world      World    @relation(fields: [worldId], references: [id])
     attributes Json?    // Custom fields based on world genre

     @@map("characters")
   }

   model World {
     id     String @id @default(uuid())
     genre  String // "fantasy", "scifi", "modern", etc.

     @@map("worlds")
   }
   ```

2. **Run migration:**
   ```bash
   npx prisma migrate dev --name add_character_attributes
   ```

3. **Copy the template:**
   ```
   .claude/skills/worldcrafter-feature-builder/assets/templates/custom-attributes.tsx
   → src/app/characters/new/page.tsx
   ```

4. **Customize genre schemas:**
   ```typescript
   export const fantasyAttributesSchema = z.object({
     manaPoints: z.number().min(0).max(100),
     magicSchool: z.enum(["fire", "water", "earth", "air"]),
   })

   export const scifiAttributesSchema = z.object({
     techLevel: z.number().min(1).max(10),
     faction: z.string(),
   })
   ```

5. **Add validation in Server Action:**
   ```typescript
   export async function createCharacter(values: any) {
     const validated = characterSchema.parse(values)

     // Fetch world to validate attributes
     const world = await prisma.world.findUnique({
       where: { id: validated.worldId }
     })

     // Validate genre-specific attributes
     if (world.genre === "fantasy" && validated.attributes) {
       fantasyAttributesSchema.parse(validated.attributes)
     }

     return await prisma.character.create({ data: validated })
   }
   ```

---

## Add Markdown Editor

**When to use:** Long-form text fields (backstories, descriptions, lore).

### Quick Setup

1. **Install dependency:**
   ```bash
   npm install @uiw/react-md-editor
   ```

2. **Copy the component:**
   ```
   .claude/skills/worldcrafter-feature-builder/assets/templates/markdown-editor.tsx
   → src/components/markdown-field.tsx
   ```

3. **Use in your form:**
   ```typescript
   import { MarkdownField } from "@/components/markdown-field"

   <FormField
     control={form.control}
     name="backstory"
     render={({ field }) => (
       <FormItem>
         <MarkdownField
           value={field.value}
           onChange={field.onChange}
           label="Backstory"
           height={400}
           preview="live"
         />
         <FormDescription>
           Use Markdown formatting for rich text
         </FormDescription>
         <FormMessage />
       </FormItem>
     )}
   />
   ```

4. **Add to schema:**
   ```typescript
   export const characterSchema = z.object({
     name: z.string().min(1),
     backstory: z.string().optional(),
   })
   ```

5. **Display rendered markdown:**
   ```typescript
   import { MarkdownPreview } from "@/components/markdown-field"

   <MarkdownPreview content={character.backstory} />
   ```

### Preview Modes

- `edit` - Split view with editor and preview side-by-side
- `live` - Editor with live preview below
- `preview` - Preview only (read-only)

---

## Add Relationship Management

**When to use:** Connections between entities (character relationships, location hierarchies).

### Quick Setup

1. **Update Prisma schema:**
   ```prisma
   model CharacterRelationship {
     id               String   @id @default(uuid())
     fromCharacterId  String
     toCharacterId    String
     relationshipType String
     description      String?

     fromCharacter Character @relation("RelationshipsFrom", fields: [fromCharacterId], references: [id], onDelete: Cascade)
     toCharacter   Character @relation("RelationshipsTo", fields: [toCharacterId], references: [id], onDelete: Cascade)

     @@map("character_relationships")
   }

   model Character {
     id                String                    @id @default(uuid())
     name              String
     relationshipsFrom CharacterRelationship[]   @relation("RelationshipsFrom")
     relationshipsTo   CharacterRelationship[]   @relation("RelationshipsTo")

     @@map("characters")
   }
   ```

2. **Run migration:**
   ```bash
   npx prisma migrate dev --name add_character_relationships
   ```

3. **Copy the component:**
   ```
   .claude/skills/worldcrafter-feature-builder/assets/templates/relationships-panel.tsx
   → src/components/relationships-panel.tsx
   ```

4. **Create Server Actions:**
   ```typescript
   // src/app/characters/[id]/actions.ts
   "use server"

   import { revalidatePath } from "next/cache"
   import { prisma } from "@/lib/prisma"
   import { createClient } from "@/lib/supabase/server"

   export async function addRelationship(values: any) {
     const supabase = await createClient()
     const { data: { user } } = await supabase.auth.getUser()
     if (!user) return { success: false, error: "Unauthorized" }

     // Verify ownership
     const character = await prisma.character.findUnique({
       where: { id: values.fromCharacterId },
       select: { userId: true }
     })

     if (!character || character.userId !== user.id) {
       return { success: false, error: "Forbidden" }
     }

     const relationship = await prisma.characterRelationship.create({
       data: values
     })

     revalidatePath(`/characters/${values.fromCharacterId}`)
     return { success: true, data: relationship }
   }

   export async function removeRelationship(id: string) {
     // ... similar pattern
   }
   ```

5. **Use in character detail page:**
   ```typescript
   import { RelationshipsPanel } from "@/components/relationships-panel"

   export default async function CharacterPage({ params }) {
     const character = await prisma.character.findUnique({
       where: { id: params.id },
       include: {
         relationshipsFrom: {
           include: { toCharacter: true }
         }
       }
     })

     return (
       <div>
         <h1>{character.name}</h1>
         <RelationshipsPanel
           characterId={character.id}
           relationships={character.relationshipsFrom}
         />
       </div>
     )
   }
   ```

---

## Complete Example

Putting it all together for a full character creation wizard:

### File Structure

```
src/
├── app/
│   └── characters/
│       ├── new/
│       │   ├── page.tsx          # Multi-step wizard
│       │   └── actions.ts        # Server Actions
│       └── [id]/
│           ├── page.tsx          # Character detail with relationships
│           └── actions.ts        # Relationship Server Actions
├── components/
│   ├── image-upload.tsx          # Image upload component
│   ├── markdown-field.tsx        # Markdown editor
│   └── relationships-panel.tsx   # Relationships UI
└── lib/
    └── schemas/
        └── character.ts          # Validation schemas

prisma/
└── schema.prisma                 # Database models
```

### 1. Database Schema

```prisma
model Character {
  id                String                    @id @default(uuid())
  name              String
  age               Int?
  imageUrl          String?
  backstory         String?
  worldId           String
  world             World                     @relation(fields: [worldId], references: [id])
  attributes        Json?
  userId            String
  createdAt         DateTime                  @default(now())
  updatedAt         DateTime                  @updatedAt

  relationshipsFrom CharacterRelationship[]   @relation("RelationshipsFrom")
  relationshipsTo   CharacterRelationship[]   @relation("RelationshipsTo")

  @@map("characters")
}

model CharacterRelationship {
  id               String    @id @default(uuid())
  fromCharacterId  String
  toCharacterId    String
  relationshipType String
  description      String?
  createdAt        DateTime  @default(now())

  fromCharacter Character @relation("RelationshipsFrom", fields: [fromCharacterId], references: [id], onDelete: Cascade)
  toCharacter   Character @relation("RelationshipsTo", fields: [toCharacterId], references: [id], onDelete: Cascade)

  @@map("character_relationships")
}

model World {
  id         String      @id @default(uuid())
  name       String
  genre      String
  characters Character[]

  @@map("worlds")
}
```

### 2. Validation Schemas

```typescript
// src/lib/schemas/character.ts
import { z } from "zod"

export const characterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.number().min(0).optional(),
  imageUrl: z.string().url().optional(),
  backstory: z.string().optional(),
  worldId: z.string().uuid(),
  attributes: z.record(z.any()).optional(),
})

export type CharacterFormValues = z.infer<typeof characterSchema>
```

### 3. Character Creation Wizard

```typescript
// src/app/characters/new/page.tsx
"use client"

import { useState } from "react"
import { MultiStepWizard } from "@/components/multi-step-wizard"
import { ImageUpload } from "@/components/image-upload"
import { MarkdownField } from "@/components/markdown-field"
import { createCharacter } from "./actions"

export default function NewCharacterPage({ searchParams }) {
  const worldId = searchParams.worldId

  // ... wizard implementation with all advanced features
}
```

### 4. Character Detail Page with Relationships

```typescript
// src/app/characters/[id]/page.tsx
import { prisma } from "@/lib/prisma"
import { RelationshipsPanel } from "@/components/relationships-panel"
import { MarkdownPreview } from "@/components/markdown-field"

export default async function CharacterPage({ params }) {
  const character = await prisma.character.findUnique({
    where: { id: params.id },
    include: {
      world: true,
      relationshipsFrom: {
        include: { toCharacter: true }
      }
    }
  })

  return (
    <div>
      {character.imageUrl && (
        <img src={character.imageUrl} alt={character.name} />
      )}
      <h1>{character.name}</h1>

      {character.backstory && (
        <MarkdownPreview content={character.backstory} />
      )}

      <RelationshipsPanel
        characterId={character.id}
        relationships={character.relationshipsFrom}
      />
    </div>
  )
}
```

---

## Next Steps

1. **Read the comprehensive guide:** `references/advanced-features-guide.md`
2. **Review templates:** Browse `assets/templates/` for complete examples
3. **Check testing guide:** Ensure proper test coverage for new features
4. **Explore combinations:** Mix and match patterns for your use case

## Need Help?

- Check `references/advanced-features-guide.md` for troubleshooting
- Review the changelog: `CHANGELOG.md`
- Examine template code for implementation details

## Performance Tips

- Use dynamic imports for heavy components (markdown editor)
- Implement pagination for large relationship lists
- Cache world/genre data to avoid repeated fetches
- Optimize images before upload (client-side resizing)
- Consider lazy loading for multi-step wizard steps
