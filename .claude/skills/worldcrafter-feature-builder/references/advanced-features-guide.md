# Advanced Entity Features Guide

This guide covers sophisticated patterns for building complex entity creation and management workflows in WorldCrafter applications.

## Table of Contents

1. [Multi-Step Form Wizards](#multi-step-form-wizards)
2. [Image Upload Integration](#image-upload-integration)
3. [Custom JSON Attributes](#custom-json-attributes)
4. [Markdown Editor Integration](#markdown-editor-integration)
5. [Relationship Management](#relationship-management)
6. [Combining Patterns](#combining-patterns)

## Multi-Step Form Wizards

Use multi-step wizards for complex entity creation flows that would overwhelm users in a single form.

### When to Use

- Character creators with multiple attribute categories
- Location builders with hierarchical data
- Item editors with technical specifications
- World setup wizards
- Onboarding flows

### Implementation Pattern

**Step 1: Define Step Types and Schemas**

```typescript
type WizardStep = "basics" | "details" | "advanced"

const stepSchemas = {
  basics: z.object({ name: z.string().min(1) }),
  details: z.object({ description: z.string() }),
  advanced: z.object({ attributes: z.record(z.any()) }),
}
```

**Step 2: State Management**

```typescript
const [currentStep, setCurrentStep] = useState<WizardStep>("basics")
const [formData, setFormData] = useState({})

const steps: WizardStep[] = ["basics", "details", "advanced"]
const currentIndex = steps.indexOf(currentStep)
const progress = ((currentIndex + 1) / steps.length) * 100
```

**Step 3: Navigation Logic**

```typescript
async function handleNext(values: any) {
  const updatedData = { ...formData, ...values }
  setFormData(updatedData)

  if (currentIndex < steps.length - 1) {
    setCurrentStep(steps[currentIndex + 1])
    form.reset(updatedData)
  } else {
    // Final step - submit
    await submitEntity(updatedData)
  }
}
```

### Best Practices

- **Validate each step independently** - Use step-specific Zod schemas
- **Preserve data between steps** - Accumulate in state
- **Show clear progress** - Visual progress bar with step labels
- **Allow backward navigation** - Users should be able to review/edit previous steps
- **Persist on navigation** - Don't lose data when users navigate away
- **Final validation** - Re-validate all data on final submission

### Template

See `assets/templates/multi-step-wizard.tsx` for complete implementation.

## Image Upload Integration

Integrate Supabase Storage for entity images (portraits, maps, icons).

### Setup

**1. Create Storage Bucket**

In Supabase Dashboard:
- Go to Storage → Create new bucket
- Name: `entity-images`
- Public or with RLS policies

**2. Configure Bucket Policies (Optional)**

```sql
-- Allow authenticated users to upload to their folders
CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'entity-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'entity-images');
```

### Implementation Pattern

**Component Structure**

```typescript
export function ImageUpload({
  value,      // Current image URL
  onChange,   // Callback with new URL
  bucket,     // Storage bucket name
  folder,     // Subfolder for organization
}) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(value)

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type and size
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file")
      return
    }

    const supabase = createClient()

    // Upload to Supabase Storage
    const fileName = `${folder}/${Date.now()}-${Math.random()}.${ext}`
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file)

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    onChange(publicUrl)
  }
}
```

### Best Practices

- **Validate file types** - Accept only images
- **Limit file sizes** - Enforce reasonable limits (e.g., 5MB)
- **Generate unique filenames** - Prevent collisions with timestamp + random
- **Show preview** - Display uploaded image immediately
- **Handle errors gracefully** - User-friendly error messages
- **Organize by folder** - Use subfolders: `characters/`, `locations/`, etc.
- **Cleanup old images** - Consider lifecycle policies or manual cleanup

### Template

See `assets/templates/image-upload.tsx` for complete implementation.

## Custom JSON Attributes

Store dynamic, genre-specific fields in JSON columns for flexible entity attributes.

### When to Use

- Genre-specific character stats (mana for fantasy, tech level for sci-fi)
- Custom metadata that varies by entity type
- User-defined fields
- Extensible attribute systems
- A/B testing new fields

### Database Schema

```prisma
model Character {
  id         String   @id @default(uuid())
  name       String
  worldId    String
  world      World    @relation(fields: [worldId], references: [id])
  attributes Json?    // Dynamic attributes based on world genre

  @@map("characters")
}

model World {
  id     String @id @default(uuid())
  genre  String // "fantasy", "scifi", "modern", etc.

  @@map("worlds")
}
```

### Validation Pattern

**Define genre-specific schemas:**

```typescript
const fantasyAttributesSchema = z.object({
  manaPoints: z.number().min(0).max(100),
  magicSchool: z.enum(["fire", "water", "earth", "air"]),
  spellSlots: z.number().min(0),
})

const scifiAttributesSchema = z.object({
  techLevel: z.number().min(1).max(10),
  faction: z.string(),
  cybernetics: z.array(z.string()),
})
```

**Server-side validation:**

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
  } else if (world.genre === "scifi" && validated.attributes) {
    scifiAttributesSchema.parse(validated.attributes)
  }

  // Create character
  return await prisma.character.create({ data: validated })
}
```

### Dynamic Form Rendering

```typescript
function renderAttributeFields() {
  switch (world?.genre) {
    case "fantasy":
      return <FantasyAttributes form={form} />
    case "scifi":
      return <SciFiAttributes form={form} />
    default:
      return null
  }
}
```

### Best Practices

- **Always validate on server** - Don't trust client-side validation alone
- **Provide defaults** - Sensible defaults for optional fields
- **Document structure** - Clear comments on expected JSON shape
- **Consider typing** - Use TypeScript for attribute types
- **Migration strategy** - Plan for schema evolution
- **Query carefully** - JSON queries can be slow; consider indexing

### Template

See `assets/templates/custom-attributes.tsx` for complete implementation.

## Markdown Editor Integration

Provide rich text editing for long-form content like backstories and lore.

### Installation

```bash
npm install @uiw/react-md-editor
```

### Implementation Pattern

```typescript
import dynamic from "next/dynamic"
import "@uiw/react-md-editor/markdown-editor.css"
import "@uiw/react-markdown-preview/markdown.css"

const MDEditor = dynamic(
  () => import("@uiw/react-md-editor"),
  { ssr: false }  // Important: Disable SSR
)

export function MarkdownField({ value, onChange, label, height = 300 }) {
  return (
    <div className="space-y-2">
      <label>{label}</label>
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || "")}
        height={height}
        preview="edit"  // "edit" | "live" | "preview"
      />
    </div>
  )
}
```

### Preview Modes

- **`edit`** - Split view with editor and preview side-by-side
- **`live`** - Editor with live preview below
- **`preview`** - Preview only (read-only)

### Display Rendered Markdown

```typescript
import ReactMarkdown from "react-markdown"

export function CharacterDetail({ character }) {
  return (
    <div className="prose dark:prose-invert">
      <ReactMarkdown>{character.backstory}</ReactMarkdown>
    </div>
  )
}
```

### Best Practices

- **Dynamic import** - Use `dynamic()` to avoid SSR issues
- **Dark mode support** - Use `data-color-mode` attribute
- **Height control** - Adjust editor height based on content
- **Placeholder text** - Guide users with helpful placeholders
- **Include cheat sheet** - Show common Markdown syntax
- **Store as plain text** - Keep original Markdown in database
- **Sanitize output** - Use safe Markdown libraries for rendering

### Template

See `assets/templates/markdown-editor.tsx` for complete implementation.

## Relationship Management

Create and manage connections between entities (character relationships, location hierarchies).

### Database Schema

```prisma
model CharacterRelationship {
  id               String   @id @default(uuid())
  fromCharacterId  String
  toCharacterId    String
  relationshipType String   // "friend", "enemy", "family", etc.
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

### UI Components

**1. Relationships Panel**
- List of existing relationships
- Add/Remove buttons
- Relationship type badges

**2. Add Relationship Modal**
- Character selector (exclude current character)
- Relationship type dropdown
- Optional description field

**3. Relationship Cards**
- Display related character name
- Show relationship type
- Include description if provided
- Remove button

### Implementation Pattern

```typescript
export function RelationshipsPanel({ characterId, relationships }) {
  const [isAddingRelationship, setIsAddingRelationship] = useState(false)

  return (
    <div>
      <Button onClick={() => setIsAddingRelationship(true)}>
        Add Relationship
      </Button>

      {relationships.map(rel => (
        <RelationshipCard
          key={rel.id}
          relationship={rel}
          onRemove={handleRemove}
        />
      ))}

      <AddRelationshipModal
        open={isAddingRelationship}
        onClose={() => setIsAddingRelationship(false)}
        characterId={characterId}
      />
    </div>
  )
}
```

### Server Actions

```typescript
export async function addRelationship(values: any) {
  const validated = relationshipSchema.parse(values)

  // Verify user owns the character
  const character = await prisma.character.findUnique({
    where: { id: validated.fromCharacterId },
    select: { userId: true }
  })

  if (!character || character.userId !== user.id) {
    return { success: false, error: "Forbidden" }
  }

  const relationship = await prisma.characterRelationship.create({
    data: validated
  })

  revalidatePath(`/characters/${validated.fromCharacterId}`)
  return { success: true, data: relationship }
}
```

### Relationship Types

Common relationship types to consider:

**Social:**
- Friend
- Enemy
- Rival
- Acquaintance

**Family:**
- Parent
- Child
- Sibling
- Spouse

**Professional:**
- Mentor
- Apprentice
- Colleague
- Employer/Employee

**Romantic:**
- Lover
- Ex-partner
- Crush

**Hierarchical:**
- Leader
- Follower
- Ally
- Subordinate

### Best Practices

- **Bidirectional vs Unidirectional** - Consider if relationships are mutual
- **Cascade deletes** - Use `onDelete: Cascade` to clean up orphaned relationships
- **Authorization** - Verify user owns both characters
- **Prevent self-relationships** - Validate `fromCharacterId !== toCharacterId`
- **Relationship constraints** - Prevent duplicate relationships
- **Rich descriptions** - Allow users to add context
- **Visual representation** - Consider graph visualizations for complex networks

### Template

See `assets/templates/relationships-panel.tsx` for complete implementation.

## Combining Patterns

Advanced applications often combine multiple patterns for sophisticated entity workflows.

### Example: Complete Character Creator

**Wizard Steps:**
1. **Basics** - Name, age, occupation (standard form)
2. **Appearance** - Height, build, image upload
3. **Personality** - Traits, alignment (genre-specific attributes)
4. **Backstory** - Markdown editor for rich text
5. **Relationships** - Add initial relationships
6. **Review** - Summary of all data before submission

**Implementation:**

```typescript
export default function CompleteCharacterWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>("basics")
  const [formData, setFormData] = useState<Partial<CharacterData>>({})

  return (
    <MultiStepWizard
      steps={["basics", "appearance", "personality", "backstory", "relationships", "review"]}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
    >
      {currentStep === "basics" && (
        <BasicsStep form={form} />
      )}
      {currentStep === "appearance" && (
        <AppearanceStep
          form={form}
          renderImageUpload={() => (
            <ImageUpload
              value={formData.imageUrl}
              onChange={(url) => setFormData({ ...formData, imageUrl: url })}
            />
          )}
        />
      )}
      {currentStep === "personality" && (
        <PersonalityStep
          form={form}
          renderCustomAttributes={() => (
            <CustomAttributes world={world} form={form} />
          )}
        />
      )}
      {currentStep === "backstory" && (
        <BackstoryStep
          form={form}
          renderMarkdownEditor={() => (
            <MarkdownField
              value={formData.backstory}
              onChange={(value) => setFormData({ ...formData, backstory: value })}
              label="Backstory"
            />
          )}
        />
      )}
      {currentStep === "relationships" && (
        <RelationshipsStep
          characterId={formData.id}
          relationships={formData.relationships || []}
        />
      )}
      {currentStep === "review" && (
        <ReviewStep data={formData} />
      )}
    </MultiStepWizard>
  )
}
```

### Integration Checklist

When combining patterns, ensure:

- [ ] Form state is properly accumulated across steps
- [ ] Validation occurs at each step and final submission
- [ ] Image uploads complete before final submission
- [ ] Custom attributes are validated based on context
- [ ] Markdown content is properly sanitized
- [ ] Relationships are created after main entity
- [ ] Error handling covers all integration points
- [ ] Loading states prevent race conditions
- [ ] Success flows redirect appropriately
- [ ] All data is persisted or discarded correctly

### Performance Considerations

- **Code splitting** - Use dynamic imports for heavy components
- **Lazy loading** - Load images and data as needed
- **Optimistic updates** - Update UI before server confirmation
- **Debouncing** - For auto-save or search features
- **Caching** - Cache fetched data (world info, character lists)
- **Progressive enhancement** - Ensure basic functionality without JavaScript

### Testing Strategy

**Unit Tests:**
- Form validation logic
- State management
- Helper functions

**Integration Tests:**
- Step transitions
- Data accumulation
- Server Action calls

**E2E Tests:**
- Complete wizard flow
- Image upload integration
- Relationship creation
- Error scenarios

## Additional Resources

- [Feature Patterns](./feature-patterns.md) - Core architectural patterns
- [Testing Guide](./testing-guide.md) - Testing strategies and examples
- [Related Skills](./related-skills.md) - How this skill works with other WorldCrafter skills
- [Templates](../assets/templates/) - Complete code templates

## Troubleshooting

### Common Issues

**Multi-Step Wizard:**
- Form data not persisting between steps → Check state accumulation logic
- Validation failing → Ensure each step has correct schema
- Progress bar incorrect → Verify step index calculation

**Image Upload:**
- Upload fails → Check bucket permissions and CORS settings
- Images not displaying → Verify public URL generation
- File too large → Implement file size validation

**Custom Attributes:**
- Attributes not saving → Check JSON column in database schema
- Validation errors → Ensure genre-specific schemas match
- Fields not rendering → Verify world genre data is loaded

**Markdown Editor:**
- SSR errors → Use `dynamic()` with `ssr: false`
- Styling issues → Import required CSS files
- Dark mode broken → Check `data-color-mode` attribute

**Relationships:**
- Self-relationships created → Add validation to prevent
- Duplicate relationships → Add unique constraint in database
- Orphaned relationships → Use `onDelete: Cascade`
