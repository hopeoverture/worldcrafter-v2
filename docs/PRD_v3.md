# WorldCrafter: Product Requirements Document v3.0

**Version:** 3.0
**Last Updated:** January 2025
**Document Owner:** Product Team
**Status:** Phase 1 Complete, Phase 2 Ready to Start

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Strategic Foundation](#2-strategic-foundation)
3. [Target Users & Personas](#3-target-users--personas)
4. [Product Roadmap](#4-product-roadmap)
5. [Functional Requirements](#5-functional-requirements)
6. [Technical Architecture](#6-technical-architecture)
7. [Success Metrics & KPIs](#7-success-metrics--kpis)
8. [Release Criteria](#8-release-criteria)
9. [Risks & Mitigation](#9-risks--mitigation)
10. [Open Questions](#10-open-questions)

---

## 1. Executive Summary

### 1.1 Product Vision

**Mission:** Empower storytellers to build living, breathing worlds with the ease of conversation and the power of structured data.

**Strategic Opportunity:** The world-building tools market is fragmented with no clear leader. Users bounce between niche tools (powerful but rigid/complex) and general tools (flexible but high setup effort). WorldCrafter bridges this gap with a unified platform that's:

- **Flexible without chaos** - Structured entities with custom fields, not rigid templates
- **Clean and fast** - Progressive disclosure, not feature overload
- **Portable by design** - One-click exports to open formats, no lock-in
- **Collaboratively built** - Real-time co-creation, not isolated silos
- **AI-assisted, not AI-driven** - Opt-in suggestions that enhance, never replace

### 1.2 Current Status (January 2025)

**Phase 1 MVP: ✅ Complete and Production-Ready**

**What's Built:**

- ✅ User authentication with Supabase Auth (email/password, sessions)
- ✅ Row-Level Security (RLS) enforced at database level
- ✅ World management (create, edit, delete with privacy controls)
- ✅ Location management (hierarchical, 13 types, rich attributes)
- ✅ PostgreSQL full-text search with ⌘K shortcut
- ✅ Activity tracking and audit logs
- ✅ 145 automated tests with 76% coverage
- ✅ Production deployment on Vercel

**Technical Stack Validated:**

- Next.js 16 (App Router) + React 19
- Supabase PostgreSQL + Prisma ORM
- Tailwind CSS v4 + shadcn/ui
- Vitest (unit/integration) + Playwright (E2E)

### 1.3 What's Next (Phase 2 - 10 Weeks)

**Focus:** Complete core entity types and enable collaboration

**Priorities:**

1. **Characters** - Portraits, relationships, backstories
2. **Events** - Timeline integration, participants
3. **Items/Artifacts** - Ownership tracking, properties
4. **Factions** - Org charts, alliances/rivalries
5. **Relationships** - Typed connections with graph visualization
6. **Collaboration** - Invites, roles (Viewer/Editor/Admin), comments
7. **Export** - JSON and Markdown for data portability

**Target:** 1,000+ signups, 40%+ D1 retention, NPS > 40

### 1.4 Strategic Objectives (2025)

| Phase       | Timeline | Goal                   | Success Metric                |
| ----------- | -------- | ---------------------- | ----------------------------- |
| **Phase 2** | Q1 2025  | Core features complete | 1K signups, 500 MAU           |
| **Phase 3** | Q2 2025  | AI differentiation     | 10K MAU, 50%+ try AI          |
| **Phase 4** | Q3 2025  | ChatGPT distribution   | 50K MAU, 10K ChatGPT installs |

---

## 2. Strategic Foundation

### 2.1 Market Landscape & Competitor Pain Points

**The Problem:** World-building tools fall into three camps, each with fatal flaws:

#### Niche World-Building Tools (World Anvil, Kanka, LegendKeeper)

**Strengths:** Rich features, templates, TTRPG focus
**Fatal Flaws:**

- Overwhelming, cluttered UIs scare off beginners
- Rigid templates don't fit all genres/workflows
- Steep learning curves (hours before first value)
- Confusing pricing tiers and paywalled features
- Weak mobile experiences

#### General Knowledge Tools (Notion, Obsidian, OneNote)

**Strengths:** Extreme flexibility, generous free tiers
**Fatal Flaws:**

- Massive setup tax before usefulness
- No native world-building features (DIY everything)
- Technical learning curve for non-coders
- No collaboration designed for creative teams

#### Author-Focused Tools (Scrivener, Campfire, Reedsy)

**Strengths:** Manuscript integration, plot tools
**Fatal Flaws:**

- Weak world-building features (maps, timelines)
- Poor relationship tracking
- Dated/complex UIs
- Not designed for TTRPG GMs

**Cross-Tool Pain Points We Solve:**

1. **Complexity fatigue** → Progressive disclosure, clean UI
2. **Template rigidity** → Custom fields via JSON, flexible entities
3. **Lock-in anxiety** → One-click export to Markdown/JSON (not paywalled)
4. **Collaboration friction** → Built-in roles, player-safe views
5. **Mobile neglect** → Mobile-first responsive design
6. **AI gimmicks** → Opt-in assistants that enhance, never replace

### 2.2 Product Principles

#### Core Design Principles

**1. Flexibility Without Chaos**

- Structured entities (not freeform notes) with custom attributes (not rigid templates)
- Multiple views (tree, table, graph) for different workflows
- Tags and collections for non-linear organization

**2. Clarity Over Features**

- Progressive disclosure: hide complexity until needed
- Empty states that guide next action
- ⌘K universal search for discoverability
- No feature overload on first load

**3. Data Freedom**

- Export at ALL tiers (not paywalled)
- Open formats (Markdown, JSON, CSV)
- API access for power users
- No vendor lock-in

**4. Collaborative by Design**

- Role-based access (Viewer → Editor → Admin → Owner)
- Player-safe views (hide GM secrets)
- Comments with @mentions
- Real-time presence indicators (Phase 3)

**5. AI as Assistant, Not Replacement**

- Opt-in (can be disabled)
- User reviews/accepts all AI output
- Contextual (knows your world's style)
- Privacy-first (data not used for training)

#### Experience Goals

**For Novelists:**

- Track 50+ characters without inconsistencies
- Visualize political alliances and character arcs
- Reference world details quickly while drafting
- Export world bible for beta readers

**For TTRPG GMs:**

- Prep sessions in under 30 minutes (vs. 4 hours)
- Quick reference during gameplay on laptop/tablet
- Share spoiler-free info with players
- Generate NPCs that fit world lore

**For Both:**

- First value within 10 minutes of signup
- Intuitive, uncluttered interface
- Fast performance (< 500ms navigations)
- Works offline (mobile PWA in Phase 3)

### 2.3 Our Differentiation Strategy

**What Makes Us Different:**

| Competitor Pain Point  | Our Solution                           | Implementation |
| ---------------------- | -------------------------------------- | -------------- |
| Overwhelming UIs       | Progressive disclosure, ⌘K search      | ✅ Phase 1     |
| Rigid templates        | Custom JSON attributes per entity      | ✅ Phase 1     |
| Poor mobile            | Mobile-first Tailwind, touch targets   | ✅ Phase 1     |
| Vendor lock-in         | One-click export (not paywalled)       | → Phase 2      |
| Weak collaboration     | Built-in roles, comments, player views | → Phase 2      |
| Missing visualizations | Relationship graph, maps, timelines    | → Phase 2-3    |
| Gimmicky AI            | Contextual, opt-in assistants          | → Phase 3      |
| Complex pricing        | Generous free tier, simple tiers       | → Phase 3      |

**Unique Value Propositions:**

1. **Living Document System** (Phase 2)
   - Auto-updates references when entities change
   - No broken links, always consistent

2. **Player's View Portal** (Phase 3)
   - Curated, spoiler-free sharing for TTRPG players
   - Toggle visibility per entity/field

3. **Conversational Interface** (Phase 4)
   - ChatGPT Apps SDK integration
   - Build worlds through conversation
   - MCP server exposes all functionality

### 2.4 Pricing Philosophy

**Principle:** Meaningfully usable free tier, not an artificially tiny sandbox.

**Planned Tiers (Phase 3 Launch):**

| Tier     | Price           | Target User         | Key Features                                                     |
| -------- | --------------- | ------------------- | ---------------------------------------------------------------- |
| **Free** | $0              | Hobbyists, soloists | Unlimited private worlds, all entity types, export, 50MB storage |
| **Pro**  | $10/mo          | Active creators     | AI features (50/day), 5GB storage, priority support              |
| **Team** | $20/mo per user | Collaborators       | Unlimited AI, real-time collab, team analytics, 50GB storage     |

**Free Tier Commitments:**

- ✅ All entity types (no "premium" entities)
- ✅ Full export (JSON, Markdown) - **never paywalled**
- ✅ Collaboration (up to 3 members per world)
- ✅ Search, relationships, activity logs

**What's Premium:**

- AI generation/suggestions (rate-limited on free)
- Advanced visualizations (timelines, analytics)
- Higher storage limits (images, maps)
- Real-time collaboration indicators
- Priority support

---

## 3. Target Users & Personas

### 3.1 Primary User Segments

**Segment 1: Fiction Writers (35% of TAM)**

- **Need:** Consistent character tracking, plot structure, world bible
- **Pain:** Character bios scattered across docs, timeline conflicts, relationship complexity
- **Willingness to Pay:** Medium ($10-20/month)

**Segment 2: Game Masters (30% of TAM)**

- **Need:** Fast session prep, spoiler-safe player sharing, NPC management
- **Pain:** Notes scattered, improvised NPCs forgotten, slow info lookup during sessions
- **Willingness to Pay:** High ($15-30/month) - active hobby spending

**Segment 3: Game Developers (20% of TAM)**

- **Need:** Lore documentation, Unity/Unreal integration, version control
- **Pain:** Lore out of sync with code, no single source of truth
- **Willingness to Pay:** Very High ($50-100/month for teams)

**Segment 4: Worldbuilding Hobbyists (15% of TAM)**

- **Need:** Structure, community feedback, showcase work
- **Pain:** Blank page syndrome, isolated hobby, no motivation
- **Willingness to Pay:** Low ($5-10/month)

### 3.2 Key Personas

#### Persona 1: Sarah the Fantasy Novelist

**Background:**

- 32, MFA in Creative Writing, working on epic fantasy trilogy
- 15 hours/week writing, 5 hours/week worldbuilding
- Self-publishing on Amazon KDP

**Goals:**

- Track 50+ characters across 3 books without inconsistencies
- Visualize character relationships and political alliances
- Reference world details quickly while drafting
- Share world bible with beta readers

**Pain Points:**

- Character bios in separate Google Doc, lose track of details
- Timeline conflicts between books (who knew what when?)
- Can't remember which character is related to whom
- No visual map of kingdom geography

**Quote:** _"I have 30,000 words of worldbuilding notes and I still forget character names mid-scene."_

**How WorldCrafter Helps:**

- Structured character profiles with relationship mapping (Phase 2)
- Event timeline prevents continuity errors (Phase 2)
- Quick search finds any entity in seconds (✅ Phase 1)
- Export to Markdown for offline reference while writing (Phase 2)

---

#### Persona 2: Marcus the Game Master

**Background:**

- 28, software engineer, runs weekly D&D 5e campaign for 6 players
- 3-4 hours/week session prep
- Active in D&D Reddit and Discord

**Goals:**

- Prep sessions faster (currently takes 4 hours)
- Quick reference NPC details during gameplay
- Generate random NPCs that fit world lore
- Share location/NPC info with players via links

**Pain Points:**

- Notes scattered: OneNote, D&D Beyond, physical cards
- Improvised NPCs have no details, players ask later
- Takes 10+ minutes mid-session to find specific info
- Players confused about faction relationships

**Quote:** _"I waste half my session prep time just organizing notes from last session."_

**How WorldCrafter Helps:**

- AI generates consistent NPCs in seconds (Phase 3)
- Searchable database accessible during session on tablet (✅ Phase 1)
- Faction relationship graph players can view (Phase 2)
- Public/private visibility controls (secret villain info hidden) (Phase 2)

---

#### Persona 3: Elena the Indie Game Developer

**Background:**

- 35, narrative designer at 5-person indie studio
- Working on story-driven RPG in Unity
- Team uses Confluence + Sheets (disconnected from game data)

**Goals:**

- Centralize lore so entire team can reference
- Export structured data to Unity (JSON)
- Version control for narrative changes
- Collaborate with writer and 2 game designers

**Pain Points:**

- Lore in Confluence, quest data in Unity, dialogue in Sheets
- No single source of truth, constant out-of-sync issues
- No way to visualize quest dependencies
- Manual data entry into Unity (error-prone)

**Quote:** _"We've had to rewrite quests because the lore doc was outdated. We need version control for narrative."_

**How WorldCrafter Helps:**

- API access for Unity integration (auto-sync lore) (Phase 3)
- World versioning (snapshot before major changes) (Phase 3)
- Team collaboration with role-based permissions (Phase 2)
- Export to JSON with custom schema (Phase 2)

---

## 4. Product Roadmap

### 4.1 Phase 1: Foundation ✅ Complete (January 2025)

**Delivered:**

- Authentication & authorization with RLS
- World management (CRUD, privacy, genres)
- Location management (hierarchical, 13 types)
- Full-text search with ⌘K shortcut
- Activity tracking
- 145 tests, 76% coverage

**Validated:**

- Tech stack (Next.js 16, Supabase, Prisma, Tailwind v4)
- Architecture patterns (Server Components, Server Actions)
- Testing pyramid (unit/integration/E2E)
- RLS security model

---

### 4.2 Phase 2: Core Features (10 Weeks - Target: March 2025)

**Goal:** Complete all essential entity types and enable collaboration

#### Epic 1: Character Management (2 weeks)

- Portraits, species, age, personality, backstory
- Relationship tracking to other entities
- Card view and table view
- Custom attributes via JSON

#### Epic 2: Event Management (1 week)

- Flexible date formats ("Year 342", "The Long Night")
- Location and participant tracking
- Timeline view (horizontal scroll)

#### Epic 3: Item Management (1 week)

- Properties (magical effects, stats)
- Ownership history
- Current owner tracking

#### Epic 4: Faction Management (1 week)

- Leadership and member lists
- Allies/enemies tracking
- Org chart preview

#### Epic 5: Relationships & Graph (2 weeks)

- Typed relationships (friend, enemy, family, member, etc.)
- Interactive graph visualization (React Flow)
- Filters by entity type, relationship type
- Export as PNG/SVG

#### Epic 6: Collaboration Basics (1 week)

- Email invites with role assignment
- 5 roles: Viewer, Commenter, Editor, Admin, Owner
- Comments with @mentions
- Member management page

#### Epic 7: Export (1 week)

- JSON export (full world dump)
- Markdown export (zip with folder structure)
- Download link generation

#### Epic 8: Testing & Polish (1 week)

- Comprehensive E2E tests
- Performance optimization
- Documentation updates
- Production deployment

**Success Criteria:**

- 1,000+ signups in first 3 months
- 500+ Monthly Active Users
- 40%+ D1 retention, 25%+ D7 retention
- NPS > 40
- All entity types operational
- 80%+ test coverage

---

### 4.3 Phase 3: Advanced Features (12 Weeks - Target: June 2025)

**Goal:** AI differentiation and visualization tools

**Key Features:**

1. **AI-Assisted Features**
   - Entity generation from prompts
   - Relationship suggestions
   - Consistency checker (find contradictions)
   - Writing prompts

2. **Visualization Tools**
   - Interactive map with location markers (Leaflet.js)
   - Timeline visualization (horizontal scroll)
   - Family tree generator
   - Analytics dashboard

3. **Public Gallery & Cloning**
   - Explore public worlds
   - Clone worlds to customize
   - Bookmark favorites

4. **Templates & Import**
   - Genre templates (Fantasy, Sci-Fi, etc.)
   - Import from CSV, Markdown, JSON
   - Field mapping UI

5. **World Versioning**
   - Save snapshots
   - Diff viewer between versions
   - Restore previous versions

6. **Real-Time Collaboration**
   - Presence indicators (who's online)
   - Live updates (broadcast changes)
   - Conflict resolution

**Success Criteria:**

- 10,000+ MAU
- 50%+ users try AI features within first week
- 40%+ users upload map image
- NPS > 50
- 500+ public worlds in gallery

---

### 4.4 Phase 4: ChatGPT Integration (8 Weeks - Target: September 2025)

**Goal:** Scale distribution via ChatGPT Apps SDK

**Key Features:**

1. **MCP Server**
   - JSON-RPC 2.0 over HTTPS + SSE
   - Tools: create/read/update entities, search, export
   - OAuth 2.1 with PKCE

2. **Conversational Widgets**
   - Inline cards (world, character, location)
   - Picture-in-Picture (character sheet, mini-graph)
   - Fullscreen (dashboard, map, timeline)

3. **ChatGPT App Submission**
   - App listing in ChatGPT store
   - OAuth flow tested end-to-end
   - Widget performance optimized

**Success Criteria:**

- 50,000+ MAU (standalone app)
- 10,000+ ChatGPT app installs
- 30%+ of new signups from ChatGPT discovery
- 4.5+ star rating on ChatGPT store

---

## 5. Functional Requirements

### 5.1 Core Entities (Phase 1-2)

All entities share common patterns:

- **Unique slug** (URL-safe, auto-generated)
- **Markdown description** (rich text)
- **Custom attributes** (JSON for genre-specific fields)
- **Image upload** (cover, portrait, emblem)
- **Activity logging** (all CRUD operations)
- **RLS enforcement** (cascade from world permissions)

#### FR-1: World Management ✅ Phase 1

**Create world:**

- Name, genre (Fantasy, Sci-Fi, Modern, Historical, Horror, Custom)
- Description (markdown)
- Privacy (Private, Unlisted, Public)
- Cover image (optional)

**World dashboard:**

- Entity counts (locations, characters, events, items, factions)
- Recent activity feed (last 20 changes)
- Quick actions (create entity, search, settings)
- Collaboration status (members, roles)

#### FR-2: Location Management ✅ Phase 1

**Create location:**

- Name, type (13 types: City, Town, Village, Region, Country, Continent, Planet, Dungeon, Forest, Mountain, Ocean, Building, Custom)
- Parent location (hierarchical)
- Description, geography, climate, population, government, economy, culture
- Coordinates (x, y) for future map positioning
- Image (optional)

**Location views:**

- Tree view (expand/collapse hierarchy)
- Table view (flat list with parent column)
- Filter by type

**Validation:**

- Circular reference prevention (can't make location its own ancestor)
- Cascade delete (children deleted when parent deleted)

#### FR-3: Character Management → Phase 2

**Create character:**

- Name, role, species, age, gender
- Appearance (physical description, portrait)
- Personality (traits, goals, fears, motivations)
- Backstory (history, significant events)
- Relationships (family, friends, enemies, factions)
- Custom attributes (STR, DEX, magic affinity, etc.)

**Character views:**

- Card view (portrait thumbnails)
- Table view (name, role, species, faction)
- Filter by role, species, faction membership

#### FR-4: Event Management → Phase 2

**Create event:**

- Name, date (flexible text: "1453 BCE", "Year 342", "The Long Night")
- Description (what happened)
- Significance (importance to world/story)
- Location (linked to Location entity)
- Participants (characters, factions)
- Type (battle, coronation, discovery, treaty, etc.)

**Event views:**

- Table view (date, name, location, type)
- Timeline view (horizontal scroll, grouped by date)
- Filter by type, location, participants

#### FR-5: Item Management → Phase 2

**Create item:**

- Name, type (weapon, armor, artifact, tool, etc.)
- Rarity (common, uncommon, rare, legendary)
- Description (what it is)
- Properties (magical effects, stats, weight)
- History (creation, previous owners)
- Current owner (character or location reference)
- Image (optional)

**Item views:**

- Card view (item illustrations)
- Table view (name, type, rarity, owner)
- Filter by type, rarity, owner

#### FR-6: Faction Management → Phase 2

**Create faction:**

- Name, type (kingdom, guild, corporation, religion, military)
- Description (purpose, history)
- Goals (what the faction wants)
- Structure (hierarchy description)
- Headquarters (location reference)
- Leadership (list of character IDs)
- Members (list of character IDs)
- Allies/Enemies (list of faction IDs)
- Emblem/logo image

**Faction views:**

- Card view (emblem thumbnails)
- Table view (name, type, headquarters, member count)
- Filter by type, headquarters location

**Faction detail page:**

- Org chart visualization (leadership → members)
- Relationship web (allies and enemies)
- Member list with links to characters

#### FR-7: Relationships & Graph → Phase 2

**Create relationship:**

- Source entity (any entity type)
- Target entity (any entity type)
- Relationship type (friend, enemy, family, member, located_in, owns, etc.)
- Directionality (A → B or A ↔ B)
- Strength (1-10 scale)
- Description (optional context)

**Relationship panel:**

- Shows on all entity detail pages
- Grouped by relationship type
- Click to navigate to related entity
- Edit/delete inline

**Relationship graph:**

- Force-directed layout (React Flow)
- Nodes color-coded by entity type
- Edges labeled with relationship type
- Filters: entity type, relationship type, strength
- Search to highlight entity
- Export as PNG/SVG

### 5.2 Collaboration Features (Phase 2)

#### FR-8: Member Management

**Invite members:**

- Share modal with email input
- Select role: Viewer, Commenter, Editor, Admin
- Email invite via Supabase Edge Function
- Invite link expires in 7 days

**Role-based access control:**

- **Viewer:** Read-only access
- **Commenter:** Viewer + add/edit/delete own comments
- **Editor:** Commenter + create/edit/delete entities
- **Admin:** Editor + manage members, change world settings
- **Owner:** Admin + transfer ownership, delete world

**Member management page:**

- List all members with roles and join dates
- Change role dropdown (owner only)
- Remove member button (owner only)

#### FR-9: Comments

**Comment features:**

- Markdown support
- Threaded replies (1 level deep)
- Edit own comments (5 min window)
- Delete own comments
- @mention users (autocomplete, email notification)

**Comment display:**

- At bottom of entity detail pages
- Sorted by timestamp (newest first)
- User avatar, name, timestamp

### 5.3 Export & Data Portability (Phase 2)

#### FR-10: Export Formats

**JSON export:**

- Full world dump (all entities, relationships, metadata)
- Single JSON file with proper schema
- Includes activity logs and member info (if owner)

**Markdown export:**

- Zip file with folder structure:
  ```
  world-name/
    README.md (world description)
    characters/
      character-1.md
      character-2.md
    locations/
      location-1.md
    events/
      event-1.md
    ...
  ```
- Each .md file has frontmatter for metadata
- Relationships listed in frontmatter
- Description in markdown body

**Export flow:**

- Export button on world dashboard
- Select format (JSON or Markdown)
- Processing indicator for large worlds
- Download link when complete (expires in 24 hours)

### 5.4 Search (Phase 1 ✅)

**Full-text search:**

- PostgreSQL tsvector with GIN indexes
- Weighted search across all entity fields
- Relevance ranking using ts_rank()
- ⌘K/Ctrl+K keyboard shortcut
- Debounced search (300ms)
- Results scoped to current world

**Search results:**

- Entity type badge (character, location, etc.)
- Snippet with highlighted query match
- Click to navigate to entity detail

### 5.5 Activity Tracking (Phase 1 ✅)

**Activity log:**

- All create/update/delete operations tracked
- Stores: user_id, entity_type, entity_id, action, timestamp, metadata
- Activity feed on world dashboard (last 20 changes)
- User name, action description, time ago formatting

---

## 6. Technical Architecture

### 6.1 Tech Stack

**Frontend:**

- Next.js 16 (App Router) + React 19
- Tailwind CSS v4 + shadcn/ui
- React Hook Form + Zod validation
- @uiw/react-md-editor (markdown WYSIWYG)
- Lucide React (icons)

**Backend:**

- Next.js Server Actions (primary)
- Supabase PostgreSQL (database)
- Prisma ORM v5
- Supabase Auth (OAuth 2.1)
- Supabase Storage (file uploads)

**Testing:**

- Vitest (unit/integration)
- React Testing Library
- Playwright (E2E)
- 80% coverage target

**DevOps:**

- Vercel (serverless hosting)
- GitHub Actions (CI/CD)
- Sentry (error tracking - Phase 2)

### 6.2 Critical Patterns

#### Authentication Flow

1. User signs up/logs in via Supabase Auth
2. Session stored in HTTP-only cookies (SSR-friendly)
3. `src/middleware.ts` refreshes session on every request
4. Database trigger auto-creates `users` record
5. RLS policies enforce access control automatically

**Supabase clients:**

- Client components: `createClient()` from `@/lib/supabase/client`
- Server components/actions: `await createClient()` from `@/lib/supabase/server` (async)

#### Server Action Pattern

All Server Actions follow this structure:

```typescript
"use server";

export async function createEntity(
  values: CreateEntityInput
): Promise<ActionResponse<Entity>> {
  // 1. Validate input
  const validated = createEntitySchema.parse(values);

  // 2. Check authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // 3. Generate slug
  const slug = generateSlug(validated.name);

  // 4. Database operation
  const entity = await prisma.entity.create({
    data: { ...validated, slug, userId: user.id },
  });

  // 5. Activity log
  await prisma.activity.create({
    data: {
      userId: user.id,
      entityType: "entity",
      entityId: entity.id,
      action: "created",
      metadata: { name: entity.name },
    },
  });

  // 6. Revalidate cache
  revalidatePath("/entities");

  // 7. Return response
  return { success: true, data: entity };
}
```

#### Database Patterns

**Connection strings:**

- `DATABASE_URL` (port 6543): Transaction pooler - **USE FOR ALL QUERIES**
- `DIRECT_DATABASE_URL` (port 5432): **USE ONLY FOR MIGRATIONS**

**Row-Level Security:**

- Enabled on ALL user data tables
- Policies cascade from world permissions
- Applied via SQL: `prisma/migrations/sql/`

**Schema conventions:**

- Tables: snake_case (via `@@map`)
- Prisma models: PascalCase
- Slugs: URL-safe, unique per world
- Soft deletes: `deletedAt` timestamp (30-day recovery)
- JSON attributes: Extensibility without schema changes

#### Form Handling

1. Define Zod schema in `src/lib/schemas/`
2. Use React Hook Form with `zodResolver(schema)` in component
3. Submit to Server Action
4. **ALWAYS validate again on server** with same Zod schema

#### Testing Strategy

**Three-layer pyramid:**

1. **Unit Tests (60-70%)** - `src/**/__tests__/*.test.ts`
   - React Testing Library, mocked Supabase/Prisma
   - Test factories in `src/test/factories/`

2. **Integration Tests (20-30%)** - `src/app/__tests__/*.integration.test.ts`
   - Real test database (`.env.test`)
   - Test Server Actions, RLS policies

3. **E2E Tests (10-20%)** - `e2e/*.spec.ts`
   - Playwright, Page Object Models
   - Critical user flows

**Coverage:** 80% minimum (enforced in CI)

---

## 7. Success Metrics & KPIs

### 7.1 Phase 1 Baseline (✅ Achieved)

**Technical:**

- ✅ 145 tests passing, 76% coverage
- ✅ Zero P0/P1 bugs
- ✅ Production deployment live
- ✅ RLS policies enforced

### 7.2 Phase 2 Targets (March 2025)

**Acquisition:**

- 1,000+ total signups (first 3 months)
- 500+ Monthly Active Users (MAU)
- 200+ Weekly Active Users (WAU)

**Engagement:**

- Average session duration: 10+ minutes
- Actions per session: 5+ (create, edit, search, view)
- Worlds created per user: 1.5+ average
- Entities per world: 15+ average

**Retention:**

- Day 1 retention: 40%+
- Day 7 retention: 25%+
- Day 30 retention: 15%+

**Feature Adoption:**

- 60%+ users create at least 1 character
- 40%+ users create relationships
- 30%+ users invite at least 1 collaborator
- 25%+ users export data at least once

**Quality:**

- Net Promoter Score (NPS): > 40
- Customer Satisfaction (CSAT): > 4.0/5
- Bug reports per release: < 10 critical bugs

### 7.3 Phase 3 Targets (June 2025)

**Acquisition:**

- 10,000+ total signups
- 5,000+ MAU
- WAU/MAU ratio: > 0.4

**Feature Adoption (AI):**

- 50%+ users try AI generation within first week
- 30%+ use AI suggestions weekly
- 20%+ run consistency checker

**Feature Adoption (Visualization):**

- 40%+ users upload map image
- 30%+ users view relationship graph
- 25%+ users view timeline

**Quality:**

- NPS: > 50
- CSAT: > 4.5/5
- Day 30 retention: > 20%

### 7.4 Phase 4 Targets (September 2025)

**Acquisition:**

- 50,000+ total signups
- 25,000+ MAU
- 10,000+ ChatGPT app installs
- 30%+ of new signups from ChatGPT

**Engagement:**

- ChatGPT users: 5,000+ MAU
- Average MCP tool calls per session: 10+

**Quality:**

- ChatGPT app rating: 4.5+ stars
- NPS (ChatGPT users): > 50

### 7.5 Revenue Metrics (Phase 3+)

**Conversion:**

- Free → Premium: 5% target
- Average time to conversion: 30 days

**Revenue:**

- Monthly Recurring Revenue (MRR): $50K by end of 2025
- Customer Lifetime Value (LTV): $300+
- LTV:CAC ratio: > 3:1

**Retention:**

- Premium churn rate: < 5% monthly

---

## 8. Release Criteria

### 8.1 Phase 1: MVP ✅ Complete

**Status:** Production-ready, deployed on Vercel

### 8.2 Phase 2: Core Features (March 2025)

**Functionality:**

- ☐ All 5 entity types operational (Characters, Events, Items, Factions + Locations)
- ☐ Relationship management + graph visualization
- ☐ Collaboration (invites, roles, comments)
- ☐ Export (JSON, Markdown)

**Quality:**

- ☐ Zero P0 bugs, < 10 P1 bugs
- ☐ Test coverage > 80%
- ☐ Lighthouse score > 90
- ☐ E2E tests for all entity types

**Metrics:**

- ☐ 1,000+ signups from launch
- ☐ NPS > 40
- ☐ D7 retention > 25%

**Documentation:**

- ☐ User guide (all entity types, collaboration, export)
- ☐ Updated CLAUDE.md with Phase 2 patterns

**Go/No-Go Decision:** Product + Engineering approval + user feedback review

### 8.3 Phase 3: Advanced Features (June 2025)

**Functionality:**

- ☐ AI features (generation, suggestions, consistency checker)
- ☐ Visualizations (maps, timelines, analytics)
- ☐ Public gallery + cloning
- ☐ Templates + import
- ☐ World versioning
- ☐ Real-time collaboration

**Quality:**

- ☐ Zero P0 bugs, < 15 P1 bugs
- ☐ Test coverage > 80%
- ☐ Performance testing (1000 concurrent users)

**Metrics:**

- ☐ 10,000+ MAU
- ☐ NPS > 50
- ☐ 50%+ try AI features

**Go/No-Go Decision:** Full leadership team approval

### 8.4 Phase 4: ChatGPT Integration (September 2025)

**Functionality:**

- ☐ MCP server operational
- ☐ OAuth flow tested end-to-end
- ☐ At least 5 widgets (inline, PiP, fullscreen)
- ☐ ChatGPT app submitted and approved

**Quality:**

- ☐ Zero P0 bugs in MCP server
- ☐ OAuth security audit passed
- ☐ Widget performance (< 1s load)

**Metrics:**

- ☐ 25,000+ MAU in standalone app
- ☐ Beta test with 100+ ChatGPT users (positive feedback)
- ☐ 10,000+ ChatGPT app installs within 3 months

**Go/No-Go Decision:** Leadership + Legal (privacy review) + OpenAI partnership approval

---

## 9. Risks & Mitigation

### 9.1 Technical Risks

**Risk: Database performance degrades with large worlds**

- **Likelihood:** Medium | **Impact:** High
- **Mitigation:**
  - Proper indexes on all foreign keys, search vectors
  - Pagination on all list views (20-50 items per page)
  - Query profiling with Prisma logging
  - Redis caching for frequently accessed data (Phase 3)
- **Contingency:** Migrate hot tables to separate database, add read replicas

**Risk: Real-time collaboration causes data conflicts**

- **Likelihood:** High (Phase 3) | **Impact:** Medium
- **Mitigation:**
  - Last-write-wins strategy with conflict warnings
  - Optimistic UI with rollback on conflict
  - Versioning system to recover from conflicts
- **Contingency:** Implement operational transformation (OT) or CRDTs

**Risk: AI costs spiral out of control**

- **Likelihood:** Medium (Phase 3) | **Impact:** High
- **Mitigation:**
  - Strict rate limits (5 generations/hour free, 50/day premium)
  - Use smaller models for simple tasks (GPT-3.5 vs GPT-4)
  - Cache common AI responses
  - Monitor costs per user with alerts
- **Contingency:** Reduce free tier limits, increase premium pricing, switch provider

### 9.2 Product Risks

**Risk: Feature bloat overwhelms new users**

- **Likelihood:** High (Phase 3+) | **Impact:** High
- **Mitigation:**
  - Progressive disclosure (hide advanced features initially)
  - Onboarding flow that introduces features gradually
  - "Simplified" vs "Advanced" mode toggle
  - Empty states that guide next action
- **Contingency:** Create "WorldCrafter Lite" simplified version

**Risk: Collaboration features unused (30% adoption target not met)**

- **Likelihood:** Medium | **Impact:** Medium
- **Mitigation:**
  - Invite flow prominently featured in UI
  - Email invites with compelling preview
  - Show collaboration benefits in onboarding
  - Track adoption metrics weekly
- **Contingency:** De-prioritize real-time features, focus on async (comments, exports)

**Risk: Public gallery has low-quality or inappropriate content**

- **Likelihood:** High (Phase 3) | **Impact:** Medium
- **Mitigation:**
  - Moderation queue for newly public worlds
  - Report button on all public content
  - Community guidelines in ToS
  - Automated content filtering (profanity, NSFW)
- **Contingency:** Require manual approval for public worlds, hire moderators

### 9.3 Business Risks

**Risk: ChatGPT Apps SDK changes or deprecates during Phase 4**

- **Likelihood:** Low-Medium | **Impact:** Very High
- **Mitigation:**
  - Stay in close contact with OpenAI partnership team
  - Build MCP server to spec, following all guidelines
  - Fallback: MCP server works with other Claude-compatible clients
- **Contingency:** Pivot to Anthropic Claude or other LLM platforms with MCP support

**Risk: Premium conversion rate < 5% target**

- **Likelihood:** Medium | **Impact:** High
- **Mitigation:**
  - Generous free tier builds trust and adoption
  - Clear premium value prop (AI, storage, team features)
  - Free trial of premium features (14 days)
  - Track conversion funnel weekly
- **Contingency:** Adjust pricing ($5/mo tier), add more premium features, enterprise tier

**Risk: Competitors copy features faster than we can ship**

- **Likelihood:** High | **Impact:** Medium
- **Mitigation:**
  - Focus on UX excellence, not just feature parity
  - Build community and network effects early
  - Strong data portability reduces switching costs both ways
  - Iterate faster with streamlined architecture
- **Contingency:** Double down on AI differentiation and ChatGPT integration (harder to copy)

### 9.4 Schedule Risks

**Risk: Phase 2 takes longer than 10 weeks**

- **Likelihood:** Medium | **Impact:** Medium
- **Mitigation:**
  - 20% time buffer built into estimates
  - Weekly progress tracking against plan
  - Defer non-critical features to Phase 3
  - Parallel development where possible
- **Contingency:** Cut scope (defer Items or Factions to Phase 3), extend timeline by 2 weeks max

---

## 10. Open Questions

### Q1: Premium tier pricing strategy?

**Options:**

- A) $10/mo Pro (AI + storage), $20/mo Team (+ collaboration)
- B) $5/mo Pro (basic), $15/mo Pro+ (AI), $30/mo Team
- C) $10/mo individual, $50/mo studio (5 users)

**Decision by:** End of Phase 2 (before Phase 3 launch)
**Decision maker:** Product + Finance

### Q2: Which AI provider (OpenAI vs Anthropic)?

**Options:**

- A) OpenAI GPT-4 (better known, more integrations)
- B) Anthropic Claude (better at creative writing, lower cost)
- C) Both (let user choose in settings)

**Decision by:** Start of Phase 3
**Decision maker:** Product + Engineering
**Criteria:** Cost per generation, output quality for worldbuilding, API reliability

### Q3: Mobile app priority (Phase 3 or later)?

**Options:**

- A) Native apps (iOS/Android) in Phase 3
- B) PWA (Progressive Web App) in Phase 3, native in Phase 4
- C) Defer to 2026 (web-only for 2025)

**Decision by:** Mid-Phase 2 (based on mobile traffic analysis)
**Decision maker:** Product + Engineering

### Q4: Real-time collaboration scope?

**Options:**

- A) Full operational transformation (Google Docs-style)
- B) Presence + live updates only (no simultaneous editing)
- C) Async only (comments, not real-time)

**Decision by:** Mid-Phase 2 (based on collaboration adoption)
**Decision maker:** Product + Engineering

---

## Document Changelog

### Version 3.0 (January 2025)

- **Complete restructure** based on Strategic Analysis document
- **Strategic Foundation** section added (market landscape, principles, differentiation)
- **Simplified** from 2,300 lines to ~1,400 lines (more focused)
- **Personas** expanded with detailed backgrounds and quotes
- **Pricing philosophy** clarified with specific tier commitments
- **Roadmap** reorganized by phase with clear epic breakdowns
- **Risks** prioritized by strategic impact
- **Open questions** surfaced for decision-making

### Version 2.0 (January 2025)

- Incorporated Phase 1 completion status
- Added Technical Architecture section
- Reorganized Functional Requirements by Phase (1-4)
- Updated Success Metrics with Phase 1 baseline

### Version 1.0 (December 2024)

- Original PRD with detailed user stories
- Full ChatGPT integration specification
- Archived as `docs/PRD_v1_ARCHIVED.md`

---

**END OF DOCUMENT**

_For detailed Phase 2 implementation plan, see `docs/PHASE_2_IMPLEMENTATION_PLAN.md`_
_For project patterns and conventions, see `CLAUDE.md`_
