# WorldCrafter: Product Requirements Document v2.0

**Version:** 2.0
**Last Updated:** January 2025
**Document Owner:** Product Team
**Status:** Phase 1 Complete, Phase 2 Ready to Start

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Market Context](#2-market-context)
3. [Product Vision & Goals](#3-product-vision--goals)
4. [Target Audience & Personas](#4-target-audience--personas)
5. [Functional Requirements](#5-functional-requirements)
6. [Technical Architecture](#6-technical-architecture)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Success Metrics & KPIs](#8-success-metrics--kpis)
9. [Release Criteria](#9-release-criteria)
10. [Risks & Mitigation](#10-risks--mitigation)
11. [Phase 2 Roadmap Overview](#11-phase-2-roadmap-overview)
12. [Open Questions & Future Considerations](#12-open-questions--future-considerations)

---

## 1. Executive Summary

### 1.1 Product Overview

WorldCrafter is a comprehensive web-based worldbuilding platform designed to help fiction writers, game masters, game developers, and worldbuilding hobbyists create, organize, and explore rich fictional universes. The platform combines structured data management with modern UX patterns, prioritizing ease of use and data portability.

**Current Status:** Phase 1 MVP launched January 2025, production-ready.

### 1.2 What's Been Built (Phase 1 MVP - ✅ Complete)

**Core Infrastructure:**

- User authentication with Supabase Auth (email/password, session management)
- Row-Level Security (RLS) policies enforced at database level
- 145 automated tests with 76% coverage
- Production-ready build deployed on Vercel

**World Management:**

- Create, read, update, delete worlds with metadata
- Genre classification (Fantasy, Sci-Fi, Modern, Historical, Horror, Custom)
- Privacy controls (Private, Unlisted, Public)
- Markdown-powered descriptions
- Cover image support
- Activity tracking and audit logs

**Location Management:**

- Hierarchical location system (cities → buildings, continents → countries → cities)
- 13 location types (City, Town, Village, Region, Country, Continent, Planet, Dungeon, Forest, Mountain, Ocean, Building, Custom)
- Rich attributes (geography, climate, population, government, economy, culture)
- Tree view and table view for navigation
- Coordinate system for future map integration
- Circular reference prevention (can't make location its own parent)

**Search & Discovery:**

- PostgreSQL full-text search with relevance ranking
- GIN indexes for performance
- ⌘K/Ctrl+K keyboard shortcut for instant search
- Debounced search (300ms) for optimal UX
- Scoped to current world

### 1.3 Technical Foundation Validated

**Tech Stack:**

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui
- **Backend:** Server Actions, Supabase PostgreSQL, Prisma ORM
- **Auth:** Supabase Auth with HTTP-only cookies (SSR-friendly)
- **Search:** PostgreSQL tsvector with ts_rank() relevance
- **Testing:** Vitest (unit/integration), Playwright (E2E)
- **Deployment:** Vercel (serverless)

**Architecture Patterns Proven:**

- Server Components with direct database access (no API routes needed)
- React Hook Form + Zod validation (client + server)
- Optimistic UI updates with rollback
- Slug-based routing for SEO
- JSON attributes for extensibility

### 1.4 What's Next (Phase 2 - Starting Now)

**Focus:** Complete core entity types and relationships (10 weeks)

**Priorities:**

1. **Characters** - Portraits, attributes, backstories, relationships
2. **Events** - Timeline integration, participants, significance tracking
3. **Items/Artifacts** - Ownership tracking, properties, history
4. **Factions** - Org charts, goals, member management, alliances/rivalries
5. **Relationships** - Typed connections between entities (friend, enemy, family, member, etc.)
6. **Graph Visualization** - Interactive network diagram of entity relationships
7. **Collaboration Basics** - Invite users, assign roles (Viewer, Editor, Admin)
8. **Export** - JSON and Markdown formats for data portability

**Target:** 5,000 Monthly Active Users (MAU) by end of Phase 2 (March 2025)

### 1.5 Strategic Objectives

1. **Deliver Core Value** - Complete all essential entity types (Phase 2, Q1 2025)
2. **Build Network Effects** - Enable collaboration and sharing (Phase 2)
3. **Data Ownership** - Provide robust export to prevent vendor lock-in (Phase 2)
4. **AI Differentiation** - Integrate helpful AI assistants (Phase 3, Q2 2025)
5. **Scale Distribution** - ChatGPT Apps SDK integration (Phase 4, Q3 2025)

### 1.6 Success Criteria by Phase

**Phase 1 (✅ Achieved - January 2025):**

- Zero critical bugs
- 70%+ test coverage (achieved 76%)
- Production deployment
- Core world and location management functional

**Phase 2 (Target: March 2025):**

- 1,000+ signups in first 3 months
- All 5 entity types operational
- Relationship graph visualization
- Basic collaboration features
- 40%+ Day 1 retention
- 25%+ Day 7 retention
- NPS > 40

**Phase 3 (Target: June 2025):**

- 10,000+ MAU
- AI features launched (generation, suggestions, consistency checking)
- Public gallery with 500+ worlds
- NPS > 50

**Phase 4 (Target: September 2025):**

- 50,000+ MAU
- ChatGPT integration live
- 10,000+ ChatGPT app installs
- 30% of signups from ChatGPT discovery

---

## 2. Market Context

### 2.1 Competitive Landscape

We analyzed 12 worldbuilding tools to identify market opportunities:

| Tool             | Target Users             | Key Strengths                            | Key Weaknesses                                       |
| ---------------- | ------------------------ | ---------------------------------------- | ---------------------------------------------------- |
| **World Anvil**  | Novelists, RPG GMs       | Extremely feature-rich, huge community   | Steep learning curve, cluttered UI, slow performance |
| **Campfire**     | Authors, storytellers    | Modular toolkit, cross-platform          | Expensive tiered pricing, less depth                 |
| **Notebook.ai**  | Writers, solo builders   | Ease of use, gentle learning curve       | Limited depth, no collaboration                      |
| **Kanka**        | TTRPG GMs and groups     | Customizable modules, generous free tier | Dense interface, performance lags                    |
| **LegendKeeper** | TTRPG GMs                | Fast/simple wiki, clean UI               | Web-only, missing advanced features                  |
| **Notion**       | Writers, teams           | Flexible databases, real-time collab     | Not specialized, steep learning curve                |
| **Obsidian**     | Power users (tech-savvy) | Local-first, bidirectional linking       | No collaboration, plugin fragmentation               |

### 2.2 User Pain Points (From Market Research)

**Overwhelming UIs & Steep Learning Curves:**

- World Anvil's cluttered interface scares off beginners
- Too many features presented at once, no progressive disclosure
- Users feel "fighting the UI" instead of building worlds

**Rigid Structures vs. Flexibility:**

- Forced templates make users feel constrained
- Fixed ontologies don't fit all genres (fantasy vs. sci-fi vs. modern)
- Need balance: structure without rigidity

**Performance, Sync Issues & Reliability:**

- Lag in Kanka and Arcweave with large worlds
- Fear of data loss with cloud-only solutions
- Vendor lock-in from poor export options

**Weak Map/Timeline Tools (or None):**

- Most tools require juggling separate software (Inkarnate, Aeon Timeline)
- No integration between lore data and visual representations
- Maps and timelines feel like afterthoughts

**Poor Mobile/Tablet Experience:**

- World Anvil has no mobile app
- Most tools are desktop-first, clunky on mobile
- No quick-capture workflows for on-the-go ideas

**Limited Export/Backup & Fear of Lock-in:**

- Export often paywalled (Kanka requires Premium for full export)
- No standard formats (proprietary JSON)
- Users distrust platforms without easy exit strategy

**Confusing Pricing:**

- Micro-pricing modules (Campfire) frustrate hobbyists
- Too many tiers (World Anvil) make decision paralysis
- Unclear what's included in free vs. paid

**AI Features Disappointing or Gimmicky:**

- AI feels tacked-on, not integrated into workflow
- Fear that AI will "override their voice"
- Generic suggestions without world context

### 2.3 WorldCrafter's Differentiation Strategy

**How We Address Each Pain Point:**

1. **Simple Onboarding** ✅ Validated in Phase 1
   - Minimal UI on first load (progressive disclosure)
   - Guided world creation with optional templates
   - Clear visual hierarchy, no feature overload
   - ⌘K universal search for discoverability

2. **Flexible Structure** ✅ Validated in Phase 1
   - Custom attributes via JSON (genre-specific fields without code)
   - Multiple location types (not just "cities and countries")
   - Optional fields, not required forms
   - Tags and collections for non-linear organization

3. **Performance & Reliability** ✅ Validated in Phase 1
   - Fast: PostgreSQL with proper indexes, serverless scaling
   - Auto-save with optimistic UI updates
   - Offline support planned (Phase 3 PWA)
   - Robust backup: daily automated Supabase backups

4. **Data Portability** → Phase 2 Priority
   - One-click export (JSON, Markdown, PDF) at ALL tiers (not paywalled)
   - API access for power users
   - Future: Obsidian plugin, game engine integrations

5. **Rich Visualizations** → Phase 2-3
   - Built-in relationship graph (Phase 2)
   - Interactive maps with location pins (Phase 3)
   - Timeline visualization (Phase 3)
   - Org charts for factions (Phase 2)

6. **Mobile/Tablet UX** ✅ Validated in Phase 1
   - Fully responsive design (mobile-first Tailwind)
   - Touch-friendly (44x44px targets)
   - Quick actions accessible on all screen sizes
   - Future: Native mobile apps (Phase 3)

7. **Collaboration Built-In** → Phase 2
   - Role-based access (Owner, Admin, Editor, Commenter, Viewer)
   - Real-time presence indicators (Phase 3)
   - Comments and @mentions (Phase 2)
   - Player view mode to hide GM secrets (Phase 3)

8. **Transparent Pricing** → Phase 3
   - Generous free tier (all core features)
   - Simple tiers: Free, Pro ($10/mo), Team ($20/mo per user)
   - No micro-transactions, no surprise paywalls
   - Free tier includes export (no lock-in)

9. **AI as Assistant, Not Replacement** → Phase 3
   - Optional AI suggestions (can be disabled)
   - User always reviews/accepts AI output
   - Contextual: AI knows your world's style and lore
   - Privacy: User data not used to train models

### 2.4 Market Opportunity

**Growth Drivers:**

- Rise of indie game development (Unity/Unreal accessibility)
- TTRPG renaissance (D&D 5e, Critical Role, etc.)
- Self-publishing boom (Amazon KDP, Substack)
- AI content creation explosion (LLMs enable creative work)
- Remote collaboration tools normalization (post-pandemic)

**Total Addressable Market (TAM):**

- Fiction Writers: 2M active worldbuilders globally
- Game Masters: 1.5M active DMs/GMs
- Game Developers: 500K narrative designers and indie devs
- Hobbyists: 1M active worldbuilding community members
- **Total TAM:** ~5M users

**Serviceable Addressable Market (SAM):**

- ~2M English-speaking, digitally-native users

**Serviceable Obtainable Market (SOM):**

- 100K users (5% of SAM) by end of 2026

**Market Gap:**
No platform combines:

- Structured worldbuilding (like World Anvil)
- Modern UX (like Notion)
- AI assistance (integrated, not gimmicky)
- Strong data portability (no lock-in)
- Conversational interface (ChatGPT integration)

---

## 3. Product Vision & Goals

### 3.1 Vision Statement

_"Empower every storyteller to build living, breathing worlds with the ease of conversation and the power of structured data."_

### 3.2 Product Goals

**Primary Goals (P0):**

1. Enable users to create complete worlds with all entity types within 30 minutes
2. Support seamless collaboration for teams of 2-10 members
3. Provide 100% data portability via export to standard formats
4. Achieve 80%+ data completeness score (filled fields) for active worlds
5. Reduce worldbuilding time by 50% through AI-assisted generation and templates

**Secondary Goals (P1):**

1. Build a community gallery with 1,000+ public worlds by end of 2025
2. Integrate with popular tools (Obsidian, game engines, Notion)
3. Establish ChatGPT Apps SDK as primary growth channel (10,000+ installs)
4. Achieve 4.5+ star rating on ChatGPT app store

**Stretch Goals (P2):**

1. Real-time multiplayer worldbuilding sessions
2. Mobile apps (iOS/Android)
3. Marketplace for templates and assets
4. White-label solution for game studios

### 3.3 Anti-Goals (Out of Scope)

- Story/novel writing tool (use Scrivener, Google Docs)
- Map creation tool from scratch (integrate with Inkarnate, Wonderdraft)
- Character portrait generation (integrate with Midjourney, DALL-E)
- Virtual tabletop (VTT) features (use Roll20, Foundry)
- Publishing platform (use Substack, Medium)

---

## 4. Target Audience & Personas

### 4.1 Primary Audience Segments

**Segment 1: Fiction Writers (35% of TAM)**

- Demographics: 25-45 years old, 60% female, college-educated
- Behavior: Writing 2-10 hours/week, working on novels or series
- Tools: Scrivener, Google Docs, Notion, Pinterest
- Pain: Inconsistency tracking, character relationship complexity
- Willingness to Pay: Medium ($10-20/month)

**Segment 2: Game Masters (30% of TAM)**

- Demographics: 25-40 years old, 70% male, tech-savvy
- Behavior: Running weekly TTRPG sessions, prep 2-5 hours/week
- Tools: D&D Beyond, Roll20, OneNote, physical notebooks
- Pain: Session prep time, quick reference during games
- Willingness to Pay: High ($15-30/month) - active hobby spend

**Segment 3: Game Developers (20% of TAM)**

- Demographics: 25-40 years old, 80% male, professional/indie devs
- Behavior: Working on game projects, need lore documentation
- Tools: Unity/Unreal, Confluence, Google Sheets, custom tools
- Pain: Narrative-to-code pipeline, version control for lore
- Willingness to Pay: Very High ($50-100/month for teams)

**Segment 4: Worldbuilding Hobbyists (15% of TAM)**

- Demographics: 18-35 years old, 50/50 gender split, creative hobbyists
- Behavior: Worldbuilding as creative outlet, 5-10 hours/week
- Tools: Notion, Pinterest, DeviantArt, Reddit communities
- Pain: Lack of structure, no community feedback
- Willingness to Pay: Low ($5-10/month)

### 4.2 User Personas

#### Persona 1: Sarah the Fantasy Novelist

**Background:**

- 32 years old, MFA in Creative Writing
- Working on epic fantasy trilogy, self-publishing
- Spends 15 hours/week writing, 5 hours/week worldbuilding
- Annual income from writing: $30K (side hustle)

**Goals:**

- Track 50+ characters across 3 books without inconsistencies
- Visualize character relationships and political alliances
- Reference world details quickly while drafting
- Share world bible with beta readers and future co-authors

**Pain Points:**

- Character bios in separate Google Doc, lose track of details
- Timeline conflicts between books (who knew what when?)
- Can't remember which character is related to whom
- No visual map of kingdom geography

**Tech Proficiency:** Medium (uses Google Workspace, Scrivener, basic Notion)

**Quote:** _"I have 30,000 words of worldbuilding notes and I still forget character names mid-scene."_

**How WorldCrafter Helps:**

- Structured character profiles with relationship mapping (Phase 2)
- Event timeline prevents continuity errors (Phase 2)
- Quick search finds any entity in seconds (✅ Phase 1)
- Export to Markdown for offline reference while writing (Phase 2)

---

#### Persona 2: Marcus the Game Master

**Background:**

- 28 years old, software engineer by day, DM by night
- Runs weekly D&D 5e campaign for 6 players, 2 years running
- Spends 3-4 hours/week on session prep
- Active in D&D Reddit and Discord communities

**Goals:**

- Prep sessions faster (currently takes 4 hours)
- Quick reference NPC details during gameplay on laptop
- Generate random NPCs that fit world lore
- Share location/NPC info with players via links

**Pain Points:**

- Notes scattered: OneNote, D&D Beyond, physical cards
- Improvised NPCs have no details, players ask later
- Takes 10+ minutes mid-session to find specific info
- Players confused about faction relationships

**Tech Proficiency:** High (dev by day, comfortable with APIs)

**Quote:** _"I waste half my session prep time just organizing notes from last session."_

**How WorldCrafter Helps:**

- AI generates consistent NPCs in seconds (Phase 3)
- Searchable database accessible during session on tablet (✅ Phase 1)
- Faction relationship graph players can view (Phase 2)
- Public/private visibility controls (secret villain info hidden) (Phase 2)

---

#### Persona 3: Elena the Indie Game Developer

**Background:**

- 35 years old, narrative designer at indie studio (5-person team)
- Working on story-driven RPG in Unity
- Needs to document lore for dialogue system, quest design
- Team uses Confluence + Sheets, but disconnected from game data

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

**Tech Proficiency:** Very High (engineer, familiar with APIs/tools)

**Quote:** _"We've had to rewrite quests because the lore doc was outdated. We need version control for narrative."_

**How WorldCrafter Helps:**

- API access for Unity integration (auto-sync lore) (Phase 3)
- World versioning (snapshot before major changes) (Phase 3)
- Team collaboration with role-based permissions (Phase 2)
- Export to JSON with custom schema (Phase 2)

---

#### Persona 4: Jamal the Worldbuilding Hobbyist

**Background:**

- 22 years old, college student (English major)
- Builds fictional worlds for fun, shares on r/worldbuilding
- Spends 10+ hours/week on worldbuilding
- Dreams of writing novel or creating TTRPG setting

**Goals:**

- Build complete, detailed sci-fi universe
- Get feedback from worldbuilding community
- Showcase work in portfolio for future opportunities
- Learn best practices from experienced worldbuilders

**Pain Points:**

- Notion databases feel overwhelming to set up
- No one sees his work (isolated hobby)
- Unsure what details are "complete enough"
- Inspiration fatigue (blank page syndrome)

**Tech Proficiency:** Medium (uses Discord, Reddit, Notion casually)

**Quote:** _"I have fragments of 10 different worlds but never finish any. I need structure and motivation."_

**How WorldCrafter Helps:**

- Templates provide starting structure (Phase 2)
- Completeness scores gamify filling out details (Phase 3)
- Public gallery showcases work to community (Phase 3)
- AI suggestions spark new ideas when stuck (Phase 3)

---

## 5. Functional Requirements

### 5.1 Phase 1: Foundation (✅ Complete - January 2025)

#### FR-1: Authentication & Authorization

**Implemented:**

- Email/password registration and login
- Email verification required (Supabase Auth)
- Session management with HTTP-only cookies
- Password reset via email link
- User profile management (name, email, avatar)
- Account deletion (soft delete with 30-day grace period)
- Row-Level Security (RLS) policies enforced at database level

**Technical Details:**

- Supabase Auth with SSR-friendly cookies (not localStorage)
- Session refresh via middleware (`src/middleware.ts`)
- Password hashing via bcrypt (Supabase default)
- Account lockout after 5 failed attempts (30 min cooldown)

#### FR-2: World Management

**Implemented:**

- Create world with name, genre, description, privacy setting
- URL-safe slug generation from name
- Edit world metadata (name, description, genre, cover image, privacy)
- Delete world with typed confirmation (must type world name)
- Soft delete with 30-day recovery period
- World list with grid/list view toggle
- Sort by: name, last updated, creation date
- Filter by: genre, privacy
- Client-side search across world names and descriptions
- World dashboard with entity counts, recent activity, quick actions

**Technical Details:**

- Prisma model: `World` with userId, name, slug, genre (enum), description, metadata (JSON), coverUrl, privacy (enum)
- RLS policies: users can only CRUD their own worlds
- Cascade delete: all related entities (locations, activities) deleted with world
- Activity logging: all create/update/delete operations tracked

#### FR-3: Location Management

**Implemented:**

- Create location with hierarchical parent relationship
- 13 location types (City, Town, Village, Region, Country, Continent, Planet, Dungeon, Forest, Mountain, Ocean, Building, Custom)
- Rich attributes: name, type, description (markdown), geography, climate, population, government, economy, culture
- Coordinates (x, y) for future map positioning
- Image URL support
- Edit location with all attributes
- Delete location with cascade to children
- Circular reference prevention (can't make location its own ancestor)
- Location list with tree view (hierarchical display with expand/collapse)
- Location list with table view (flat table with parent column)
- Filter by location type
- Location detail page with parent/children navigation

**Technical Details:**

- Prisma model: `Location` with worldId, name, slug, type, parentId (self-relation), description, attributes (JSON), coordinates (JSON), imageUrl
- RLS policies: cascade from world permissions (if user can access world, can access locations)
- Tree traversal algorithm to prevent circular hierarchies
- Cascade delete via Prisma schema (children deleted when parent deleted)

#### FR-4: Search

**Implemented:**

- PostgreSQL full-text search with tsvector column
- GIN index for performance
- Weighted search across all location fields (name: A, type: B, description: C, other fields: D)
- Relevance ranking using ts_rank()
- ⌘K/Ctrl+K keyboard shortcut to open search modal
- Debounced search (300ms) to reduce database load
- Results scoped to current world only
- Search results page with URL query parameter support
- Empty states for no results

**Technical Details:**

- Migration: `003_location_fulltext_search.sql` adds search_vector column, GIN index, and automatic update trigger
- Server Action: `searchLocations(worldId, query)` returns ranked results
- Hook: `useDebounce` for 300ms delay
- Component: `GlobalSearch` with CommandDialog (shadcn/ui)

#### FR-5: Activity Tracking

**Implemented:**

- Log all create/update/delete operations
- Store: user_id, entity_type, entity_id, action, timestamp, metadata (JSON)
- Activity feed on world dashboard (last 20 changes)
- Activity includes user name, action description, time ago formatting

**Technical Details:**

- Prisma model: `Activity` with worldId, userId, entityType (enum), entityId, action, metadata (JSON), createdAt
- Index: (worldId, createdAt) for fast queries
- RLS policies: cascade from world permissions

---

### 5.2 Phase 2: Core Entity Types & Relationships (Next - 10 weeks)

#### FR-6: Character Management

**Create character with:**

- Basic info: name, role, species, age, gender
- Appearance: physical description (markdown), portrait image
- Personality: traits, goals, fears, motivations (markdown)
- Backstory: history, significant events (markdown)
- Relationships: family, friends, enemies, factions (linked to other entities)
- Custom attributes: JSON for genre-specific stats (STR, DEX, magic affinity, etc.)

**Character list with:**

- Card view (portrait thumbnails) and table view
- Filter by: role, species, faction membership
- Sort by: name, creation date, last updated
- Search across all character fields

**Character detail page:**

- All attributes displayed
- Relationships panel showing connections to other characters, locations, factions
- Activity log for this character
- Comments section (if collaboration enabled)
- Edit/delete actions

**Technical Requirements:**

- Prisma model: `Character` with worldId, name, slug, role, species, age, appearance, personality, backstory, goals, fears, attributes (JSON), imageUrl
- RLS policies: cascade from world
- Slug uniqueness: unique per world (worldId + slug)

#### FR-7: Event Management

**Create event with:**

- Basic info: name, date (flexible text format), type
- Description: what happened (markdown)
- Significance: importance to world/story
- Location: where it occurred (linked to Location entity)
- Participants: characters and factions involved (JSON array of IDs)
- Custom attributes: JSON for genre-specific details

**Event list with:**

- Table view with date, name, location, type
- Timeline view (horizontal scroll) grouped by date
- Filter by: type, location, participants
- Sort by: date, name, creation date

**Event detail page:**

- All attributes
- Linked location and participants
- Timeline context (previous/next events)
- Edit/delete actions

**Technical Requirements:**

- Prisma model: `Event` with worldId, name, slug, date (string for flexibility), description, significance, type, locationId, participants (JSON), attributes (JSON)
- Date parsing: support various formats ("1453 BCE", "Year 342", "The Long Night")
- RLS policies: cascade from world

#### FR-8: Item Management

**Create item with:**

- Basic info: name, type, rarity
- Description: what it is (markdown)
- Properties: magical effects, stats (JSON)
- History: how it was created, previous owners (markdown)
- Current owner: character or location reference
- Custom attributes: JSON for genre-specific details
- Image upload

**Item list with:**

- Card view (item illustrations) and table view
- Filter by: type, rarity, owner
- Sort by: name, rarity, creation date

**Item detail page:**

- All attributes
- Ownership history timeline
- Related characters/locations
- Edit/delete actions

**Technical Requirements:**

- Prisma model: `Item` with worldId, name, slug, type, rarity, description, properties, history, currentOwner (string/ref), location (string/ref), attributes (JSON), imageUrl
- RLS policies: cascade from world

#### FR-9: Faction Management

**Create faction with:**

- Basic info: name, type (kingdom, guild, corporation, religion, military)
- Description: purpose, history (markdown)
- Goals: what the faction wants (markdown)
- Structure: hierarchy description (markdown)
- Headquarters: location reference
- Leadership: list of character IDs (JSON array)
- Members: list of character IDs (JSON array)
- Allies: list of faction IDs (JSON array)
- Enemies: list of faction IDs (JSON array)
- Custom attributes: JSON for genre-specific details
- Emblem/logo image upload

**Faction list with:**

- Card view (emblem thumbnails) and table view
- Filter by: type, headquarters location
- Sort by: name, creation date

**Faction detail page:**

- All attributes
- Org chart visualization (leadership → members)
- Relationship web (allies and enemies)
- Member list with links to characters
- Edit/delete actions

**Technical Requirements:**

- Prisma model: `Faction` with worldId, name, slug, type, description, goals, structure, headquartersId, leadership (JSON), members (JSON), allies (JSON), enemies (JSON), attributes (JSON), emblemUrl
- RLS policies: cascade from world

#### FR-10: Relationships & Graph Visualization

**Create relationship between any two entities:**

- Source entity (character, location, event, item, faction)
- Target entity (any entity type)
- Relationship type: predefined (friend, enemy, family, member, located_in, owns, etc.) or custom text
- Directionality: unidirectional (A → B) or bidirectional (A ↔ B)
- Strength: 1-10 scale
- Description: optional context (markdown)

**View relationships:**

- Panel on entity detail page showing all connections
- Grouped by relationship type
- Click to navigate to related entity
- Edit/delete relationship inline

**Relationship graph visualization:**

- Accessible from world dashboard
- Force-directed graph layout (React Flow or Cytoscape.js)
- Nodes: entities (color-coded by type, size by relationship count)
- Edges: relationships (labeled with type, arrow for direction)
- Controls: pan, zoom, drag nodes
- Filters: entity type, relationship type, strength threshold
- Search to highlight specific entity
- Click node to open entity detail modal
- Export as PNG/SVG

**Technical Requirements:**

- Prisma model: `Relationship` with worldId, sourceType (enum), sourceId, targetType (enum), targetId, type, description, strength, isDirectional, attributes (JSON)
- RLS policies: cascade from world
- Graph library: React Flow (preferred for performance) or Cytoscape.js

#### FR-11: Collaboration Basics

**Invite members to world:**

- Share modal with email input
- Select role: Viewer, Commenter, Editor, Admin
- Send email invite via Supabase Edge Function
- Invite link expires in 7 days
- Invitee must sign up/login to accept

**Member management:**

- List all members with roles and join dates
- Change role dropdown (owner only)
- Remove member button (owner only)
- Notification to affected user on change/removal

**Role-based access control (RBAC):**

- **Viewer:** Read-only access to all entities
- **Commenter:** Viewer + add/edit/delete own comments
- **Editor:** Commenter + create/edit/delete entities
- **Admin:** Editor + manage members, change world settings
- **Owner:** Admin + transfer ownership, delete world

**Comments:**

- Comment form at bottom of entity detail pages
- Markdown support in comments
- Threaded replies (1 level deep)
- Edit own comments (5 min window)
- Delete own comments
- @mention users (autocomplete, sends notification)
- Email notification for replies and @mentions

**Technical Requirements:**

- Prisma model: `WorldMember` with worldId, userId, role (enum), invitedBy, invitedAt
- Prisma model: `Comment` with worldId, entityType (enum), entityId, userId, content, parentId (for replies), createdAt
- RLS policies: check WorldMember role for access
- Email: Supabase Edge Function + SendGrid/Resend

#### FR-12: Export

**Export formats:**

- **JSON:** Full world dump (all entities, relationships, metadata) as single JSON file
- **Markdown:** Zip file with folder structure, one .md file per entity with frontmatter for metadata

**Export flow:**

- Export button on world dashboard
- Select format (JSON or Markdown)
- Processing indicator for large worlds (async job)
- Download link when complete (expires in 24 hours)
- Success notification with link

**Technical Requirements:**

- Server Action: `exportWorld(worldId, format)` creates export job
- JSON export: serialize all world data with proper relationships
- Markdown export: use frontmatter for metadata, markdown body for descriptions
- File generation: Node.js streams for large exports
- Storage: Supabase Storage for temporary export files (24-hour TTL)

---

### 5.3 Phase 3: Advanced Features (June 2025 Target)

#### FR-13: AI-Assisted Features

**AI entity generation:**

- "Generate with AI" button on create forms
- Modal with prompt input: "Describe what you want to create"
- Context sent to LLM: world genre, description, existing entities
- LLM generates all entity fields
- Preview before saving (editable)
- Regenerate button for different result
- Rate limit: 5 generations/hour free, unlimited premium

**AI relationship suggestions:**

- "Suggest Relationships" button on entity detail
- Analyze entity + all world entities
- Return 3-5 suggestions with reasoning
- Each suggestion has "Add" and "Dismiss" buttons
- Rate limit: 10 suggestions/day free, unlimited premium

**Consistency checker:**

- "Run Consistency Check" button on dashboard
- Batch analyze all entities for:
  - Date conflicts (event A before B but references B)
  - Location impossibilities (character in two places)
  - Description contradictions (hair color changes)
- Generate report with severity levels (error, warning, info)
- Click issue to view conflicting entities side-by-side
- Mark as false positive (hide from future reports)
- Rate limit: 1 check/day free, 5/day premium

**AI writing prompts:**

- "Get Writing Prompts" button on dashboard
- Options: focus on specific entities or random
- Generate 5-10 prompts: story starters, quest hooks, conflict ideas
- Save to collection or dismiss
- Regenerate for new batch
- Rate limit: 3 generations/day free, unlimited premium

**Technical Requirements:**

- LLM provider: OpenAI GPT-4 or Anthropic Claude (TBD)
- Embeddings: OpenAI text-embedding-3-small for semantic search
- Rate limiting: Redis (Upstash) or database tracking
- Context window: optimize prompts to fit within token limits
- Cost management: track usage per user, implement hard limits

#### FR-14: Visualization Tools

**Interactive map:**

- Upload map image (PNG/JPG, max 10MB)
- Leaflet.js or Pixi.js for rendering
- Add location markers (drag-and-drop)
- Custom marker icons per location type
- Click marker to view location details
- Draw lines for routes/borders
- Layers toggle (political, terrain, climate)
- Distance measurement tool
- Save coordinates to location.coordinates
- Export map as PNG with markers

**Timeline visualization:**

- Horizontal scrollable timeline (vis-timeline or custom)
- Parse event dates to position on timeline
- Zoom controls (year/decade/century scales)
- Event markers with icons (type-based colors)
- Click for detail popup
- Filter by type, location, participants
- Highlight related events (same location/characters)
- Export as PNG

**Family tree:**

- Generate from character relationships (type="parent"/"child")
- Tree layout (top-to-bottom or left-to-right)
- Character portraits on nodes
- Expand/collapse branches
- Click to view character detail
- Export as PNG/SVG

**Org chart:**

- Generate from faction leadership/members
- Hierarchical tree layout
- Faction emblem at root
- Character portraits on nodes
- Click to view character/faction detail
- Export as PNG/SVG

**Analytics dashboard:**

- Entity counts pie chart (by type)
- Activity line chart (last 30 days)
- Completeness score per entity (% fields filled)
- Leaderboard (shared worlds): top contributors
- Most/least connected entities (relationship degree)
- Orphaned entities list (no relationships)
- Export data as CSV

**Technical Requirements:**

- Map library: Leaflet.js (lightweight) or Pixi.js (high performance)
- Timeline library: vis-timeline or Recharts with custom timeline component
- Tree library: React Flow (preferred) or d3-hierarchy
- Chart library: Recharts (already installed) or Chart.js
- Image upload: Supabase Storage with client-side resizing
- Export: html2canvas for PNG, native SVG export

#### FR-15: Public Gallery & Cloning

**Public gallery:**

- Route: `/explore`
- Grid view of public worlds (cover images)
- Sort by: popular (view count), recent, alphabetical
- Filter by: genre, tags
- Search by: title/description (full-text)
- Click to view world (read-only for non-members)
- "Clone to My Worlds" button
- Bookmark button

**Cloning:**

- Full copy of world structure
- All entities, relationships, tags, pages copied
- Cloner becomes owner of new world
- Original author credited in metadata
- Cloned world is Private by default
- Original world_id stored for attribution

**Bookmarks:**

- Bookmark button on public world detail
- Bookmarks list on user profile
- Remove bookmark option

**Technical Requirements:**

- Privacy enum: PRIVATE, UNLISTED, PUBLIC
- View count tracking (increment on world detail view)
- Clone operation: deep copy all related entities, generate new IDs
- Bookmarks model: `Bookmark` with userId, worldId, createdAt
- RLS: public worlds readable by all, private/unlisted only by members

#### FR-16: Templates & Import

**Genre templates:**

- Predefined templates: Fantasy, Sci-Fi, Modern Urban, Historical, Horror
- Each includes starter entities (5-10 characters, 3-5 locations, etc.)
- Template gallery on world creation flow
- Customize template before creating (edit entity names)
- All entities created on world save

**Custom entity templates:**

- "Save as Template" button on entity edit page
- Template includes all field values and structure
- Template library on user profile
- Apply template when creating entity (pre-fill form)
- Public/private toggle
- Public template marketplace (browse, clone)

**Import from other platforms:**

- Import wizard on world dashboard
- Supported formats:
  - CSV: Column headers map to entity fields
  - Markdown: Frontmatter for metadata, body for description
  - JSON: World Anvil export, Campfire export, generic schema
- Upload files or paste text
- Field mapping UI (drag-and-drop columns to fields)
- Preview parsed data (first 5 entities)
- Confirm and batch import
- Error report (failed imports with reasons)

**Technical Requirements:**

- Template storage: JSON in database or separate Prisma model
- Import parser: CSV (papaparse), Markdown (gray-matter), JSON (native)
- Field mapping UI: dnd-kit for drag-and-drop
- Batch import: queue system for large imports (BullMQ or pg-boss)

#### FR-17: World Versioning

**Create snapshot:**

- "Save Snapshot" button on dashboard
- Modal: name (required), description (optional)
- Serialize entire world to JSON (all entities, relationships, tags, pages)
- Store in world_versions table
- Limit 50 snapshots per world (auto-prune oldest)
- Success notification with link to version history

**View version history:**

- List all snapshots with name, timestamp, creator
- Click to view snapshot details (read-only)
- Diff viewer between two selected snapshots
- Shows added/removed/modified entities
- Field-level diff for modified entities

**Restore snapshot:**

- "Restore" button on snapshot row
- Modal: preview diff between current state and snapshot
- Confirmation checkbox: "I understand this will overwrite current state"
- Auto-save current state as snapshot before restore
- Restore replaces all entities with snapshot data
- Activity log recorded

**Technical Requirements:**

- Prisma model: `WorldVersion` with worldId, versionNum, name, description, snapshot (JSONB), createdAt, createdBy
- Snapshot serialization: recursive JSON export of all entities
- Diff algorithm: deep-diff or custom implementation
- Restore: transactional batch delete/create operations

#### FR-18: Real-Time Collaboration

**Presence indicators:**

- Show active users on entity detail pages (avatar pills)
- Supabase Realtime presence channel per world
- Broadcast join/leave events
- Display user avatars with online indicator

**Live updates:**

- Broadcast create/update/delete events to all connected clients
- Subscribe to world channel: `world:{worldId}`
- Receive events: entity_created, entity_updated, entity_deleted
- Optimistic UI updates with rollback on conflict
- Toast notifications: "Alice updated the Character X"

**Conflict resolution:**

- Detect if two users edit same entity simultaneously
- Last-write-wins strategy (newer timestamp)
- Show conflict warning to second saver
- Option to view other user's version and merge manually

**Technical Requirements:**

- Supabase Realtime channels (WebSocket)
- Presence tracking: track userId, userName, avatarUrl, current page
- Broadcast: send events on create/update/delete Server Actions
- Conflict detection: check updatedAt timestamp before save

---

### 5.4 Phase 4: ChatGPT Apps SDK Integration (September 2025 Target)

#### FR-19: MCP Server

**Endpoint:** `/api/mcp`
**Protocol:** JSON-RPC 2.0 over HTTPS with Server-Sent Events

**Tools exposed:**

- `create_world` - Create new world with genre and description
- `get_worlds` - List user's worlds
- `get_world` - Get world details and entity summary
- `create_character` - Create character with attributes
- `get_character` - Get character details
- `update_character` - Update character attributes
- `create_location` - Create location with hierarchy
- `get_location` - Get location details
- `add_relationship` - Create relationship between entities
- `search_world` - Full-text search within world
- `get_world_summary` - Generate AI summary of world
- `export_world` - Export world to JSON/Markdown
- `suggest_ideas` - AI-powered brainstorming based on world context

**Each tool has:**

- JSON Schema for parameters
- `_meta` annotations for ChatGPT (outputTemplate, widgetAccessible)
- OAuth token validation on every request (JWT verify)

**Technical Requirements:**

- JSON-RPC 2.0 spec compliance
- SSE for streaming responses (long-running operations)
- Tool definitions with strict JSON Schema validation
- Rate limiting per OAuth token
- Error handling with standard JSON-RPC error codes

#### FR-20: OAuth 2.1 Authorization

**Authorization flow:**

- Protected resource metadata: `/.well-known/oauth-protected-resource`
- Authorization server: Supabase Auth
- Dynamic client registration supported
- PKCE required (S256 code challenge method)
- Scopes: `worlds:read`, `worlds:write`, `worlds:share`
- Token validation on every MCP request (JWT verify)

**Security:**

- HTTPS only (TLS 1.3)
- CORS headers for `https://chatgpt.com`
- Token rotation supported
- Revocation endpoint
- Audit logging for all OAuth operations

**Technical Requirements:**

- Supabase Auth OAuth configuration
- Custom OAuth endpoints for ChatGPT-specific flow
- JWT token validation middleware
- Scope enforcement per tool (read vs. write operations)

#### FR-21: Conversational Widgets

**Widget types:**

**Inline cards:**

- World card: cover image, name, genre, entity counts
- Character card: portrait, name, role, quick stats
- Location card: image, name, type, parent hierarchy

**Picture-in-Picture:**

- Character sheet: full attributes, relationships, bio
- Relationship graph: interactive mini-graph for entity

**Fullscreen:**

- World dashboard: entity counts, activity, navigation
- Map viewer: interactive map with location pins
- Timeline: scrollable event timeline

**Widget implementation:**

- Built with React
- Bundled with Vite (single ESM per widget)
- Served from `/api/widgets/{name}.html`
- MIME type: `text/html+skybridge`
- `window.openai` API integration:
  - `setWidgetState(state)` - Persist context visible to ChatGPT (max 4k tokens)
  - `callTool(toolName, params)` - Invoke MCP tool from widget
  - `sendFollowUpMessage(message)` - Send message to ChatGPT from widget action

**State management:**

- Persist context visible to ChatGPT (max 4k tokens)
- State includes: worldId, currentEntity, filters
- State rehydrated on component-initiated tool calls
- New chat creates fresh state

**Technical Requirements:**

- React 19 with Vite bundler
- Tailwind CSS v4 for styling
- Widget manifest with iframe config
- PostMessage communication with ChatGPT frame
- Asset bundling: single ESM file per widget
- CORS: allow `https://chatgpt.com`

---

## 6. Technical Architecture

### 6.1 Tech Stack (Validated in Phase 1)

**Frontend:**

- **Framework:** Next.js 16 (App Router) with React 19
- **Styling:** Tailwind CSS v4 (CSS-first engine, no PostCSS)
- **Components:** shadcn/ui (Radix UI primitives + Tailwind)
  - Installed: Button, Input, Label, Card, Badge, Select, Tabs, Table, Alert, Skeleton, Command, AlertDialog, RadioGroup, Separator, Popover, Toast (Sonner)
- **Forms:** React Hook Form + Zod validation
- **State Management:**
  - TanStack Query for server state (future - Phase 2)
  - React Context for client state (current)
- **Markdown:** @uiw/react-md-editor (WYSIWYG with live preview)
- **Icons:** Lucide React

**Backend:**

- **Runtime:** Node.js 22+ (LTS)
- **Framework:** Next.js API Routes + Server Actions (primary)
- **Database:** Supabase PostgreSQL
- **ORM:** Prisma (v5.x)
- **Auth:** Supabase Auth (OAuth 2.1, email/password)
- **Storage:** Supabase Storage (file uploads)
- **Real-time:** Supabase Realtime (WebSocket channels) - Phase 3

**Database:**

- **Provider:** Supabase (managed PostgreSQL 15+)
- **Connection Pooling:** PgBouncer
  - Port 6543 (transaction pooler) for all queries
  - Port 5432 (direct) for migrations only
- **Search:** PostgreSQL tsvector with GIN indexes
- **Indexes:** Foreign keys, slugs, search vectors, activity timestamps

**Testing:**

- **Unit/Integration:** Vitest (fast, ESM-native)
- **UI Testing:** React Testing Library
- **E2E:** Playwright (Chromium, Firefox, mobile)
- **Coverage:** 76% (target 80% for Phase 2)
- **Test Database:** Separate Supabase project (.env.test)

**DevOps:**

- **Hosting:** Vercel (serverless, edge functions)
- **CI/CD:** GitHub Actions
  - Lint, format, test on every push
  - Build verification on PRs
  - Deploy to preview on PR, production on merge to main
- **Monitoring:** Sentry (error tracking) - Phase 2
- **Analytics:** Vercel Analytics - Phase 2
- **Version Control:** Git + GitHub

**External Services:**

- **Email:** Supabase Edge Functions + SendGrid/Resend - Phase 2
- **AI:** OpenAI GPT-4 or Anthropic Claude - Phase 3
- **Rate Limiting:** Upstash Redis - Phase 3

### 6.2 Architecture Patterns (Established in Phase 1)

#### Authentication Flow

**Session Management:**

1. User signs up/logs in via Supabase Auth
2. Session stored in HTTP-only cookies (secure, SSR-friendly)
3. `src/middleware.ts` runs on EVERY request to refresh session via `updateSession()`
4. Database trigger auto-creates `users` table record on signup
5. `User` model in Prisma (public.users) references auth.users(id)

**Supabase Client Usage:**

- **Client components:** `createClient()` from `@/lib/supabase/client`
- **Server components/actions:** `createClient()` from `@/lib/supabase/server` (**async**)
- Both respect RLS policies automatically

**Auth Checks:**

```typescript
// Server Component/Action pattern
const supabase = await createClient();
const {
  data: { user },
  error,
} = await supabase.auth.getUser();
if (!user) {
  redirect("/login");
}
```

#### Data Access Patterns

**Server Components (Preferred):**

- Fetch data directly in async server components
- Use Prisma (`prisma.world.findMany()`) or Supabase client
- No API route needed - direct database access
- Better security (no exposed endpoints) and performance (no HTTP overhead)

**Example:**

```typescript
// app/worlds/page.tsx (Server Component)
export default async function WorldsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const worlds = await prisma.world.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' }
  });

  return <WorldsList worlds={worlds} />;
}
```

**Server Actions (Mutations):**

- Use `"use server"` directive
- Accept validated input (Zod schema)
- Perform auth check
- Execute database operation
- Revalidate cache if needed
- Return typed response

**Example:**

```typescript
// app/worlds/actions.ts
"use server";

export async function createWorld(values: CreateWorldInput) {
  const validated = createWorldSchema.parse(values); // 1. Validate

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" }; // 2. Auth

  const world = await prisma.world.create({
    data: { ...validated, userId: user.id },
  }); // 3. DB operation

  revalidatePath("/worlds"); // 4. Revalidate cache

  return { success: true, data: world }; // 5. Return response
}
```

**Client Components with Server Actions:**

```typescript
// components/forms/world-form.tsx
"use client";

export function WorldForm() {
  const form = useForm({ resolver: zodResolver(createWorldSchema) });

  async function onSubmit(values) {
    const result = await createWorld(values);
    if (result.success) {
      toast.success("World created!");
      router.push(`/worlds/${result.data.slug}`);
    } else {
      toast.error(result.error);
    }
  }

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}
```

**API Routes (Limited Use):**

- Only for: external APIs, webhooks, custom HTTP methods, file downloads
- NOT for: fetching data in Server Components (use direct Prisma access)

#### Form Handling Workflow

**Standard pattern:**

1. **Define Zod schema** in `src/lib/schemas/`

```typescript
// src/lib/schemas/world.schema.ts
export const createWorldSchema = z.object({
  name: z.string().min(1).max(100),
  genre: z.nativeEnum(Genre),
  description: z.string().max(5000).optional(),
  privacy: z.nativeEnum(Privacy).default(Privacy.PRIVATE),
});

export type CreateWorldInput = z.infer<typeof createWorldSchema>;
```

2. **Create Server Action** with validation

```typescript
// app/worlds/actions.ts
"use server";

export async function createWorld(values: CreateWorldInput) {
  const validated = createWorldSchema.parse(values); // Server-side validation
  // ... auth check, DB operation, revalidation
}
```

3. **Create form component** with React Hook Form

```typescript
// components/forms/world-form.tsx
"use client";

export function WorldForm() {
  const form = useForm<CreateWorldInput>({
    resolver: zodResolver(createWorldSchema), // Client-side validation
    defaultValues: { privacy: Privacy.PRIVATE },
  });

  // ... onSubmit handler calls Server Action
}
```

**Key principle:** ALWAYS validate on both client (UX) and server (security)

#### Database Schema Design

**Naming conventions:**

- **Tables:** snake_case (via `@@map` in Prisma)
- **Prisma models:** PascalCase
- **Columns:** camelCase in Prisma, snake_case in DB

**Example:**

```prisma
model World {
  id String @id @default(cuid())
  userId String @db.Uuid
  // ... fields

  @@map("worlds") // Table name: worlds
}
```

**Schema patterns:**

- **Slugs:** URL-safe identifiers (unique per world for locations)
- **Soft deletes:** `deletedAt` timestamp (30-day recovery)
- **JSON attributes:** Extensibility without schema changes
- **Enums:** Type safety for fixed values (Genre, Privacy, etc.)
- **Timestamps:** `createdAt`, `updatedAt` on all entities
- **Cascade deletes:** Parent deletion cascades to children (locations, activities)

**Connection strings:**

- `DATABASE_URL` (port 6543): Transaction pooler - **USE FOR ALL QUERIES**
- `DIRECT_DATABASE_URL` (port 5432): Direct connection - **USE ONLY FOR MIGRATIONS**

#### Row-Level Security (RLS)

**Policy enforcement:**

- Enabled on ALL user data tables (users, worlds, locations, activities, etc.)
- Policies defined in SQL: `prisma/migrations/sql/001_rls_policies.sql`
- Applied via: `npm run db:rls`

**Policy pattern:**

```sql
-- Users can only access their own worlds
CREATE POLICY "Users can CRUD own worlds"
  ON worlds
  FOR ALL
  USING (auth.uid() = user_id);

-- World members can access locations based on world access
CREATE POLICY "World members can access locations"
  ON locations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM worlds
      WHERE worlds.id = locations.world_id
      AND worlds.user_id = auth.uid()
    )
  );
```

**RLS with Prisma:**

- Prisma queries automatically filtered by RLS
- No additional code needed in Server Actions
- Security at database level (defense in depth)

#### Search Implementation

**PostgreSQL full-text search:**

- `tsvector` column for searchable text
- GIN index for fast lookups
- Automatic updates via triggers
- Relevance ranking with `ts_rank()`

**Migration:**

```sql
-- Add search vector column
ALTER TABLE locations ADD COLUMN search_vector tsvector;

-- Create GIN index
CREATE INDEX locations_search_idx ON locations USING GIN(search_vector);

-- Create trigger for automatic updates
CREATE TRIGGER locations_search_update
  BEFORE INSERT OR UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION
  tsvector_update_trigger(
    search_vector, 'pg_catalog.english',
    name, type, description, geography, climate, population
  );
```

**Search query:**

```typescript
// Server Action
export async function searchLocations(worldId: string, query: string) {
  const results = await prisma.$queryRaw`
    SELECT *, ts_rank(search_vector, plainto_tsquery('english', ${query})) AS rank
    FROM locations
    WHERE world_id = ${worldId}
      AND search_vector @@ plainto_tsquery('english', ${query})
    ORDER BY rank DESC
    LIMIT 50
  `;
  return results;
}
```

#### Hierarchical Data (Locations)

**Self-referencing relationship:**

```prisma
model Location {
  id       String     @id @default(cuid())
  parentId String?

  parent   Location?  @relation("LocationHierarchy", fields: [parentId], references: [id])
  children Location[] @relation("LocationHierarchy")
}
```

**Circular reference prevention:**

```typescript
// Check if newParentId is a descendant of locationId
async function isDescendant(
  locationId: string,
  ancestorId: string
): Promise<boolean> {
  const location = await prisma.location.findUnique({
    where: { id: locationId },
    select: { parentId: true },
  });

  if (!location?.parentId) return false;
  if (location.parentId === ancestorId) return true;

  return isDescendant(location.parentId, ancestorId);
}
```

**Cascade delete:**

```prisma
model Location {
  parent Location? @relation("LocationHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  // When parent is deleted, all children are deleted automatically
}
```

### 6.3 Testing Strategy (Established in Phase 1)

**Three-layer pyramid:**

1. **Unit Tests (60-70%)**
   - Framework: Vitest + React Testing Library
   - Location: `src/**/__tests__/*.test.ts(x)`
   - Scope: Components, hooks, utilities, form validation
   - Mocking: Supabase client, Prisma, external APIs
   - Data: Test factories (`src/test/factories/`)
   - Run: `npm test` (watch mode) or `npm run test:coverage`

2. **Integration Tests (20-30%)**
   - Framework: Vitest with real test database
   - Location: `src/app/__tests__/*.integration.test.ts`
   - Scope: Server Actions, RLS policies, complex data flows
   - Database: Separate Supabase project (`.env.test`)
   - Cleanup: `afterAll` hooks delete test data
   - Run: `npm run test:integration`

3. **E2E Tests (10-20%)**
   - Framework: Playwright
   - Location: `e2e/*.spec.ts`
   - Scope: Critical user flows (auth, world lifecycle, location management, search)
   - Browsers: Chromium, Firefox, Mobile Safari
   - Page Objects: `e2e/pages/` (future)
   - Run: `npm run test:e2e`

**Coverage targets:**

- Overall: 80% (Phase 2 target, currently 76%)
- Utilities: 100%
- Server Actions: 90%+
- Components: 70%+
- Enforced in CI: Builds fail below threshold

**Test data factories:**

```typescript
// src/test/factories/world.ts
export function createTestWorld(overrides?: Partial<World>): World {
  return {
    id: cuid(),
    userId: "test-user-id",
    name: "Test World",
    slug: "test-world",
    genre: Genre.FANTASY,
    privacy: Privacy.PRIVATE,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
```

**Mocks:**

```typescript
// src/test/mocks/supabase.ts
export const mockSupabaseClient = {
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: "test-user-id" } },
      error: null,
    }),
  },
};
```

### 6.4 Key Technical Decisions & Rationale

**1. Next.js App Router over Pages Router**

- **Reason:** Server Components by default (better performance, less client JS)
- **Tradeoff:** Steeper learning curve, some libraries not compatible yet
- **Mitigation:** Use `"use client"` directive for interactive components

**2. Server Actions over API Routes**

- **Reason:** Simpler DX (no endpoint definition), type-safe by default, less boilerplate
- **Tradeoff:** Less flexibility for custom HTTP methods, harder to version
- **Mitigation:** Use API routes for external integrations, webhooks

**3. Prisma over raw SQL**

- **Reason:** Type safety, migrations, easy RLS integration
- **Tradeoff:** Performance overhead, complex queries require raw SQL
- **Mitigation:** Use `prisma.$queryRaw` for complex queries (search, analytics)

**4. Supabase over custom auth**

- **Reason:** Battle-tested, OAuth providers, RLS integration, WebSocket support
- **Tradeoff:** Vendor lock-in, limited customization
- **Mitigation:** Abstraction layer for auth logic, standard JWT tokens

**5. PostgreSQL full-text search over Elasticsearch**

- **Reason:** No additional infrastructure, good enough for MVP, lower cost
- **Tradeoff:** Less powerful than dedicated search engine, doesn't scale infinitely
- **Mitigation:** Can migrate to Elasticsearch/Algolia in Phase 4 if needed

**6. HTTP-only cookies over localStorage for auth**

- **Reason:** More secure (no XSS attacks), SSR-friendly
- **Tradeoff:** More complex setup, requires middleware
- **Mitigation:** Supabase handles cookie management automatically

**7. Tailwind CSS v4 over CSS-in-JS**

- **Reason:** Faster build times (CSS-first), smaller bundle, better DX
- **Tradeoff:** Learning curve, utility class verbosity
- **Mitigation:** shadcn/ui provides pre-built components, Tailwind IntelliSense

**8. Vitest over Jest**

- **Reason:** Faster (Vite-based), better ESM support, simpler config
- **Tradeoff:** Smaller ecosystem than Jest
- **Mitigation:** React Testing Library works the same, most Jest patterns portable

---

## 7. Non-Functional Requirements

### 7.1 Performance

**Targets:**

- Initial page load: < 2 seconds (p95)
- Subsequent navigations: < 500ms (client-side routing)
- API response time: < 200ms (p95)
- Database query time: < 100ms (p95)
- Search results: < 300ms (p95)

**Scalability:**

- Support 100,000 concurrent users
- Database: handle 10M+ entities across all users
- Horizontal scaling via serverless (Vercel, Supabase)
- CDN for static assets (Vercel Edge)

**Optimization strategies:**

- Image optimization: WebP format, `next/image` with automatic resizing
- Code splitting: dynamic imports for routes (Next.js automatic)
- Database indexing: all foreign keys, search vectors, activity timestamps
- Connection pooling: PgBouncer (port 6543)
- Caching: TanStack Query (client), Redis (server - Phase 3)

### 7.2 Security

**Authentication security:**

- Passwords hashed with bcrypt (Supabase default)
- Session tokens in HTTP-only cookies (no localStorage)
- CSRF protection via SameSite cookies
- Rate limiting on auth endpoints (5 attempts/15 min)
- Account lockout after failed attempts

**Data security:**

- Row-Level Security (RLS) enforced at database level
- All API endpoints validate authentication
- Input validation: Zod schemas on client and server
- SQL injection prevention: parameterized queries (Prisma)
- XSS prevention: sanitize user input, escape HTML (React automatic)

**Infrastructure security:**

- HTTPS only (TLS 1.3)
- Environment variables never in client bundle
- API keys rotatable, scoped permissions (Phase 3)
- Security headers: CSP, HSTS, X-Frame-Options
- Regular dependency audits (npm audit, Dependabot)

**Privacy & compliance:**

- GDPR compliant: data export, right to deletion
- Privacy policy and terms of service (Phase 2)
- Cookie consent banner (EU users) (Phase 2)
- Data retention: deleted accounts purged after 30 days
- No third-party trackers (privacy-first)

### 7.3 Reliability

**Uptime:**

- Target: 99.9% uptime (43 minutes downtime/month)
- Monitoring: Uptime Robot, Sentry (Phase 2)
- Alerting: Email for critical errors
- Status page: status.worldcrafter.app (Phase 3)

**Data integrity:**

- Database backups: daily automated (Supabase)
- Point-in-time recovery (PITR) available
- Referential integrity via foreign keys
- Soft deletes for user data (30-day recovery)
- Audit logs for all data modifications

**Error handling:**

- Graceful degradation (show cached data if API fails)
- Error boundaries catch React errors
- User-friendly error messages (no stack traces)
- Error reporting: Sentry with user context (Phase 2)
- Retry logic for transient failures (network, rate limits)

### 7.4 Usability

**Accessibility:**

- WCAG 2.1 Level AA compliance target
- Keyboard navigation (tab order, focus indicators)
- Screen reader support (ARIA labels, semantic HTML)
- Color contrast ratios (4.5:1 for text)
- Alternative text for images

**Responsive design:**

- Mobile-first approach (Tailwind default)
- Breakpoints: mobile (< 640px), tablet (640-1024px), desktop (> 1024px)
- Touch-friendly targets (min 44x44px)
- Adaptive layouts (dashboard becomes list on mobile)

**Browser support:**

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)
- No IE11 support

**Internationalization:**

- UI text externalized to i18n files (next-intl) - Phase 3
- Phase 1-2: English only
- Phase 3: Spanish, French, German, Japanese
- Phase 4: RTL support (Arabic, Hebrew)
- Date/time formatting per locale

### 7.5 Maintainability

**Code quality:**

- TypeScript strict mode enabled
- ESLint + Prettier for linting/formatting
- Pre-commit hooks: lint, format, test
- Code review required for all PRs
- Test coverage: 80% minimum (enforced)

**Documentation:**

- Inline code comments for complex logic
- README for setup instructions
- CLAUDE.md for project-specific patterns
- API documentation (OpenAPI spec - Phase 2)
- Component storybook (Phase 3)

**Testing:**

- Unit tests: Vitest + React Testing Library
- Integration tests: Vitest + test database
- E2E tests: Playwright (critical flows)
- Visual regression tests: Chromatic (Phase 3)
- CI/CD: GitHub Actions (test on every push)

---

## 8. Success Metrics & KPIs

### 8.1 Phase 1 Baseline (✅ Achieved - January 2025)

**Technical metrics:**

- ✅ 145 automated tests passing
- ✅ 76% test coverage (exceeds 70% target)
- ✅ Zero critical bugs (P0/P1)
- ✅ Production-ready build (all TypeScript compiles)
- ✅ RLS policies enforced on all user data tables

**Functional metrics:**

- ✅ Authentication flows work (signup, login, logout, session persistence)
- ✅ World CRUD operations functional
- ✅ Location CRUD with hierarchy working
- ✅ Full-text search operational with relevance ranking
- ✅ Activity tracking and audit logs

### 8.2 Phase 2 Targets (March 2025)

**Acquisition:**

- 1,000+ total signups (first 3 months)
- 500+ Monthly Active Users (MAU)
- 200+ Weekly Active Users (WAU)
- Viral coefficient: 0.5+ (invitations tracking)

**Engagement:**

- Average session duration: 10+ minutes
- Actions per session: 5+ (create, edit, search, view)
- Worlds created per user: 1.5+ average
- Entities per world: 15+ average (across all entity types)

**Retention:**

- Day 1 retention: 40%+ (signups who return next day)
- Day 7 retention: 25%+ (signups who return within 7 days)
- Day 30 retention: 15%+ (signups who return within 30 days)
- Monthly churn: < 50%

**Feature adoption:**

- 80%+ users create at least 1 location (validated in Phase 1)
- 60%+ users create at least 1 character
- 40%+ users create relationships between entities
- 30%+ users use collaboration features (invite at least 1 member)
- 25%+ users export data at least once

**Quality:**

- Net Promoter Score (NPS): > 40
- Customer Satisfaction (CSAT): > 4.0/5
- Bug reports per release: < 10 critical bugs
- Average response time (support): < 48 hours

### 8.3 Phase 3 Targets (June 2025)

**Acquisition:**

- 10,000+ total signups
- 5,000+ Monthly Active Users (MAU)
- 2,000+ Weekly Active Users (WAU)
- WAU/MAU ratio: > 0.4

**Engagement:**

- Average session duration: 15+ minutes
- Worlds created per user: 2+ average
- Public worlds in gallery: 500+
- Bookmarks per user: 3+ average

**Feature adoption (AI):**

- 50%+ users try AI generation within first week
- 30%+ use AI suggestions weekly
- 20%+ run consistency checker at least once
- 15%+ use AI writing prompts

**Feature adoption (Visualization):**

- 40%+ users upload map image
- 30%+ users view relationship graph
- 25%+ users view timeline
- 20%+ users view analytics dashboard

**Quality:**

- Net Promoter Score (NPS): > 50
- Customer Satisfaction (CSAT): > 4.5/5
- Day 30 retention: > 20%

### 8.4 Phase 4 Targets (September 2025)

**Acquisition:**

- 50,000+ total signups
- 25,000+ Monthly Active Users (MAU)
- ChatGPT app installs: 10,000+
- 30%+ of new signups from ChatGPT discovery

**Engagement:**

- ChatGPT users: 5,000+ MAU
- Average MCP tool calls per session: 10+
- Widget interactions per session: 5+

**Quality:**

- ChatGPT app rating: 4.5+ stars
- NPS (ChatGPT users): > 50

### 8.5 Revenue Metrics (Phase 3+ - Premium Tier Launch)

**Conversion:**

- Free → Premium conversion rate: 5% target
- Average time to conversion: 30 days

**Revenue:**

- Monthly Recurring Revenue (MRR): $50K by end of 2025
- Customer Lifetime Value (LTV): $300+
- LTV:CAC ratio: > 3:1

**Retention:**

- Premium churn rate: < 5% monthly
- Annual plan adoption: 30%+ of premium users

---

## 9. Release Criteria

### 9.1 Phase 1: MVP (✅ Complete - January 2025)

**Functionality:**

- ✅ User registration, login, profile
- ✅ Create, edit, delete worlds
- ✅ Create, edit, delete locations (hierarchical)
- ✅ World dashboard with stats and activity
- ✅ Global search (full-text)
- ✅ RLS policies enforced

**Quality:**

- ✅ Zero critical bugs
- ✅ Test coverage > 70% (achieved 76%)
- ✅ Lighthouse score > 85 (baseline established)
- ✅ Manual testing of all core flows

**Documentation:**

- ✅ README updated with setup instructions
- ✅ Phase 1 implementation plan complete
- ✅ CLAUDE.md with project patterns

**Status:** ✅ Production-ready, deployment pending user approval

---

### 9.2 Phase 2: Core Features (Target: March 2025 - 10 weeks)

**Functionality:**

- ☐ All 5 entity types (Characters, Events, Items, Factions + Locations)
- ☐ Relationship management + graph visualization
- ☐ Collaboration (invites, roles: Viewer/Commenter/Editor/Admin, comments)
- ☐ Export (JSON, Markdown)
- ☐ Character/Location/Event/Item/Faction CRUD operations
- ☐ Relationship graph with filters and search

**Quality:**

- ☐ Zero critical bugs
- ☐ < 10 high-priority bugs
- ☐ Test coverage > 80%
- ☐ Lighthouse score > 90
- ☐ E2E tests for all new entity types

**Metrics:**

- ☐ 1,000+ signups from launch
- ☐ NPS > 40
- ☐ D7 retention > 25%

**Documentation:**

- ☐ Full user documentation (entity types, collaboration, export)
- ☐ API documentation (if public API released)

**Go/No-Go Decision:** Product + Engineering + Design approval + user feedback review

---

### 9.3 Phase 3: Advanced Features (Target: June 2025 - 12 weeks)

**Functionality:**

- ☐ AI entity generation, suggestions, consistency checker, writing prompts
- ☐ Visualization tools (interactive maps, timelines, family trees, analytics)
- ☐ Public gallery + cloning
- ☐ Templates (genre templates, custom entity templates)
- ☐ Import from other platforms (CSV, Markdown, JSON)
- ☐ World versioning (snapshots, restore, diff viewer)
- ☐ Real-time collaboration (presence, live updates, conflict resolution)

**Quality:**

- ☐ Zero critical bugs
- ☐ < 15 high-priority bugs
- ☐ Test coverage > 80%
- ☐ Lighthouse score > 90
- ☐ Performance testing under load (1000 concurrent users)

**Metrics:**

- ☐ 10,000+ users
- ☐ NPS > 50
- ☐ D30 retention > 20%
- ☐ 50%+ users try AI features

**Documentation:**

- ☐ AI feature guide
- ☐ Visualization guide
- ☐ Import/export guide
- ☐ Public gallery user guide

**Go/No-Go Decision:** Full leadership team approval

---

### 9.4 Phase 4: ChatGPT Integration (Target: September 2025 - 8 weeks)

**Functionality:**

- ☐ MCP server operational
- ☐ OAuth flow tested end-to-end
- ☐ All core tools exposed (create, read, update entities)
- ☐ At least 5 widgets (inline, PiP, fullscreen)
- ☐ Widget state management working
- ☐ ChatGPT app submitted and approved

**Quality:**

- ☐ Zero critical bugs in MCP server
- ☐ OAuth security audit passed
- ☐ Widget performance (< 1s load)
- ☐ CORS configuration secure
- ☐ Rate limiting per OAuth token

**Metrics:**

- ☐ 25,000+ users in standalone app
- ☐ Beta test with 100+ ChatGPT users (positive feedback)
- ☐ 10,000+ ChatGPT app installs within 3 months

**Documentation:**

- ☐ ChatGPT integration user guide
- ☐ OAuth setup documentation
- ☐ Widget API documentation
- ☐ MCP tool reference

**Go/No-Go Decision:** Leadership + Legal (privacy review) + OpenAI partnership approval

---

## 10. Risks & Mitigation

### 10.1 Technical Risks

**Risk 1: Database performance degrades with large worlds**

- **Likelihood:** Medium
- **Impact:** High (slow queries, poor UX)
- **Mitigation:**
  - Proper indexes on all foreign keys, search vectors
  - Pagination on all list views (20-50 items per page)
  - Query profiling with Prisma logging
  - Add Redis caching for frequently accessed data (Phase 3)
- **Contingency:** Migrate hot tables to separate database, add read replicas

**Risk 2: Search doesn't scale beyond 10K entities per world**

- **Likelihood:** Low (Phase 2-3)
- **Impact:** Medium (slow search results)
- **Mitigation:**
  - Limit search results to 50 per query
  - Add pagination to search results
  - PostgreSQL GIN indexes handle up to 100K+ documents well
- **Contingency:** Migrate to Elasticsearch or Algolia in Phase 4

**Risk 3: Supabase RLS policies create N+1 query problems**

- **Likelihood:** Medium
- **Impact:** Medium (slow page loads)
- **Mitigation:**
  - Test RLS with large datasets in integration tests
  - Use Prisma `include` to eager-load relationships
  - Profile queries with `EXPLAIN ANALYZE`
- **Contingency:** Optimize policies, add materialized views, or disable RLS for read-only public data

**Risk 4: Real-time collaboration causes data conflicts**

- **Likelihood:** High (Phase 3)
- **Impact:** Medium (data loss, user frustration)
- **Mitigation:**
  - Last-write-wins strategy with conflict warnings
  - Optimistic UI with rollback on conflict
  - Versioning system to recover from conflicts
- **Contingency:** Implement operational transformation (OT) or CRDTs for true collaborative editing

**Risk 5: AI costs spiral out of control**

- **Likelihood:** Medium (Phase 3)
- **Impact:** High (unsustainable economics)
- **Mitigation:**
  - Strict rate limits (5 generations/hour free, 50/day premium)
  - Use smaller models for simple tasks (GPT-3.5 vs GPT-4)
  - Cache common AI responses (character archetypes, etc.)
  - Monitor costs per user with alerts
- **Contingency:** Reduce free tier limits, increase premium pricing, switch to cheaper provider (Anthropic Claude)

### 10.2 Product Risks

**Risk 6: Users don't understand hierarchical locations**

- **Likelihood:** Medium
- **Impact:** Medium (confusion, poor adoption)
- **Mitigation:**
  - Onboarding tour showing example hierarchy (Phase 2)
  - Visual tree view with expand/collapse
  - Clear parent selector with "None (top-level)" option
  - Tooltips and help text
- **Contingency:** Add "flat" mode where hierarchy is optional

**Risk 7: Feature bloat overwhelms new users**

- **Likelihood:** High (Phase 3+)
- **Impact:** High (high bounce rate, poor retention)
- **Mitigation:**
  - Progressive disclosure (hide advanced features initially)
  - Onboarding flow that introduces features gradually
  - "Simplified" vs "Advanced" mode toggle
  - Empty states that guide next action
- **Contingency:** Create "WorldCrafter Lite" simplified version for casual users

**Risk 8: Collaboration features unused (30% adoption target not met)**

- **Likelihood:** Medium
- **Impact:** Medium (wasted development effort)
- **Mitigation:**
  - Invite flow prominently featured in UI
  - Email invites with compelling preview
  - Show collaboration benefits in onboarding
  - Track adoption metrics weekly
- **Contingency:** De-prioritize real-time features, focus on async collaboration (comments, exports)

**Risk 9: Public gallery has low-quality or inappropriate content**

- **Likelihood:** High (Phase 3)
- **Impact:** Medium (brand damage, legal issues)
- **Mitigation:**
  - Moderation queue for newly public worlds
  - Report button on all public content
  - Community guidelines in ToS
  - Automated content filtering (profanity, NSFW)
- **Contingency:** Require manual approval for public worlds, hire moderators

### 10.3 Business Risks

**Risk 10: ChatGPT Apps SDK changes or deprecates during Phase 4**

- **Likelihood:** Low-Medium
- **Impact:** Very High (major feature blocked)
- **Mitigation:**
  - Stay in close contact with OpenAI partnership team
  - Build MCP server to spec, following all guidelines
  - Have fallback: standalone MCP server can work with other Claude-compatible clients
- **Contingency:** Pivot to Anthropic Claude or other LLM platforms with MCP support

**Risk 11: Competitors copy features faster than we can ship**

- **Likelihood:** High
- **Impact:** Medium (reduced differentiation)
- **Mitigation:**
  - Focus on UX excellence, not just feature parity
  - Build community and network effects early
  - Strong data portability reduces switching costs both ways
  - Iterate faster with streamlined architecture
- **Contingency:** Double down on AI differentiation and ChatGPT integration (harder to copy)

**Risk 12: Premium conversion rate < 5% target**

- **Likelihood:** Medium
- **Impact:** High (revenue targets missed)
- **Mitigation:**
  - Generous free tier builds trust and adoption
  - Clear premium value prop (AI, storage, team features)
  - Free trial of premium features (14 days)
  - Track conversion funnel weekly
- **Contingency:** Adjust pricing ($5/mo tier?), add more premium features, enterprise tier for studios

**Risk 13: Free tier abuse (spam accounts, excessive AI usage)**

- **Likelihood:** Medium (Phase 3)
- **Impact:** Medium (cost increase, service degradation)
- **Mitigation:**
  - CAPTCHA on signup
  - Rate limits on all expensive operations
  - Email verification required
  - Monitor usage patterns with alerts
- **Contingency:** Tighten free tier limits, require credit card for AI features

### 10.4 Schedule Risks

**Risk 14: Phase 2 takes longer than 10 weeks**

- **Likelihood:** Medium
- **Impact:** Medium (delayed revenue, competitive pressure)
- **Mitigation:**
  - 20% time buffer built into estimates
  - Weekly progress tracking against plan
  - Defer non-critical features to Phase 3
  - Parallel development where possible
- **Contingency:** Cut scope (defer Items or Factions to Phase 3), extend timeline by 2 weeks max

**Risk 15: Key developer leaves during Phase 2-3**

- **Likelihood:** Low
- **Impact:** Very High (major delays)
- **Mitigation:**
  - Comprehensive documentation (CLAUDE.md, Phase plans)
  - Custom skills capture tribal knowledge
  - Automated tests enable confident refactoring
  - Code review ensures knowledge sharing
- **Contingency:** Hire contractor/freelancer, extend timeline, reduce scope

---

## 11. Phase 2 Roadmap Overview

### 11.1 Phase 2 Goals (10 Weeks - Target: March 2025)

**Primary objectives:**

1. Complete all 5 core entity types (Characters, Events, Items, Factions + Locations from Phase 1)
2. Build relationship system with graph visualization
3. Enable basic collaboration (invites, roles, comments)
4. Provide data portability (JSON and Markdown export)

**Success criteria:**

- All entity types have CRUD operations
- Relationship graph is interactive and useful
- Users can invite collaborators and assign roles
- Users can export complete world data
- 1,000+ signups, 40%+ D1 retention, NPS > 40

### 11.2 Epic Breakdown (10 Weeks)

**Week 1-2: Character Management (18 hours)**

- Day 1-2: Character Server Actions + Zod schemas + integration tests (9 hours)
- Day 3-4: Character forms (create, edit) with portrait upload (6 hours)
- Day 5: Character list (card/table view) + detail page (3 hours)

**Week 3: Event Management (9 hours)**

- Day 1-2: Event Server Actions + schemas + tests (5 hours)
- Day 3: Event forms with flexible date format (2 hours)
- Day 4: Event list + detail page (2 hours)

**Week 4: Item Management (9 hours)**

- Day 1-2: Item Server Actions + schemas + tests (5 hours)
- Day 3: Item forms with properties editor (2 hours)
- Day 4: Item list + detail page (2 hours)

**Week 5: Faction Management (9 hours)**

- Day 1-2: Faction Server Actions + schemas + tests (5 hours)
- Day 3: Faction forms with member management (2 hours)
- Day 4: Faction list + detail page with org chart preview (2 hours)

**Week 6-7: Relationships & Graph (18 hours)**

- Day 1-2: Relationship model + Server Actions + tests (6 hours)
- Day 3-4: Relationship UI on entity detail pages (4 hours)
- Day 5-6: Graph visualization with React Flow (6 hours)
- Day 7: Graph filters and export (2 hours)

**Week 8: Collaboration Basics (9 hours)**

- Day 1-2: WorldMember model + invite Server Actions + tests (5 hours)
- Day 3: Invite UI + member management page (2 hours)
- Day 4: Comments model + UI (2 hours)

**Week 9: Export & Polish (9 hours)**

- Day 1-2: JSON export Server Action + tests (3 hours)
- Day 3-4: Markdown export with frontmatter (4 hours)
- Day 5: UI polish and bug fixes (2 hours)

**Week 10: Testing & Deployment (9 hours)**

- Day 1-2: Comprehensive E2E tests for all new features (4 hours)
- Day 3: Performance testing and optimization (2 hours)
- Day 4: Documentation updates (2 hours)
- Day 5: Production deployment and monitoring setup (1 hour)

**Total estimated effort:** ~90 hours (10 weeks × 9 hours/week with 1 developer)

_Note: Detailed week-by-week implementation plan in separate `PHASE_2_IMPLEMENTATION_PLAN.md`_

### 11.3 Key Deliverables

**Functionality:**

- 5 entity types with full CRUD operations
- Relationship system connecting any entity to any entity
- Interactive graph visualization with filters
- Collaboration with 5 role levels
- Comments with @mentions and email notifications
- Export to JSON and Markdown

**Quality:**

- 80%+ test coverage (up from 76%)
- All E2E tests passing
- Zero P0/P1 bugs
- Lighthouse score > 90

**Documentation:**

- User guide for all entity types
- Collaboration guide (inviting users, roles, permissions)
- Export guide (formats, how to use exports)
- Updated CLAUDE.md with Phase 2 patterns

### 11.4 Phase 2 → Phase 3 Transition

**After Phase 2 completion, assess:**

- User adoption of collaboration features (target: 30%+ invite at least 1 member)
- Export usage (target: 25%+ export at least once)
- Relationship graph usage (target: 40%+ view graph)
- Bug backlog (should be < 10 high-priority bugs)

**Decision point:**

- **If metrics met:** Proceed to Phase 3 (AI features, advanced visualizations, public gallery)
- **If metrics missed:** Extend Phase 2 with UX improvements, onboarding, marketing push

---

## 12. Open Questions & Future Considerations

### 12.1 Open Questions (Needs Decision)

**Q1: Premium tier pricing strategy?**

- **Options:**
  - A) $10/mo Pro (AI + storage), $20/mo Team (+ collaboration)
  - B) $5/mo Pro (basic), $15/mo Pro+ (AI), $30/mo Team
  - C) $10/mo individual, $50/mo studio (5 users)
- **Decision by:** End of Phase 2 (before Phase 3 launch)
- **Decision maker:** Product + Finance

**Q2: Which AI provider (OpenAI vs Anthropic)?**

- **Options:**
  - A) OpenAI GPT-4 (better known, more integrations)
  - B) Anthropic Claude (better at creative writing, lower cost)
  - C) Both (let user choose in settings)
- **Decision by:** Start of Phase 3
- **Decision maker:** Product + Engineering
- **Criteria:** Cost per generation, output quality for worldbuilding, API reliability

**Q3: Mobile app priority (Phase 3 or later)?**

- **Options:**
  - A) Native apps (iOS/Android) in Phase 3
  - B) PWA (Progressive Web App) in Phase 3, native in Phase 4
  - C) Defer to 2026 (web-only for 2025)
- **Decision by:** Mid-Phase 2 (based on mobile traffic analysis)
- **Decision maker:** Product + Engineering
- **Criteria:** Mobile usage %, user requests, development capacity

**Q4: Obsidian plugin priority?**

- **Options:**
  - A) Phase 2 (high demand from power users)
  - B) Phase 3 (after API stabilizes)
  - C) Community-driven (open-source, we provide API docs)
- **Decision by:** End of Phase 2
- **Decision maker:** Product + Community feedback
- **Criteria:** Obsidian user overlap %, API readiness, development effort

**Q5: Real-time collaboration scope?**

- **Options:**
  - A) Full operational transformation (Google Docs-style)
  - B) Presence + live updates only (no simultaneous editing)
  - C) Async only (comments, not real-time)
- **Decision by:** Mid-Phase 2 (based on collaboration adoption)
- **Decision maker:** Product + Engineering
- **Criteria:** Complexity, user demand, performance impact

### 12.2 Future Considerations (Post-2025)

**Advanced AI features:**

- AI Dungeon Master mode (interactive storytelling)
- Voice-to-world (describe world verbally, AI structures it)
- Image-to-entity (upload character art, AI extracts attributes)
- Consistency auto-fix (AI rewrites contradictions)

**Marketplace:**

- User-created templates (buy/sell)
- Asset packs (character portraits, location images)
- Commissioned worlds (hire worldbuilders)

**Game engine integrations:**

- Unity plugin (sync lore to game data)
- Unreal Engine integration
- Godot export
- Roll20 / Foundry VTT integration

**White-label solution:**

- Branded instance for game studios
- Custom domain, SSO, API access
- Priority support
- Revenue share model

**Community features:**

- Forums per world
- Worldbuilding challenges/contests
- Collaborative anthology worlds (multiple authors)
- Livestream integration (Twitch overlays for GMs)

**Content recommendations:**

- "Worlds like this" (collaborative filtering)
- "People who built X also built Y"
- Genre-specific templates from popular worlds

**Advanced export:**

- PDF world bible with professional formatting (latex?)
- EPUB for Kindle
- Twine export (interactive fiction)
- Unity ScriptableObject export

---

## Document Changelog

### Version 2.0 (January 2025)

- **Initial release** of PRD v2
- Incorporated Phase 1 completion status
- Added Technical Architecture section documenting Phase 1 decisions
- Reorganized Functional Requirements by Phase (1-4)
- Updated Success Metrics with Phase 1 baseline
- Revised Release Criteria with Phase 2-4 timelines
- Added Phase 2 Roadmap Overview (10-week plan)
- Incorporated market insights from Executive Summary document
- Streamlined from 2000+ lines to ~950 lines (more focused)

### Version 1.0 (December 2024)

- Original PRD with 17 sections, 2000+ lines
- Detailed user stories for all features
- Full ChatGPT integration specification
- Archived as `docs/PRD_v1_ARCHIVED.md` (reference only)

---

**END OF DOCUMENT**

_For detailed Phase 2 implementation plan, see `docs/PHASE_2_IMPLEMENTATION_PLAN.md`_
_For Phase 1 completion details, see `docs/PHASE_1_IMPLEMENTATION_PLAN.md`_
_For project patterns and conventions, see `CLAUDE.md`_
