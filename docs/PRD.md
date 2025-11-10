# WorldCrafter: Product Requirements Document (PRD)

**Version:** 1.0
**Last Updated:** January 2025
**Document Owner:** Product Team
**Status:** Draft for Review

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Product Vision & Goals](#3-product-vision--goals)
4. [Target Audience](#4-target-audience)
5. [User Personas](#5-user-personas)
6. [User Stories & Jobs to be Done](#6-user-stories--jobs-to-be-done)
7. [Functional Requirements](#7-functional-requirements)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [User Experience Requirements](#9-user-experience-requirements)
10. [Technical Requirements](#10-technical-requirements)
11. [Success Metrics & KPIs](#11-success-metrics--kpis)
12. [Release Criteria](#12-release-criteria)
13. [Risks & Mitigation](#13-risks--mitigation)
14. [Dependencies](#14-dependencies)
15. [Timeline & Roadmap](#15-timeline--roadmap)
16. [Open Questions](#16-open-questions)
17. [Appendices](#17-appendices)

---

## 1. Executive Summary

### 1.1 Product Overview

WorldCrafter is a comprehensive web-based worldbuilding platform designed to help fiction writers, game masters, game developers, and worldbuilding hobbyists create, organize, and explore rich fictional universes. The platform combines structured data management with AI-assisted content generation and will feature integration with the ChatGPT Apps SDK for conversational worldbuilding.

### 1.2 Key Value Propositions

- **Centralized Organization**: Consolidate scattered worldbuilding notes across characters, locations, events, items, and factions in one structured platform
- **Multi-Genre Flexibility**: Support fantasy, sci-fi, modern, historical, horror, and custom genres with adaptable data models
- **AI-Enhanced Creativity**: Leverage AI for content generation, consistency checking, and relationship suggestions
- **Collaborative Worldbuilding**: Enable teams to build worlds together with real-time collaboration and permission controls
- **Visual Understanding**: Provide maps, timelines, relationship graphs, and org charts for spatial and temporal context
- **Future-Ready Interface**: Conversational worldbuilding via ChatGPT Apps SDK integration

### 1.3 Strategic Objectives

1. **Capture Market Share**: Become the #1 choice for structured worldbuilding by Q4 2025
2. **Build Network Effects**: Enable content sharing and discovery to drive viral growth
3. **AI Differentiation**: Lead the market in AI-assisted worldbuilding features
4. **Platform Expansion**: Establish ChatGPT as a secondary interface to reach 800M+ users
5. **Revenue Generation**: Convert 5% of free users to premium tier by end of 2025

### 1.4 Success Criteria

- 10,000 Monthly Active Users (MAU) by end of Phase 2
- 50,000 MAU by end of Phase 3
- 4.5+ star rating from early adopters
- Net Promoter Score (NPS) > 50
- Successfully launch on ChatGPT Apps SDK platform (Phase 4)

---

## 2. Problem Statement

### 2.1 Current Market Pain Points

**For Fiction Writers:**
- Worldbuilding notes scattered across Google Docs, Notion, notebooks, and mind maps
- Inconsistencies accumulate as stories grow (character details change, timeline conflicts)
- Difficult to track complex relationships and hierarchies
- No easy way to visualize spatial/temporal relationships
- Collaboration with co-authors is cumbersome

**For Game Masters (TTRPG):**
- Session prep requires digging through multiple sources
- NPCs and locations lack consistent detail levels
- Hard to reference information quickly during gameplay
- Sharing content with players is manual and fragmented
- No tools for generating consistent random content

**For Game Developers:**
- Narrative design docs are separate from game data pipelines
- Lore changes require manual updates across multiple systems
- No version control for worldbuilding content
- Difficult to export structured data to game engines
- Team collaboration on narrative is inefficient

**For Worldbuilding Hobbyists:**
- Lack of structure leads to incomplete worlds
- Missing connections between entities (orphaned content)
- No feedback or community for improvement
- Inspiration fatigue (blank page syndrome)
- No showcase platform for completed work

### 2.2 Existing Solutions & Gaps

| Platform | Strengths | Gaps |
|----------|-----------|------|
| **World Anvil** | Mature feature set, templates | Steep learning curve, cluttered UI, slow performance |
| **Notion** | Flexible databases, familiar | Not purpose-built, requires manual setup, no visualizations |
| **Obsidian** | Local-first, powerful linking | No collaboration, no AI features, technical barrier |
| **Campfire** | Beautiful UI, story focus | Limited data model, no API/export, closed ecosystem |
| **LegendKeeper** | Good UX, map features | Limited entity types, no AI, expensive |
| **Scrivener** | Industry standard for writing | Not a worldbuilding tool, no structured data |

**Market Gap**: No platform combines structured worldbuilding, AI assistance, modern UX, and conversational interface (ChatGPT integration).

### 2.3 Opportunity

The worldbuilding tools market is growing 15-20% annually driven by:
- Rise of indie game development (Unity/Unreal accessibility)
- TTRPG renaissance (D&D 5e, Critical Role, etc.)
- Self-publishing boom (Amazon KDP, Substack)
- AI content creation explosion
- ChatGPT's 800M+ user base creating distribution opportunity

**WorldCrafter's Opportunity**: Capture early adopters with superior UX and AI features, then scale via ChatGPT integration.

---

## 3. Product Vision & Goals

### 3.1 Vision Statement

*"Empower every storyteller to build living, breathing worlds with the ease of conversation and the power of structured data."*

### 3.2 Product Goals

**Primary Goals (P0):**
1. Enable users to create complete worlds with all entity types (characters, locations, events, items, factions) within 30 minutes
2. Reduce worldbuilding time by 50% through AI-assisted generation and templates
3. Achieve 80%+ data completeness score (filled fields) for active worlds
4. Support seamless collaboration for teams of 2-10 members
5. Provide 100% data portability via export to standard formats

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

- Story/novel writing tool (use Scrivener, Google Docs, etc.)
- Map creation tool (integrate with Inkarnate, Wonderdraft)
- Character portrait generation (integrate with Midjourney, DALL-E)
- Dice roller / VTT features (use Roll20, Foundry)
- Publishing platform (use Substack, Medium)

---

## 4. Target Audience

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

### 4.2 Total Addressable Market (TAM)

- **Fiction Writers**: 2M active worldbuilders globally
- **Game Masters**: 1.5M active DMs/GMs (D&D, Pathfinder, etc.)
- **Game Developers**: 500K narrative designers and indie devs
- **Hobbyists**: 1M active worldbuilding community members

**Total TAM**: ~5M users
**Serviceable Addressable Market (SAM)**: ~2M English-speaking, digitally-native users
**Serviceable Obtainable Market (SOM)**: 100K users (5% of SAM) by end of 2026

---

## 5. User Personas

### Persona 1: Sarah the Fantasy Novelist

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

**Quote:** *"I have 30,000 words of worldbuilding notes and I still forget character names mid-scene."*

**How WorldCrafter Helps:**
- Structured character profiles with relationship mapping
- Event timeline prevents continuity errors
- Quick search finds any entity in seconds
- Export to Markdown for offline reference while writing

---

### Persona 2: Marcus the Game Master

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

**Quote:** *"I waste half my session prep time just organizing notes from last session."*

**How WorldCrafter Helps:**
- AI generates consistent NPCs in seconds
- Searchable database accessible during session on tablet
- Faction relationship graph players can view
- Public/private visibility controls (secret villain info hidden)

---

### Persona 3: Elena the Indie Game Developer

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

**Quote:** *"We've had to rewrite quests because the lore doc was outdated. We need version control for narrative."*

**How WorldCrafter Helps:**
- API access for Unity integration (auto-sync lore)
- World versioning (snapshot before major changes)
- Team collaboration with role-based permissions
- Export to JSON with custom schema

---

### Persona 4: Jamal the Worldbuilding Hobbyist

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

**Quote:** *"I have fragments of 10 different worlds but never finish any. I need structure and motivation."*

**How WorldCrafter Helps:**
- Templates provide starting structure
- Completeness scores gamify filling out details
- Public gallery showcases work to community
- AI suggestions spark new ideas when stuck

---

## 6. User Stories & Jobs to be Done

### 6.1 User Stories (Organized by Epic)

#### Epic 1: World Creation & Management

**US-1.1:** As a user, I want to create a new world with genre, name, and description so that I can start organizing my worldbuilding.
**Acceptance Criteria:**
- Form includes name (required), genre (dropdown), description (optional rich text)
- World is created with unique slug for URL
- User is redirected to world dashboard after creation
- World appears in user's world list

**US-1.2:** As a user, I want to edit my world's metadata so that I can update details as my world evolves.
**Acceptance Criteria:**
- Edit form pre-populates with existing data
- Changes are saved and reflected immediately
- Slug remains stable (doesn't break links)
- Success confirmation shown

**US-1.3:** As a user, I want to upload a cover image for my world so that it's visually distinctive in my world list.
**Acceptance Criteria:**
- Drag-and-drop or file picker upload
- Image is resized to standard dimensions (1200x630)
- Thumbnail generated for list view (300x157)
- Preview shown before confirming

**US-1.4:** As a user, I want to delete a world so that I can remove abandoned projects.
**Acceptance Criteria:**
- Confirmation modal with warning about permanent deletion
- User must type world name to confirm
- All related entities (characters, locations, etc.) are cascade deleted
- Activity log recorded for audit

**US-1.5:** As a user, I want to view a dashboard for my world so that I can see an overview and navigate to entities.
**Acceptance Criteria:**
- Stats panel shows count of all entity types
- Recent activity feed shows last 10 changes with timestamps
- Quick action buttons to create new entities
- Search bar for within-world search
- Navigation sidebar to entity categories

---

#### Epic 2: Entity Management

**US-2.1:** As a user, I want to create a character with customizable attributes so that I can document the people in my world.
**Acceptance Criteria:**
- Multi-step form wizard (basics, appearance, personality, backstory, custom fields)
- Support for rich text in long-form fields (markdown)
- Image upload for character portrait
- Custom JSON attributes for genre-specific stats
- Character appears in world's character list

**US-2.2:** As a user, I want to create locations with hierarchical relationships so that I can represent geographic structure.
**Acceptance Criteria:**
- Form includes parent location dropdown (for nesting)
- Tree view shows location hierarchy
- Support for type (city, dungeon, planet, etc.)
- Coordinates field for map placement (optional)
- Description supports markdown

**US-2.3:** As a user, I want to create events with flexible date formats so that I can chronicle world history.
**Acceptance Criteria:**
- Date field accepts various formats ("1453 BCE", "Year 342", "The Long Night")
- Link to location where event occurred
- Tag participants (characters/factions)
- Type field (battle, discovery, political, natural disaster)
- Events appear in timeline view

**US-2.4:** As a user, I want to create items/artifacts with properties so that I can track important objects.
**Acceptance Criteria:**
- Fields for type, rarity, description, properties, history
- Current owner field (character or location reference)
- Image upload for item illustration
- Custom attributes (stats, effects, etc.)
- Searchable and filterable in item database

**US-2.5:** As a user, I want to create factions/organizations so that I can model political and social structures.
**Acceptance Criteria:**
- Fields for type (kingdom, guild, corporation, religion)
- Goals, structure (hierarchy), headquarters location
- Leadership and member lists (character references)
- Ally/enemy relationships (faction references)
- Emblem/logo image upload

**US-2.6:** As a user, I want to view a detailed page for any entity so that I can see all information and related content.
**Acceptance Criteria:**
- Clean, readable layout with all attributes
- Related entities shown in sidebar (relationships)
- Comments thread at bottom (if user has COMMENTER role)
- Edit/delete buttons (if user has EDITOR role)
- Breadcrumb navigation

**US-2.7:** As a user, I want to edit any entity so that I can update details as my world develops.
**Acceptance Criteria:**
- Form pre-populated with current data
- Changes saved immediately (optimistic UI update)
- Version history logged
- Success/error feedback shown

**US-2.8:** As a user, I want to delete entities so that I can remove unused content.
**Acceptance Criteria:**
- Confirmation modal
- Soft delete option (hide but don't remove from DB)
- Cascade delete relationships that reference entity
- Activity log recorded

---

#### Epic 3: Relationships & Connections

**US-3.1:** As a user, I want to define relationships between entities so that I can model connections in my world.
**Acceptance Criteria:**
- Create relationship from any entity detail page
- Select target entity type and specific entity
- Choose relationship type (friend, enemy, family, member, located in, etc.)
- Specify directionality (A→B or A↔B)
- Set strength (1-10 scale)
- Add optional description

**US-3.2:** As a user, I want to view all relationships for an entity so that I can understand its connections.
**Acceptance Criteria:**
- Relationship panel on entity detail page
- Grouped by relationship type
- Click to navigate to related entity
- Edit/delete relationship inline
- Visual indicator for directionality

**US-3.3:** As a user, I want to visualize relationships as an interactive graph so that I can see patterns and gaps.
**Acceptance Criteria:**
- Graph view accessible from world dashboard
- Nodes represent entities (color-coded by type)
- Edges represent relationships (labeled with type)
- Pan, zoom, drag controls
- Filter by entity type or relationship type
- Click node to open entity detail modal
- Export as PNG/SVG

**US-3.4:** As a user, I want AI to suggest potential relationships so that I can discover narrative opportunities.
**Acceptance Criteria:**
- "Suggested Connections" panel appears for entities with <3 relationships
- AI analyzes entity descriptions and suggests logical connections
- Shows reasoning ("Both are wizards in the same city")
- One-click "Add Relationship" button
- Dismiss individual suggestions

---

#### Epic 4: Content Organization

**US-4.1:** As a user, I want to apply tags to entities so that I can categorize them flexibly.
**Acceptance Criteria:**
- Tag input with autocomplete from existing tags
- Create new tags inline
- Assign color to tags (color picker)
- Multi-select tag filter on list views
- Tag management page to rename/merge/delete tags

**US-4.2:** As a user, I want to search within my world so that I can find content quickly.
**Acceptance Criteria:**
- Search bar with ⌘K keyboard shortcut
- Full-text search across all entity fields
- Results grouped by entity type
- Preview snippet with highlighted matches
- Click to navigate to entity
- Filters by type, tags, date range

**US-4.3:** As a user, I want to create collections/folders so that I can organize entities by workflow (chapters, sessions, themes).
**Acceptance Criteria:**
- Create collection with name and description
- Add entities via drag-and-drop or multi-select
- Collections appear in world dashboard sidebar
- Nested collections (max 3 levels)
- Smart collections with auto-populate rules

**US-4.4:** As a user, I want to create free-form wiki pages so that I can document concepts that don't fit entity templates.
**Acceptance Criteria:**
- Markdown editor with live preview
- Hierarchical page structure (parent/child)
- `[[Entity Name]]` syntax auto-links to entities
- Page templates (magic system, religion, technology)
- Full-text searchable

---

#### Epic 5: Collaboration & Sharing

**US-5.1:** As a world owner, I want to invite collaborators so that my team can work together.
**Acceptance Criteria:**
- Share modal with email input
- Select role: Viewer, Commenter, Editor, Admin
- Invitee receives email with link
- Invitee must have WorldCrafter account to accept
- Member list shows all collaborators with roles

**US-5.2:** As a world owner, I want to change collaborator permissions so that I can control access levels.
**Acceptance Criteria:**
- Dropdown on member list to change role
- Changes apply immediately
- Notification sent to affected user
- Activity log recorded

**US-5.3:** As a world owner, I want to revoke access so that I can remove collaborators.
**Acceptance Criteria:**
- "Remove" button on member list
- Confirmation modal
- User loses access immediately
- Notification sent to removed user

**US-5.4:** As a collaborator, I want to leave comments on entities so that I can provide feedback asynchronously.
**Acceptance Criteria:**
- Comment form at bottom of entity detail pages
- Support for markdown in comments
- Threaded replies (1 level deep)
- Email notification to world owner and @mentioned users
- Edit/delete own comments

**US-5.5:** As a user, I want to make my world public so that I can share it with the community.
**Acceptance Criteria:**
- Privacy setting on world: Private, Unlisted, Public
- Public worlds appear in gallery
- Public URLs don't require login to view
- World owner can revert to private anytime

**US-5.6:** As a user, I want to browse the public gallery so that I can find inspiration and discover others' work.
**Acceptance Criteria:**
- Gallery page at /explore with grid/list view
- Filter by genre, popularity (view count), recent updates
- Search by title or tags
- Click to view world (read-only unless cloned)
- "Clone to My Worlds" button creates editable copy

**US-5.7:** As a user, I want to clone public worlds so that I can use them as templates.
**Acceptance Criteria:**
- Clone creates full copy with all entities and relationships
- User becomes owner of cloned world
- Original author credited in metadata
- Cloned world is private by default

**US-5.8:** As a collaborator, I want to see who else is viewing/editing so that I can coordinate in real-time.
**Acceptance Criteria:**
- Avatar pills showing active users (presence indicators)
- Updates to entities trigger toast notifications ("Alice edited this character")
- Conflict detection if two users edit same entity simultaneously
- Last-write-wins merge strategy

---

#### Epic 6: AI-Assisted Features

**US-6.1:** As a user, I want AI to generate entity content so that I can overcome writer's block.
**Acceptance Criteria:**
- "Generate with AI" button on create forms
- Modal with prompt input and options (tone, detail level)
- AI generates content based on world context
- Preview before saving, regenerate option
- Save to entity or discard

**US-6.2:** As a user, I want AI to suggest relationships so that I can discover hidden connections.
**Acceptance Criteria:**
- "Suggest Relationships" button on entity pages
- AI analyzes entity + world context, suggests 3-5 connections
- Shows reasoning for each suggestion
- One-click add or dismiss
- Rate limit: 10 suggestions/day for free users

**US-6.3:** As a user, I want AI to check consistency so that I can catch errors.
**Acceptance Criteria:**
- "Run Consistency Check" on world dashboard
- AI scans for date conflicts, location impossibilities, description contradictions
- Report page lists warnings and errors with severity
- Click to view conflicting entities side-by-side
- Mark false positives to ignore

**US-6.4:** As a user, I want AI to generate writing prompts so that I can get story ideas based on my world.
**Acceptance Criteria:**
- "Get Writing Prompts" button on dashboard
- Select focus (specific characters/locations or random)
- AI generates 5-10 story starters, quest ideas, or conflict prompts
- Save favorites to collections
- Regenerate for new ideas

---

#### Epic 7: Visualization Tools

**US-7.1:** As a user, I want to upload a world map and place locations so that I can show geography.
**Acceptance Criteria:**
- Upload map image (PNG/JPG)
- Interactive map with pan/zoom controls
- Drag-and-drop location markers
- Custom marker icons per location type
- Lines to show routes/borders
- Distance measurement tool

**US-7.2:** As a user, I want to view a timeline of events so that I can visualize history.
**Acceptance Criteria:**
- Horizontal scrollable timeline
- Zoom controls (year/decade/century scales)
- Event markers with icons (color-coded by type)
- Click for detail modal
- Filter by type, location, participants

**US-7.3:** As a user, I want to view family trees so that I can understand lineages.
**Acceptance Criteria:**
- Generate tree from "parent"/"child" relationships
- Expand/collapse nodes
- Click to view character details
- Export as PNG/SVG

**US-7.4:** As a user, I want to view faction org charts so that I can visualize hierarchies.
**Acceptance Criteria:**
- Generate from faction leadership/member data
- Hierarchical tree layout
- Click to view faction/character details
- Export as PNG/SVG

**US-7.5:** As a user, I want to view world analytics so that I can track progress.
**Acceptance Criteria:**
- Dashboard shows entity counts (pie chart)
- Activity over time (line chart)
- Completeness scores per entity
- Top contributors (shared worlds)
- Most/least connected entities
- Orphaned entities (no relationships)

---

#### Epic 8: Templates & Presets

**US-8.1:** As a user, I want to start from genre templates so that I can get a quick start.
**Acceptance Criteria:**
- Template gallery on world creation flow
- Preview template contents (starter entities)
- Templates available: Fantasy, Sci-Fi, Modern Urban, Historical, Horror
- Customize template fields before creating
- All starter entities created with world

**US-8.2:** As a user, I want to create custom entity templates so that I can reuse formats.
**Acceptance Criteria:**
- "Save as Template" button on entity edit page
- Template library on user profile
- Apply template when creating new entity
- Share template publicly (optional)
- Public template marketplace

**US-8.3:** As a user, I want to import from other platforms so that I can migrate existing worlds.
**Acceptance Criteria:**
- Import wizard on world dashboard
- Support formats: CSV, Markdown (with frontmatter), JSON (World Anvil, Campfire)
- Preview parsed data with field mapping
- Confirm and batch import
- Error report for failed imports

---

#### Epic 9: Export & Integration

**US-9.1:** As a user, I want to export my world so that I can back up data or use in other tools.
**Acceptance Criteria:**
- Export modal with format selection: JSON, Markdown, PDF, CSV
- JSON: full data dump of all entities
- Markdown: folder structure with one file per entity
- PDF: formatted world bible with TOC
- CSV: spreadsheet per entity type
- Download link when processing complete

**US-9.2:** As a user, I want API access so that I can integrate with custom tools.
**Acceptance Criteria:**
- Generate API key in user settings
- REST API endpoints for all CRUD operations
- Rate limit: 1000 requests/hour per key
- OpenAPI spec at /api/docs
- Authentication via Bearer token

**US-9.3:** As a user, I want to install the Obsidian plugin so that I can sync with my vault.
**Acceptance Criteria:**
- Plugin available in Obsidian Community Plugins
- Settings panel to configure API key and world ID
- Sync command (pull or push)
- Bidirectional sync with conflict resolution
- Frontmatter mapping to entity metadata

---

#### Epic 10: World Versioning

**US-10.1:** As a user, I want to save world snapshots so that I can revert to previous states.
**Acceptance Criteria:**
- "Save Snapshot" button on dashboard
- Name snapshot ("Before Chapter 5", "Session 12 Backup")
- Full world data serialized to JSON
- Version history list with timestamps
- Diff viewer shows changes between versions

**US-10.2:** As a user, I want to restore from snapshot so that I can undo major changes.
**Acceptance Criteria:**
- "Restore" button on version history
- Confirmation modal with diff preview
- Current state saved as auto-snapshot before restore
- All entities reverted to snapshot state
- Activity log recorded

**US-10.3:** As a user, I want to compare versions so that I can see what changed.
**Acceptance Criteria:**
- Diff viewer between two selected versions
- Shows added, removed, modified entities
- Click entity to see field-level changes
- Export diff as text report

---

#### Epic 11: ChatGPT Apps SDK Integration

**US-11.1:** As a user, I want to connect WorldCrafter to ChatGPT so that I can build worlds conversationally.
**Acceptance Criteria:**
- OAuth authorization flow from ChatGPT
- User approves scopes (worlds:read, worlds:write)
- WorldCrafter MCP server accessible to ChatGPT
- User's worlds visible in ChatGPT sessions

**US-11.2:** As a user in ChatGPT, I want to create entities by describing them so that I can worldbuild naturally.
**Acceptance Criteria:**
- Prompt: "Create a wise old wizard named Aldrin"
- ChatGPT calls `create_character` tool
- Character card widget appears inline
- ChatGPT confirms creation and suggests next steps

**US-11.3:** As a user in ChatGPT, I want to view my world data so that I can reference it during conversation.
**Acceptance Criteria:**
- Prompt: "Show me my fantasy worlds"
- ChatGPT calls `get_worlds` tool with genre filter
- World cards widget appears with grid layout
- Click to explore specific world (fullscreen widget)

**US-11.4:** As a user in ChatGPT, I want to search my world so that I can find specific content.
**Acceptance Criteria:**
- Prompt: "Find all references to dragons in Eldoria"
- ChatGPT calls `search_world` tool
- Results widget appears with matching entities
- Click to view entity details

**US-11.5:** As a user in ChatGPT, I want to update entities so that I can refine content conversationally.
**Acceptance Criteria:**
- Prompt: "Add backstory to Aldrin about his lost apprentice"
- ChatGPT calls `update_character` tool
- Widget updates to show new backstory
- ChatGPT confirms update

**US-11.6:** As a user in ChatGPT, I want to view relationship graphs so that I can visualize connections.
**Acceptance Criteria:**
- Prompt: "Show me all connections to the villain"
- ChatGPT calls `get_relationship_graph` tool
- Fullscreen widget with interactive graph appears
- Filter and explore graph while ChatGPT composer remains visible

---

### 6.2 Jobs to be Done Framework

**When I** (situation) **I want to** (motivation) **so I can** (expected outcome).

| Situation | Motivation | Expected Outcome | Feature |
|-----------|------------|------------------|---------|
| Starting a new writing project | Create a structured world foundation | Avoid inconsistencies later | World creation, templates |
| Midway through writing | Reference character details without breaking flow | Keep writing without context switching | Quick search, character profiles |
| Planning story arc | Visualize character relationships | Identify conflict opportunities | Relationship graph |
| Finishing a chapter | Ensure timeline consistency | Catch continuity errors before readers | Consistency checker |
| Prepping TTRPG session | Generate NPCs that fit world | Save prep time | AI entity generation |
| Running live game session | Look up NPC details quickly | Avoid breaking immersion | Mobile-responsive quick reference |
| Collaborating with co-author | Share world with controlled access | Enable teamwork without chaos | Collaboration + permissions |
| Switching tools | Export existing world data | Avoid vendor lock-in | Multi-format export |
| Feeling uninspired | Get story/quest prompts based on my world | Spark creativity | AI writing prompts |
| Showcasing work | Share completed world publicly | Get feedback and recognition | Public gallery |

---

## 7. Functional Requirements

### 7.1 Authentication & Authorization

**FR-1.1: User Registration**
- Support email/password registration
- Email verification required
- OAuth providers: Google, GitHub (optional Phase 2)
- CAPTCHA for bot prevention
- Password requirements: min 12 chars, 1 uppercase, 1 number, 1 special
- Accept terms of service and privacy policy checkbox

**FR-1.2: User Login**
- Email + password authentication
- "Remember me" option (30-day session)
- Password reset via email link (expires in 1 hour)
- Account lockout after 5 failed attempts (30 min cooldown)
- Session stored in HTTP-only cookies (Supabase Auth)

**FR-1.3: User Profile**
- Display name, bio, avatar image
- Email (verified), change password
- Delete account (soft delete, 30-day grace period)
- API key generation for programmatic access

**FR-1.4: Row-Level Security (RLS)**
- Users can only CRUD their own data
- World members can access based on assigned role
- Public worlds readable by all
- Enforce via Supabase RLS policies

---

### 7.2 World Management

**FR-2.1: Create World**
- Required: name (max 100 chars)
- Optional: genre (enum), description (rich text), setting summary, cover image
- Generate URL-safe slug from name
- Set privacy to Private by default
- Creator assigned as owner (ADMIN role)

**FR-2.2: Edit World**
- Update any field except slug
- Upload/change cover image
- Modify privacy setting (Private, Unlisted, Public)
- Save button with optimistic UI update
- Version incrementing for change tracking

**FR-2.3: Delete World**
- Confirmation modal requires typing world name
- Soft delete (mark deleted_at timestamp)
- Cascade delete all entities, relationships, comments
- Permanent deletion after 30 days
- Notify all members via email

**FR-2.4: World Dashboard**
- Stats: entity counts by type (characters, locations, events, items, factions, pages)
- Recent activity: last 20 changes with user, timestamp, action
- Quick actions: buttons to create each entity type
- Global search bar (full-text)
- Navigation sidebar with entity categories

**FR-2.5: World List**
- Grid and list view toggle
- Sort by: name, last updated, creation date
- Filter by: genre, privacy, my worlds vs shared with me
- Search across world names and descriptions
- Pagination (20 per page)

---

### 7.3 Entity Management

**FR-3.1: Character CRUD**
- Create: multi-step form (basics → appearance → personality → backstory → custom)
- Fields: name*, slug (auto), role, species, age, appearance, personality, backstory, goals, fears, attributes (JSON), image
- Rich text editor for long fields (markdown)
- Custom attributes support genre-specific fields
- Edit: same form, pre-populated
- Delete: soft delete with confirmation
- Detail view: all fields, relationships panel, comments

**FR-3.2: Location CRUD**
- Create: form with all fields
- Fields: name*, slug (auto), type, parent (dropdown of locations), description, geography, climate, population, government, economy, culture, coordinates (x/y), attributes (JSON), image
- Hierarchical relationship via parent_id
- Tree view navigation
- Detail view: hierarchy breadcrumb, child locations, related events

**FR-3.3: Event CRUD**
- Create: form with all fields
- Fields: name*, slug (auto), date (flexible text), description, significance, type, location (dropdown), participants (JSON array of IDs), attributes (JSON)
- Flexible date parsing (no strict datetime)
- Detail view: timeline context, linked location, participant list

**FR-3.4: Item CRUD**
- Create: form with all fields
- Fields: name*, slug (auto), type, rarity, description, properties, history, current owner (text/ref), location (text/ref), attributes (JSON), image
- Detail view: ownership history, related characters

**FR-3.5: Faction CRUD**
- Create: form with all fields
- Fields: name*, slug (auto), type, description, goals, structure, headquarters (location ref), leadership (JSON array), members (JSON array), allies (JSON array), enemies (JSON array), attributes (JSON), emblem image
- Detail view: org chart, relationship web

**FR-3.6: Entity Listing**
- Separate list page per entity type
- Table and card view toggle
- Columns: name, type, last updated, tags, actions
- Sort by any column
- Filter by tags, type, date range
- Multi-select for batch operations (tag, delete)
- Pagination (50 per page)

**FR-3.7: Entity Detail Page**
- Responsive layout: main content + sidebar
- Main: all attributes, rich text rendered
- Sidebar: metadata (created, updated), tags, relationships panel, quick actions (edit, delete, share)
- Comments section at bottom (if COMMENTER+ role)
- Breadcrumb navigation

---

### 7.4 Relationships

**FR-4.1: Create Relationship**
- Modal/form from entity detail page
- Select target entity type (dropdown)
- Search and select specific target entity
- Relationship type (predefined + custom text)
- Directionality toggle (unidirectional vs bidirectional)
- Strength slider (1-10)
- Optional description (text)
- Save creates relationship record

**FR-4.2: View Relationships**
- Panel on entity detail showing all connections
- Grouped by relationship type
- Show target entity name, type, strength
- Click to navigate to related entity
- Indicator for direction (→ or ↔)

**FR-4.3: Edit/Delete Relationship**
- Inline edit in relationships panel
- Update type, strength, description
- Delete with confirmation (no undo)

**FR-4.4: Relationship Graph**
- Accessible from world dashboard
- Force-directed graph layout (D3.js or React Flow)
- Nodes: entities (color by type, size by relationship count)
- Edges: relationships (labeled, arrow for direction)
- Controls: pan, zoom, drag nodes
- Filters: entity type, relationship type
- Search to highlight specific entity
- Click node to open detail modal
- Export as PNG/SVG

---

### 7.5 Content Organization

**FR-5.1: Tags**
- Create tags inline when editing entities
- Tag autocomplete from existing tags
- Assign color to tags (7 presets + custom hex)
- Tag management page: list all tags, rename, merge, delete
- Multi-select tag filter on all list views
- Tag cloud on world dashboard

**FR-5.2: Global Search**
- Search bar on world dashboard (⌘K shortcut)
- Full-text search across all entity fields
- Results grouped by entity type
- Preview snippet with matched text highlighted
- Relevance ranking
- Filters: entity type, tags, date range
- Pagination (20 results per page)

**FR-5.3: Collections/Folders**
- Create collection: name, description
- Add entities via drag-and-drop or multi-select from lists
- Collections sidebar on dashboard
- Nested collections (max 3 levels)
- Reorder entities within collection
- Delete collection (doesn't delete entities)

**FR-5.4: Smart Collections**
- Define rules: "All characters tagged 'villain'"
- Auto-populate based on rules
- Refresh on schedule or manual trigger

**FR-5.5: Wiki Pages**
- Create page: title, content (markdown)
- Markdown editor with live preview
- Hierarchical pages (parent/child)
- [[Entity Name]] syntax auto-links
- Page templates: magic system, religion, technology, culture
- Full-text searchable
- Version history (last 10 versions)

---

### 7.6 Collaboration

**FR-6.1: Invite Members**
- Share modal with email input
- Select role: Viewer, Commenter, Editor, Admin
- Send email invite via Supabase Edge Function
- Invite link expires in 7 days
- Invitee must sign up/login to accept

**FR-6.2: Member Management**
- List all members with roles
- Change role dropdown (owner only)
- Remove member button (owner only)
- Notification to affected user on change/removal

**FR-6.3: Role-Based Access Control**
- **Viewer**: Read-only access to all entities
- **Commenter**: Viewer + add/edit/delete own comments
- **Editor**: Commenter + create/edit/delete entities
- **Admin**: Editor + manage members, change world settings
- **Owner**: Admin + transfer ownership, delete world

**FR-6.4: Comments**
- Comment form at bottom of entity detail
- Markdown support
- Threaded replies (1 level)
- Edit own comments (5 min window)
- Delete own comments
- @mention users (autocomplete, sends notification)
- Email notification for replies and @mentions

**FR-6.5: Activity Log**
- Record all create/update/delete operations
- Store: user_id, entity_type, entity_id, action, timestamp, metadata (JSON)
- Display on dashboard recent activity feed
- Filterable by user, entity type, action
- Exportable as CSV

---

### 7.7 Privacy & Sharing

**FR-7.1: Privacy Levels**
- **Private**: Only owner and invited members can access
- **Unlisted**: Anyone with link can view (not in gallery)
- **Public**: Listed in gallery, searchable, viewable by all

**FR-7.2: Public Gallery**
- Route: /explore
- Grid view of public worlds
- Sort by: popular (view count), recent, alphabetical
- Filter by genre, tags
- Search by title/description
- Click to view world (read-only for non-members)
- "Clone to My Worlds" button

**FR-7.3: Cloning**
- Full copy of world structure
- All entities, relationships, tags, pages copied
- Cloner becomes owner of new world
- Original author credited in metadata
- Cloned world is Private by default
- Original world_id stored for attribution

**FR-7.4: Bookmarks**
- Bookmark button on public world detail
- Bookmarks list on user profile
- Remove bookmark option

---

### 7.8 AI-Assisted Features

**FR-8.1: AI Entity Generation**
- "Generate with AI" button on create forms
- Modal with prompt input: "Describe what you want to create"
- Context sent to LLM: world genre, description, existing entities
- LLM generates all entity fields
- Preview before saving (editable)
- Regenerate button for different result
- Save or discard
- Rate limit: 5 generations/hour free, unlimited premium

**FR-8.2: AI Relationship Suggestions**
- "Suggest Relationships" button on entity detail
- Analyze entity + all world entities
- Return 3-5 suggestions with reasoning
- Each suggestion has "Add" and "Dismiss" buttons
- Rate limit: 10 suggestions/day free, unlimited premium

**FR-8.3: Consistency Checker**
- "Run Consistency Check" button on dashboard
- Batch analyze all entities for:
  - Date conflicts (event A before B but references B)
  - Location impossibilities (character in two places)
  - Description contradictions (hair color changes)
- Generate report with severity levels (error, warning, info)
- Click issue to view conflicting entities side-by-side
- Mark as false positive (hide from future reports)
- Rate limit: 1 check/day free, 5/day premium

**FR-8.4: AI Writing Prompts**
- "Get Writing Prompts" button on dashboard
- Options: focus on specific entities or random
- Generate 5-10 prompts: story starters, quest hooks, conflict ideas
- Save to collection or dismiss
- Regenerate for new batch
- Rate limit: 3 generations/day free, unlimited premium

---

### 7.9 Visualization Tools

**FR-9.1: Interactive Map**
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

**FR-9.2: Timeline Visualization**
- Horizontal scrollable timeline (vis-timeline)
- Parse event dates to position on timeline
- Zoom controls (year/decade/century)
- Event markers with icons (type-based)
- Click for detail popup
- Filter by type, location, participants
- Highlight related events (same location/characters)
- Export as PNG

**FR-9.3: Family Tree**
- Generate from character relationships (type="parent"/"child")
- Tree layout (top-to-bottom or left-to-right)
- Character portraits on nodes
- Expand/collapse branches
- Click to view character detail
- Export as PNG/SVG

**FR-9.4: Org Chart**
- Generate from faction leadership/members
- Hierarchical tree layout
- Faction emblem at root
- Character portraits on nodes
- Click to view character/faction detail
- Export as PNG/SVG

**FR-9.5: Analytics Dashboard**
- Entity counts pie chart (by type)
- Activity line chart (last 30 days)
- Completeness score per entity (% fields filled)
- Leaderboard (shared worlds): top contributors
- Most/least connected entities (relationship degree)
- Orphaned entities list (no relationships)
- Export data as CSV

---

### 7.10 Templates & Import/Export

**FR-10.1: Genre Templates**
- Predefined templates: Fantasy, Sci-Fi, Modern Urban, Historical, Horror
- Each includes starter entities (5-10 characters, 3-5 locations, etc.)
- Template gallery on world creation flow
- Customize template before creating (edit entity names)
- All entities created on world save

**FR-10.2: Custom Entity Templates**
- "Save as Template" button on entity edit page
- Template includes all field values and structure
- Template library on user profile
- Apply template when creating entity (pre-fill form)
- Public/private toggle
- Public template marketplace (browse, clone)

**FR-10.3: Import**
- Import wizard on world dashboard
- Supported formats:
  - **CSV**: Column headers map to entity fields
  - **Markdown**: Frontmatter for metadata, body for description
  - **JSON**: World Anvil export, Campfire export, generic schema
- Upload files or paste text
- Field mapping UI (drag-and-drop columns to fields)
- Preview parsed data (first 5 entities)
- Confirm and batch import
- Error report (failed imports with reasons)

**FR-10.4: Export**
- Export button on world dashboard
- Format selection: JSON, Markdown, PDF, CSV
- **JSON**: Full world dump (all entities, relationships, metadata)
- **Markdown**: Zip file with folder structure, one .md per entity
- **PDF**: Puppeteer-rendered world bible with TOC, images, formatting
- **CSV**: Separate file per entity type
- Processing indicator (async for large worlds)
- Download link when complete (expires in 24 hours)

---

### 7.11 World Versioning

**FR-11.1: Create Snapshot**
- "Save Snapshot" button on dashboard
- Modal: name (required), description (optional)
- Serialize entire world to JSON (all entities, relationships, tags, pages)
- Store in world_versions table
- Limit 50 snapshots per world (auto-prune oldest)
- Success notification with link to version history

**FR-11.2: View Version History**
- List all snapshots with name, timestamp, creator
- Click to view snapshot details (read-only)
- Diff viewer between two selected snapshots
- Shows added/removed/modified entities
- Field-level diff for modified entities

**FR-11.3: Restore Snapshot**
- "Restore" button on snapshot row
- Modal: preview diff between current state and snapshot
- Confirmation checkbox: "I understand this will overwrite current state"
- Auto-save current state as snapshot before restore
- Restore replaces all entities with snapshot data
- Activity log recorded

**FR-11.4: Compare Versions**
- Select two snapshots from history
- Diff viewer shows changes
- Entity-level: added, removed, modified
- Field-level: before/after values
- Export diff as text report

---

### 7.12 API Access

**FR-12.1: API Key Management**
- Generate API key in user settings
- Display once (copy to clipboard)
- Revoke key (immediate invalidation)
- Multiple keys allowed (label each)
- Key scopes: read, write, admin (future)

**FR-12.2: REST API Endpoints**
- Base URL: /api/v1
- Authentication: Bearer token (API key)
- Endpoints:
  - `GET /worlds` - List user's worlds
  - `POST /worlds` - Create world
  - `GET /worlds/{id}` - Get world details
  - `PATCH /worlds/{id}` - Update world
  - `DELETE /worlds/{id}` - Delete world
  - Similar CRUD for all entity types
- Response format: JSON with standard structure
- Error handling: HTTP status codes + error messages

**FR-12.3: Rate Limiting**
- 1000 requests/hour per API key (free)
- 10,000 requests/hour (premium)
- Rate limit headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
- 429 status when exceeded

**FR-12.4: API Documentation**
- OpenAPI 3.0 spec at /api/docs
- Swagger UI for interactive testing
- Code examples (curl, JavaScript, Python)
- Authentication guide

---

### 7.13 ChatGPT Apps SDK Integration

**FR-13.1: MCP Server**
- Endpoint: /api/mcp
- JSON-RPC 2.0 over HTTPS
- Streaming support (Server-Sent Events)
- Tools exposed: create_world, get_world, update_world, create_character, get_character, update_character, create_location, get_location, add_relationship, search_world, get_world_summary, export_world, suggest_ideas
- Each tool has JSON Schema + _meta annotations

**FR-13.2: OAuth 2.1 Authorization**
- Protected resource metadata: /.well-known/oauth-protected-resource
- Authorization server: Supabase Auth
- Dynamic client registration supported
- PKCE required (S256)
- Scopes: worlds:read, worlds:write, worlds:share
- Token validation on every MCP request (JWT verify)

**FR-13.3: Conversational Widgets**
- Inline cards: world card, character card, location card
- Picture-in-Picture: character sheet, relationship graph
- Fullscreen: world dashboard, map viewer, timeline
- Built with React, bundled with Vite (single ESM per widget)
- Served from /api/widgets/{name}.html
- MIME type: text/html+skybridge
- window.openai API integration: setWidgetState, callTool, sendFollowUpMessage

**FR-13.4: Widget State Management**
- Persist context visible to ChatGPT (max 4k tokens)
- State includes: worldId, currentEntity, filters
- State rehydrated on component-initiated tool calls
- New chat creates fresh state

**FR-13.5: CORS Configuration**
- Allow origin: https://chatgpt.com
- Allow credentials: true
- Allow headers: Authorization, Content-Type
- Allow methods: GET, POST, OPTIONS
- Apply to /api/mcp and /api/widgets/*

---

### 7.14 Real-Time Collaboration

**FR-14.1: Presence Indicators**
- Show active users on entity detail pages (avatar pills)
- Supabase Realtime presence channel per world
- Broadcast join/leave events
- Display user avatars with online indicator

**FR-14.2: Live Updates**
- Broadcast create/update/delete events to all connected clients
- Subscribe to world channel: `world:{worldId}`
- Receive events: entity_created, entity_updated, entity_deleted
- Optimistic UI updates with rollback on conflict
- Toast notifications: "Alice updated the Gearhaven character"

**FR-14.3: Conflict Resolution**
- Detect if two users edit same entity simultaneously
- Last-write-wins strategy (newer timestamp)
- Show conflict warning to second saver
- Option to view other user's version and merge manually

---

### 7.15 Notifications

**FR-15.1: In-App Notifications**
- Notification center icon in navbar (bell)
- Badge count for unread notifications
- Notification types: comment reply, @mention, member added, entity updated (subscribed)
- Mark as read/unread
- Clear all button
- Persist for 30 days

**FR-15.2: Email Notifications**
- Preference toggles in user settings
- Notification types: invitations, comment replies, @mentions, weekly digest
- Email template with world context
- Unsubscribe link in footer
- Send via Supabase Edge Function + SendGrid/Resend

**FR-15.3: Digest Emails**
- Weekly summary of world activity
- Includes: entity counts, recent changes, comment activity
- Preference: daily/weekly/monthly/off
- Smart send (only if activity occurred)

---

## 8. Non-Functional Requirements

### 8.1 Performance

**NFR-1.1: Page Load Time**
- Initial page load: < 2 seconds (p95)
- Subsequent navigations: < 500ms (client-side routing)
- API response time: < 200ms (p95)
- Database query time: < 100ms (p95)

**NFR-1.2: Scalability**
- Support 100,000 concurrent users
- Database: handle 10M+ entities across all users
- Horizontal scaling via serverless (Vercel, Supabase)
- CDN for static assets (Cloudflare, Vercel Edge)

**NFR-1.3: Optimization**
- Image optimization: WebP format, responsive sizes
- Code splitting: dynamic imports for routes
- Database indexing: all foreign keys, search vectors
- Connection pooling: PgBouncer (port 6543)
- Caching: TanStack Query (client), Redis (server, future)

### 8.2 Security

**NFR-2.1: Authentication Security**
- Passwords hashed with bcrypt (Supabase default)
- Session tokens in HTTP-only cookies (no localStorage)
- CSRF protection via SameSite cookies
- Rate limiting on auth endpoints (5 attempts/15 min)
- Account lockout after failed attempts

**NFR-2.2: Data Security**
- Row-Level Security (RLS) enforced at database level
- All API endpoints validate authentication
- Input validation: Zod schemas on client and server
- SQL injection prevention: parameterized queries (Prisma)
- XSS prevention: sanitize user input, escape HTML

**NFR-2.3: Infrastructure Security**
- HTTPS only (TLS 1.3)
- Environment variables never in client bundle
- API keys rotatable, scoped permissions
- Security headers: CSP, HSTS, X-Frame-Options
- Regular dependency audits (npm audit, Snyk)

**NFR-2.4: Privacy & Compliance**
- GDPR compliant: data export, right to deletion
- Privacy policy and terms of service
- Cookie consent banner (EU users)
- Data retention: deleted accounts purged after 30 days
- No third-party trackers (respect user privacy)

### 8.3 Reliability

**NFR-3.1: Uptime**
- Target: 99.9% uptime (43 minutes downtime/month)
- Monitoring: Uptime Robot, Sentry
- Alerting: PagerDuty/email for critical errors
- Status page: status.worldcrafter.app (future)

**NFR-3.2: Data Integrity**
- Database backups: daily automated (Supabase)
- Point-in-time recovery (PITR) available
- Referential integrity via foreign keys
- Soft deletes for user data (30-day recovery)
- Audit logs for all data modifications

**NFR-3.3: Error Handling**
- Graceful degradation (show cached data if API fails)
- Error boundaries catch React errors
- User-friendly error messages (no stack traces)
- Error reporting: Sentry with user context
- Retry logic for transient failures (network, rate limits)

### 8.4 Usability

**NFR-4.1: Accessibility**
- WCAG 2.1 Level AA compliance
- Keyboard navigation (tab order, focus indicators)
- Screen reader support (ARIA labels, semantic HTML)
- Color contrast ratios (4.5:1 for text)
- Alternative text for images

**NFR-4.2: Responsive Design**
- Mobile-first approach
- Breakpoints: mobile (< 640px), tablet (640-1024px), desktop (> 1024px)
- Touch-friendly targets (min 44x44px)
- Adaptive layouts (dashboard becomes list on mobile)

**NFR-4.3: Browser Support**
- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)
- No IE11 support

**NFR-4.4: Internationalization**
- UI text externalized to i18n files (next-intl)
- Phase 1: English only
- Phase 3: Spanish, French, German, Japanese
- RTL support (Arabic, Hebrew) - future
- Date/time formatting per locale

### 8.5 Maintainability

**NFR-5.1: Code Quality**
- TypeScript strict mode enabled
- ESLint + Prettier for linting/formatting
- Pre-commit hooks: lint, format, test
- Code review required for all PRs
- Test coverage: 80% minimum (enforced)

**NFR-5.2: Documentation**
- Inline code comments for complex logic
- README for setup instructions
- CLAUDE.md for project-specific patterns
- API documentation (OpenAPI spec)
- Component storybook (future)

**NFR-5.3: Testing**
- Unit tests: Vitest + React Testing Library
- Integration tests: Vitest + test database
- E2E tests: Playwright (critical flows)
- Visual regression tests: Chromatic (future)
- CI/CD: GitHub Actions (test on every push)

### 8.6 Compatibility

**NFR-6.1: ChatGPT Apps SDK**
- Next.js iframe compatibility (asset prefix, base href)
- CORS headers for chatgpt.com
- OAuth 2.1 with PKCE support
- MCP server JSON-RPC 2.0 compliant
- Widget bundling (single ESM files)

**NFR-6.2: Third-Party Integrations**
- Obsidian plugin (separate repo)
- Unity/Unreal plugins (Phase 4)
- Webhook support for external tools (future)
- Zapier integration (future)

---

## 9. User Experience Requirements

### 9.1 Design Principles

**UX-1: Clarity Over Cleverness**
- Prioritize obvious, familiar patterns over innovative but confusing UX
- Clear labels, no jargon
- Progressive disclosure (hide advanced features initially)

**UX-2: Fast Feedback**
- Optimistic UI updates (assume success, rollback on error)
- Loading states for async operations (skeletons, spinners)
- Success/error notifications (toasts, inline messages)

**UX-3: Forgiving Interactions**
- Undo/redo for destructive actions (future)
- Confirmation modals for deletes
- Auto-save drafts (localStorage)
- Soft deletes with recovery period

**UX-4: Contextual Help**
- Inline tooltips on hover (question mark icons)
- Empty states with guidance ("Create your first character")
- Onboarding tour for new users (optional)
- Help center with searchable docs (future)

### 9.2 Navigation

**UX-5: Consistent Layout**
- Top navbar: logo, world switcher, user menu
- Left sidebar: world navigation (dashboard, entities, gallery, settings)
- Main content area: responsive to screen size
- Breadcrumbs on detail pages

**UX-6: Keyboard Shortcuts**
- ⌘K: Global search
- ⌘N: New entity (context-aware)
- ⌘S: Save form
- Esc: Close modal
- ⌘/: Show shortcut menu

### 9.3 Visual Design

**UX-7: Color Palette**
- Primary: Blue (trust, professionalism)
- Accent: Purple (creativity, imagination)
- Neutral: Grays (backgrounds, text)
- Semantic: Green (success), Red (error), Yellow (warning), Blue (info)

**UX-8: Typography**
- Headings: Inter (sans-serif)
- Body: Inter (sans-serif)
- Code: JetBrains Mono (monospace)
- Scale: 12px, 14px, 16px, 18px, 24px, 32px, 48px

**UX-9: Spacing**
- 8px grid system
- Padding/margin: 8px, 16px, 24px, 32px, 48px, 64px

**UX-10: Components**
- shadcn/ui component library (Radix + Tailwind)
- Consistent interactive states (hover, active, disabled)
- Smooth transitions (200-300ms ease)

---

## 10. Technical Requirements

### 10.1 Technology Stack

**Tech-1: Frontend**
- Framework: Next.js 16 (App Router)
- UI Library: React 19
- Styling: Tailwind CSS v4
- Components: shadcn/ui (Radix + Tailwind)
- Forms: React Hook Form + Zod validation
- State: TanStack Query for server state
- Charts: Recharts or Chart.js
- Maps: Leaflet.js or Pixi.js
- Graphs: React Flow or Cytoscape.js

**Tech-2: Backend**
- Runtime: Node.js 22+ (LTS)
- Framework: Next.js API Routes + Server Actions
- Database: Supabase PostgreSQL
- ORM: Prisma
- Auth: Supabase Auth (OAuth 2.1)
- Storage: Supabase Storage
- Real-time: Supabase Realtime (WebSockets)
- Email: Supabase Edge Functions + SendGrid/Resend

**Tech-3: AI Services**
- LLM: OpenAI GPT-4 or Anthropic Claude
- Embeddings: OpenAI text-embedding-3-small
- Rate limiting: Upstash Redis (future)

**Tech-4: DevOps**
- Hosting: Vercel (frontend + API)
- Database: Supabase (managed Postgres)
- CI/CD: GitHub Actions
- Monitoring: Sentry (errors), Vercel Analytics (performance)
- Version control: Git + GitHub

### 10.2 Database Schema

**Tech-5: Core Models**
- User (id, email, name, avatar, created_at, updated_at)
- World (id, user_id, name, slug, genre, description, cover_url, privacy, created_at, updated_at)
- Character (id, world_id, name, slug, role, species, age, appearance, personality, backstory, goals, fears, attributes, image_url, created_at, updated_at)
- Location (id, world_id, name, slug, type, parent_id, description, geography, climate, population, government, economy, culture, coordinates, attributes, image_url, created_at, updated_at)
- Event (id, world_id, name, slug, date, description, significance, type, location_id, participants, attributes, created_at, updated_at)
- Item (id, world_id, name, slug, type, rarity, description, properties, history, current_owner, location, attributes, image_url, created_at, updated_at)
- Faction (id, world_id, name, slug, type, description, goals, structure, headquarters, leadership, members, allies, enemies, attributes, image_url, created_at, updated_at)

**Tech-6: Supporting Models**
- Relationship (id, world_id, source_type, source_id, target_type, target_id, type, description, strength, is_directional, attributes, created_at, updated_at)
- Tag (id, world_id, name, color, created_at)
- Collection (id, world_id, name, description, items, created_at, updated_at)
- Page (id, world_id, title, slug, content, parent_id, attributes, created_at, updated_at)
- Comment (id, world_id, entity_type, entity_id, user_id, content, parent_id, created_at, updated_at)
- WorldMember (id, world_id, user_id, role, invited_by, invited_at)
- WorldVersion (id, world_id, version_num, name, snapshot, created_at)
- Activity (id, world_id, user_id, entity_type, entity_id, action, metadata, created_at)
- EntityTemplate (id, user_id, name, entity_type, fields, is_public, created_at)
- Bookmark (id, user_id, world_id, created_at)

**Tech-7: Indexes**
- Foreign keys (all relations)
- Slug uniqueness (world_id + slug)
- Search vectors (tsvector for full-text search)
- Relationship lookups (source_type/id, target_type/id)
- Activity logs (world_id + created_at)

**Tech-8: RLS Policies**
- Users can CRUD their own worlds
- World members can access based on role (Viewer, Commenter, Editor, Admin)
- Public worlds readable by all
- Cascade permissions to entities (if can read world, can read entities)

### 10.3 API Design

**Tech-9: REST API**
- Base path: /api/v1
- Versioning in URL
- JSON request/response
- Standard HTTP methods (GET, POST, PATCH, DELETE)
- Status codes: 200 (success), 201 (created), 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 429 (rate limit), 500 (server error)
- Error format: { error: { code, message, details } }
- Pagination: limit/offset query params, response includes total
- Filtering: query params (e.g., ?genre=fantasy&privacy=public)
- Sorting: ?sort=name&order=asc

**Tech-10: MCP Server**
- Endpoint: /api/mcp
- Protocol: JSON-RPC 2.0
- Transport: HTTPS with Server-Sent Events
- Tool definitions with JSON Schema
- _meta annotations for ChatGPT (outputTemplate, widgetAccessible, etc.)
- OAuth token validation on every request

**Tech-11: Widget Serving**
- Path: /api/widgets/[name].html
- MIME type: text/html+skybridge
- Single ESM file per widget
- Bundled with Vite
- CORS headers for chatgpt.com

### 10.4 Security Implementation

**Tech-12: Authentication**
- Supabase Auth (cookies, not localStorage)
- HTTP-only, Secure, SameSite=Lax cookies
- Session refresh via middleware (src/middleware.ts)
- JWT token validation for API requests

**Tech-13: Authorization**
- RLS policies at database level (Supabase)
- Role checks in Server Actions
- API key scoping (future)

**Tech-14: Input Validation**
- Zod schemas for all forms
- Validate on client (immediate feedback)
- Validate on server (security)
- Sanitize HTML (DOMPurify for rich text)

**Tech-15: Rate Limiting**
- API: 1000 req/hour per user (Vercel Edge Config)
- Auth: 5 attempts/15 min (Supabase built-in)
- AI: 5 generations/hour free tier (custom logic)

### 10.5 Testing Strategy

**Tech-16: Unit Tests**
- Framework: Vitest
- Coverage: 80% minimum
- Mock external services (Supabase, OpenAI)
- Test utilities, hooks, Server Actions
- Run on every commit (CI)

**Tech-17: Integration Tests**
- Framework: Vitest
- Test database: Supabase test project
- Test Server Actions, RLS policies, complex flows
- Clean up test data in afterAll hooks
- Run on PR (CI)

**Tech-18: E2E Tests**
- Framework: Playwright
- Browsers: Chromium, Firefox, Mobile Safari
- Test critical user flows (signup, create world, share, export)
- Screenshots on failure
- Run on PR (CI)

**Tech-19: Performance Testing**
- Lighthouse CI (score > 90)
- Bundle size monitoring (< 200KB initial JS)
- Database query profiling (Prisma logging)

---

## 11. Success Metrics & KPIs

### 11.1 Acquisition Metrics

**Metric-1: User Signups**
- Target: 1,000 users by end of Phase 1 (MVP)
- Target: 10,000 users by end of Phase 2 (Core)
- Target: 50,000 users by end of Phase 3 (Advanced)
- Target: 100,000 users by end of Phase 4 (ChatGPT)
- Measurement: Supabase Auth user count

**Metric-2: Acquisition Channels**
- Track source: organic, social, referral, ChatGPT, paid
- Goal: <50% from single channel (diversification)
- Measurement: UTM parameters, referrer header

**Metric-3: Viral Coefficient**
- Formula: (# invites sent) x (% accepted) / (# inviters)
- Target: > 1.0 (self-sustaining growth)
- Measurement: invitation tracking in database

### 11.2 Engagement Metrics

**Metric-4: Monthly Active Users (MAU)**
- Definition: Users who logged in and performed action in last 30 days
- Target: 5,000 MAU by end of Phase 2
- Target: 25,000 MAU by end of Phase 3
- Measurement: Activity log queries

**Metric-5: Weekly Active Users (WAU)**
- Target: WAU/MAU ratio > 0.4 (strong engagement)
- Measurement: Activity log queries

**Metric-6: Daily Active Users (DAU)**
- Target: DAU/MAU ratio > 0.15
- Measurement: Activity log queries

**Metric-7: Session Duration**
- Target: Average 15+ minutes per session
- Measurement: Analytics timestamp tracking

**Metric-8: Actions per Session**
- Target: 5+ meaningful actions (create, edit, search, view)
- Measurement: Activity log aggregation

**Metric-9: Worlds Created per User**
- Target: Average 2+ worlds per active user
- Measurement: World count by user_id

**Metric-10: Entities Created per World**
- Target: Average 20+ entities per active world
- Measurement: Entity counts aggregation

### 11.3 Retention Metrics

**Metric-11: Day 1 Retention**
- Target: > 40% of signups return next day
- Measurement: Activity log (created_at vs next day activity)

**Metric-12: Day 7 Retention**
- Target: > 25% of signups return within 7 days
- Measurement: Activity log cohort analysis

**Metric-13: Day 30 Retention**
- Target: > 15% of signups return within 30 days
- Measurement: Activity log cohort analysis

**Metric-14: Churn Rate**
- Definition: % of users inactive for 60+ days
- Target: < 50% monthly churn
- Measurement: Last activity timestamp

### 11.4 Feature Adoption Metrics

**Metric-15: AI Feature Usage**
- Target: 50%+ of users try AI generation within first week
- Target: 20%+ use AI weekly
- Measurement: Activity log (ai_generation events)

**Metric-16: Collaboration Usage**
- Target: 30% of worlds have 2+ members by Phase 2 end
- Measurement: WorldMember count

**Metric-17: Export Usage**
- Target: 25% of users export at least once
- Measurement: Export activity log

**Metric-18: ChatGPT Integration Usage**
- Target: 10,000 installs within 3 months of Phase 4 launch
- Target: 30% of new users discover via ChatGPT by Phase 4 end
- Measurement: ChatGPT Apps SDK analytics + OAuth source tracking

### 11.5 Quality Metrics

**Metric-19: Net Promoter Score (NPS)**
- Target: > 50 (excellent)
- Measurement: In-app survey (quarterly)

**Metric-20: Customer Satisfaction (CSAT)**
- Target: > 4.5/5 stars
- Measurement: In-app rating prompt after milestones

**Metric-21: Bug Reports per Release**
- Target: < 10 critical bugs per release
- Measurement: GitHub Issues, Sentry errors

**Metric-22: Average Response Time (Support)**
- Target: < 24 hours for critical issues
- Measurement: Support ticket system (future)

**Metric-23: Page Load Performance**
- Target: Lighthouse score > 90
- Measurement: Vercel Analytics, Lighthouse CI

### 11.6 Revenue Metrics (Future Premium Tier)

**Metric-24: Conversion Rate (Free → Premium)**
- Target: 5% conversion rate
- Measurement: Stripe subscription events

**Metric-25: Monthly Recurring Revenue (MRR)**
- Target: $50K MRR by end of 2025
- Measurement: Stripe revenue

**Metric-26: Customer Lifetime Value (LTV)**
- Target: LTV:CAC ratio > 3:1
- Measurement: Revenue / acquisition cost

**Metric-27: Churn Rate (Premium)**
- Target: < 5% monthly churn
- Measurement: Stripe cancellation events

---

## 12. Release Criteria

### 12.1 Phase 1: MVP (Week 4 Release)

**Functionality:**
- ✅ User registration, login, profile
- ✅ Create, edit, delete worlds
- ✅ Create, edit, delete locations
- ✅ World dashboard with stats and activity
- ✅ Global search (full-text)
- ✅ RLS policies enforced

**Quality:**
- ✅ Zero critical bugs
- ✅ < 5 high-priority bugs
- ✅ Test coverage > 70%
- ✅ Lighthouse score > 85
- ✅ Manual testing of all core flows

**Documentation:**
- ✅ README updated with setup instructions
- ✅ Deployment guide
- ✅ User guide (Phase 1 features)

**Go/No-Go Decision:** Product Manager + Engineering Lead approval

---

### 12.2 Phase 2: Core Features (Week 10 Release)

**Functionality:**
- ✅ All entity types (characters, events, items, factions)
- ✅ Relationship management + graph visualization
- ✅ Tags and collections
- ✅ Collaboration (invite, roles, comments)
- ✅ Export (JSON, Markdown)
- ✅ Genre templates

**Quality:**
- ✅ Zero critical bugs
- ✅ < 10 high-priority bugs
- ✅ Test coverage > 80%
- ✅ Lighthouse score > 90
- ✅ E2E tests for all critical flows

**Metrics:**
- ✅ 1,000+ signups from Phase 1
- ✅ NPS > 40
- ✅ D7 retention > 20%

**Documentation:**
- ✅ Full user documentation
- ✅ API documentation (if released)

**Go/No-Go Decision:** Product + Engineering + Design approval + user feedback review

---

### 12.3 Phase 3: Advanced Features (Week 16 Release)

**Functionality:**
- ✅ AI entity generation, suggestions, consistency checker, writing prompts
- ✅ World versioning
- ✅ Wiki pages, smart collections
- ✅ Public gallery, cloning
- ✅ Import from other platforms
- ✅ Interactive maps, timelines, family trees, analytics

**Quality:**
- ✅ Zero critical bugs
- ✅ < 15 high-priority bugs
- ✅ Test coverage > 80%
- ✅ Lighthouse score > 90
- ✅ Performance testing under load (1000 concurrent)

**Metrics:**
- ✅ 10,000+ users
- ✅ NPS > 50
- ✅ D30 retention > 15%
- ✅ 50%+ users try AI features

**Documentation:**
- ✅ AI feature guide
- ✅ Import/export guide
- ✅ Visualization guide

**Go/No-Go Decision:** Full leadership team approval

---

### 12.4 Phase 4: ChatGPT Integration (Week 20 Release)

**Functionality:**
- ✅ MCP server operational
- ✅ OAuth flow tested end-to-end
- ✅ All core tools exposed (create, read, update entities)
- ✅ At least 5 widgets (inline, PiP, fullscreen)
- ✅ Real-time collaboration (if included)

**Quality:**
- ✅ Zero critical bugs in MCP server
- ✅ ChatGPT app submission approved (when platform opens)
- ✅ Widget performance (< 1s load)
- ✅ OAuth security audit passed

**Metrics:**
- ✅ 25,000+ users in standalone app
- ✅ Beta test with 100+ ChatGPT users (positive feedback)

**Documentation:**
- ✅ ChatGPT integration user guide
- ✅ OAuth setup documentation
- ✅ Widget API documentation

**Go/No-Go Decision:** Leadership + Legal (privacy review) + OpenAI partnership approval

---

## 13. Risks & Mitigation

### 13.1 Technical Risks

**Risk-1: ChatGPT Apps SDK Changes During Development**
- Likelihood: Medium
- Impact: High
- Mitigation: Track OpenAI announcements, maintain abstraction layer, join developer community, build standalone app first (independent)
- Contingency: Delay Phase 4, focus on standalone growth

**Risk-2: Performance Degradation at Scale**
- Likelihood: Medium
- Impact: High
- Mitigation: Load testing before launch, database indexing, caching strategy, CDN for assets, horizontal scaling via serverless
- Contingency: Optimize critical paths, add Redis caching, database read replicas

**Risk-3: AI API Costs Exceed Budget**
- Likelihood: Medium
- Impact: Medium
- Mitigation: Strict rate limits, monitor usage, cache common queries, use smaller models for simple tasks
- Contingency: Reduce free tier limits, introduce premium AI tier, self-host open models

**Risk-4: Data Loss or Corruption**
- Likelihood: Low
- Impact: Critical
- Mitigation: Daily automated backups, point-in-time recovery, soft deletes, referential integrity, testing on separate database
- Contingency: Restore from backup, communicate with users, offer compensation (free premium)

**Risk-5: Security Breach**
- Likelihood: Low
- Impact: Critical
- Mitigation: Security audits, dependency scanning, RLS enforcement, rate limiting, penetration testing
- Contingency: Incident response plan, notify users, password reset, security patch, legal consultation

### 13.2 Product Risks

**Risk-6: Low User Adoption**
- Likelihood: Medium
- Impact: High
- Mitigation: User research, MVP validation, iterate on feedback, invest in marketing, community building
- Contingency: Pivot features, reduce scope, target niche segment (e.g., GMs only)

**Risk-7: Poor Feature-Market Fit**
- Likelihood: Medium
- Impact: High
- Mitigation: User testing before building, MVP approach, analytics tracking, regular user interviews
- Contingency: Deprecate unused features, double down on winners, survey users for needs

**Risk-8: Competition Launches Similar Features**
- Likelihood: High
- Impact: Medium
- Mitigation: Fast iteration, AI differentiation, community focus, ChatGPT exclusive features
- Contingency: Accelerate roadmap, emphasize unique value (ChatGPT integration), competitive pricing

**Risk-9: User Churn After Initial Excitement**
- Likelihood: Medium
- Impact: High
- Mitigation: Onboarding flow, engagement loops (notifications, digests), community features, regular content updates
- Contingency: Retention campaigns, win-back emails, feature surveys, pivot to power users

### 13.3 Business Risks

**Risk-10: Insufficient Funding**
- Likelihood: Low (bootstrapped initially)
- Impact: High
- Mitigation: Lean MVP, serverless architecture (low fixed costs), early revenue (premium tier)
- Contingency: Seek investment, reduce scope, monetize earlier (freemium launch)

**Risk-11: Legal/IP Issues**
- Likelihood: Low
- Impact: High
- Mitigation: Legal review of terms of service, privacy policy, content ownership clauses, GDPR compliance
- Contingency: Legal consultation, settle/negotiate, pivot if necessary

**Risk-12: Key Team Member Departure**
- Likelihood: Medium
- Impact: Medium
- Mitigation: Documentation, code reviews, cross-training, modular architecture
- Contingency: Hire replacement, redistribute work, reduce velocity temporarily

**Risk-13: OpenAI Denies ChatGPT App Submission**
- Likelihood: Low
- Impact: Medium
- Mitigation: Follow SDK guidelines strictly, quality standards, privacy compliance, early feedback from OpenAI
- Contingency: Standalone app still valuable, explore other distribution (Claude, Gemini), reapply with changes

### 13.4 Market Risks

**Risk-14: Market Saturation (Too Many Worldbuilding Tools)**
- Likelihood: Medium
- Impact: Medium
- Mitigation: AI differentiation, ChatGPT exclusivity, superior UX, community network effects
- Contingency: Target underserved niches (game devs, TTRPG GMs), competitive pricing, feature depth

**Risk-15: Shift in User Behavior (Away from Worldbuilding)**
- Likelihood: Low
- Impact: High
- Mitigation: Diversify use cases (writing, game dev, TTRPG), monitor trends, adaptable data model
- Contingency: Pivot to adjacent markets (storytelling, project management), expand definition of "worldbuilding"

---

## 14. Dependencies

### 14.1 Internal Dependencies

**Dep-1: Phase Dependencies**
- Phase 2 depends on Phase 1 completion (MVP must be stable)
- Phase 3 AI features depend on API budget approval
- Phase 4 depends on ChatGPT Apps SDK public availability

**Dep-2: Team Dependencies**
- Design mockups must be ready before frontend implementation
- Database schema must be finalized before entity CRUD
- Authentication must be complete before collaboration features

### 14.2 External Dependencies

**Dep-3: Third-Party Services**
- Supabase (database, auth, storage, realtime): critical path
- Vercel (hosting): critical path
- OpenAI API (AI features): medium priority (can delay Phase 3)
- Sentry (monitoring): low priority (nice to have)

**Dep-4: ChatGPT Apps SDK**
- Platform availability: Q1-Q2 2025 (estimated)
- Submission review time: unknown (2-4 weeks estimated)
- Policy changes: ongoing risk

**Dep-5: Open Source Libraries**
- Next.js, React, Prisma: stable, low risk
- shadcn/ui, TanStack Query: stable, low risk
- Leaflet, React Flow: stable, low risk

---

## 15. Timeline & Roadmap

### 15.1 Detailed Timeline

**Phase 1: MVP (Weeks 1-4)**
- Week 1: Project setup, authentication, database schema
- Week 2: World CRUD, dashboard
- Week 3: Location CRUD, global search
- Week 4: Testing, bug fixes, deployment

**Phase 2: Core Features (Weeks 5-10)**
- Week 5: Character CRUD, relationship data model
- Week 6: Event, Item, Faction CRUD
- Week 7: Relationship UI, graph visualization
- Week 8: Tags, collections, collaboration (invite/roles)
- Week 9: Comments, export (JSON, Markdown), templates
- Week 10: Testing, bug fixes, Phase 2 release

**Phase 3: Advanced Features (Weeks 11-16)**
- Week 11: AI integration (entity generation, suggestions)
- Week 12: Consistency checker, writing prompts, rate limiting
- Week 13: World versioning, wiki pages, smart collections
- Week 14: Import from other platforms, public gallery
- Week 15: Interactive map, timeline, family trees, analytics
- Week 16: Testing, performance optimization, Phase 3 release

**Phase 4: ChatGPT Integration (Weeks 17-20)**
- Week 17: MCP server implementation, OAuth setup
- Week 18: Widget development (inline cards, PiP, fullscreen)
- Week 19: Real-time collaboration (Supabase Realtime), testing
- Week 20: ChatGPT app submission, documentation, Phase 4 release

**Post-Phase 4: Iteration & Growth (Weeks 21+)**
- Mobile apps (iOS, Android)
- Premium tier rollout
- Marketplace for templates/assets
- Additional integrations (Notion, game engines)
- Enterprise features (SSO, white-label)

### 15.2 Milestones

| Milestone | Date | Deliverables | Success Criteria |
|-----------|------|--------------|------------------|
| M1: MVP Launch | End of Week 4 | Functional app with world/location management | 100 signups, 50 worlds created, NPS > 30 |
| M2: Core Features Launch | End of Week 10 | All entity types, collaboration, export | 1,000 signups, 500 active worlds, NPS > 40 |
| M3: Advanced Features Launch | End of Week 16 | AI features, visualizations, gallery | 10,000 signups, 50% try AI, NPS > 50 |
| M4: ChatGPT Integration Launch | End of Week 20 | MCP server, widgets, OAuth | App approved, 1,000 ChatGPT installs in first month |
| M5: 50K Users | Q3 2025 | Growth milestone | 50,000 MAU, 25% from ChatGPT |
| M6: Premium Tier Launch | Q4 2025 | Monetization | 2,500 premium users (5% conversion), $25K MRR |

---

## 16. Open Questions

### 16.1 Product Questions

**Q-1: Premium Tier Pricing?**
- Options: $10/mo, $15/mo, $20/mo
- Decision needed by: Phase 3 completion
- Owner: Product Manager
- Considerations: Competitive pricing (World Anvil $5-13/mo), value perception, willingness to pay research

**Q-2: AI Rate Limits for Free Tier?**
- Options: 5/hour, 10/day, 20/week
- Decision needed by: Phase 3 start
- Owner: Product Manager + Engineering
- Considerations: API costs, user experience, conversion incentive

**Q-3: Public Gallery Moderation?**
- Options: Automated (AI filter), manual review, user reporting
- Decision needed by: Phase 3 mid-point
- Owner: Product Manager
- Considerations: Scale, cost, legal risk, community safety

**Q-4: Mobile App Priority?**
- Options: Phase 5 (post-launch), responsive web only, React Native
- Decision needed by: Phase 4 completion
- Owner: Product + Engineering leads
- Considerations: Development cost, user demand, GMs need mobile reference

### 16.2 Technical Questions

**Q-5: Self-Host AI Models?**
- Options: Continue OpenAI API, self-host Llama/Mistral, hybrid
- Decision needed by: Phase 3 mid-point
- Owner: Engineering Lead
- Considerations: Cost at scale, latency, model quality, maintenance

**Q-6: Real-Time Collaboration Architecture?**
- Options: Supabase Realtime (WebSockets), custom WebSocket server, CRDT (Yjs)
- Decision needed by: Phase 4 start
- Owner: Engineering Lead
- Considerations: Complexity, conflict resolution, scale, cost

**Q-7: Observability Stack?**
- Options: Sentry only, add Datadog, add OpenTelemetry
- Decision needed by: Phase 2 completion
- Owner: Engineering Lead
- Considerations: Cost, debug capability, compliance

**Q-8: Database Scaling Strategy?**
- Options: Supabase Pro plan, read replicas, sharding (future)
- Decision needed by: 50K users milestone
- Owner: Engineering Lead
- Considerations: Cost, complexity, query patterns

### 16.3 Business Questions

**Q-9: Fundraising?**
- Options: Bootstrap, angel round, VC seed
- Decision needed by: Phase 3 completion
- Owner: Founder/CEO
- Considerations: Burn rate, growth trajectory, dilution

**Q-10: Team Expansion?**
- Options: Hire designer, second engineer, marketing lead
- Decision needed by: Phase 2 completion
- Owner: Founder/CEO
- Considerations: Funding, workload, growth needs

**Q-11: Marketing Strategy?**
- Options: Content marketing, Reddit/Discord community, paid ads, partnerships
- Decision needed by: Phase 2 launch
- Owner: Product Manager (interim)
- Considerations: Budget, target audience, CAC

**Q-12: Legal Entity & Terms?**
- Options: LLC, C-Corp, Delaware vs local
- Decision needed by: Before Phase 1 launch
- Owner: Founder/CEO
- Considerations: Liability, fundraising, international users

---

## 17. Appendices

### Appendix A: Glossary

- **MAU**: Monthly Active Users (users with at least one action in 30 days)
- **RLS**: Row-Level Security (database access control)
- **MCP**: Model Context Protocol (standard for LLM tool integration)
- **CRUD**: Create, Read, Update, Delete
- **NPS**: Net Promoter Score (customer satisfaction metric)
- **CSAT**: Customer Satisfaction Score
- **LTV**: Lifetime Value (total revenue per customer)
- **CAC**: Customer Acquisition Cost
- **MRR**: Monthly Recurring Revenue
- **PKCE**: Proof Key for Code Exchange (OAuth security extension)
- **SSR**: Server-Side Rendering
- **RSC**: React Server Components
- **E2E**: End-to-End (testing)

### Appendix B: User Research Summary

*To be added: Summary of user interviews, surveys, and usability tests conducted during discovery phase.*

### Appendix C: Competitive Analysis

| Feature | WorldCrafter | World Anvil | Notion | Obsidian | LegendKeeper | Campfire |
|---------|--------------|-------------|--------|----------|--------------|----------|
| Multi-genre support | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| AI generation | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| ChatGPT integration | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Relationship graph | ✅ | ✅ | ❌ | ✅ (plugins) | ❌ | ❌ |
| Real-time collaboration | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Interactive maps | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Timeline visualization | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| API access | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Mobile app | Phase 5 | ✅ | ✅ | ✅ | ❌ | ✅ |
| Pricing | Free + $15/mo | Free + $5-13/mo | Free + $10/mo | Free | $5/mo | $50/year |
| UX Rating | TBD | 3.5/5 | 4.5/5 | 4/5 | 4/5 | 4/5 |

**Key Differentiators:**
1. AI-powered features (generation, suggestions, consistency)
2. ChatGPT Apps SDK integration (800M+ potential users)
3. Modern, fast UX (Next.js vs legacy tech)
4. Multi-genre flexibility without complexity
5. Real-time collaboration (vs World Anvil's limitations)

### Appendix D: Technical Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          Users                                   │
│  (Web Browsers, ChatGPT, Mobile Apps)                           │
└────────────┬────────────────────────────────────┬───────────────┘
             │                                    │
             │                                    │
    ┌────────▼────────┐                  ┌────────▼──────────┐
    │   Next.js App   │                  │  ChatGPT Client   │
    │  (Vercel Edge)  │                  │  (openai.com)     │
    │                 │                  │                   │
    │  - React UI     │                  │  - Conversation   │
    │  - Server Comp  │                  │  - Widgets        │
    │  - API Routes   │                  │  - OAuth          │
    └────────┬────────┘                  └────────┬──────────┘
             │                                    │
             │                                    │
             └──────────┬─────────────────────────┘
                        │
                        │
             ┌──────────▼──────────┐
             │   Supabase Auth     │
             │  (OAuth Server)     │
             │  - JWT Tokens       │
             │  - Session Mgmt     │
             └──────────┬──────────┘
                        │
                        │
    ┌───────────────────┼───────────────────┐
    │                   │                   │
┌───▼────────┐  ┌───────▼────────┐  ┌──────▼────────┐
│ PostgreSQL │  │ Supabase       │  │ Supabase      │
│ (Prisma)   │  │ Storage        │  │ Realtime      │
│            │  │                │  │               │
│ - RLS      │  │ - Images       │  │ - WebSockets  │
│ - Indexes  │  │ - Exports      │  │ - Presence    │
│ - Backups  │  │                │  │ - Broadcast   │
└────────────┘  └────────────────┘  └───────────────┘
                        │
                        │
             ┌──────────▼──────────┐
             │   OpenAI API        │
             │  (GPT-4, Embeddings)│
             │  - AI Generation    │
             │  - Suggestions      │
             │  - Consistency      │
             └─────────────────────┘
```

### Appendix E: Data Model ERD

*(Detailed Entity-Relationship Diagram available in separate file: docs/ERD.md)*

### Appendix F: Wireframes & Mockups

*(Design files available in Figma: [link to be added])*

### Appendix G: ChatGPT Apps SDK Integration Details

**Tool Definitions Example:**

```json
{
  "tools": [
    {
      "name": "create_character",
      "title": "Create Character",
      "description": "Create a new character in the world",
      "inputSchema": {
        "type": "object",
        "properties": {
          "worldId": { "type": "string" },
          "name": { "type": "string" },
          "role": { "type": "string" },
          "backstory": { "type": "string" }
        },
        "required": ["worldId", "name"]
      },
      "_meta": {
        "openai/outputTemplate": "ui://widget/character-card.html",
        "openai/widgetAccessible": true,
        "openai/toolInvocation": {
          "invoking": "Creating character...",
          "invoked": "Character created successfully!"
        }
      }
    }
  ]
}
```

**Widget Example (Character Card):**

```typescript
// src/widgets/character-card.tsx
import React from 'react';

export function CharacterCard() {
  const { toolOutput } = window.openai.useWidgetProps();
  const character = toolOutput.structuredContent;

  return (
    <div className="character-card">
      <img src={character.imageUrl} alt={character.name} />
      <h2>{character.name}</h2>
      <p className="role">{character.role}</p>
      <p className="backstory">{character.backstory}</p>
      <button onClick={() => window.openai.callTool('update_character', {
        id: character.id
      })}>
        Edit Character
      </button>
    </div>
  );
}
```

---

## Document Approval

**Prepared By:** Product Team
**Date:** January 2025

**Approval Required From:**

- [ ] Product Manager
- [ ] Engineering Lead
- [ ] Design Lead
- [ ] CEO/Founder

**Next Steps After Approval:**

1. Distribute PRD to all stakeholders
2. Engineering begins Phase 1 implementation
3. Design begins mockups for all phases
4. Product schedules weekly check-ins
5. Update PRD as requirements evolve (version control in Git)

---

**END OF DOCUMENT**
