# WorldCrafter: Suggested Improvements

**Based on:** PRD v3.0 Strategic Analysis
**Current Status:** Phase 1 Complete + Characters (Week 1-2 of Phase 2)
**Last Updated:** January 2025

---

## Executive Summary

This document analyzes the gap between our current implementation and PRD v3.0's strategic vision. It prioritizes improvements across three categories:

1. **Quick Wins** - High impact, low effort (1-4 hours)
2. **Strategic Alignment** - Features that directly address market pain points
3. **Phase 2 Acceleration** - Critical features for March 2025 milestone

**Current Completion:**

- ✅ Phase 1 MVP: 100% (Worlds, Locations, Search, Auth)
- 🔄 Phase 2: 20% (Characters only)
- ❌ Phase 2 Remaining: 80% (Events, Items, Factions, Relationships, Collaboration, Export)

**Key Insight:** We need 72 more hours to complete Phase 2 by March 2025 deadline.

---

## Table of Contents

1. [Quick Wins (Priority 1)](#1-quick-wins-priority-1)
2. [Strategic UX Improvements](#2-strategic-ux-improvements)
3. [Missing Critical Features](#3-missing-critical-features)
4. [Data Portability Gaps](#4-data-portability-gaps)
5. [Dashboard Enhancements](#5-dashboard-enhancements)
6. [Mobile Experience](#6-mobile-experience)
7. [Onboarding & Discoverability](#7-onboarding--discoverability)
8. [Performance Optimizations](#8-performance-optimizations)

---

## 1. Quick Wins (Priority 1)

### 1.1 Add Entity Count Cards to Dashboard (2 hours)

**Problem:** Dashboard only shows location count. PRD v3.0 emphasizes all 5 entity types.

**Current State:**

- ✅ Locations card exists
- ❌ Characters card missing (but characters exist in DB!)
- ❌ Events, Items, Factions cards missing

**Solution:**
Update `world-dashboard.tsx` to show character count:

```typescript
interface WorldDashboardProps {
  world: World
  activities: ActivityWithUser[]
  locationCount: number
  characterCount: number  // ADD THIS
}

// Add card:
<Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">Characters</CardTitle>
    <Users className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">{characterCount}</div>
    <p className="text-xs text-muted-foreground mt-1">
      {characterCount === 0 ? "No characters yet" : `${characterCount} character${characterCount === 1 ? "" : "s"}`}
    </p>
  </CardContent>
</Card>
```

**Impact:** Users immediately see their world's progress across entities.

**File to Edit:** `src/components/worlds/world-dashboard.tsx`, `src/app/worlds/[slug]/page.tsx`

---

### 1.2 Add Quick Action Buttons to Dashboard (2 hours)

**Problem:** Users must navigate to separate pages to create entities. PRD v3.0 emphasizes "first value within 10 minutes."

**Current State:**

- Dashboard is read-only
- No quick actions for common tasks

**Solution:**
Add "Quick Actions" section above stats cards:

```typescript
<div className="flex gap-2 mb-6 flex-wrap">
  <Button asChild size="sm">
    <Link href={`/worlds/${world.slug}/characters/new`}>
      <Plus className="w-4 h-4 mr-2" />
      Add Character
    </Link>
  </Button>
  <Button asChild size="sm" variant="outline">
    <Link href={`/worlds/${world.slug}/locations/new`}>
      <Plus className="w-4 h-4 mr-2" />
      Add Location
    </Link>
  </Button>
  {/* Future: Add Event, Add Item, Add Faction */}
</div>
```

**Impact:** Reduces time to create first entity from 3 clicks to 1 click.

**Files to Edit:** `src/components/worlds/world-dashboard.tsx`

---

### 1.3 Add "Getting Started" Empty State (2 hours)

**Problem:** New users see empty dashboard with no guidance. PRD v3.0 emphasizes "progressive disclosure" and "empty states that guide next action."

**Current State:**

- Dashboard shows 0 for all counts
- No guidance on what to do first

**Solution:**
Show helpful card when world has zero entities:

```typescript
{locationCount === 0 && characterCount === 0 && (
  <Card className="col-span-full">
    <CardHeader>
      <CardTitle>Welcome to your new world! 🌍</CardTitle>
      <CardDescription>
        Let's start building. Here are some suggestions:
      </CardDescription>
    </CardHeader>
    <CardContent>
      <ol className="list-decimal list-inside space-y-2">
        <li>Create a <strong>Location</strong> (e.g., a city, region, or planet)</li>
        <li>Add a <strong>Character</strong> (protagonist, villain, or NPC)</li>
        <li>Use <strong>⌘K</strong> to quickly search and navigate</li>
      </ol>
      <div className="flex gap-2 mt-4">
        <Button asChild>
          <Link href={`/worlds/${world.slug}/locations/new`}>
            Create First Location
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/worlds/${world.slug}/characters/new`}>
            Create First Character
          </Link>
        </Button>
      </div>
    </CardContent>
  </Card>
)}
```

**Impact:** Reduces bounce rate for new users by providing clear next steps.

**Files to Edit:** `src/components/worlds/world-dashboard.tsx`

---

### 1.4 Add Breadcrumb Navigation (1 hour)

**Problem:** Users get lost in deep navigation (World → Characters → Character Detail). No way to navigate back without browser back button.

**Current State:**

- No breadcrumbs on any page
- Users rely on browser back button

**Solution:**
Add breadcrumb component used across all entity pages:

```typescript
// src/components/ui/breadcrumbs.tsx
export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight className="w-4 h-4" />}
          {item.href ? (
            <Link href={item.href} className="hover:text-foreground">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

// Usage in character detail page:
<Breadcrumbs items={[
  { label: "Worlds", href: "/worlds" },
  { label: world.name, href: `/worlds/${world.slug}` },
  { label: "Characters", href: `/worlds/${world.slug}/characters` },
  { label: character.name },
]} />
```

**Impact:** Improves navigation clarity, reduces user frustration.

**Files to Create:** `src/components/ui/breadcrumbs.tsx`
**Files to Edit:** All entity detail pages

---

## 2. Strategic UX Improvements

### 2.1 Progressive Disclosure: Collapse Advanced Fields (3 hours)

**Problem:** PRD v3.0 strategic principle: "Clarity Over Features" - hide complexity until needed. Character form shows all fields at once (overwhelming for beginners).

**Current State:**

- Character form has 5 tabs (good!)
- But "Advanced" tab always visible
- Custom attributes (JSON) exposed early

**Solution:**

1. Hide "Advanced" tab by default
2. Add "Show Advanced Options" toggle button
3. Show tooltip: "For genre-specific stats (STR, DEX, etc.)"

```typescript
const [showAdvanced, setShowAdvanced] = useState(false);

<Tabs defaultValue="basics">
  <TabsList>
    <TabsTrigger value="basics">Basics</TabsTrigger>
    <TabsTrigger value="appearance">Appearance</TabsTrigger>
    <TabsTrigger value="personality">Personality</TabsTrigger>
    <TabsTrigger value="backstory">Backstory</TabsTrigger>
    {showAdvanced && <TabsTrigger value="advanced">Advanced</TabsTrigger>}
  </TabsList>

  {!showAdvanced && (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setShowAdvanced(true)}
      className="mt-2"
    >
      <Plus className="w-4 h-4 mr-2" />
      Show Advanced Options
    </Button>
  )}

  {/* ... tabs content ... */}
</Tabs>
```

**Impact:** Reduces cognitive load for new users, maintains power user features.

**Applies to:** Character form (current), Event/Item/Faction forms (future)

**Files to Edit:** `src/components/forms/character-form.tsx`

---

### 2.2 Inline Editing for Quick Updates (4 hours)

**Problem:** PRD v3.0 emphasizes "Fast performance (< 500ms navigations)". Currently, editing a character requires:

1. Click "Edit" button
2. Navigate to edit page
3. Update form
4. Submit
5. Navigate back

**Current State:**

- All edits require full page navigation
- 3-5 seconds per quick edit

**Solution:**
Add inline editing for simple fields on detail pages:

```typescript
// On character detail page
<div className="group relative">
  <h2 className="text-2xl font-bold">{character.name}</h2>
  <Button
    variant="ghost"
    size="sm"
    className="opacity-0 group-hover:opacity-100 absolute -right-8 top-0"
    onClick={() => setEditingName(true)}
  >
    <Pencil className="w-4 h-4" />
  </Button>
</div>

{editingName && (
  <Dialog open onOpenChange={() => setEditingName(false)}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit Name</DialogTitle>
      </DialogHeader>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />
      <DialogFooter>
        <Button onClick={handleSaveInline}>Save</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)}
```

**Fields to Enable Inline Editing:**

- Character: name, role, species, age
- Location: name, type, population
- All entities: tags (future feature)

**Impact:** 80% of edits complete in < 2 seconds (vs. 5+ seconds now).

**Files to Edit:** `src/components/characters/character-detail.tsx`, other detail pages

---

### 2.3 Keyboard Shortcuts Guide (2 hours)

**Problem:** PRD v3.0 mentions "⌘K universal search for discoverability" but no other shortcuts. Power users want more keyboard navigation.

**Current State:**

- ⌘K works for search (great!)
- No other keyboard shortcuts
- No shortcuts documentation

**Solution:**

1. Add keyboard shortcut modal (⌘/ or ? to open)
2. Implement common shortcuts:
   - `G` then `D` → Dashboard
   - `G` then `C` → Characters
   - `G` then `L` → Locations
   - `N` → New (context-aware: new character if on characters page)
   - `E` → Edit (when viewing an entity)
   - `Esc` → Close modals/dialogs

```typescript
// src/hooks/use-keyboard-shortcuts.ts
export function useKeyboardShortcuts(worldSlug: string) {
  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      // G + D = Dashboard
      if (isSequence("g", "d")) {
        router.push(`/worlds/${worldSlug}`);
      }
      // G + C = Characters
      if (isSequence("g", "c")) {
        router.push(`/worlds/${worldSlug}/characters`);
      }
      // ... etc
    }

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [worldSlug]);
}
```

**Impact:** Power users navigate 3-5x faster. Competitive advantage (World Anvil lacks this).

**Files to Create:** `src/hooks/use-keyboard-shortcuts.ts`, `src/components/ui/shortcuts-modal.tsx`

---

## 3. Missing Critical Features

### 3.1 Events, Items, Factions (Priority: CRITICAL)

**Problem:** PRD v3.0 Phase 2 goal: "Complete all 5 core entity types." We only have 2/5 (Locations, Characters).

**Current State:**

- ❌ Events: 0% complete (Week 3 of Phase 2 plan)
- ❌ Items: 0% complete (Week 4 of Phase 2 plan)
- ❌ Factions: 0% complete (Week 5 of Phase 2 plan)

**Required:** 27 hours (9 hours each)

- Week 3: Event Management (schema, forms, list/detail)
- Week 4: Item Management (schema, forms, list/detail)
- Week 5: Faction Management (schema, forms, list/detail)

**Impact:** Without these, we're at 40% feature parity with competitors (vs. target: 100%).

**Priority:** **P0 - BLOCKING PHASE 2 LAUNCH**

**Action:** Follow Phase 2 Implementation Plan exactly (Week 3-5).

**Use Skills:** `worldcrafter-database-setup`, `worldcrafter-feature-builder`

---

### 3.2 Relationships & Graph Visualization (Priority: CRITICAL)

**Problem:** PRD v3.0 unique value prop: "Living Document System" and "Relationship graph visualization." This is our **key differentiator** vs. Notion/Obsidian.

**Current State:**

- ❌ Relationship model doesn't exist
- ❌ No way to link entities together
- ❌ Graph visualization doesn't exist

**Required:** 18 hours (Week 6-7 of Phase 2)

- Relationship schema + RLS (6 hours)
- Relationship UI on entity pages (4 hours)
- Graph visualization with React Flow (6 hours)
- Graph export (2 hours)

**Impact:** This is the #1 most requested feature in worldbuilding tools. Without it, we're just another database.

**Priority:** **P0 - BLOCKING PHASE 2 LAUNCH**

**Action:** Follow Phase 2 Implementation Plan exactly (Week 6-7).

**Use Skills:** `worldcrafter-database-setup`, `worldcrafter-feature-builder`

---

### 3.3 Export (JSON + Markdown) (Priority: CRITICAL)

**Problem:** PRD v3.0 principle: "Data Freedom - Export at ALL tiers (not paywalled)." This addresses #1 user pain point: "Lock-in anxiety."

**Current State:**

- ❌ No export functionality
- ❌ Users can't backup their data
- ❌ Can't use data in other tools (Obsidian, etc.)

**Required:** 7 hours (Week 9 Days 1-4)

- JSON export (3 hours)
- Markdown export with frontmatter (4 hours)

**Impact:** Users won't trust us without export. Competitive necessity (Kanka paywalls export, we don't).

**Priority:** **P0 - BLOCKING PHASE 2 LAUNCH**

**Quote from PRD v3.0:** "One-click export to open formats, no lock-in"

**Action:** Follow Phase 2 Implementation Plan exactly (Week 9).

**Use Skills:** `worldcrafter-feature-builder`

---

### 3.4 Collaboration (Invites, Roles, Comments) (Priority: HIGH)

**Problem:** PRD v3.0 principle: "Collaborative by Design." Target: 30%+ users invite at least 1 collaborator.

**Current State:**

- ❌ No collaboration features
- ❌ Worlds are single-user only
- ❌ No sharing, no comments

**Required:** 9 hours (Week 8 of Phase 2)

- WorldMember & Comment models (5 hours)
- Member management UI (2 hours)
- Comment section on entity pages (2 hours)

**Impact:** GMs want to share with players. Writers want to share with beta readers. This is key for viral growth.

**Priority:** **P1 - REQUIRED FOR PHASE 2**

**Target Metric:** 30%+ adoption = 300+ users invite someone (out of 1,000 signups)

**Action:** Follow Phase 2 Implementation Plan exactly (Week 8).

**Use Skills:** `worldcrafter-auth-guard`, `worldcrafter-feature-builder`

---

## 4. Data Portability Gaps

### 4.1 Missing: One-Click Backup Button (1 hour)

**Problem:** PRD v3.0: "Data freedom via one-click exports." Users fear data loss.

**Current State:**

- No backup functionality
- Users can't download a snapshot

**Solution:**
Add "Backup World" button to settings:

```typescript
<Button onClick={handleBackup}>
  <Download className="w-4 h-4 mr-2" />
  Backup World (JSON)
</Button>

async function handleBackup() {
  const backup = await exportWorldJSON(world.id);
  // Trigger immediate download
  const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${world.slug}-backup-${Date.now()}.json`;
  a.click();
}
```

**Impact:** Users feel safe. Reduces fear of data loss. Quick win before full export feature (Week 9).

**Files to Edit:** `src/app/worlds/[slug]/settings/page.tsx`

---

### 4.2 Missing: Import from JSON (Future - Phase 3)

**Problem:** PRD v3.0 mentions import (Phase 3), but users expect it alongside export.

**Current State:**

- Can't import worlds
- Can't restore backups
- Can't migrate from other tools

**Solution (Future):**

- Week 9 export creates format
- Phase 3 adds import wizard
- Support Kanka, World Anvil exports

**Note:** Defer to Phase 3, but document format now.

---

## 5. Dashboard Enhancements

### 5.1 Add Recent Activity Filters (2 hours)

**Problem:** Activity feed shows all actions. Users want to filter by entity type.

**Current State:**

- Shows last 20 activities (mixed types)
- No filters

**Solution:**
Add filter dropdown above activity feed:

```typescript
<Select value={activityFilter} onValueChange={setActivityFilter}>
  <SelectTrigger>
    <SelectValue placeholder="All Activity" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All Activity</SelectItem>
    <SelectItem value="location">Locations Only</SelectItem>
    <SelectItem value="character">Characters Only</SelectItem>
    {/* Future: event, item, faction */}
  </SelectContent>
</Select>

<ActivityFeed
  activities={activities.filter(a =>
    activityFilter === 'all' || a.entityType === activityFilter
  )}
/>
```

**Impact:** Users can focus on what changed in specific entity types.

**Files to Edit:** `src/components/worlds/world-dashboard.tsx`

---

### 5.2 Add World Completeness Score (3 hours)

**Problem:** PRD v3.0 mentions "Completeness scores gamify filling out details" (Phase 3), but simple version could ship now.

**Current State:**

- No indication of world "completeness"
- Users don't know what's missing

**Solution:**
Calculate simple completeness:

```typescript
function calculateCompleteness(world: World, counts: EntityCounts) {
  let score = 0;
  let total = 5;

  // Has description
  if (world.description) score += 1;

  // Has at least 3 locations
  if (counts.locations >= 3) score += 1;

  // Has at least 3 characters
  if (counts.characters >= 3) score += 1;

  // Has at least 1 relationship (future)
  // if (counts.relationships >= 1) score += 1;

  // Has at least 5 entities total
  if (counts.total >= 5) score += 1;

  return Math.round((score / total) * 100);
}

// Show on dashboard:
<Card>
  <CardHeader>
    <CardTitle className="text-sm font-medium">Completeness</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">{completeness}%</div>
    <Progress value={completeness} className="mt-2" />
    <p className="text-xs text-muted-foreground mt-2">
      {completeness < 30 && "Just getting started"}
      {completeness >= 30 && completeness < 70 && "Making progress!"}
      {completeness >= 70 && "Well developed!"}
    </p>
  </CardContent>
</Card>
```

**Impact:** Gamification encourages users to add more content. Increases engagement.

**Files to Edit:** `src/components/worlds/world-dashboard.tsx`

---

### 5.3 Add Quick Stats Panel (2 hours)

**Problem:** Users want to see world stats at a glance without scrolling.

**Current State:**

- Stats cards are good but basic
- No aggregated stats

**Solution:**
Add stats panel above activity feed:

```typescript
<Card>
  <CardHeader>
    <CardTitle>World Statistics</CardTitle>
  </CardHeader>
  <CardContent className="grid grid-cols-2 gap-4 text-sm">
    <div>
      <span className="text-muted-foreground">Total Entities:</span>
      <span className="font-bold ml-2">{totalEntities}</span>
    </div>
    <div>
      <span className="text-muted-foreground">Last Edit:</span>
      <span className="font-bold ml-2">{formatDistanceToNow(world.updatedAt)}</span>
    </div>
    <div>
      <span className="text-muted-foreground">Created:</span>
      <span className="font-bold ml-2">{formatDistanceToNow(world.createdAt)} ago</span>
    </div>
    <div>
      <span className="text-muted-foreground">Privacy:</span>
      <Badge variant="outline" className="ml-2">{privacyLabels[world.privacy]}</Badge>
    </div>
  </CardContent>
</Card>
```

**Impact:** Users get snapshot of world health.

**Files to Edit:** `src/components/worlds/world-dashboard.tsx`

---

## 6. Mobile Experience

### 6.1 Improve Touch Targets (2 hours)

**Problem:** PRD v3.0: "Touch-friendly (44x44px targets)." Some buttons are too small on mobile.

**Current State:**

- Most buttons are okay
- Icon-only buttons might be < 44px
- Dropdown menus hard to tap

**Solution:**
Audit all icon buttons and ensure minimum size:

```typescript
// Before:
<Button size="sm" variant="ghost">
  <Pencil className="w-4 h-4" />
</Button>

// After:
<Button size="sm" variant="ghost" className="min-h-[44px] min-w-[44px]">
  <Pencil className="w-4 h-4" />
</Button>
```

**Files to Audit:** All components with icon-only buttons

**Impact:** Better mobile UX, meets accessibility standards.

---

### 6.2 Add Mobile-Optimized List Views (3 hours)

**Problem:** Character list has card/table views, but table view is cramped on mobile.

**Current State:**

- Table view works on desktop
- Breaks on mobile (<640px)

**Solution:**
Force card view on mobile, hide table toggle:

```typescript
const isMobile = useMediaQuery('(max-width: 640px)');

{!isMobile && (
  <Tabs value={viewMode} onValueChange={setViewMode}>
    <TabsList>
      <TabsTrigger value="card">Card View</TabsTrigger>
      <TabsTrigger value="table">Table View</TabsTrigger>
    </TabsList>
  </Tabs>
)}

{/* Always show cards on mobile */}
{(isMobile || viewMode === 'card') && <CharacterCards characters={characters} />}
{!isMobile && viewMode === 'table' && <CharacterTable characters={characters} />}
```

**Impact:** Better mobile experience, no horizontal scrolling.

**Files to Edit:** `src/components/characters/characters-list.tsx`, other list components

---

## 7. Onboarding & Discoverability

### 7.1 Add Interactive Tour (4 hours)

**Problem:** PRD v3.0: "Onboarding tour showing example hierarchy" (Phase 2 risk mitigation). New users don't know where to start.

**Current State:**

- No onboarding
- Users dropped into empty dashboard

**Solution:**
Add Shepherd.js or Joyride tour on first visit:

```typescript
const steps = [
  {
    target: '.dashboard-stats',
    content: 'This is your world dashboard. Track locations, characters, and more.',
  },
  {
    target: '.quick-actions',
    content: 'Use these buttons to quickly add entities to your world.',
  },
  {
    target: '.search-button',
    content: 'Press ⌘K anytime to search your entire world.',
  },
  {
    target: '.activity-feed',
    content: 'See all recent changes here. Never lose track of what you edited.',
  },
];

<Tour steps={steps} run={isFirstVisit} />
```

**Dependencies:**

```bash
npm install react-joyride
```

**Impact:** 40%+ D1 retention (PRD target) requires good onboarding.

**Files to Create:** `src/components/onboarding/world-tour.tsx`

---

### 7.2 Add Sample World Template (3 hours)

**Problem:** PRD v3.0: "Genre templates" (Phase 3), but a simpler "Example World" can ship now.

**Current State:**

- Users start with blank world
- No examples to learn from

**Solution:**
Add "Create Example World" button on worlds page:

```typescript
async function createExampleWorld(userId: string) {
  const world = await createWorld({
    name: "Example Fantasy World",
    genre: "FANTASY",
    description:
      "A sample world to help you get started. Feel free to edit or delete!",
  });

  // Create 3 sample locations
  await createLocation(world.id, {
    name: "Silverdale",
    type: "City",
    description: "A bustling city known for its silver mines.",
  });

  // Create 2 sample characters
  await createCharacter(world.id, {
    name: "Aldrin the Wise",
    role: "Wizard",
    species: "Human",
    appearance: "An ancient wizard with a long white beard.",
  });

  // ... etc

  return world;
}
```

**Impact:** Users understand structure by example. Reduces cognitive load.

**Files to Edit:** `src/app/worlds/page.tsx`

---

## 8. Performance Optimizations

### 8.1 Add Pagination to Lists (3 hours)

**Problem:** PRD v3.0: "Pagination on all list views (20-50 items per page)." Character list loads ALL characters.

**Current State:**

- Loads all characters in one query
- Slow for worlds with 100+ characters

**Solution:**
Add cursor-based pagination:

```typescript
// Server Action
export async function getCharacters(
  worldId: string,
  cursor?: string,
  limit = 50
) {
  const characters = await prisma.character.findMany({
    where: { worldId },
    take: limit + 1, // Take one extra to check if there's more
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' },
  });

  const hasMore = characters.length > limit;
  const items = hasMore ? characters.slice(0, -1) : characters;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return { items, nextCursor, hasMore };
}

// Component
function CharactersList() {
  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['characters', worldId],
    queryFn: ({ pageParam }) => getCharacters(worldId, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  return (
    <>
      {data.pages.map(page => page.items.map(char => <CharacterCard key={char.id} character={char} />))}
      {hasNextPage && (
        <Button onClick={() => fetchNextPage()}>Load More</Button>
      )}
    </>
  );
}
```

**Impact:** Page load time: 2s → 300ms (for large worlds).

**Files to Edit:** All list components (characters, locations, events, items, factions)

**Dependencies:**

```bash
npm install @tanstack/react-query
```

---

### 8.2 Add Loading Skeletons (2 hours)

**Problem:** Character detail page shows blank screen while loading. PRD v3.0: "Loading states" required.

**Current State:**

- Uses `loading.tsx` (good!)
- But skeleton doesn't match actual layout

**Solution:**
Improve loading skeletons to match final layout:

```typescript
// src/app/worlds/[slug]/characters/[characterSlug]/loading.tsx
export default function Loading() {
  return (
    <div className="container mx-auto py-8">
      <Skeleton className="h-8 w-64 mb-4" /> {/* Breadcrumbs */}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-64 w-full" /> {/* Portrait + Name */}
          <Skeleton className="h-48 w-full" /> {/* Appearance */}
          <Skeleton className="h-48 w-full" /> {/* Personality */}
        </div>

        <div className="space-y-6">
          <Skeleton className="h-32 w-full" /> {/* Quick Stats */}
          <Skeleton className="h-48 w-full" /> {/* Relationships */}
        </div>
      </div>
    </div>
  );
}
```

**Impact:** Perceived performance improves (feels faster even if actual time same).

**Files to Edit:** All `loading.tsx` files

---

## Priority Matrix

| Feature                      | Impact   | Effort | Priority | Blocking Phase 2? |
| ---------------------------- | -------- | ------ | -------- | ----------------- |
| **Events, Items, Factions**  | CRITICAL | 27h    | P0       | YES               |
| **Relationships & Graph**    | CRITICAL | 18h    | P0       | YES               |
| **Export (JSON + Markdown)** | CRITICAL | 7h     | P0       | YES               |
| **Collaboration**            | HIGH     | 9h     | P1       | YES               |
| Quick Action Buttons         | HIGH     | 2h     | P1       | NO                |
| Entity Count Cards           | HIGH     | 2h     | P1       | NO                |
| Getting Started Empty State  | HIGH     | 2h     | P1       | NO                |
| Progressive Disclosure       | MEDIUM   | 3h     | P2       | NO                |
| Breadcrumb Navigation        | MEDIUM   | 1h     | P2       | NO                |
| Pagination                   | MEDIUM   | 3h     | P2       | NO                |
| Keyboard Shortcuts           | LOW      | 2h     | P3       | NO                |
| Interactive Tour             | LOW      | 4h     | P3       | NO                |

---

## Recommended Implementation Order

### Week 1 (Next Week): Quick Wins

**Total: 9 hours**

1. Entity count cards (2h)
2. Quick action buttons (2h)
3. Getting started empty state (2h)
4. Breadcrumb navigation (1h)
5. Activity filters (2h)

**Result:** Improved dashboard UX, better onboarding.

---

### Week 2-3: Core Phase 2 Features

**Total: 27 hours (follow Phase 2 plan exactly)**

- Week 2: Event Management (9h)
- Week 3: Item Management (9h)
- Week 3.5: Faction Management (9h)

**Result:** All 5 entity types complete.

---

### Week 4-5: Relationships

**Total: 18 hours (follow Phase 2 plan exactly)**

- Relationship schema + Server Actions (6h)
- Relationship UI on entity pages (4h)
- Graph visualization (6h)
- Graph export (2h)

**Result:** Key differentiator shipped.

---

### Week 6: Collaboration + Export

**Total: 16 hours (follow Phase 2 plan exactly)**

- Collaboration (9h)
- Export (7h)

**Result:** Phase 2 feature-complete.

---

### Week 7: Polish + Testing

**Total: 18 hours**

- Progressive disclosure (3h)
- Pagination (3h)
- Loading skeletons (2h)
- E2E tests (4h)
- Coverage (2h)
- Documentation (2h)
- Deployment (2h)

**Result:** Phase 2 ready to launch.

---

## Total Effort Required

| Category                         | Hours        |
| -------------------------------- | ------------ |
| Quick Wins (Week 1)              | 9            |
| Phase 2 Core Features (Week 2-5) | 63           |
| Polish & Testing (Week 7)        | 18           |
| **TOTAL**                        | **90 hours** |

**Current Completion:** 18 hours (20%)
**Remaining:** 72 hours (80%)

**Timeline at 9 hours/week:** 8 weeks (by March 31, 2025) ✅ Meets deadline

---

## Success Metrics (Phase 2)

After implementing all suggestions:

**Functionality:**

- ✅ All 5 entity types (Locations, Characters, Events, Items, Factions)
- ✅ Relationship system + graph visualization
- ✅ Collaboration (invites, roles, comments)
- ✅ Export (JSON, Markdown)

**Quality:**

- ✅ 80%+ test coverage
- ✅ Zero P0 bugs
- ✅ < 10 P1 bugs
- ✅ Lighthouse score > 90

**User Experience:**

- ✅ First value within 10 minutes (getting started guide)
- ✅ Progressive disclosure (hide complexity)
- ✅ Mobile-friendly (44px touch targets)
- ✅ Fast navigation (< 500ms, keyboard shortcuts)

**User Metrics (Post-Launch):**

- Target: 1,000+ signups in 3 months
- Target: 40%+ D1 retention
- Target: 25%+ D7 retention
- Target: NPS > 40

---

## Strategic Alignment with PRD v3.0

### Core Principles Met:

1. ✅ **Flexibility Without Chaos** - Custom JSON attributes, not rigid templates
2. ⚠️ **Clarity Over Features** - Partially (need progressive disclosure)
3. ⚠️ **Data Freedom** - Blocked (need export)
4. ⚠️ **Collaborative by Design** - Blocked (need collaboration features)
5. ✅ **AI as Assistant** - N/A (Phase 3)

### Differentiation Strategy:

- ✅ **Simple Onboarding** - Quick wins improve this
- ✅ **Flexible Structure** - Already implemented
- ⚠️ **Data Portability** - BLOCKED (critical gap)
- ⚠️ **Rich Visualizations** - BLOCKED (need graph)
- ✅ **Mobile/Tablet UX** - Mostly done, improvements needed

---

## Questions & Decisions Needed

### Q1: Should we defer anything to Phase 3?

**Options:**

- A) Ship all Phase 2 features as planned (90h)
- B) Defer Collaboration to Phase 3, ship sooner (81h, -9h)
- C) Defer Factions to Phase 3, ship sooner (81h, -9h)

**Recommendation:** Option A. Collaboration is critical for viral growth.

---

### Q2: Should we add TanStack Query now or later?

**Context:** Pagination requires TanStack Query (or similar). It's not in current stack.

**Options:**

- A) Add now (increases complexity but enables pagination)
- B) Defer, use simple "Load More" button with Server Actions
- C) Wait for Phase 3

**Recommendation:** Option B for Phase 2. Add TanStack Query in Phase 3 for real-time features.

---

### Q3: Priority: UX polish vs. feature completion?

**Current state:** Basic features work but UX could be smoother.

**Options:**

- A) Finish all Phase 2 features first, then polish
- B) Do quick wins (9h) now, then features, then more polish
- C) Perfect each feature before moving to next

**Recommendation:** Option B. Quick wins boost morale and user experience while we build core features.

---

## Next Actions

### Immediate (This Week):

1. ✅ Review this document with team
2. ☐ Decide on Q1-Q3 above
3. ☐ Start Week 1 Quick Wins (9 hours)
   - Entity count cards
   - Quick action buttons
   - Getting started empty state
   - Breadcrumbs
   - Activity filters

### Next 2 Weeks:

4. ☐ Execute Week 3-4 of Phase 2 Plan (Events + Items) - 18 hours
5. ☐ Execute Week 5 of Phase 2 Plan (Factions) - 9 hours

### Following 3 Weeks:

6. ☐ Execute Week 6-7 of Phase 2 Plan (Relationships + Graph) - 18 hours
7. ☐ Execute Week 8 of Phase 2 Plan (Collaboration) - 9 hours
8. ☐ Execute Week 9 of Phase 2 Plan (Export) - 7 hours

### Final 2 Weeks:

9. ☐ Execute Week 10 of Phase 2 Plan (Testing + Deployment) - 9 hours
10. ☐ Polish UX (progressive disclosure, pagination, loading states) - 10 hours
11. ☐ Launch Phase 2! 🚀

---

**Document Version:** 1.0
**Next Review:** After Week 1 Quick Wins complete
**Owner:** Product Team
