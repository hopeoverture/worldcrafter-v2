# Phase 2 Core Features Implementation Plan

**Timeline:** 10 Weeks (Weeks 5-14 from project start)
**Effort:** 90-108 hours (9-11 hours/week, 1 full-time developer)
**Status:** 🚀 In Progress (27% Complete - includes Quick Wins)
**Last Updated:** January 2025
**Aligned with:** PRD v3.0

---

## Implementation Progress

**Overall:** 27% Complete (27/99 hours - includes 9h Quick Wins)

| Week           | Focus                 | Status          | Hours Complete | Hours Remaining |
| -------------- | --------------------- | --------------- | -------------- | --------------- |
| Week 1-2       | Character Management  | ✅ Complete     | 18/18          | 0               |
| Week 3         | Event Management      | Not Started     | 0/9            | 9               |
| Week 4         | Item Management       | Not Started     | 0/9            | 9               |
| Week 5         | Faction Management    | Not Started     | 0/9            | 9               |
| Week 6-7       | Relationships & Graph | Not Started     | 0/18           | 18              |
| Week 8         | Collaboration Basics  | Not Started     | 0/9            | 9               |
| Week 9         | Export & Polish       | Not Started     | 0/9            | 9               |
| Week 10        | Testing & Deployment  | Not Started     | 0/9            | 9               |
| **Quick Wins** | **UX Polish**         | **✅ Complete** | **9/9**        | **0**           |
| **TOTAL**      |                       | **27%**         | **27/99**      | **72**          |

**What's Complete:**

- ✅ **Phase 1 MVP** - Worlds, locations, search, auth (see `PHASE_1_IMPLEMENTATION_PLAN.md`)
- ✅ **Quick Wins (9 hours)** - Dashboard & UX improvements aligned with PRD v3.0:
  - Character count card on dashboard (2h)
  - Quick action buttons for Add Character, Browse Characters (2h)
  - Getting started empty state guide for new worlds (2h)
  - Breadcrumb navigation component (1h)
  - Activity feed filters by entity type (2h)
- ✅ **Week 1-2: Character Management (18 hours)**
  - Day 1-2: Character database schema, Server Actions, and integration tests (9 hours)
  - Day 3-4: Character Forms with multi-tab UI, markdown editors, and unit tests (6 hours)
  - Day 5: Character List & Detail with card/table views and filtering (3 hours)

**What's Next:**

- Week 3, Day 1-2: Event Schema & Server Actions (5 hours)

---

## Overview

Phase 2 delivers all core entity types (Characters, Events, Items, Factions) plus relationship management, collaboration features, and data export. This completes the foundational worldbuilding platform.

### Strategic Alignment with PRD v3.0

**Phase 2 Mission:** Complete core entity types and enable collaboration to position WorldCrafter as the leading world-building platform with:

**Target Metrics (from PRD v3.0):**

- **1,000+ signups** in first 3 months post-launch
- **500+ Monthly Active Users (MAU)**
- **40%+ D1 retention**, 25%+ D7 retention
- **NPS > 40**

**Key Differentiators We're Building:**

1. **Living Document System** - Auto-updating relationships between entities (no broken links)
2. **Data Freedom** - Export to JSON/Markdown at ALL tiers (never paywalled) - addresses "lock-in anxiety"
3. **Collaborative by Design** - Role-based access with player-safe views - addresses "collaboration friction"
4. **Clarity Over Features** - Progressive disclosure, empty states guide action - addresses "complexity fatigue"

**Competitive Positioning:**

- vs. **World Anvil/Kanka**: Cleaner UI, faster performance, generous free tier
- vs. **Notion/Obsidian**: Native world-building features, relationship graph, collaboration
- vs. **Scrivener/Campfire**: Better relationship tracking, modern UI, team features

### Functional Goals

- Users can create and manage all 5 entity types (Locations from Phase 1 + Characters, Events, Items, Factions)
- Users can define relationships between any entities with typed connections
- Users can visualize entity relationships as an interactive graph (key differentiator)
- Users can invite collaborators with role-based permissions (5 roles: Viewer → Owner)
- Users can export complete world data to JSON and Markdown (data portability commitment)
- 80%+ test coverage maintained (quality baseline)

### Success Metrics

**Acquisition:**

- 1,000+ total signups (first 3 months)
- 500+ Monthly Active Users (MAU)
- 200+ Weekly Active Users (WAU)

**Engagement:**

- Average session duration: 10+ minutes
- Actions per session: 5+ (create, edit, search, view)
- Worlds created per user: 1.5+ average
- Entities per world: 15+ average

**Feature Adoption:**

- 60%+ users create at least 1 character
- 40%+ users create relationships (graph visualization key)
- 30%+ users invite at least 1 collaborator
- 25%+ users export data at least once

**Quality:**

- Net Promoter Score (NPS): > 40
- Customer Satisfaction (CSAT): > 4.0/5
- Zero P0 bugs, < 10 P1 bugs at launch

### Key Dependencies from Phase 1

**Completed infrastructure we'll build on:**

- ✅ Authentication system (Supabase Auth)
- ✅ World management (CRUD, privacy, dashboard)
- ✅ Location management (hierarchical)
- ✅ RLS policies pattern established
- ✅ Server Actions pattern established
- ✅ Form components pattern (WorldForm, LocationForm)
- ✅ List components pattern (WorldsList, LocationsList)
- ✅ Testing infrastructure (Vitest, Playwright, factories)
- ✅ Activity logging system
- ✅ Search infrastructure (PostgreSQL tsvector)

---

## Week 1-2: Character Management (18 hours)

**Status:** 🔄 In Progress (83% Complete)
**Completed:** 15/18 hours
**Remaining:** 3 hours

### Day 1-2: Character Schema & Server Actions (9 hours) ✅ COMPLETE

**Tasks:**

1. Update Prisma schema with Character model
2. Create migration and apply RLS policies
3. Create Zod validation schemas
4. Implement 5 Server Actions (create, update, delete, get, list)
5. Create character test factory
6. Write integration tests (20+ tests)

**Prisma Model to Add:**

```prisma
model Character {
  id          String   @id @default(cuid())
  worldId     String
  name        String   @db.VarChar(100)
  slug        String
  role        String?  @db.VarChar(100)
  species     String?  @db.VarChar(100)
  age         String?  @db.VarChar(50)
  gender      String?  @db.VarChar(50)
  appearance  String?  @db.Text
  personality String?  @db.Text
  backstory   String?  @db.Text
  goals       String?  @db.Text
  fears       String?  @db.Text
  attributes  Json?
  imageUrl    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  world       World    @relation(fields: [worldId], references: [id], onDelete: Cascade)

  @@unique([worldId, slug])
  @@index([worldId, updatedAt])
  @@map("characters")
}
```

**Files to Create:**

- `prisma/migrations/xxx_add_characters.sql` - Add Character table
- `prisma/migrations/sql/004_character_rls.sql` - RLS policies for characters
- `src/lib/schemas/character.schema.ts` - Zod validation schemas
- `src/app/worlds/[slug]/characters/actions.ts` - Server Actions
- `src/test/factories/character.ts` - Character factory
- `src/app/__tests__/character-actions.integration.test.ts` - Integration tests

**Server Actions to Implement:**

```typescript
// src/app/worlds/[slug]/characters/actions.ts
"use server";

export async function createCharacter(
  worldId: string,
  data: CreateCharacterInput
): Promise<ActionResult<Character>>;
export async function updateCharacter(
  id: string,
  data: UpdateCharacterInput
): Promise<ActionResult<Character>>;
export async function deleteCharacter(id: string): Promise<ActionResult<void>>;
export async function getCharacters(
  worldId: string,
  filters?: CharacterFilters
): Promise<Character[]>;
export async function getCharacter(
  worldId: string,
  slug: string
): Promise<Character | null>;
```

**Zod Schemas:**

```typescript
// src/lib/schemas/character.schema.ts
export const createCharacterSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  role: z.string().max(100).optional(),
  species: z.string().max(100).optional(),
  age: z.string().max(50).optional(),
  gender: z.string().max(50).optional(),
  appearance: z.string().max(10000).optional(),
  personality: z.string().max(10000).optional(),
  backstory: z.string().max(10000).optional(),
  goals: z.string().max(5000).optional(),
  fears: z.string().max(5000).optional(),
  attributes: z.record(z.any()).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export const updateCharacterSchema = createCharacterSchema.partial();

export const characterFiltersSchema = z.object({
  role: z.string().optional(),
  species: z.string().optional(),
  search: z.string().optional(),
});
```

**RLS Policies:**

```sql
-- prisma/migrations/sql/004_character_rls.sql
-- Enable RLS
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- Users can access characters in their worlds
CREATE POLICY "Users can access own world characters"
  ON characters
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM worlds
      WHERE worlds.id = characters.world_id
      AND worlds.user_id = auth.uid()
    )
  );

-- Users can create characters in their worlds
CREATE POLICY "Users can create characters in own worlds"
  ON characters
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM worlds
      WHERE worlds.id = characters.world_id
      AND worlds.user_id = auth.uid()
    )
  );

-- Users can update characters in their worlds
CREATE POLICY "Users can update own world characters"
  ON characters
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM worlds
      WHERE worlds.id = characters.world_id
      AND worlds.user_id = auth.uid()
    )
  );

-- Users can delete characters in their worlds
CREATE POLICY "Users can delete own world characters"
  ON characters
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM worlds
      WHERE worlds.id = characters.world_id
      AND worlds.user_id = auth.uid()
    )
  );
```

**Integration Tests (20+ tests):**

- Create character with all fields
- Create character with minimal fields (name only)
- Update character attributes
- Delete character (cascade activity logs)
- Get characters with filters (role, species)
- Get character by slug
- Slug uniqueness per world
- RLS enforcement (users can't access other users' characters)
- Activity logging on create/update/delete
- Image URL validation

**Commands:**

```bash
# 1. Create migration
npx prisma migrate dev --name add_characters

# 2. Apply RLS policies
npm run db:rls

# 3. Regenerate Prisma client
npx prisma generate

# 4. Test character actions
npm run test:integration -- character-actions
```

**Skill to Use:** `worldcrafter-database-setup` (for schema/RLS), `worldcrafter-feature-builder` (for actions/tests)

**✅ COMPLETION SUMMARY (2025-01-10):**

- ✅ Prisma schema updated with Character model
- ✅ Database migration applied with `npx prisma db push`
- ✅ RLS policies created in `004_character_rls.sql` and applied
- ✅ Zod schemas created in `src/lib/schemas/character.schema.ts`
- ✅ 5 Server Actions implemented in `src/app/worlds/[slug]/characters/actions.ts`
- ✅ Test factory created in `src/test/factories/character.ts`
- ✅ 29 integration tests written and passing (100% pass rate)
- ✅ Activity feed updated to support CHARACTER entity type
- ✅ Build successful with zero TypeScript errors
- ✅ Test database synced

**Files Created/Modified:**

- `prisma/schema.prisma` - Added Character model
- `prisma/migrations/sql/004_character_rls.sql` - RLS policies
- `src/lib/schemas/character.schema.ts` - Validation schemas
- `src/app/worlds/[slug]/characters/actions.ts` - Server Actions
- `src/test/factories/character.ts` - Test factory
- `src/app/__tests__/character-actions.integration.test.ts` - Integration tests (29 tests)
- `src/components/activity/activity-feed.tsx` - Added CHARACTER icon support
- `scripts/apply-rls-migration.mjs` - Added 004_character_rls.sql

---

### Day 3-4: Character Forms (6 hours) ✅ COMPLETE

**Tasks:**

1. Create CharacterForm component with multi-tab UI
2. Integrate markdown editors for long-form fields
3. Add image URL input with preview
4. Create character creation page
5. Create character editing page
6. Write unit tests for form validation

**Files to Create:**

- `src/components/forms/character-form.tsx` - Main form component
- `src/app/worlds/[slug]/characters/new/page.tsx` - Create page
- `src/app/worlds/[slug]/characters/[characterSlug]/edit/page.tsx` - Edit page
- `src/components/forms/__tests__/character-form.test.tsx` - Unit tests

**CharacterForm Component:**

```typescript
// src/components/forms/character-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from "next/dynamic";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface CharacterFormProps {
  worldId: string;
  character?: Character; // For edit mode
  onSuccess?: (character: Character) => void;
}

export function CharacterForm({ worldId, character, onSuccess }: CharacterFormProps) {
  const form = useForm<CreateCharacterInput>({
    resolver: zodResolver(createCharacterSchema),
    defaultValues: character || {},
  });

  async function onSubmit(values: CreateCharacterInput) {
    const result = character
      ? await updateCharacter(character.id, values)
      : await createCharacter(worldId, values);

    if (result.success) {
      toast.success(character ? "Character updated!" : "Character created!");
      onSuccess?.(result.data);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Tabs defaultValue="basics">
          <TabsList>
            <TabsTrigger value="basics">Basics</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="personality">Personality</TabsTrigger>
            <TabsTrigger value="backstory">Backstory</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </Tabs>

          <TabsContent value="basics">
            {/* Name, Role, Species, Age, Gender */}
          </TabsContent>

          <TabsContent value="appearance">
            {/* Appearance (markdown), Image URL */}
          </TabsContent>

          <TabsContent value="personality">
            {/* Personality (markdown), Goals, Fears */}
          </TabsContent>

          <TabsContent value="backstory">
            {/* Backstory (markdown) */}
          </TabsContent>

          <TabsContent value="advanced">
            {/* Custom attributes (JSON editor) */}
          </TabsContent>
        </Tabs>

        <Button type="submit">
          {character ? "Update Character" : "Create Character"}
        </Button>
      </form>
    </Form>
  );
}
```

**Form Fields by Tab:**

**Basics:**

- Name (required, max 100 chars)
- Role (optional, max 100 chars) - e.g., "Warrior", "Merchant", "King"
- Species (optional, max 100 chars) - e.g., "Human", "Elf", "Dragon"
- Age (optional, max 50 chars) - flexible text, e.g., "25", "Ancient", "Unknown"
- Gender (optional, max 50 chars)

**Appearance:**

- Appearance (markdown editor, max 10000 chars)
- Image URL (optional, URL validation with preview)

**Personality:**

- Personality (markdown editor, max 10000 chars)
- Goals (markdown editor, max 5000 chars)
- Fears (markdown editor, max 5000 chars)

**Backstory:**

- Backstory (markdown editor, max 10000 chars)

**Advanced:**

- Custom attributes (JSON editor for genre-specific stats)
  - Example: `{ "strength": 18, "dexterity": 14, "magicAffinity": "Fire" }`

**Unit Tests (13+ tests):**

- Renders all tabs
- Name field validation (required, max length)
- Optional field validation (max lengths)
- Image URL validation (valid URL or empty)
- Markdown editor integration
- Form submission calls correct Server Action
- Success toast on create/update
- Error toast on failure
- Edit mode pre-populates fields
- Custom attributes JSON validation

**Skill to Use:** `worldcrafter-feature-builder`

**✅ COMPLETION SUMMARY (2025-11-10):**

- ✅ CharacterForm component created with 5-tab UI (Basics, Appearance, Personality, Backstory, Advanced)
- ✅ Markdown editors integrated for long-form fields (appearance, personality, backstory, goals, fears)
- ✅ Image URL input with live preview functionality
- ✅ Character creation page created at `/worlds/[slug]/characters/new`
- ✅ Character editing page created at `/worlds/[slug]/characters/[characterSlug]/edit`
- ✅ Loading and error states for both pages
- ✅ 19 unit tests written and passing (100% pass rate)
- ✅ Build successful with zero TypeScript errors
- ✅ New routes registered: `/worlds/[slug]/characters/new`, `/worlds/[slug]/characters/[characterSlug]/edit`

**Files Created:**

- `src/components/forms/character-form.tsx` - Multi-tab form with markdown editors
- `src/app/worlds/[slug]/characters/new/page.tsx` - Creation page
- `src/app/worlds/[slug]/characters/new/loading.tsx` - Loading state
- `src/app/worlds/[slug]/characters/new/error.tsx` - Error boundary
- `src/app/worlds/[slug]/characters/[characterSlug]/edit/page.tsx` - Edit page
- `src/app/worlds/[slug]/characters/[characterSlug]/edit/loading.tsx` - Loading state
- `src/app/worlds/[slug]/characters/[characterSlug]/edit/error.tsx` - Error boundary
- `src/components/forms/__tests__/character-form.test.tsx` - Unit tests (19 tests)

---

### Day 5: Character List & Detail (3 hours)

**Tasks:**

1. Create CharactersList component with card and table views
2. Add filter by role and species
3. Create character detail page
4. Write unit tests

**Files to Create:**

- `src/components/characters/characters-list.tsx` - List component
- `src/components/characters/character-card.tsx` - Card for grid view
- `src/components/characters/character-detail.tsx` - Detail component
- `src/app/worlds/[slug]/characters/page.tsx` - List page
- `src/app/worlds/[slug]/characters/[characterSlug]/page.tsx` - Detail page
- `src/components/characters/__tests__/characters-list.test.tsx` - Unit tests

**CharactersList Component Features:**

- **View modes:** Card view (portraits in grid), Table view (data table)
- **Filters:** Role dropdown, Species dropdown, Search input
- **Sort:** Name, Created date, Updated date
- **Actions:** View, Edit, Delete buttons
- **Empty state:** "Create your first character" CTA
- **Character count:** "Showing 15 characters (filtered by Warrior)"

**CharacterCard Component:**

```typescript
// src/components/characters/character-card.tsx
export function CharacterCard({ character }: { character: Character }) {
  return (
    <Card>
      {character.imageUrl && (
        <img src={character.imageUrl} alt={character.name} />
      )}
      <CardHeader>
        <CardTitle>{character.name}</CardTitle>
        {character.role && <Badge>{character.role}</Badge>}
        {character.species && <Badge variant="outline">{character.species}</Badge>}
      </CardHeader>
      <CardContent>
        {character.appearance && (
          <p className="line-clamp-3">{stripMarkdown(character.appearance)}</p>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild size="sm">
          <Link href={`/worlds/${worldSlug}/characters/${character.slug}`}>
            View
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
```

**CharacterDetail Component Features:**

- Display all character attributes
- Render markdown fields (appearance, personality, backstory, goals, fears)
- Show portrait image
- Metadata panel (created date, updated date, world name)
- Quick actions: Edit, Delete, Share
- Activity log for this character (Phase 1 infrastructure)
- Relationships panel (Phase 2 Week 6-7)

**Unit Tests (14+ tests):**

- Empty state rendering
- Character count display
- Card view with portraits
- Table view with data columns
- Filter by role
- Filter by species
- Sort functionality
- Delete confirmation dialog
- Character detail page renders all fields
- Markdown rendering for long-form fields

**Skill to Use:** `worldcrafter-feature-builder`

**✅ COMPLETION SUMMARY (2025-11-10):**

- ✅ CharactersList component created with card and table views
- ✅ CharacterCard component for grid view with portrait images and badges
- ✅ CharacterDetail component with comprehensive character information display
- ✅ Filter by role and species dropdowns (dynamic based on character data)
- ✅ View mode toggle (Card View / Table View)
- ✅ Empty states (no characters, filtered empty)
- ✅ Characters list page with authentication checks
- ✅ Character detail page with breadcrumb navigation
- ✅ Loading and error states for both pages
- ✅ 14 comprehensive unit tests written and passing (100% pass rate)
- ✅ Build successful with zero TypeScript errors

**Files Created:**

- `src/components/characters/character-card.tsx` - Card component with image, badges, dropdown menu
- `src/components/characters/characters-list.tsx` - List with card/table views, filtering
- `src/components/characters/character-detail.tsx` - Comprehensive detail view with markdown rendering
- `src/app/worlds/[slug]/characters/page.tsx` - Characters list page
- `src/app/worlds/[slug]/characters/loading.tsx` - Loading state
- `src/app/worlds/[slug]/characters/error.tsx` - Error boundary
- `src/app/worlds/[slug]/characters/[characterSlug]/page.tsx` - Character detail page
- `src/app/worlds/[slug]/characters/[characterSlug]/loading.tsx` - Loading state
- `src/app/worlds/[slug]/characters/[characterSlug]/error.tsx` - Error boundary
- `src/components/characters/__tests__/characters-list.test.tsx` - Unit tests (14 tests)

**Features Implemented:**

- ✅ Card view with character portraits, role/species badges, and dropdown actions
- ✅ Table view with sortable columns (Name, Role, Species, Age, Actions)
- ✅ Dynamic role filter (automatically populated from character data)
- ✅ Dynamic species filter (automatically populated from character data)
- ✅ Character count display with filter status
- ✅ Empty state with "Create First Character" CTA
- ✅ Filtered empty state with "Clear Filters" button
- ✅ Character detail page with:
  - Info cards for role, species, and age
  - Markdown rendering for appearance, personality, backstory, goals, fears
  - Custom attributes display
  - Portrait image display
  - Metadata panel with creation/update dates
  - Quick stats sidebar
  - Breadcrumb navigation
  - Edit button
- ✅ Loading skeletons matching page layouts
- ✅ Error boundaries with reset functionality

**Test Results:**

- ✅ 14/14 unit tests passing (100% pass rate)
- ✅ Tests cover: empty states, view modes, filtering, table view, links, action buttons

---

## Week 3: Event Management (9 hours)

**Status:** Not Started
**Completed:** 0/9 hours
**Remaining:** 9 hours

### Day 1-2: Event Schema & Server Actions (5 hours)

**Tasks:**

1. Update Prisma schema with Event model
2. Create migration and apply RLS policies
3. Create Zod validation schemas
4. Implement 5 Server Actions
5. Create event test factory
6. Write integration tests (15+ tests)

**Prisma Model to Add:**

```prisma
model Event {
  id            String   @id @default(cuid())
  worldId       String
  name          String   @db.VarChar(100)
  slug          String
  date          String?  @db.VarChar(100) // Flexible text format
  description   String?  @db.Text
  significance  String?  @db.Text
  type          String?  @db.VarChar(50)
  locationId    String?
  participants  Json?    // Array of character/faction IDs
  attributes    Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  world         World    @relation(fields: [worldId], references: [id], onDelete: Cascade)
  location      Location? @relation(fields: [locationId], references: [id], onDelete: SetNull)

  @@unique([worldId, slug])
  @@index([worldId, date])
  @@index([worldId, type])
  @@map("events")
}
```

**Event Types (Enum or flexible string):**

- Battle
- Discovery
- Political (coronation, treaty, assassination)
- Natural Disaster
- Cultural (festival, ritual)
- Personal (birth, death, marriage)
- Custom

**Files to Create:**

- `prisma/migrations/xxx_add_events.sql`
- `prisma/migrations/sql/005_event_rls.sql`
- `src/lib/schemas/event.schema.ts`
- `src/app/worlds/[slug]/events/actions.ts`
- `src/test/factories/event.ts`
- `src/app/__tests__/event-actions.integration.test.ts`

**Zod Schemas:**

```typescript
export const createEventSchema = z.object({
  name: z.string().min(1).max(100),
  date: z.string().max(100).optional(),
  description: z.string().max(10000).optional(),
  significance: z.string().max(5000).optional(),
  type: z.string().max(50).optional(),
  locationId: z.string().cuid().optional(),
  participants: z
    .array(
      z.object({
        type: z.enum(["character", "faction"]),
        id: z.string().cuid(),
      })
    )
    .optional(),
  attributes: z.record(z.any()).optional(),
});
```

**Integration Tests (15+ tests):**

- Create event with flexible date formats ("1453 BCE", "Year 342", "The Long Night")
- Create event with location reference
- Create event with participants (characters and factions)
- Update event
- Delete event
- Get events sorted by date (string-based sorting)
- Filter by type
- Filter by location
- RLS enforcement
- Activity logging

**Commands:**

```bash
npx prisma migrate dev --name add_events
npm run db:rls
npm run test:integration -- event-actions
```

**Skill to Use:** `worldcrafter-database-setup`, `worldcrafter-feature-builder`

---

### Day 3: Event Forms (2 hours)

**Tasks:**

1. Create EventForm component
2. Add location selector (dropdown of world's locations)
3. Add participant selector (multi-select characters/factions)
4. Create event creation/editing pages

**Files to Create:**

- `src/components/forms/event-form.tsx`
- `src/app/worlds/[slug]/events/new/page.tsx`
- `src/app/worlds/[slug]/events/[eventSlug]/edit/page.tsx`

**EventForm Features:**

- Name (required)
- Date (flexible text input, with format examples)
- Type (dropdown: Battle, Discovery, Political, Natural Disaster, Cultural, Personal, Custom)
- Location (searchable dropdown of locations)
- Participants (multi-select characters and factions with autocomplete)
- Description (markdown editor)
- Significance (markdown editor - "Why is this event important?")
- Custom attributes (JSON editor)

**Skill to Use:** `worldcrafter-feature-builder`

---

### Day 4: Event List & Detail (2 hours)

**Tasks:**

1. Create EventsList component with table and timeline preview
2. Create EventDetail component
3. Add filtering and sorting
4. Write unit tests

**Files to Create:**

- `src/components/events/events-list.tsx`
- `src/components/events/event-detail.tsx`
- `src/app/worlds/[slug]/events/page.tsx`
- `src/app/worlds/[slug]/events/[eventSlug]/page.tsx`
- `src/components/events/__tests__/events-list.test.tsx`

**EventsList Features:**

- **Table view:** Date, Name, Type, Location, Participants count
- **Timeline preview:** Simple horizontal timeline (full timeline in Phase 3)
- **Filters:** Type dropdown, Location dropdown
- **Sort:** Date, Name, Created date
- **Type badges:** Color-coded (Battle=red, Discovery=blue, etc.)
- **Empty state:** "Record your first event"

**EventDetail Features:**

- All event attributes
- Linked location (click to navigate)
- Participant list with links to characters/factions
- Timeline context: "Previous event", "Next event" navigation (if sorted by date)
- Markdown rendering for description and significance

**Skill to Use:** `worldcrafter-feature-builder`

---

## Week 4: Item Management (9 hours)

**Status:** Not Started
**Completed:** 0/9 hours
**Remaining:** 9 hours

### Day 1-2: Item Schema & Server Actions (5 hours)

**Tasks:**

1. Update Prisma schema with Item model
2. Create migration and apply RLS policies
3. Create Zod validation schemas
4. Implement 5 Server Actions
5. Create item test factory
6. Write integration tests (15+ tests)

**Prisma Model to Add:**

```prisma
model Item {
  id           String   @id @default(cuid())
  worldId      String
  name         String   @db.VarChar(100)
  slug         String
  type         String?  @db.VarChar(50)
  rarity       String?  @db.VarChar(50)
  description  String?  @db.Text
  properties   String?  @db.Text
  history      String?  @db.Text
  currentOwner String?  @db.VarChar(200) // Text or character reference
  location     String?  @db.VarChar(200) // Text or location reference
  attributes   Json?
  imageUrl     String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  world        World    @relation(fields: [worldId], references: [id], onDelete: Cascade)

  @@unique([worldId, slug])
  @@index([worldId, type])
  @@index([worldId, rarity])
  @@map("items")
}
```

**Item Types:**

- Weapon
- Armor
- Artifact
- Tool
- Consumable
- Document
- Currency
- Custom

**Rarity Levels:**

- Common
- Uncommon
- Rare
- Epic
- Legendary
- Unique
- Custom

**Files to Create:**

- `prisma/migrations/xxx_add_items.sql`
- `prisma/migrations/sql/006_item_rls.sql`
- `src/lib/schemas/item.schema.ts`
- `src/app/worlds/[slug]/items/actions.ts`
- `src/test/factories/item.ts`
- `src/app/__tests__/item-actions.integration.test.ts`

**Commands:**

```bash
npx prisma migrate dev --name add_items
npm run db:rls
npm run test:integration -- item-actions
```

**Skill to Use:** `worldcrafter-database-setup`, `worldcrafter-feature-builder`

---

### Day 3: Item Forms (2 hours)

**Tasks:**

1. Create ItemForm component with tabbed UI
2. Add type and rarity selectors
3. Create item creation/editing pages

**Files to Create:**

- `src/components/forms/item-form.tsx`
- `src/app/worlds/[slug]/items/new/page.tsx`
- `src/app/worlds/[slug]/items/[itemSlug]/edit/page.tsx`

**ItemForm Features:**

- **Basics tab:** Name, Type, Rarity, Image URL
- **Details tab:** Description (markdown), Properties (markdown)
- **History tab:** History (markdown), Current Owner (text or character selector), Location (text or location selector)
- **Advanced tab:** Custom attributes (JSON editor)

**Skill to Use:** `worldcrafter-feature-builder`

---

### Day 4: Item List & Detail (2 hours)

**Tasks:**

1. Create ItemsList component with card and table views
2. Create ItemDetail component
3. Add filtering by type and rarity
4. Write unit tests

**Files to Create:**

- `src/components/items/items-list.tsx`
- `src/components/items/item-card.tsx`
- `src/components/items/item-detail.tsx`
- `src/app/worlds/[slug]/items/page.tsx`
- `src/app/worlds/[slug]/items/[itemSlug]/page.tsx`
- `src/components/items/__tests__/items-list.test.tsx`

**ItemsList Features:**

- **Card view:** Item images, name, type, rarity badges
- **Table view:** Name, Type, Rarity, Owner, Location
- **Filters:** Type dropdown, Rarity dropdown
- **Sort:** Name, Rarity, Created date
- **Rarity badges:** Color-coded (Common=gray, Rare=blue, Legendary=gold)

**ItemDetail Features:**

- Item image
- All attributes
- Ownership history (Phase 3: track ownership changes over time)
- Related characters (if currentOwner is a character)
- Related locations (if location is set)

**Skill to Use:** `worldcrafter-feature-builder`

---

## Week 5: Faction Management (9 hours)

**Status:** Not Started
**Completed:** 0/9 hours
**Remaining:** 9 hours

### Day 1-2: Faction Schema & Server Actions (5 hours)

**Tasks:**

1. Update Prisma schema with Faction model
2. Create migration and apply RLS policies
3. Create Zod validation schemas
4. Implement 5 Server Actions
5. Create faction test factory
6. Write integration tests (15+ tests)

**Prisma Model to Add:**

```prisma
model Faction {
  id            String   @id @default(cuid())
  worldId       String
  name          String   @db.VarChar(100)
  slug          String
  type          String?  @db.VarChar(50)
  description   String?  @db.Text
  goals         String?  @db.Text
  structure     String?  @db.Text
  headquartersId String?
  leadership    Json?    // Array of character IDs
  members       Json?    // Array of character IDs
  allies        Json?    // Array of faction IDs
  enemies       Json?    // Array of faction IDs
  attributes    Json?
  emblemUrl     String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  world         World    @relation(fields: [worldId], references: [id], onDelete: Cascade)
  headquarters  Location? @relation(fields: [headquartersId], references: [id], onDelete: SetNull)

  @@unique([worldId, slug])
  @@index([worldId, type])
  @@map("factions")
}
```

**Faction Types:**

- Kingdom
- Guild
- Corporation
- Religion
- Military
- Criminal
- Academic
- Custom

**Files to Create:**

- `prisma/migrations/xxx_add_factions.sql`
- `prisma/migrations/sql/007_faction_rls.sql`
- `src/lib/schemas/faction.schema.ts`
- `src/app/worlds/[slug]/factions/actions.ts`
- `src/test/factories/faction.ts`
- `src/app/__tests__/faction-actions.integration.test.ts`

**Commands:**

```bash
npx prisma migrate dev --name add_factions
npm run db:rls
npm run test:integration -- faction-actions
```

**Skill to Use:** `worldcrafter-database-setup`, `worldcrafter-feature-builder`

---

### Day 3: Faction Forms (2 hours)

**Tasks:**

1. Create FactionForm component with tabbed UI
2. Add member selectors (multi-select characters)
3. Add ally/enemy selectors (multi-select factions)
4. Create faction creation/editing pages

**Files to Create:**

- `src/components/forms/faction-form.tsx`
- `src/app/worlds/[slug]/factions/new/page.tsx`
- `src/app/worlds/[slug]/factions/[factionSlug]/edit/page.tsx`

**FactionForm Features:**

- **Basics tab:** Name, Type, Emblem URL, Description (markdown)
- **Structure tab:** Goals (markdown), Structure (markdown), Headquarters (location selector)
- **Members tab:** Leadership (multi-select characters), Members (multi-select characters)
- **Relations tab:** Allies (multi-select factions), Enemies (multi-select factions)
- **Advanced tab:** Custom attributes (JSON editor)

**Skill to Use:** `worldcrafter-feature-builder`

---

### Day 4: Faction List & Detail (2 hours)

**Tasks:**

1. Create FactionsList component with card and table views
2. Create FactionDetail component with org chart preview
3. Add filtering by type
4. Write unit tests

**Files to Create:**

- `src/components/factions/factions-list.tsx`
- `src/components/factions/faction-card.tsx`
- `src/components/factions/faction-detail.tsx`
- `src/app/worlds/[slug]/factions/page.tsx`
- `src/app/worlds/[slug]/factions/[factionSlug]/page.tsx`
- `src/components/factions/__tests__/factions-list.test.tsx`

**FactionsList Features:**

- **Card view:** Emblem images, name, type, member count
- **Table view:** Name, Type, Headquarters, Member count, Allies/Enemies
- **Filters:** Type dropdown
- **Sort:** Name, Created date
- **Type badges:** Color-coded

**FactionDetail Features:**

- Emblem image
- All attributes (goals, structure)
- Org chart preview (leadership → members hierarchy)
- Headquarters link to location
- Member list with links to characters
- Ally/enemy lists with links to other factions
- Full org chart visualization (Phase 3)

**Skill to Use:** `worldcrafter-feature-builder`

---

## Week 6-7: Relationships & Graph Visualization (18 hours)

**Status:** Not Started
**Completed:** 0/18 hours
**Remaining:** 18 hours

### Day 1-2: Relationship Schema & Server Actions (6 hours)

**Tasks:**

1. Update Prisma schema with Relationship model
2. Create migration and apply RLS policies
3. Create Zod validation schemas
4. Implement relationship Server Actions
5. Create relationship test factory
6. Write integration tests (20+ tests)

**Prisma Model to Add:**

```prisma
enum EntityType {
  WORLD
  LOCATION
  CHARACTER
  EVENT
  ITEM
  FACTION
}

model Relationship {
  id             String     @id @default(cuid())
  worldId        String
  sourceType     EntityType
  sourceId       String
  targetType     EntityType
  targetId       String
  type           String     @db.VarChar(50)
  description    String?    @db.Text
  strength       Int        @default(5) // 1-10 scale
  isDirectional  Boolean    @default(false)
  attributes     Json?
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt

  world          World      @relation(fields: [worldId], references: [id], onDelete: Cascade)

  @@index([worldId, sourceType, sourceId])
  @@index([worldId, targetType, targetId])
  @@index([worldId, type])
  @@map("relationships")
}
```

**Relationship Types (predefined + custom):**

**For Characters:**

- Family: parent, child, sibling, spouse, cousin
- Social: friend, enemy, rival, mentor, student, ally
- Professional: employer, employee, colleague, subordinate

**For Factions:**

- Alliance: allied_with, rival_of, at_war_with, neutral_with
- Structure: parent_organization, subsidiary_of, merged_with

**For Locations:**

- Geographic: located_in, borders, connected_to, capital_of

**For Items:**

- Ownership: owned_by, created_by, stolen_from
- Association: associated_with, stored_in, guarded_by

**For Events:**

- Temporal: caused_by, led_to, happened_during
- Participation: participant_in, witness_to, victim_of

**Custom:** User-defined text

**Files to Create:**

- `prisma/migrations/xxx_add_relationships.sql`
- `prisma/migrations/sql/008_relationship_rls.sql`
- `src/lib/schemas/relationship.schema.ts`
- `src/app/worlds/[slug]/relationships/actions.ts`
- `src/test/factories/relationship.ts`
- `src/app/__tests__/relationship-actions.integration.test.ts`

**Server Actions:**

```typescript
export async function createRelationship(
  worldId: string,
  data: CreateRelationshipInput
): Promise<ActionResult<Relationship>>;
export async function updateRelationship(
  id: string,
  data: UpdateRelationshipInput
): Promise<ActionResult<Relationship>>;
export async function deleteRelationship(
  id: string
): Promise<ActionResult<void>>;
export async function getRelationships(
  worldId: string,
  filters?: RelationshipFilters
): Promise<Relationship[]>;
export async function getEntityRelationships(
  entityType: EntityType,
  entityId: string
): Promise<Relationship[]>;
```

**Integration Tests (20+ tests):**

- Create unidirectional relationship (A → B)
- Create bidirectional relationship (A ↔ B)
- Create relationships between different entity types
- Update relationship type and strength
- Delete relationship
- Get all relationships in world
- Get relationships for specific entity
- Filter by type, source, target
- Strength validation (1-10 range)
- RLS enforcement
- Activity logging

**Commands:**

```bash
npx prisma migrate dev --name add_relationships
npm run db:rls
npm run test:integration -- relationship-actions
```

**Skill to Use:** `worldcrafter-database-setup`, `worldcrafter-feature-builder`

---

### Day 3-4: Relationship UI on Entity Pages (4 hours)

**Tasks:**

1. Create RelationshipPanel component
2. Add to all entity detail pages (Character, Location, Event, Item, Faction)
3. Implement "Add Relationship" modal
4. Write unit tests

**Files to Create:**

- `src/components/relationships/relationship-panel.tsx`
- `src/components/relationships/add-relationship-dialog.tsx`
- `src/components/relationships/__tests__/relationship-panel.test.tsx`

**RelationshipPanel Component:**

```typescript
interface RelationshipPanelProps {
  entityType: EntityType;
  entityId: string;
  worldId: string;
  relationships: Relationship[];
}

export function RelationshipPanel({ entityType, entityId, worldId, relationships }: RelationshipPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Relationships</CardTitle>
        <AddRelationshipDialog
          worldId={worldId}
          sourceType={entityType}
          sourceId={entityId}
        />
      </CardHeader>
      <CardContent>
        {relationships.length === 0 ? (
          <p>No relationships yet.</p>
        ) : (
          <RelationshipList relationships={relationships} />
        )}
      </CardContent>
    </Card>
  );
}
```

**AddRelationshipDialog Features:**

- Select target entity type (dropdown)
- Search and select target entity (autocomplete)
- Select relationship type (dropdown with predefined + custom text input)
- Set directionality toggle (unidirectional / bidirectional)
- Set strength slider (1-10)
- Optional description (textarea)
- Preview: "Character A [friend of] → Character B (Strength: 7)"

**RelationshipList Features:**

- Grouped by relationship type
- Show target entity name with link
- Direction indicator (→ or ↔)
- Strength badge (1-10, color-coded: 1-3=weak/red, 4-7=medium/yellow, 8-10=strong/green)
- Inline edit and delete actions
- Hover tooltip showing description

**Integration:**

- Add RelationshipPanel to:
  - `src/components/characters/character-detail.tsx`
  - `src/components/locations/location-detail.tsx`
  - `src/components/events/event-detail.tsx`
  - `src/components/items/item-detail.tsx`
  - `src/components/factions/faction-detail.tsx`

**Skill to Use:** `worldcrafter-feature-builder`

---

### Day 5-6: Graph Visualization (6 hours)

**Tasks:**

1. Install React Flow library
2. Create RelationshipGraph component
3. Implement graph layout and rendering
4. Add filters (entity type, relationship type, strength)
5. Add search and highlighting
6. Create graph page
7. Write unit tests

**Dependencies:**

```bash
npm install reactflow
```

**Files to Create:**

- `src/components/relationships/relationship-graph.tsx`
- `src/components/relationships/graph-controls.tsx`
- `src/components/relationships/graph-legend.tsx`
- `src/app/worlds/[slug]/graph/page.tsx`
- `src/components/relationships/__tests__/relationship-graph.test.tsx`

**RelationshipGraph Component:**

```typescript
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';

interface RelationshipGraphProps {
  worldId: string;
  entities: AllEntityTypes[]; // Characters, Locations, etc.
  relationships: Relationship[];
}

export function RelationshipGraph({ worldId, entities, relationships }: RelationshipGraphProps) {
  // Convert entities to nodes
  const nodes: Node[] = entities.map(entity => ({
    id: entity.id,
    type: getNodeType(entity.type),
    position: calculatePosition(entity), // Force-directed or hierarchical
    data: {
      label: entity.name,
      entityType: entity.type,
      imageUrl: entity.imageUrl,
    },
    style: {
      background: getColorByType(entity.type),
      width: getNodeSize(entity),
      height: getNodeSize(entity),
    },
  }));

  // Convert relationships to edges
  const edges: Edge[] = relationships.map(rel => ({
    id: rel.id,
    source: rel.sourceId,
    target: rel.targetId,
    type: rel.isDirectional ? 'default' : 'straight',
    label: rel.type,
    animated: rel.strength > 7, // Strong relationships animate
    style: {
      stroke: getColorByStrength(rel.strength),
      strokeWidth: rel.strength / 2,
    },
    markerEnd: rel.isDirectional ? {
      type: 'arrowclosed',
    } : undefined,
  }));

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background />
      </ReactFlow>
    </div>
  );
}
```

**GraphControls Features:**

- **Entity type filters:** Checkboxes for Characters, Locations, Events, Items, Factions
- **Relationship type filter:** Dropdown (All, Family, Friend, Enemy, etc.)
- **Strength filter:** Slider (show only relationships with strength >= X)
- **Search:** Input to highlight specific entity (zooms and highlights node)
- **Layout toggle:** Force-directed, Hierarchical, Circular
- **Export:** PNG/SVG download button

**Node Styling:**

- **Characters:** Circle, blue
- **Locations:** Square, green
- **Events:** Diamond, orange
- **Items:** Hexagon, purple
- **Factions:** Shield shape, red
- Size based on relationship count (more relationships = larger node)
- Portrait/emblem image in center (if available)

**Edge Styling:**

- **Strength 1-3:** Thin, dashed, red
- **Strength 4-7:** Medium, solid, yellow
- **Strength 8-10:** Thick, solid, green, animated
- Label shows relationship type
- Arrow for directional relationships

**Interactions:**

- **Click node:** Open entity detail modal (or navigate to detail page)
- **Click edge:** Show relationship details in sidebar
- **Hover node:** Highlight connected nodes and edges
- **Drag node:** Reposition (position persists in localStorage)
- **Zoom/pan:** Mouse wheel and drag
- **Double-click background:** Deselect all

**Graph Page (`/worlds/[slug]/graph`):**

- Full-screen graph view
- Sidebar with controls
- Legend showing node and edge types
- "Back to Dashboard" button

**Skill to Use:** `worldcrafter-feature-builder`

---

### Day 7: Graph Export & Polish (2 hours)

**Tasks:**

1. Implement PNG/SVG export functionality
2. Add keyboard shortcuts (Ctrl+F for search, Escape to deselect)
3. Optimize performance for large graphs (virtualization)
4. Write E2E test for graph interaction

**Export Implementation:**

```typescript
import { toPng, toSvg } from "react-to-image";

async function exportGraph(format: "png" | "svg") {
  const graphElement = document.querySelector(".react-flow");
  const dataUrl =
    format === "png" ? await toPng(graphElement) : await toSvg(graphElement);

  const link = document.createElement("a");
  link.download = `world-graph.${format}`;
  link.href = dataUrl;
  link.click();
}
```

**Performance Optimization:**

- Limit initial render to 100 nodes (with "Show More" button)
- Use React Flow's built-in virtualization for large graphs
- Debounce filter changes (300ms)
- Lazy load entity images

**E2E Test:**

```typescript
// e2e/graph.spec.ts
test("user can view and interact with relationship graph", async ({ page }) => {
  // Create world with entities and relationships
  // Navigate to graph page
  // Verify nodes and edges render
  // Click node to open detail modal
  // Search for entity and verify highlight
  // Filter by entity type
  // Export as PNG
});
```

**Skill to Use:** `worldcrafter-feature-builder`, `worldcrafter-test-generator`

---

## Week 8: Collaboration Basics (9 hours)

**Status:** Not Started
**Completed:** 0/9 hours
**Remaining:** 9 hours

### Day 1-2: Collaboration Schema & Server Actions (5 hours)

**Tasks:**

1. Update Prisma schema with WorldMember and Comment models
2. Create migration and apply RLS policies
3. Create Zod validation schemas
4. Implement invite, role management, and comment Server Actions
5. Create test factories
6. Write integration tests (20+ tests)

**Prisma Models to Add:**

```prisma
enum Role {
  VIEWER
  COMMENTER
  EDITOR
  ADMIN
  OWNER
}

model WorldMember {
  id         String   @id @default(cuid())
  worldId    String
  userId     String   @db.Uuid
  role       Role
  invitedBy  String   @db.Uuid
  invitedAt  DateTime @default(now())
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  world      World    @relation(fields: [worldId], references: [id], onDelete: Cascade)
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  inviter    User     @relation("Inviter", fields: [invitedBy], references: [id])

  @@unique([worldId, userId])
  @@index([userId])
  @@map("world_members")
}

model Comment {
  id         String     @id @default(cuid())
  worldId    String
  entityType EntityType
  entityId   String
  userId     String     @db.Uuid
  content    String     @db.Text
  parentId   String?    // For threaded replies
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt

  world      World      @relation(fields: [worldId], references: [id], onDelete: Cascade)
  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  parent     Comment?   @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies    Comment[]  @relation("CommentReplies")

  @@index([worldId, entityType, entityId])
  @@index([userId])
  @@map("comments")
}
```

**Role Permissions:**

- **VIEWER:** Read-only access to all entities
- **COMMENTER:** Viewer + add/edit/delete own comments
- **EDITOR:** Commenter + create/edit/delete entities
- **ADMIN:** Editor + manage members, change world settings (except delete world)
- **OWNER:** Admin + transfer ownership, delete world (only one owner per world)

**Files to Create:**

- `prisma/migrations/xxx_add_collaboration.sql`
- `prisma/migrations/sql/009_collaboration_rls.sql`
- `src/lib/schemas/collaboration.schema.ts`
- `src/app/worlds/[slug]/settings/actions.ts` (extend existing)
- `src/app/worlds/[slug]/comments/actions.ts`
- `src/test/factories/world-member.ts`
- `src/test/factories/comment.ts`
- `src/app/__tests__/collaboration-actions.integration.test.ts`

**Server Actions:**

```typescript
// Invite & Member Management
export async function inviteMember(
  worldId: string,
  email: string,
  role: Role
): Promise<ActionResult<WorldMember>>;
export async function updateMemberRole(
  memberId: string,
  role: Role
): Promise<ActionResult<WorldMember>>;
export async function removeMember(
  memberId: string
): Promise<ActionResult<void>>;
export async function getWorldMembers(worldId: string): Promise<WorldMember[]>;
export async function acceptInvite(
  inviteToken: string
): Promise<ActionResult<WorldMember>>;

// Comments
export async function createComment(
  data: CreateCommentInput
): Promise<ActionResult<Comment>>;
export async function updateComment(
  commentId: string,
  content: string
): Promise<ActionResult<Comment>>;
export async function deleteComment(
  commentId: string
): Promise<ActionResult<void>>;
export async function getEntityComments(
  entityType: EntityType,
  entityId: string
): Promise<Comment[]>;
```

**RLS Policies:**

- World members can access based on role
- OWNER and ADMIN can manage members
- COMMENTER+ can add comments
- Users can edit/delete own comments (within 5 min window)
- EDITOR+ can create/edit/delete entities

**Integration Tests (20+ tests):**

- Invite user by email (sends email, creates pending invite)
- Accept invite (creates WorldMember record)
- Update member role (OWNER/ADMIN only)
- Remove member (OWNER/ADMIN only)
- Role-based access control:
  - VIEWER can read entities
  - COMMENTER can add comments
  - EDITOR can create entities
  - ADMIN can manage members
  - OWNER can delete world
- Comments CRUD
- Threaded replies (parent/child)
- Edit window (5 minutes)
- RLS enforcement per role

**Commands:**

```bash
npx prisma migrate dev --name add_collaboration
npm run db:rls
npm run test:integration -- collaboration-actions
```

**Skill to Use:** `worldcrafter-database-setup`, `worldcrafter-auth-guard`, `worldcrafter-feature-builder`

---

### Day 3: Member Management UI (2 hours)

**Tasks:**

1. Create member management page
2. Add invite modal
3. Add member list with role management
4. Write unit tests

**Files to Create:**

- `src/app/worlds/[slug]/settings/members/page.tsx`
- `src/components/collaboration/invite-member-dialog.tsx`
- `src/components/collaboration/member-list.tsx`
- `src/components/collaboration/__tests__/member-list.test.tsx`

**Member Management Page Features:**

- List all world members with avatars, names, emails, roles, join dates
- Invite button (opens modal)
- Role dropdown for each member (OWNER/ADMIN only)
- Remove button for each member (OWNER/ADMIN only)
- Can't remove self
- Can't change own role
- Only one OWNER (transfer ownership feature in Phase 3)

**InviteMemberDialog Features:**

- Email input with validation
- Role selector (default: EDITOR)
- Preview: "You're inviting user@example.com as an Editor"
- Send button triggers Server Action (sends email via Supabase Edge Function)
- Success toast: "Invite sent to user@example.com"

**Email Template (Supabase Edge Function):**

```
Subject: You've been invited to collaborate on [World Name]

Hi,

[Inviter Name] has invited you to collaborate on the world "[World Name]" on WorldCrafter as an [Role].

Accept invite: [Accept Invite Link]

This invite expires in 7 days.

If you don't have a WorldCrafter account, you'll be prompted to create one.

Thanks,
The WorldCrafter Team
```

**Skill to Use:** `worldcrafter-auth-guard`, `worldcrafter-feature-builder`

---

### Day 4: Comments UI (2 hours)

**Tasks:**

1. Create CommentSection component
2. Add to all entity detail pages
3. Implement threaded replies
4. Add @mention support (autocomplete)
5. Write unit tests

**Files to Create:**

- `src/components/collaboration/comment-section.tsx`
- `src/components/collaboration/comment-form.tsx`
- `src/components/collaboration/comment-thread.tsx`
- `src/components/collaboration/__tests__/comment-section.test.tsx`

**CommentSection Component:**

```typescript
interface CommentSectionProps {
  worldId: string;
  entityType: EntityType;
  entityId: string;
  currentUserRole: Role;
}

export function CommentSection({ worldId, entityType, entityId, currentUserRole }: CommentSectionProps) {
  const { data: comments } = useQuery({
    queryKey: ['comments', entityType, entityId],
    queryFn: () => getEntityComments(entityType, entityId),
  });

  // Only COMMENTER+ can add comments
  if (currentUserRole === Role.VIEWER) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent>
        <CommentForm
          worldId={worldId}
          entityType={entityType}
          entityId={entityId}
        />
        <CommentThread comments={comments || []} />
      </CardContent>
    </Card>
  );
}
```

**CommentForm Features:**

- Textarea with markdown support
- @mention autocomplete (triggers on "@" key)
- Submit button
- Character count (max 5000)
- Preview toggle
- Success toast on submit

**CommentThread Features:**

- Top-level comments sorted by creation date (newest first)
- Threaded replies (1 level deep, indented)
- Avatar, author name, timestamp ("2 hours ago")
- Markdown rendering
- Reply button (shows inline reply form)
- Edit/Delete buttons (own comments only, within 5 min)
- @mentions highlighted and clickable (navigates to user profile - Phase 3)

**Integration:**

- Add CommentSection to all entity detail pages (below RelationshipPanel)

**Skill to Use:** `worldcrafter-feature-builder`

---

## Week 9: Export & Polish (9 hours)

**Status:** Not Started
**Completed:** 0/9 hours
**Remaining:** 9 hours

### Day 1-2: JSON Export (3 hours)

**Tasks:**

1. Create JSON export Server Action
2. Implement full world serialization
3. Add export UI to world settings
4. Write integration tests

**Files to Create:**

- `src/app/worlds/[slug]/export/actions.ts`
- `src/lib/utils/export.ts` (helper functions)
- `src/app/__tests__/export.integration.test.ts`

**JSON Export Server Action:**

```typescript
// src/app/worlds/[slug]/export/actions.ts
"use server";

export async function exportWorldJSON(
  worldId: string
): Promise<ActionResult<{ url: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // Check user has access to world
  const world = await prisma.world.findFirst({
    where: { id: worldId, userId: user.id },
  });
  if (!world) return { success: false, error: "World not found" };

  // Fetch all world data
  const [locations, characters, events, items, factions, relationships] =
    await Promise.all([
      prisma.location.findMany({ where: { worldId } }),
      prisma.character.findMany({ where: { worldId } }),
      prisma.event.findMany({ where: { worldId } }),
      prisma.item.findMany({ where: { worldId } }),
      prisma.faction.findMany({ where: { worldId } }),
      prisma.relationship.findMany({ where: { worldId } }),
    ]);

  // Serialize to JSON
  const exportData = {
    version: "2.0",
    exportedAt: new Date().toISOString(),
    world: {
      ...world,
      locations,
      characters,
      events,
      items,
      factions,
      relationships,
    },
  };

  const json = JSON.stringify(exportData, null, 2);

  // Upload to Supabase Storage (24-hour TTL)
  const fileName = `${world.slug}-${Date.now()}.json`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("exports")
    .upload(fileName, json, {
      contentType: "application/json",
      cacheControl: "86400", // 24 hours
    });

  if (uploadError) {
    return { success: false, error: "Export failed" };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("exports")
    .getPublicUrl(fileName);

  return { success: true, data: { url: urlData.publicUrl } };
}
```

**Export UI:**

- Add "Export" tab to world settings page
- Format selector: JSON, Markdown (Phase 2), PDF (Phase 3)
- "Export World" button
- Progress indicator (processing...)
- Download link when ready (expires in 24 hours)
- Success toast with download button

**Integration Tests:**

- Export world with all entity types
- Verify JSON structure matches schema
- Verify all entities included
- Verify relationships included
- Test large world export (1000+ entities)
- Verify download URL works

**Skill to Use:** `worldcrafter-feature-builder`

---

### Day 3-4: Markdown Export (4 hours)

**Tasks:**

1. Create Markdown export Server Action
2. Implement folder structure and frontmatter
3. Add markdown export to UI
4. Write integration tests

**Files to Create:**

- `src/lib/utils/markdown-export.ts`
- `src/app/__tests__/markdown-export.integration.test.ts`

**Markdown Export Structure:**

```
world-name-export.zip
├── README.md                    # World overview
├── world.json                   # Metadata
├── characters/
│   ├── character-1.md
│   ├── character-2.md
│   └── ...
├── locations/
│   ├── location-1.md
│   └── ...
├── events/
│   ├── event-1.md
│   └── ...
├── items/
│   ├── item-1.md
│   └── ...
├── factions/
│   ├── faction-1.md
│   └── ...
└── relationships.md             # All relationships
```

**Markdown File Format (with frontmatter):**

```markdown
---
id: char_abc123
slug: aldrin-the-wise
type: character
role: Wizard
species: Human
age: 387
created: 2025-01-10T12:00:00Z
updated: 2025-01-15T14:30:00Z
---

# Aldrin the Wise

## Appearance

Ancient wizard with a long white beard...

## Personality

Wise, patient, mysterious...

## Backstory

Born in the year 1638...

## Goals

- Protect the realm from dark magic
- Find a worthy apprentice

## Fears

- Losing his magic
- Repeating past mistakes

## Relationships

- **Mentor of**: [[Elara]] (Character)
- **Lives in**: [[Elderwood Tower]] (Location)
- **Member of**: [[Council of Mages]] (Faction)
```

**Markdown Export Implementation:**

```typescript
export async function exportWorldMarkdown(
  worldId: string
): Promise<ActionResult<{ url: string }>> {
  // Fetch all entities
  // Generate markdown files with frontmatter
  // Create folder structure
  // Zip files using JSZip or archiver
  // Upload to Supabase Storage
  // Return download URL
}
```

**Dependencies:**

```bash
npm install jszip gray-matter
```

**Integration Tests:**

- Export world as Markdown zip
- Verify folder structure
- Verify frontmatter parsing
- Verify entity cross-links ([[Entity Name]])
- Test Obsidian compatibility (import into vault)

**Skill to Use:** `worldcrafter-feature-builder`

---

### Day 5: UI Polish & Bug Fixes (2 hours)

**Tasks:**

1. Review all Phase 2 pages for consistency
2. Ensure all entity types follow same patterns
3. Fix any visual inconsistencies
4. Add missing loading states and error boundaries
5. Add missing success/error toasts
6. Test all forms for validation edge cases

**Pages to Review:**

- Characters: list, detail, create, edit
- Events: list, detail, create, edit
- Items: list, detail, create, edit
- Factions: list, detail, create, edit
- Graph: visualization, filters, export
- Settings: members, export

**Checklist:**

- ☐ All list pages have empty states
- ☐ All detail pages have loading skeletons
- ☐ All forms have validation error messages
- ☐ All Server Actions have success/error toasts
- ☐ All images have alt text and fallback
- ☐ All badges are consistently styled
- ☐ All buttons are accessible (keyboard navigation)
- ☐ All modals are dismissible (Escape key)
- ☐ All markdown fields render correctly
- ☐ All relationship panels are functional

**Common Bugs to Check:**

- Form submission during loading (disable button)
- Duplicate slugs in same world (unique constraint)
- Delete confirmation not showing
- Image URLs with spaces or special characters
- Markdown editor toolbar not showing
- Long entity names breaking layout
- Empty relationship graph showing error

**Skill to Use:** Manual testing + `worldcrafter-feature-builder` for fixes

---

## Week 10: Testing & Deployment (9 hours)

**Status:** Not Started
**Completed:** 0/9 hours
**Remaining:** 9 hours

### Day 1-2: Comprehensive E2E Tests (4 hours)

**Tasks:**

1. Write E2E test suites for all new features
2. Verify all critical user flows work end-to-end
3. Test collaboration features
4. Test export features

**E2E Test Files to Create:**

- `e2e/characters.spec.ts` (8 tests)
- `e2e/events.spec.ts` (6 tests)
- `e2e/items.spec.ts` (6 tests)
- `e2e/factions.spec.ts` (6 tests)
- `e2e/relationships.spec.ts` (10 tests)
- `e2e/collaboration.spec.ts` (12 tests)
- `e2e/export.spec.ts` (8 tests)

**E2E Test Coverage (56+ tests):**

**Characters (8 tests):**

- Create character with all fields
- Edit character
- Delete character
- View character detail page
- Filter characters by role and species
- Search characters
- Character list shows cards and table views
- Character form validates required fields

**Events (6 tests):**

- Create event with flexible date
- Link event to location and participants
- Edit event
- Delete event
- Filter events by type and location
- View event detail with linked entities

**Items (6 tests):**

- Create item with rarity
- Edit item ownership and location
- Delete item
- Filter items by type and rarity
- Item card displays image and badges
- Item detail shows all attributes

**Factions (6 tests):**

- Create faction with members
- Add allies and enemies
- Edit faction structure
- Delete faction
- Faction detail shows org chart preview
- Member and ally lists are interactive

**Relationships (10 tests):**

- Create unidirectional relationship from character detail
- Create bidirectional relationship
- Delete relationship
- View relationship graph
- Filter graph by entity type
- Filter graph by relationship type
- Search entity in graph and highlight
- Click node in graph to view detail
- Export graph as PNG
- Graph handles large number of nodes (100+)

**Collaboration (12 tests):**

- Invite member by email
- Accept invite and join world
- Change member role (ADMIN action)
- Remove member (ADMIN action)
- VIEWER can only read entities
- COMMENTER can add comments
- EDITOR can create entities
- ADMIN can manage members
- Add comment to character
- Reply to comment (threaded)
- Edit own comment (within 5 minutes)
- Delete own comment

**Export (8 tests):**

- Export world as JSON
- Verify JSON structure
- Download JSON file
- Export world as Markdown
- Verify Markdown zip structure
- Extract and read markdown files
- Verify frontmatter parsing
- Verify entity cross-links in markdown

**Commands:**

```bash
# Run all E2E tests
npm run test:e2e

# Run specific suite
npm run test:e2e -- characters.spec.ts

# Run with UI mode for debugging
npm run test:e2e -- --ui
```

**Skill to Use:** `worldcrafter-test-generator`

---

### Day 3: Test Coverage & Performance (2 hours)

**Tasks:**

1. Run coverage report
2. Identify gaps below 80% threshold
3. Write missing unit/integration tests
4. Profile database queries
5. Add indexes if needed
6. Test with large datasets (1000+ entities per world)

**Commands:**

```bash
# Coverage report
npm run test:coverage

# Profile queries (enable Prisma logging)
# In .env: DATABASE_URL with ?log=query

# Test performance
npm run test:integration -- --reporter=verbose
```

**Coverage Targets:**

- Overall: 80%+ (up from 76% in Phase 1)
- Server Actions: 90%+
- Components: 75%+
- Utilities: 100%

**Performance Checklist:**

- ☐ All list queries use pagination (50 per page)
- ☐ All foreign key columns have indexes
- ☐ Graph query optimized (limit to 500 relationships)
- ☐ Export handles 10,000+ entities without timeout
- ☐ Search results return in < 300ms
- ☐ Character list loads in < 1s with 500 characters

**Database Indexes to Verify:**

```sql
-- Check existing indexes
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Add missing indexes if needed
CREATE INDEX IF NOT EXISTS characters_world_id_updated_at_idx ON characters(world_id, updated_at);
CREATE INDEX IF NOT EXISTS events_world_id_date_idx ON events(world_id, date);
CREATE INDEX IF NOT EXISTS items_world_id_type_idx ON items(world_id, type);
CREATE INDEX IF NOT EXISTS factions_world_id_type_idx ON factions(world_id, type);
CREATE INDEX IF NOT EXISTS relationships_world_id_type_idx ON relationships(world_id, type);
CREATE INDEX IF NOT EXISTS comments_world_id_entity_idx ON comments(world_id, entity_type, entity_id);
```

**Skill to Use:** `worldcrafter-test-generator`, manual profiling

---

### Day 4: Documentation (2 hours)

**Tasks:**

1. Update README with Phase 2 features
2. Create user guide for Phase 2 features
3. Update CLAUDE.md with new patterns
4. Document collaboration workflows

**Files to Update/Create:**

- `README.md` - Add Phase 2 feature list
- `docs/USER_GUIDE_PHASE2.md` - New user guide
- `CLAUDE.md` - Add Phase 2 patterns
- `docs/COLLABORATION_GUIDE.md` - Collaboration workflows

**USER_GUIDE_PHASE2.md Contents:**

- How to create characters
- How to create events with timeline
- How to create items and track ownership
- How to create factions and org structure
- How to define relationships
- How to view and interact with relationship graph
- How to invite collaborators
- How to manage member roles and permissions
- How to add comments and reply
- How to export world data (JSON, Markdown)

**CLAUDE.md Updates:**

- Entity creation patterns (forms, Server Actions)
- Relationship management patterns
- Collaboration patterns (RBAC, comments)
- Export patterns
- Testing patterns for new entity types

**COLLABORATION_GUIDE.md Contents:**

- Inviting team members
- Understanding roles (Viewer, Commenter, Editor, Admin, Owner)
- Role permissions matrix
- Best practices for team worldbuilding
- Using comments effectively
- Managing member access

**Skill to Use:** Manual documentation

---

### Day 5: Production Deployment (1 hour)

**Tasks:**

1. Verify all migrations applied to production database
2. Run build and verify no TypeScript errors
3. Deploy to Vercel production
4. Run smoke tests on production
5. Monitor for errors (Sentry - if set up)

**Pre-Deployment Checklist:**

- ☐ All Phase 2 migrations applied
- ☐ RLS policies applied (all 9 policy files)
- ☐ Environment variables set in Vercel
- ☐ Build succeeds with zero errors
- ☐ All 145+ tests passing (Phase 1 + Phase 2)
- ☐ Coverage > 80%
- ☐ No console errors in dev build
- ☐ No console warnings (except known third-party)

**Deployment Commands:**

```bash
# 1. Verify build locally
npm run build

# 2. Run all tests
npm run test:all

# 3. Deploy to Vercel
vercel --prod

# 4. Verify deployment
curl https://worldcrafter.vercel.app/api/health

# 5. Run smoke tests on production
npm run test:e2e -- --project chromium --grep "@smoke"
```

**Smoke Tests (Tag with @smoke):**

- User can sign up and log in
- User can create world
- User can create character
- User can create relationship
- User can view graph
- User can invite member
- User can export world

**Post-Deployment:**

- Monitor Vercel logs for errors
- Check Supabase dashboard for query performance
- Verify analytics tracking (if set up)
- Announce launch to early users (email, social)

**Rollback Plan (if issues):**

- Revert Vercel deployment to previous version
- Database rollback: restore from backup (Supabase PITR)
- Communicate with users about downtime

**Skill to Use:** Manual deployment + monitoring

---

## Success Criteria

### Functionality (100% Target - All 8 features)

- [ ] All 5 entity types (Locations, Characters, Events, Items, Factions) have CRUD operations
- [ ] Relationship system connects any entity to any entity
- [ ] Interactive graph visualization with filters, search, and export
- [ ] Collaboration: invite members, assign roles (5 levels), manage permissions
- [ ] Comments: add, reply, edit, delete with @mentions
- [ ] Export: JSON and Markdown formats
- [ ] All entity detail pages show relationships panel
- [ ] All entity detail pages show comments section (for COMMENTER+)

### Quality (Phase 2 Targets)

- [ ] Zero critical bugs (P0)
- [ ] < 10 high-priority bugs (P1)
- [ ] Test coverage > 80% (up from 76%)
- [ ] All 200+ tests passing (145 from Phase 1 + 56 from Phase 2)
- [ ] Lighthouse score > 90
- [ ] Build compiles with zero TypeScript errors

### Performance (Phase 2 Baselines)

- [ ] Character list loads in < 1s with 500 characters
- [ ] Graph renders in < 2s with 500 nodes and 1000 edges
- [ ] Export completes in < 10s for world with 1000 entities
- [ ] Search results return in < 300ms
- [ ] All database queries < 100ms (p95)

### User Metrics (Phase 2 Targets)

- [ ] 1,000+ total signups (first 3 months post-Phase 2 launch)
- [ ] 500+ Monthly Active Users (MAU)
- [ ] 40%+ Day 1 retention
- [ ] 25%+ Day 7 retention
- [ ] NPS > 40

### Feature Adoption (Phase 2 Targets)

- [ ] 80%+ users create at least 1 character
- [ ] 60%+ users create at least 1 relationship
- [ ] 40%+ users view relationship graph
- [ ] 30%+ users invite at least 1 collaborator
- [ ] 25%+ users export world data

### Documentation (Complete)

- [ ] README updated with Phase 2 features
- [ ] USER_GUIDE_PHASE2.md created
- [ ] COLLABORATION_GUIDE.md created
- [ ] CLAUDE.md updated with new patterns

---

## Dependencies & Prerequisites

### External Services Required

- ✅ Supabase project (production) - from Phase 1
- ✅ Supabase test project (.env.test) - from Phase 1
- ✅ Vercel account - from Phase 1
- ✅ GitHub repository - from Phase 1
- ⚠️ Email service (SendGrid or Resend) - **NEW for invites**
- ⚠️ Sentry account (optional, for monitoring) - Recommended

### Environment Variables Required

```bash
# Phase 1 (already set)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DATABASE_URL=  # Port 6543 (pooler)
DIRECT_DATABASE_URL=  # Port 5432 (direct)
NEXT_PUBLIC_BASE_URL=

# Phase 2 (new)
SENDGRID_API_KEY=  # Or RESEND_API_KEY
NEXT_PUBLIC_COLLABORATION_ENABLED=true
```

### Technical Blockers

All blockers from Phase 1 resolved. New dependencies:

- [ ] Email service configured (SendGrid/Resend)
- [ ] Supabase Storage bucket created (`exports` with 24-hour TTL)
- [ ] Supabase Edge Function for email invites (or use SendGrid directly)

### Phase 1 Infrastructure Dependencies

Phase 2 builds on Phase 1 completed work:

- ✅ Authentication system (Supabase Auth)
- ✅ World management (CRUD, privacy, dashboard)
- ✅ Location management (hierarchical)
- ✅ RLS policies pattern
- ✅ Server Actions pattern
- ✅ Form components pattern (React Hook Form + Zod)
- ✅ List components pattern (grid/table views)
- ✅ Testing infrastructure (Vitest, Playwright, factories)
- ✅ Activity logging system
- ✅ Search infrastructure (PostgreSQL tsvector)

---

## Risk Mitigation

### Technical Risks

**Risk 1: Relationship graph performance degrades with large worlds**

- **Likelihood:** Medium
- **Impact:** High (slow graph rendering, poor UX)
- **Mitigation:**
  - Limit initial render to 500 relationships
  - Implement virtualization with React Flow
  - Add "Show More" button for incremental loading
  - Optimize graph queries with proper indexes
- **Contingency:** Add graph pagination, reduce default node size

**Risk 2: Email invites not delivered (spam filters, bounces)**

- **Likelihood:** Medium
- **Impact:** Medium (users can't invite collaborators)
- **Mitigation:**
  - Use reputable email service (SendGrid/Resend)
  - Configure SPF, DKIM, DMARC records
  - Test with multiple email providers
  - Add "Resend Invite" button
- **Contingency:** Add alternative invite method (shareable link)

**Risk 3: Export times out for very large worlds (10,000+ entities)**

- **Likelihood:** Medium
- **Impact:** Medium (users can't export)
- **Mitigation:**
  - Implement async export with job queue (BullMQ or pg-boss)
  - Show progress indicator
  - Send email when export ready
  - Limit export to 10,000 entities (with pagination)
- **Contingency:** Add "partial export" feature (select entity types)

**Risk 4: Collaboration role permissions have security gaps**

- **Likelihood:** Low
- **Impact:** Very High (unauthorized access to data)
- **Mitigation:**
  - Comprehensive RLS policy testing
  - Manual security audit before launch
  - Role permission matrix documentation
  - Integration tests for all role combinations
- **Contingency:** Disable collaboration feature if critical issue found

### Product Risks

**Risk 5: Users find relationship graph confusing or not useful**

- **Likelihood:** Medium
- **Impact:** Medium (low adoption of key feature)
- **Mitigation:**
  - User testing with 5-10 early users before launch
  - Tooltips and onboarding tour for graph
  - Provide example graphs with sample data
  - Collect feedback via in-app survey
- **Contingency:** Simplify graph UI, add templates, improve legend

**Risk 6: Collaboration adoption < 30% target**

- **Likelihood:** Medium
- **Impact:** Medium (wasted development effort)
- **Mitigation:**
  - Prominent invite button in UI
  - Email campaigns highlighting collaboration features
  - Show collaboration benefits in onboarding
  - Track adoption metrics weekly
- **Contingency:** Add more solo user features (templates, AI), de-prioritize real-time

**Risk 7: Users request features not in Phase 2 roadmap**

- **Likelihood:** High
- **Impact:** Low (scope creep risk)
- **Mitigation:**
  - Clearly communicate Phase 2 vs Phase 3 features
  - Maintain public roadmap
  - Collect feature requests in backlog (Canny or similar)
  - Regular user updates on progress
- **Contingency:** Fast-follow with most requested features in Phase 3

### Schedule Risks

**Risk 8: Phase 2 takes longer than 10 weeks**

- **Likelihood:** Medium
- **Impact:** Medium (delayed Phase 3 features)
- **Mitigation:**
  - 20% time buffer built into estimates (90 → 108 hours)
  - Weekly progress tracking against plan
  - Defer non-critical polish to Phase 3
  - Parallel development where possible
- **Contingency:** Cut scope (defer Comments or Export to Phase 3), extend timeline by 2 weeks max

**Risk 9: Dependency on email service delays launch**

- **Likelihood:** Low
- **Impact:** Medium (can't launch collaboration without invites)
- **Mitigation:**
  - Set up email service in Week 1 (parallel with Character work)
  - Test email delivery early (Week 2)
  - Have backup provider ready (SendGrid + Resend accounts)
- **Contingency:** Launch without invites, add shareable link workaround

---

## Using WorldCrafter Skills

All Phase 2 implementation should leverage the custom skills:

### Database Work

**Use:** `worldcrafter-database-setup`

- For: Schema design, migrations, RLS policies (Characters, Events, Items, Factions, Relationships, Collaboration models)

### Building Features

**Use:** `worldcrafter-feature-builder`

- For: All entity CRUD (forms, Server Actions, list/detail pages)
- For: Relationship graph UI
- For: Collaboration UI (invites, comments)
- For: Export functionality

### Authentication & Authorization

**Use:** `worldcrafter-auth-guard`

- For: Role-based access control (RBAC)
- For: RLS policies for collaboration
- For: Permission checks in Server Actions

### Testing

**Use:** `worldcrafter-test-generator`

- For: Unit, integration, and E2E tests
- For: Test factories for new entities
- For: Coverage analysis

### Not Sure?

**Use:** `worldcrafter-skill-selector`

- Will help choose the right skill for the task

---

## Estimated Effort Summary

| Week                | Focus                 | Hours   | Running Total |
| ------------------- | --------------------- | ------- | ------------- |
| Week 1-2            | Character Management  | 18      | 18            |
| Week 3              | Event Management      | 9       | 27            |
| Week 4              | Item Management       | 9       | 36            |
| Week 5              | Faction Management    | 9       | 45            |
| Week 6-7            | Relationships & Graph | 18      | 63            |
| Week 8              | Collaboration Basics  | 9       | 72            |
| Week 9              | Export & Polish       | 9       | 81            |
| Week 10             | Testing & Deployment  | 9       | 90            |
| **Total**           |                       | **90**  |               |
| **With 20% Buffer** |                       | **108** |               |

### Per Week Breakdown (Full-time Developer)

- **Weeks 1-2:** 9 hours/week (steady entity development)
- **Week 3-5:** 9 hours/week (3 entity types)
- **Weeks 6-7:** 9 hours/week (relationships + graph)
- **Week 8-10:** 9 hours/week (collaboration, export, testing)

### Part-time Options

- **15 hrs/week:** 6-7 weeks
- **20 hrs/week:** 4.5-5.4 weeks
- **30 hrs/week:** 3-3.6 weeks

---

## Next Steps

### Current Status Summary

✅ **Phase 1 Complete:**

- Authentication, Worlds, Locations, Search, Activity tracking
- 145 tests passing (76% coverage)
- Production-ready build

🔄 **Phase 2 Ready to Start:**

- All dependencies resolved
- Infrastructure in place
- Plan documented

### Immediate Next Tasks - Week 1 Day 1: Character Schema

**Priority 1: Character Database Setup (4 hours)**

1. Update `prisma/schema.prisma` with Character model
2. Create migration: `npx prisma migrate dev --name add_characters`
3. Create RLS policy file: `prisma/migrations/sql/004_character_rls.sql`
4. Apply RLS: `npm run db:rls`
5. Test in Supabase Studio: verify Character table and policies

**Priority 2: Character Zod Schemas (2 hours)**

1. Create `src/lib/schemas/character.schema.ts`
2. Define createCharacterSchema, updateCharacterSchema, characterFiltersSchema
3. Export TypeScript types

**Priority 3: Character Server Actions (3 hours)**

1. Create `src/app/worlds/[slug]/characters/actions.ts`
2. Implement 5 Server Actions (create, update, delete, get, list)
3. Add slug generation
4. Add activity logging
5. Add proper error handling and validation

---

## Questions & Support

### Have Questions?

- Check `CLAUDE.md` for project patterns
- Check skill documentation in `.claude/skills/*/SKILL.md`
- Check PRD v2: `docs/PRD_v2.md`
- Check Phase 1 plan: `docs/PHASE_1_IMPLEMENTATION_PLAN.md`

### Need Help?

- Ask: "Which skill should I use for [task]?" → skill-selector will help
- Ask: "How do I [specific task]?" → Relevant skill will provide guidance

### Reporting Issues

- Document bugs in `docs/BUGS.md` with priority (P0/P1/P2)
- Track progress using this plan (update completion percentages)
- Update this plan if timeline shifts significantly

---

**Ready to begin Phase 2 implementation! 🚀**

Start with Week 1, Day 1: Character Database Setup (4 hours)

Use `worldcrafter-database-setup` skill for schema and RLS, then `worldcrafter-feature-builder` for Server Actions.
