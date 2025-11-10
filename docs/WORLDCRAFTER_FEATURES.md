# WorldCrafter Feature Specification

**Version:** 1.0
**Last Updated:** January 2025
**Target Stack:** Next.js 16, Supabase, Prisma, React 19, ChatGPT Apps SDK

---

## Executive Summary

WorldCrafter is a **multi-genre worldbuilding platform** that enables fiction writers, game masters, game developers, and worldbuilding hobbyists to create, organize, and explore rich fictional universes. The platform provides structured tools for managing complex worldbuilding entities (characters, locations, events, items, factions) while maintaining flexibility across fantasy, sci-fi, modern, historical, and custom genres.

**Development Strategy:** Standalone-first with phased ChatGPT Apps SDK integration
**Target Audience:** All worldbuilding creators (writers, GMs, developers, hobbyists)
**Deployment Model:** Web app with optional conversational AI interface

---

## Implementation Phases

### Phase 1: MVP (Weeks 1-4)
Core world and location management with basic CRUD operations. Proves technical feasibility and user value.

### Phase 2: Core Features (Weeks 5-10)
Full entity management, relationship mapping, search, and organization. Production-ready for early adopters.

### Phase 3: Advanced Features (Weeks 11-16)
AI-assisted generation, templates, export/import, visualization tools. Competitive feature parity.

### Phase 4: ChatGPT Integration (Weeks 17-20)
MCP server implementation, conversational interface, interactive widgets. Future-forward differentiator.

---

## Feature Catalog

### 1. World Management

#### 1.1 Create & Edit Worlds
**Phase:** MVP (Phase 1)

**Description:**
Users can create multiple worlds with customizable metadata including name, genre, description, settings, and custom fields.

**Pain Point Solved:**
Writers and GMs often juggle multiple projects across notebooks, documents, and apps. Centralizing world definitions prevents fragmentation and lost context.

**How It Works:**
- **UI:** Form with React Hook Form + Zod validation
- **Fields:**
  - Name (required, max 100 chars)
  - Genre (select: Fantasy, Sci-Fi, Modern, Historical, Horror, Custom)
  - Description (rich text markdown editor, max 5000 chars)
  - Setting Summary (optional, 500 chars)
  - Custom Metadata (JSON field for genre-specific attributes)
  - Cover Image (upload to Supabase Storage)
  - Privacy (Private, Unlisted, Public)
- **Database:** `World` model in Prisma
  ```prisma
  model World {
    id          String   @id @default(cuid())
    userId      String   @db.Uuid
    name        String   @db.VarChar(100)
    slug        String   @unique
    genre       Genre    @default(CUSTOM)
    description String?  @db.Text
    setting     String?  @db.VarChar(500)
    metadata    Json?
    coverUrl    String?
    privacy     Privacy  @default(PRIVATE)
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt

    user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    locations   Location[]
    characters  Character[]
    events      Event[]
    items       Item[]
    factions    Faction[]

    @@map("worlds")
  }

  enum Genre {
    FANTASY
    SCIFI
    MODERN
    HISTORICAL
    HORROR
    CUSTOM
  }

  enum Privacy {
    PRIVATE
    UNLISTED
    PUBLIC
  }
  ```
- **RLS:** Users can only CRUD their own worlds
- **Server Action:** `createWorld()`, `updateWorld()`, `deleteWorld()`
- **Routes:**
  - `/worlds` - List view
  - `/worlds/new` - Create form
  - `/worlds/[slug]` - World detail page
  - `/worlds/[slug]/edit` - Edit form

**ChatGPT SDK Integration (Phase 4):**
- Tool: `create_world` - "Create a steampunk world called Gearhaven"
- Widget: Inline world card showing name, genre, description
- State: `worldId` persisted for follow-up questions

---

#### 1.2 World Dashboard
**Phase:** MVP (Phase 1)

**Description:**
Overview page for each world showing quick stats, recent activity, and navigation to all entities.

**Pain Point Solved:**
Worldbuilders lose track of what's in their world. A dashboard provides at-a-glance context and entry points.

**How It Works:**
- **UI:** Card-based dashboard with:
  - Stats panel (# characters, locations, events, items, factions)
  - Recent activity feed (last 10 edits with timestamps)
  - Quick actions (Add Character, Add Location, etc.)
  - Search bar (global search within world)
  - Navigation sidebar to entity categories
- **Data Fetching:** Server Component with Prisma aggregations
  ```typescript
  const stats = await prisma.world.findUnique({
    where: { id: worldId },
    include: {
      _count: {
        select: {
          characters: true,
          locations: true,
          events: true,
          items: true,
          factions: true
        }
      }
    }
  })
  ```
- **Activity Log:** Separate `Activity` model tracking create/update/delete operations
- **Route:** `/worlds/[slug]/dashboard`

**ChatGPT SDK Integration (Phase 4):**
- Tool: `get_world_summary` - "Summarize my Gearhaven world"
- Widget: Fullscreen dashboard clone for in-chat exploration

---

#### 1.3 World Versioning
**Phase:** Advanced (Phase 3)

**Description:**
Save snapshots of world state at key milestones. Revert to previous versions or compare changes.

**Pain Point Solved:**
Writers/GMs make experimental changes and want safety nets. Game developers need version control for narrative iterations.

**How It Works:**
- **Database:** `WorldVersion` model
  ```prisma
  model WorldVersion {
    id          String   @id @default(cuid())
    worldId     String
    versionNum  Int
    name        String   // "Before Chapter 5", "Session 12 Backup"
    snapshot    Json     // Full world data serialized
    createdAt   DateTime @default(now())

    world       World    @relation(fields: [worldId], references: [id], onDelete: Cascade)

    @@unique([worldId, versionNum])
    @@map("world_versions")
  }
  ```
- **Snapshot Logic:** Serialize entire world graph (all entities, relationships) to JSON
- **UI:**
  - Version history list with diff viewer
  - "Save Snapshot" button on world dashboard
  - "Restore to this version" with confirmation modal
- **Implementation:** Server Action creates snapshot, stores in `snapshot` JSON field
- **Performance:** Limit to 50 versions per world, prune oldest automatically

**ChatGPT SDK Integration (Phase 4):**
- Tool: `save_world_snapshot` - "Save a snapshot called 'Before the War'"
- Widget: Timeline visualization of versions

---

### 2. Entity Management

#### 2.1 Character Creation & Profiles
**Phase:** Core (Phase 2)

**Description:**
Create detailed character profiles with customizable attributes, backstory, relationships, and images.

**Pain Point Solved:**
Characters are scattered across docs with inconsistent detail levels. Centralized profiles ensure completeness and accessibility.

**How It Works:**
- **Database:** `Character` model
  ```prisma
  model Character {
    id          String   @id @default(cuid())
    worldId     String
    name        String   @db.VarChar(100)
    slug        String
    role        String?  @db.VarChar(50) // "Protagonist", "Villain", "NPC"
    species     String?  @db.VarChar(50)
    age         String?  @db.VarChar(20) // "27", "Ancient", "Unknown"
    appearance  String?  @db.Text
    personality String?  @db.Text
    backstory   String?  @db.Text
    goals       String?  @db.Text
    fears       String?  @db.Text
    attributes  Json?    // Custom fields (stats, skills, etc.)
    imageUrl    String?
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt

    world       World    @relation(fields: [worldId], references: [id], onDelete: Cascade)
    relationships Relationship[] @relation("CharacterRelationships")

    @@unique([worldId, slug])
    @@map("characters")
  }
  ```
- **UI:** Multi-step form wizard:
  1. Basics (name, role, species, age)
  2. Physical (appearance, image upload)
  3. Personality & Psychology
  4. Backstory & Goals
  5. Custom Attributes (genre-specific fields)
- **Rich Text:** Markdown editor with preview for long-form fields
- **Image Upload:** Supabase Storage with resize on upload (thumbnail + full)
- **Routes:**
  - `/worlds/[slug]/characters` - List view with filters
  - `/worlds/[slug]/characters/new` - Create wizard
  - `/worlds/[slug]/characters/[charSlug]` - Character sheet
  - `/worlds/[slug]/characters/[charSlug]/edit` - Edit form

**ChatGPT SDK Integration (Phase 4):**
- Tool: `create_character` - "Create a wise old wizard named Aldrin"
- Widget: Character sheet card (inline or PiP) with stats, image, quick facts
- AI Enhancement: Auto-suggest personality traits based on role/backstory

---

#### 2.2 Location Management
**Phase:** MVP (Phase 1)

**Description:**
Define places in your world with descriptions, geography, climate, population, and custom metadata.

**Pain Point Solved:**
Locations are critical for spatial storytelling but often underdeveloped. Structured location data ensures consistency.

**How It Works:**
- **Database:** `Location` model
  ```prisma
  model Location {
    id          String   @id @default(cuid())
    worldId     String
    name        String   @db.VarChar(100)
    slug        String
    type        String?  @db.VarChar(50) // "City", "Dungeon", "Forest", "Planet"
    parentId    String?  // For hierarchical locations
    description String?  @db.Text
    geography   String?  @db.Text
    climate     String?  @db.VarChar(100)
    population  String?  @db.VarChar(50)
    government  String?  @db.VarChar(100)
    economy     String?  @db.Text
    culture     String?  @db.Text
    coordinates Json?    // {x: 123, y: 456} for map placement
    attributes  Json?
    imageUrl    String?
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt

    world       World     @relation(fields: [worldId], references: [id], onDelete: Cascade)
    parent      Location? @relation("LocationHierarchy", fields: [parentId], references: [id])
    children    Location[] @relation("LocationHierarchy")

    @@unique([worldId, slug])
    @@map("locations")
  }
  ```
- **Hierarchical Structure:** Continent > Country > Region > City > District
- **UI:** Tree view for navigation + detailed form for editing
- **Map Integration:** Store x/y coordinates for Phase 3 map visualization
- **Routes:** Similar to characters (list, create, detail, edit)

**ChatGPT SDK Integration (Phase 4):**
- Tool: `create_location` - "Add a mysterious forest north of the capital"
- Widget: Location card with map thumbnail (if coordinates exist)

---

#### 2.3 Event Timeline
**Phase:** Core (Phase 2)

**Description:**
Chronicle important events in world history with dates, descriptions, and connections to characters/locations.

**Pain Point Solved:**
Timelines are hard to visualize and keep consistent. Centralized event tracking prevents continuity errors.

**How It Works:**
- **Database:** `Event` model
  ```prisma
  model Event {
    id          String   @id @default(cuid())
    worldId     String
    name        String   @db.VarChar(150)
    slug        String
    date        String?  @db.VarChar(100) // Flexible: "1453 BCE", "Year 342", "The Long Night"
    description String?  @db.Text
    significance String? @db.Text
    type        String?  @db.VarChar(50) // "Battle", "Discovery", "Political", "Natural"
    locationId  String?  // Where it happened
    participants Json?   // Array of character IDs involved
    attributes  Json?
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt

    world       World     @relation(fields: [worldId], references: [id], onDelete: Cascade)
    location    Location? @relation(fields: [locationId], references: [id])

    @@unique([worldId, slug])
    @@map("events")
  }
  ```
- **Date Parsing:** Support flexible date formats (no strict datetime constraint)
- **UI:** Timeline view (horizontal scrollable) + list view (sortable by date)
- **Filtering:** By type, location, date range, participants
- **Routes:** Standard CRUD routes

**ChatGPT SDK Integration (Phase 4):**
- Tool: `add_event` - "Record the Battle of Winterhold in Year 523"
- Widget: Timeline visualization (horizontal or vertical)

---

#### 2.4 Item/Artifact Database
**Phase:** Core (Phase 2)

**Description:**
Track important objects, magical artifacts, technology, or resources in your world.

**Pain Point Solved:**
GMs forget which NPC has which item. Writers lose track of MacGuffin details. Centralized item registry solves this.

**How It Works:**
- **Database:** `Item` model
  ```prisma
  model Item {
    id          String   @id @default(cuid())
    worldId     String
    name        String   @db.VarChar(100)
    slug        String
    type        String?  @db.VarChar(50) // "Weapon", "Artifact", "Technology", "Resource"
    rarity      String?  @db.VarChar(30) // "Common", "Rare", "Legendary"
    description String?  @db.Text
    properties  String?  @db.Text // Magical/technological properties
    history     String?  @db.Text
    currentOwner String? // Character ID
    location    String?  // Location ID or "Unknown"
    attributes  Json?    // Stats, damage, effects, etc.
    imageUrl    String?
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt

    world       World    @relation(fields: [worldId], references: [id], onDelete: Cascade)

    @@unique([worldId, slug])
    @@map("items")
  }
  ```
- **UI:** Card grid view with filters, detailed modal for viewing
- **Ownership Tracking:** Link to character or location (soft reference in JSON for flexibility)
- **Image Gallery:** Support multiple images per item

**ChatGPT SDK Integration (Phase 4):**
- Tool: `create_item` - "Add the legendary sword Frostbite with ice enchantment"
- Widget: Item card with stats and image

---

#### 2.5 Faction/Organization System
**Phase:** Core (Phase 2)

**Description:**
Define groups, guilds, kingdoms, corporations, or any organizational structure with members, goals, and hierarchies.

**Pain Point Solved:**
Complex political/social structures are hard to track. Faction system clarifies allegiances and conflicts.

**How It Works:**
- **Database:** `Faction` model
  ```prisma
  model Faction {
    id          String   @id @default(cuid())
    worldId     String
    name        String   @db.VarChar(100)
    slug        String
    type        String?  @db.VarChar(50) // "Kingdom", "Guild", "Corporation", "Religion"
    description String?  @db.Text
    goals       String?  @db.Text
    structure   String?  @db.Text // Hierarchy description
    headquarters String? // Location ID
    leadership  Json?    // Array of character IDs
    members     Json?    // Array of character IDs
    allies      Json?    // Array of faction IDs
    enemies     Json?    // Array of faction IDs
    attributes  Json?
    imageUrl    String?  // Emblem/logo
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt

    world       World    @relation(fields: [worldId], references: [id], onDelete: Cascade)

    @@unique([worldId, slug])
    @@map("factions")
  }
  ```
- **UI:** Org chart visualization for structure, list of members/allies/enemies
- **Relationships:** Track faction-to-faction relationships (allies, enemies, neutral)

**ChatGPT SDK Integration (Phase 4):**
- Tool: `create_faction` - "Create the Mages' Guild based in Arcanum"
- Widget: Faction card with emblem, leadership, and relationship web

---

### 3. Relationship Mapping

#### 3.1 Entity Relationships
**Phase:** Core (Phase 2)

**Description:**
Define relationships between any entities (character-to-character, character-to-location, faction-to-faction, etc.).

**Pain Point Solved:**
Relationships are the heart of storytelling but hard to visualize. Explicit relationship data enables graph views and prevents inconsistencies.

**How It Works:**
- **Database:** `Relationship` model
  ```prisma
  model Relationship {
    id          String   @id @default(cuid())
    worldId     String
    sourceType  EntityType
    sourceId    String
    targetType  EntityType
    targetId    String
    type        String   @db.VarChar(50) // "Friend", "Enemy", "Family", "Member", "Located In"
    description String?  @db.Text
    strength    Int?     @default(5) // 1-10 scale
    isDirectional Boolean @default(false) // true = A→B, false = A↔B
    attributes  Json?
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt

    world       World    @relation(fields: [worldId], references: [id], onDelete: Cascade)

    @@unique([worldId, sourceType, sourceId, targetType, targetId, type])
    @@index([sourceType, sourceId])
    @@index([targetType, targetId])
    @@map("relationships")
  }

  enum EntityType {
    CHARACTER
    LOCATION
    EVENT
    ITEM
    FACTION
  }
  ```
- **UI:**
  - Add relationship from any entity detail page
  - Relationship panel showing all connections
  - Graph visualization (D3.js or Cytoscape.js)
- **Strength Scale:** 1-10 to indicate importance/intensity
- **Directionality:** Support one-way (A loves B) and two-way (A and B are friends)

**ChatGPT SDK Integration (Phase 4):**
- Tool: `add_relationship` - "Make Aldrin the mentor of Elara"
- Widget: Relationship graph (interactive, zoomable)

---

#### 3.2 Relationship Graph Visualization
**Phase:** Advanced (Phase 3)

**Description:**
Interactive network graph showing all entities and their connections with filtering and clustering.

**Pain Point Solved:**
Complex webs of relationships are impossible to grasp from lists. Visual graphs reveal patterns and gaps.

**How It Works:**
- **Library:** React Flow or Cytoscape.js
- **Data Structure:** Nodes (entities) + Edges (relationships)
- **Features:**
  - Pan/zoom/drag controls
  - Filter by entity type (show only characters)
  - Filter by relationship type (show only family ties)
  - Clustering by faction/location
  - Click node to open entity detail
  - Highlight connected nodes on hover
- **Performance:** Virtualization for worlds with 500+ entities
- **Export:** PNG/SVG download of graph
- **Route:** `/worlds/[slug]/graph`

**ChatGPT SDK Integration (Phase 4):**
- Tool: `view_relationship_graph` - "Show me all connections to the villain"
- Widget: Fullscreen graph with ChatGPT composer overlay

---

### 4. Content Organization

#### 4.1 Tags & Categories
**Phase:** Core (Phase 2)

**Description:**
Apply custom tags to any entity for flexible categorization and filtering.

**Pain Point Solved:**
Rigid hierarchies don't fit every use case. Tags provide organic, user-defined organization.

**How It Works:**
- **Database:** `Tag` model with many-to-many relations
  ```prisma
  model Tag {
    id          String   @id @default(cuid())
    worldId     String
    name        String   @db.VarChar(50)
    color       String?  @db.VarChar(7) // Hex color
    createdAt   DateTime @default(now())

    world       World    @relation(fields: [worldId], references: [id], onDelete: Cascade)
    characters  Character[]
    locations   Location[]
    events      Event[]
    items       Item[]
    factions    Faction[]

    @@unique([worldId, name])
    @@map("tags")
  }
  ```
- **UI:** Tag input with autocomplete, tag pills with color coding
- **Filtering:** Multi-select tag filter on all list views
- **Tag Management:** Dedicated page to rename/merge/delete tags

**ChatGPT SDK Integration (Phase 4):**
- Tool: `tag_entity` - "Tag Aldrin as 'major character' and 'magic user'"
- Auto-tagging: AI suggests tags based on entity content

---

#### 4.2 Folders & Collections
**Phase:** Advanced (Phase 3)

**Description:**
Organize entities into custom folders/collections (e.g., "Chapter 5 Characters", "Session Prep", "Unfinished").

**Pain Point Solved:**
Writers need to organize by narrative structure (chapters, arcs). GMs need session-specific collections. Folders enable workflow-based organization.

**How It Works:**
- **Database:** `Collection` model
  ```prisma
  model Collection {
    id          String   @id @default(cuid())
    worldId     String
    name        String   @db.VarChar(100)
    description String?  @db.Text
    items       Json     // Array of {type: EntityType, id: string}
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt

    world       World    @relation(fields: [worldId], references: [id], onDelete: Cascade)

    @@map("collections")
  }
  ```
- **UI:**
  - Drag-and-drop interface to add entities to collections
  - Collections sidebar on world dashboard
  - Nested collections (max 3 levels)
- **Smart Collections:** Auto-populate based on rules (e.g., "All characters tagged 'villain'")

**ChatGPT SDK Integration (Phase 4):**
- Tool: `create_collection` - "Make a collection for my next session"

---

#### 4.3 Global Search
**Phase:** MVP (Phase 1)

**Description:**
Full-text search across all entities within a world with filters and relevance ranking.

**Pain Point Solved:**
Finding specific content in large worlds is time-consuming. Search provides instant access.

**How It Works:**
- **Implementation:** PostgreSQL full-text search with `tsvector` columns
  ```sql
  ALTER TABLE characters ADD COLUMN search_vector tsvector;
  CREATE INDEX characters_search_idx ON characters USING GIN(search_vector);

  -- Update trigger to maintain search_vector
  CREATE TRIGGER characters_search_update
  BEFORE INSERT OR UPDATE ON characters
  FOR EACH ROW EXECUTE FUNCTION
  tsvector_update_trigger(search_vector, 'pg_catalog.english', name, role, backstory, personality);
  ```
- **UI:**
  - Search bar on world dashboard (⌘K hotkey)
  - Results grouped by entity type
  - Preview snippet with highlighted matches
  - Click to navigate to entity
- **Filters:** Type, tags, date range
- **Ranking:** `ts_rank()` for relevance scoring

**ChatGPT SDK Integration (Phase 4):**
- Tool: `search_world` - "Find all references to dragons"
- Widget: Search results list with quick navigation

---

#### 4.4 Notes & Wiki Pages
**Phase:** Advanced (Phase 3)

**Description:**
Create free-form wiki pages for lore, rules, concepts that don't fit entity templates.

**Pain Point Solved:**
Not everything fits into character/location/etc. Wiki pages handle miscellaneous world knowledge.

**How It Works:**
- **Database:** `Page` model
  ```prisma
  model Page {
    id          String   @id @default(cuid())
    worldId     String
    title       String   @db.VarChar(150)
    slug        String
    content     String   @db.Text // Markdown
    parentId    String?  // Hierarchical pages
    attributes  Json?
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt

    world       World    @relation(fields: [worldId], references: [id], onDelete: Cascade)
    parent      Page?    @relation("PageHierarchy", fields: [parentId], references: [id])
    children    Page[]   @relation("PageHierarchy")

    @@unique([worldId, slug])
    @@map("pages")
  }
  ```
- **UI:** Markdown editor with live preview, wiki-style navigation
- **Linking:** `[[Entity Name]]` syntax auto-links to entities
- **Templates:** Page templates for common patterns (magic system, technology, religion)

**ChatGPT SDK Integration (Phase 4):**
- Tool: `create_page` - "Create a page explaining the magic system"

---

### 5. Collaboration & Sharing

#### 5.1 World Sharing & Permissions
**Phase:** Core (Phase 2)

**Description:**
Share worlds with other users via invite links with granular permission levels (view, comment, edit, admin).

**Pain Point Solved:**
Co-authors, writing groups, and GM teams need collaborative access. Sharing enables teamwork.

**How It Works:**
- **Database:** `WorldMember` model
  ```prisma
  model WorldMember {
    id          String   @id @default(cuid())
    worldId     String
    userId      String   @db.Uuid
    role        MemberRole
    invitedBy   String   @db.Uuid
    invitedAt   DateTime @default(now())

    world       World    @relation(fields: [worldId], references: [id], onDelete: Cascade)
    user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    inviter     User     @relation("Invites", fields: [invitedBy], references: [id])

    @@unique([worldId, userId])
    @@map("world_members")
  }

  enum MemberRole {
    VIEWER     // Read-only
    COMMENTER  // Can add comments
    EDITOR     // Can create/edit entities
    ADMIN      // Full control except delete world
  }
  ```
- **RLS Updates:** Modify policies to allow access based on `world_members` table
- **UI:**
  - Share modal with email invite input
  - Member list with role dropdown
  - Revoke access button
- **Email Notifications:** Send invite emails via Supabase Edge Functions

**ChatGPT SDK Integration (Phase 4):**
- Each user's ChatGPT session sees only worlds they own/have access to
- OAuth scope: `worlds:share` for invite permissions

---

#### 5.2 Public World Gallery
**Phase:** Advanced (Phase 3)

**Description:**
Browse publicly shared worlds created by the community with search, filtering, and cloning.

**Pain Point Solved:**
Worldbuilders want inspiration and to showcase work. Gallery enables discovery and learning.

**How It Works:**
- **Privacy Setting:** World privacy enum includes `PUBLIC`
- **Route:** `/explore` with grid/list view
- **Filtering:** By genre, popularity (view count), recent updates
- **Cloning:** "Clone to My Worlds" creates full copy for user to customize
- **Likes/Bookmarks:** Users can favorite worlds (separate `Bookmark` model)
- **Reporting:** Flag inappropriate content (moderation queue)

**ChatGPT SDK Integration (Phase 4):**
- Tool: `browse_gallery` - "Show me popular sci-fi worlds"
- Widget: Gallery grid with world cards

---

#### 5.3 Comments & Discussions
**Phase:** Core (Phase 2)

**Description:**
Leave comments on any entity for feedback, questions, or collaborative notes.

**Pain Point Solved:**
Collaborators need asynchronous communication tied to specific content. Comments keep discussions contextual.

**How It Works:**
- **Database:** `Comment` model
  ```prisma
  model Comment {
    id          String   @id @default(cuid())
    worldId     String
    entityType  EntityType
    entityId    String
    userId      String   @db.Uuid
    content     String   @db.Text
    parentId    String?  // For threaded replies
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt

    world       World    @relation(fields: [worldId], references: [id], onDelete: Cascade)
    user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    parent      Comment? @relation("CommentThread", fields: [parentId], references: [id])
    replies     Comment[] @relation("CommentThread")

    @@index([entityType, entityId])
    @@map("comments")
  }
  ```
- **UI:** Comment thread at bottom of entity detail pages
- **Notifications:** Email/in-app notifications for replies
- **Permissions:** Respect `COMMENTER` role minimum

**ChatGPT SDK Integration (Phase 4):**
- Tool: `add_comment` - "Add a note that Aldrin needs more backstory"

---

#### 5.4 Real-Time Collaboration
**Phase:** Premium (Phase 4)

**Description:**
Live cursors, presence indicators, and simultaneous editing for team worldbuilding sessions.

**Pain Point Solved:**
Async collaboration has lag. Real-time sync enables pair worldbuilding and live GM prep.

**How It Works:**
- **Technology:** Supabase Realtime (WebSocket channels)
- **Presence:** Track which users are viewing each entity
  ```typescript
  const channel = supabase.channel(`world:${worldId}`)
  channel.on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState()
    // Show avatars of active users
  })
  channel.subscribe()
  ```
- **Broadcasting:** Broadcast edit events to all connected clients
- **Conflict Resolution:** Last-write-wins with merge conflict detection
- **UI:**
  - Avatar pills showing active users
  - Color-coded cursors (if editing same page)
  - Toast notifications for updates ("Alice edited the character")

**ChatGPT SDK Integration (Phase 4):**
- Not applicable (real-time is web-only feature)

---

### 6. AI-Assisted Generation

#### 6.1 AI Entity Generation
**Phase:** Advanced (Phase 3)

**Description:**
Generate characters, locations, items, or factions using AI based on prompts and world context.

**Pain Point Solved:**
Writer's block and blank-page syndrome. AI jumpstarts creativity with coherent, context-aware suggestions.

**How It Works:**
- **Integration:** OpenAI API (GPT-4) or Anthropic API (Claude)
- **Prompt Engineering:**
  ```
  You are helping create a {entityType} for a {world.genre} world called "{world.name}".

  World Context:
  {world.description}

  Existing entities: {relatedEntities}

  User Request: {userPrompt}

  Generate a detailed {entityType} with the following fields:
  - Name
  - Description
  - [entity-specific fields]

  Ensure consistency with the world's tone and existing lore.
  ```
- **UI:**
  - "Generate with AI" button on create forms
  - Modal with prompt input and generation options
  - Preview generated content before saving
  - Regenerate/edit/save options
- **Cost Control:** Rate limit API calls (5 per hour for free users)
- **Storage:** Save generation logs for debugging

**ChatGPT SDK Integration (Phase 4):**
- Native ChatGPT conversation is the AI generator itself!
- Tool: `save_generated_character` - AI creates, user confirms, tool persists to DB

---

#### 6.2 AI Relationship Suggestions
**Phase:** Advanced (Phase 3)

**Description:**
AI analyzes entities and suggests potential relationships (e.g., "These two characters could be rivals").

**Pain Point Solved:**
Isolated entities lack depth. Relationship suggestions reveal narrative opportunities.

**How It Works:**
- **Trigger:** Run analysis when viewing entity with no relationships
- **Algorithm:**
  - Extract semantic embeddings of entity descriptions (OpenAI Embeddings API)
  - Calculate similarity scores between entities
  - Identify high-similarity pairs without existing relationships
  - Use LLM to suggest relationship types based on attributes
- **UI:**
  - Sidebar panel "Suggested Connections"
  - Each suggestion shows reasoning ("Both are wizards in the same city")
  - One-click "Add Relationship" button
  - Dismiss suggestions

**ChatGPT SDK Integration (Phase 4):**
- Tool: `suggest_relationships` - "What connections am I missing for Aldrin?"

---

#### 6.3 Lore Consistency Checker
**Phase:** Advanced (Phase 3)

**Description:**
AI scans world content for inconsistencies (contradictory dates, impossible travel times, conflicting descriptions).

**Pain Point Solved:**
Large worlds accumulate continuity errors. Automated checking catches mistakes before they compound.

**How It Works:**
- **Analysis Types:**
  - Date conflicts (Event A happens after Event B but references it)
  - Location conflicts (Character in two places at once)
  - Description contradictions (Hair color changes between mentions)
- **Implementation:**
  - Periodic batch job or manual trigger
  - LLM analyzes pairs of entities for logical inconsistencies
  - Heuristics for obvious errors (duplicate names with different IDs)
- **UI:**
  - "Consistency Report" page with warnings/errors
  - Click to view conflicting entities side-by-side
  - Mark as "false positive" to ignore

**ChatGPT SDK Integration (Phase 4):**
- Tool: `check_consistency` - "Are there any continuity errors in my world?"

---

#### 6.4 AI Writing Prompts
**Phase:** Advanced (Phase 3)

**Description:**
Generate story prompts, quest ideas, or scene starters based on world entities and relationships.

**Pain Point Solved:**
Writers/GMs run out of ideas. AI prompts leverage existing world data for contextual inspiration.

**How It Works:**
- **Prompt Types:**
  - Story starters ("Write a scene where X meets Y")
  - Quest hooks ("The players must retrieve Z from location L")
  - Conflict ideas ("Faction A and B clash over resource R")
- **Generation Logic:**
  - Select random entities/relationships from world
  - Feed to LLM with template prompt
  - Return 5-10 ideas
- **UI:**
  - "Get Writing Prompts" button on dashboard
  - Filters (focus on specific characters/locations)
  - Save favorite prompts to collections

**ChatGPT SDK Integration (Phase 4):**
- Native feature - ChatGPT can brainstorm without separate tool

---

### 7. Templates & Presets

#### 7.1 Genre Templates
**Phase:** Core (Phase 2)

**Description:**
Pre-built world templates for common genres with starter entities and structures.

**Pain Point Solved:**
Blank slates are intimidating. Templates provide scaffolding for quick starts.

**How It Works:**
- **Templates:**
  - **Fantasy:** Kingdom + capital city + king + wizard + quest item
  - **Sci-Fi:** Starship + crew members + alien species + planets
  - **Modern Urban:** City + neighborhoods + protagonist + supporting cast
  - **Historical:** Time period + major locations + historical figures
  - **Horror:** Setting + monster/threat + victims + investigation
- **Storage:** JSON files in codebase with seed data
- **UI:**
  - "Start from Template" option on world creation
  - Template gallery with previews
  - Customization form before creating
- **Implementation:** Server Action clones template structure and creates all entities

**ChatGPT SDK Integration (Phase 4):**
- Tool: `use_template` - "Start a fantasy world from template"

---

#### 7.2 Custom Entity Templates
**Phase:** Advanced (Phase 3)

**Description:**
Users create reusable templates for entities (e.g., "My Standard NPC Format").

**Pain Point Solved:**
Repetitive entity creation is tedious. Templates save time and ensure consistency.

**How It Works:**
- **Database:** `EntityTemplate` model
  ```prisma
  model EntityTemplate {
    id          String   @id @default(cuid())
    userId      String   @db.Uuid
    name        String
    entityType  EntityType
    fields      Json     // Template structure
    isPublic    Boolean  @default(false)
    createdAt   DateTime @default(now())

    user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

    @@map("entity_templates")
  }
  ```
- **UI:**
  - "Save as Template" button on entity edit page
  - Template library on user profile
  - Public template marketplace (if `isPublic = true`)
  - "Create from Template" dropdown on create forms

**ChatGPT SDK Integration (Phase 4):**
- Tool: `use_entity_template` - "Create a character using my NPC template"

---

#### 7.3 Import from Existing Formats
**Phase:** Advanced (Phase 3)

**Description:**
Import worlds from other platforms (World Anvil, Campfire, Obsidian markdown, CSV).

**Pain Point Solved:**
Users have existing worldbuilding data in other tools. Import reduces friction for migration.

**How It Works:**
- **Supported Formats:**
  - CSV (character list with columns)
  - Markdown (folder structure with frontmatter)
  - JSON (World Anvil export, Campfire export)
- **Parser:** Server-side processing
  ```typescript
  async function importFromMarkdown(files: File[]) {
    for (const file of files) {
      const content = await file.text()
      const { data, content: body } = matter(content) // Parse frontmatter
      // Map frontmatter fields to entity attributes
      await createEntity(data.type, { ...data, description: body })
    }
  }
  ```
- **UI:**
  - Import wizard on world dashboard
  - Upload files or paste text
  - Preview parsed data with field mapping
  - Confirm and import

**ChatGPT SDK Integration (Phase 4):**
- Not directly applicable (file upload from ChatGPT not supported yet)

---

### 8. Export & Integration

#### 8.1 Export to Multiple Formats
**Phase:** Core (Phase 2)

**Description:**
Export entire worlds or specific entities to JSON, Markdown, PDF, or CSV.

**Pain Point Solved:**
Users need portable backups and to use data in other tools (Notion, Scrivener, game engines).

**How It Works:**
- **Formats:**
  - **JSON:** Full data dump (all entities, relationships, metadata)
  - **Markdown:** Folder structure with one file per entity
  - **PDF:** Formatted world bible with table of contents
  - **CSV:** Spreadsheet format (one entity type at a time)
- **Implementation:**
  - JSON: Direct Prisma serialization
  - Markdown: Template-based conversion (Handlebars/Mustache)
  - PDF: Puppeteer HTML-to-PDF rendering
  - CSV: Convert entity arrays to CSV rows
- **UI:**
  - "Export World" button on dashboard
  - Modal with format selection and options
  - Download link when processing complete

**ChatGPT SDK Integration (Phase 4):**
- Tool: `export_world` - "Export my world to Markdown"
- Widget: Download link (if file hosting supported)

---

#### 8.2 API Access
**Phase:** Advanced (Phase 3)

**Description:**
REST API for programmatic access to world data with authentication and rate limiting.

**Pain Point Solved:**
Power users and developers want to build custom tools, game integrations, or automations.

**How It Works:**
- **Endpoints:** CRUD operations for all entity types
  ```
  GET    /api/v1/worlds/{worldId}
  GET    /api/v1/worlds/{worldId}/characters
  POST   /api/v1/worlds/{worldId}/characters
  PATCH  /api/v1/worlds/{worldId}/characters/{charId}
  DELETE /api/v1/worlds/{worldId}/characters/{charId}
  ```
- **Authentication:** API keys (generated in user settings)
- **Rate Limiting:** 1000 requests/hour per API key
- **Documentation:** OpenAPI spec with Swagger UI at `/api/docs`
- **SDKs:** Official TypeScript SDK (optional)

**ChatGPT SDK Integration (Phase 4):**
- This IS the MCP server integration
- ChatGPT Apps SDK replaces need for public REST API

---

#### 8.3 Obsidian Plugin Integration
**Phase:** Advanced (Phase 3)

**Description:**
Obsidian plugin to sync worlds bidirectionally with Markdown vault.

**Pain Point Solved:**
Many worldbuilders use Obsidian. Plugin bridges ecosystems for best-of-both-worlds workflow.

**How It Works:**
- **Plugin Architecture:**
  - Obsidian plugin (TypeScript) uses WorldCrafter API
  - Settings panel to configure API key and world ID
  - Sync command pulls/pushes data
- **Mapping:**
  - One Markdown file per entity (frontmatter for metadata)
  - Folder structure mirrors entity types
  - Bidirectional sync with conflict resolution
- **Distribution:** Obsidian Community Plugins directory
- **Development:** Separate repo from main app

**ChatGPT SDK Integration (Phase 4):**
- Not directly related

---

#### 8.4 Game Engine Integration
**Phase:** Premium (Phase 4)

**Description:**
Unity/Unreal plugins or JSON export format optimized for game development pipelines.

**Pain Point Solved:**
Game developers write world lore in docs, then manually transfer to game data. Direct export streamlines workflow.

**How It Works:**
- **Unity Plugin:**
  - Editor window to browse WorldCrafter worlds
  - Import entities as ScriptableObjects
  - Sync updates with one click
- **Unreal Plugin:**
  - Similar integration via Blueprint nodes
- **JSON Schema:** Game-optimized format with localization keys, asset references
- **Implementation:** C# (Unity) / C++ (Unreal) HTTP clients

**ChatGPT SDK Integration (Phase 4):**
- Not directly related

---

### 9. Visualization Tools

#### 9.1 Interactive World Maps
**Phase:** Advanced (Phase 3)

**Description:**
Upload/generate world maps and place locations with interactive markers.

**Pain Point Solved:**
Spatial relationships are hard to convey with text. Maps provide geographic context.

**How It Works:**
- **Map Upload:** Supabase Storage for image files (PNG/JPG)
- **Library:** Leaflet.js or Pixi.js for interactive rendering
- **Features:**
  - Pan/zoom controls
  - Drag-and-drop location markers
  - Custom marker icons per location type
  - Lines to show routes/connections
  - Layers (political borders, terrain, climate)
  - Distance measurement tool
- **Database:**
  - Map image URL stored on World model
  - Location coordinates (x, y relative to image dimensions)
- **UI Route:** `/worlds/[slug]/map`

**ChatGPT SDK Integration (Phase 4):**
- Tool: `view_map` - "Show me the map with all cities"
- Widget: Fullscreen map viewer

---

#### 9.2 Timeline Visualization
**Phase:** Advanced (Phase 3)

**Description:**
Visual timeline of all events with filtering, zooming, and event detail popups.

**Pain Point Solved:**
Chronological relationships are hard to grasp from lists. Timelines show history at a glance.

**How It Works:**
- **Library:** vis-timeline or custom D3.js implementation
- **Data Source:** Events sorted by date (parsed to numeric timestamps where possible)
- **Features:**
  - Horizontal scrollable timeline
  - Zoom in/out (year/decade/century scales)
  - Event markers with icons
  - Click for detail modal
  - Filter by type, location, participants
  - Nested timelines (sub-events)
- **UI Route:** `/worlds/[slug]/timeline`

**ChatGPT SDK Integration (Phase 4):**
- Tool: `view_timeline` - "Show me the timeline from Year 200-300"
- Widget: Fullscreen timeline

---

#### 9.3 Family Trees / Org Charts
**Phase:** Advanced (Phase 3)

**Description:**
Hierarchical visualizations for character lineages or faction structures.

**Pain Point Solved:**
Complex hierarchies are hard to understand textually. Visual trees clarify structure.

**How It Works:**
- **Use Cases:**
  - Character family trees (based on "parent" relationships)
  - Faction org charts (leadership hierarchies)
- **Library:** React Flow or D3 hierarchy layouts
- **Data Processing:**
  - Query relationships where `type = 'parent'` or `type = 'child'`
  - Build tree structure from flat relationship data
  - Layout algorithm (Dagre, Elkjs)
- **Features:**
  - Expand/collapse nodes
  - Click to view entity details
  - Export as PNG/SVG
- **UI:** Accessible from character/faction detail pages

**ChatGPT SDK Integration (Phase 4):**
- Tool: `view_family_tree` - "Show the royal lineage"
- Widget: Tree visualization

---

#### 9.4 Statistics & Analytics
**Phase:** Advanced (Phase 3)

**Description:**
Dashboard showing world metrics (entity counts, activity trends, completeness scores).

**Pain Point Solved:**
Creators want to track progress and identify gaps. Analytics provide actionable insights.

**How It Works:**
- **Metrics:**
  - Entity counts by type (pie chart)
  - Activity over time (line chart of create/update events)
  - Completeness scores (% of fields filled per entity)
  - Top contributors (in shared worlds)
  - Most connected entities (relationship degree)
  - Orphaned entities (no relationships)
- **Library:** Recharts or Chart.js
- **Data:** Aggregation queries with Prisma
- **UI Route:** `/worlds/[slug]/analytics`

**ChatGPT SDK Integration (Phase 4):**
- Tool: `get_analytics` - "How complete is my world?"
- Widget: Stats dashboard

---

### 10. ChatGPT Apps SDK Integration

#### 10.1 MCP Server Implementation
**Phase:** ChatGPT Integration (Phase 4)

**Description:**
Expose WorldCrafter as an MCP server with tools for all core operations.

**Pain Point Solved:**
Switching between ChatGPT and web app breaks flow. MCP integration enables conversational worldbuilding without context switching.

**How It Works:**
- **Endpoint:** `/api/mcp` (Next.js API route)
- **Transport:** JSON-RPC 2.0 over HTTPS with streaming support
- **Tools Exposed:**
  ```json
  {
    "tools": [
      "create_world",
      "get_world",
      "update_world",
      "create_character",
      "get_character",
      "update_character",
      "create_location",
      "get_location",
      "add_relationship",
      "search_world",
      "get_world_summary",
      "export_world",
      "suggest_ideas"
    ]
  }
  ```
- **Tool Schemas:** Convert Zod schemas to JSON Schema
- **Output Templates:** Link tools to widget URIs
  ```json
  {
    "_meta": {
      "openai/outputTemplate": "ui://widget/character-sheet.html"
    }
  }
  ```
- **Implementation:**
  - Create MCP handler functions that wrap existing Server Actions
  - Token validation via Supabase Auth
  - Error handling with proper JSON-RPC error codes

**Technical Requirements:**
- OAuth 2.1 with PKCE (Supabase as authorization server)
- Protected resource metadata at `/.well-known/oauth-protected-resource`
- CORS headers for `https://chatgpt.com`
- Streaming support for long-running operations

---

#### 10.2 Conversational UI Widgets
**Phase:** ChatGPT Integration (Phase 4)

**Description:**
React components rendered in ChatGPT with `window.openai` integration.

**Pain Point Solved:**
Text-only output is limiting. Rich widgets show complex data (maps, character sheets) in familiar formats.

**How It Works:**
- **Widget Types:**
  - **Inline Cards:**
    - Character card (name, image, quick stats)
    - Location card (map thumbnail, description)
    - World summary card
  - **Picture-in-Picture:**
    - Character sheet (full stats, live updates)
    - Relationship graph (interactive)
  - **Fullscreen:**
    - World dashboard (full feature set)
    - Map explorer
    - Timeline viewer
- **Development:**
  - Create React components in `/src/widgets/`
  - Bundle with Vite (single ESM file per widget)
  - Serve from `/api/widgets/[widgetName].html`
  - Use `window.openai` API for state/messaging
- **State Management:**
  ```typescript
  // Persist data visible to ChatGPT
  window.openai.setWidgetState({
    worldId: 'xyz',
    currentEntity: 'character-123'
  })

  // Call tools from widget
  window.openai.callTool('update_character', {
    id: 'character-123',
    updates: { backstory: newBackstory }
  })

  // Send follow-up messages
  window.openai.sendFollowUpMessage('Tell me more about this character')
  ```

---

#### 10.3 OAuth Authorization Flow
**Phase:** ChatGPT Integration (Phase 4)

**Description:**
Secure user authentication for ChatGPT to access private WorldCrafter data.

**Pain Point Solved:**
Users shouldn't trust ChatGPT with passwords. OAuth provides secure delegated access.

**How It Works:**
- **Authorization Server:** Supabase Auth configured for OAuth 2.1
- **Endpoints Required:**
  1. `/.well-known/oauth-protected-resource` - Metadata
     ```json
     {
       "resource": "https://worldcrafter.app",
       "authorization_servers": ["https://auth.supabase.co"],
       "scopes_supported": [
         "worlds:read",
         "worlds:write",
         "worlds:share"
       ]
     }
     ```
  2. Authorization endpoint (Supabase hosted)
  3. Token endpoint (Supabase hosted)
  4. JWKS endpoint for signature verification

- **Dynamic Client Registration:**
  - ChatGPT registers on-the-fly
  - Short-lived client credentials
  - PKCE for security

- **Scope Definitions:**
  - `worlds:read` - View worlds and entities
  - `worlds:write` - Create/update entities
  - `worlds:share` - Manage sharing/permissions

- **Token Validation:** Verify JWT on every MCP request
  ```typescript
  async function validateToken(req: Request) {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error) return null
    return user
  }
  ```

---

#### 10.4 Conversational UX Patterns
**Phase:** ChatGPT Integration (Phase 4)

**Description:**
Optimized prompts and workflows for natural worldbuilding conversations.

**Pain Point Solved:**
Bad conversation design leads to frustration. Thoughtful UX makes AI feel helpful, not confusing.

**How It Works:**
- **Conversation Flows:**

  **Example 1: Quick Character Creation**
  ```
  User: "Create a wise old wizard named Aldrin"
  ChatGPT: [Calls create_character tool]
  Widget: Character card appears
  ChatGPT: "I've created Aldrin, a wise wizard. Would you like to add backstory, relationships, or place him in a location?"
  User: "He lives in the Crystal Tower"
  ChatGPT: [Searches for location "Crystal Tower", adds relationship]
  ```

  **Example 2: World Exploration**
  ```
  User: "Show me all my fantasy worlds"
  ChatGPT: [Calls get_worlds with genre filter]
  Widget: Grid of world cards
  ChatGPT: "You have 3 fantasy worlds: Eldoria, Shadowrealm, and Dragonfell. Which would you like to explore?"
  User: "Eldoria"
  ChatGPT: [Calls get_world_summary for Eldoria]
  Widget: World dashboard in fullscreen
  ```

  **Example 3: AI-Assisted Brainstorming**
  ```
  User: "I need a villain for my story"
  ChatGPT: "I can help create a compelling villain. A few questions:
  - What genre is your world?
  - What should they oppose (protagonist? kingdom? ideology)?
  - Any specific traits you want?"
  User: "Fantasy, opposes the kingdom, should be sympathetic"
  ChatGPT: [Generates character with GPT-4, calls create_character]
  Widget: Character card with generated content
  ChatGPT: "Here's Seraphine, a fallen noble seeking to reclaim her family's honor. Want to adjust anything?"
  ```

- **Design Principles:**
  - Always confirm before creating entities (show preview)
  - Offer next steps after each action
  - Use widgets for complex data, text for conversation
  - Gracefully handle ambiguity ("Did you mean location X or character X?")
  - Surface errors clearly ("I couldn't create that character because the name is already used")

---

## Database Schema Summary

Complete Prisma schema additions needed for all features:

```prisma
// ... existing User and World models ...

model Character {
  id            String   @id @default(cuid())
  worldId       String
  name          String   @db.VarChar(100)
  slug          String
  role          String?  @db.VarChar(50)
  species       String?  @db.VarChar(50)
  age           String?  @db.VarChar(20)
  appearance    String?  @db.Text
  personality   String?  @db.Text
  backstory     String?  @db.Text
  goals         String?  @db.Text
  fears         String?  @db.Text
  attributes    Json?
  imageUrl      String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  world         World    @relation(fields: [worldId], references: [id], onDelete: Cascade)
  relationships Relationship[] @relation("CharacterRelationships")
  comments      Comment[]

  @@unique([worldId, slug])
  @@map("characters")
}

model Location {
  id          String   @id @default(cuid())
  worldId     String
  name        String   @db.VarChar(100)
  slug        String
  type        String?  @db.VarChar(50)
  parentId    String?
  description String?  @db.Text
  geography   String?  @db.Text
  climate     String?  @db.VarChar(100)
  population  String?  @db.VarChar(50)
  government  String?  @db.VarChar(100)
  economy     String?  @db.Text
  culture     String?  @db.Text
  coordinates Json?
  attributes  Json?
  imageUrl    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  world       World     @relation(fields: [worldId], references: [id], onDelete: Cascade)
  parent      Location? @relation("LocationHierarchy", fields: [parentId], references: [id])
  children    Location[] @relation("LocationHierarchy")
  events      Event[]
  comments    Comment[]

  @@unique([worldId, slug])
  @@map("locations")
}

model Event {
  id           String   @id @default(cuid())
  worldId      String
  name         String   @db.VarChar(150)
  slug         String
  date         String?  @db.VarChar(100)
  description  String?  @db.Text
  significance String?  @db.Text
  type         String?  @db.VarChar(50)
  locationId   String?
  participants Json?
  attributes   Json?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  world        World     @relation(fields: [worldId], references: [id], onDelete: Cascade)
  location     Location? @relation(fields: [locationId], references: [id])
  comments     Comment[]

  @@unique([worldId, slug])
  @@map("events")
}

model Item {
  id           String   @id @default(cuid())
  worldId      String
  name         String   @db.VarChar(100)
  slug         String
  type         String?  @db.VarChar(50)
  rarity       String?  @db.VarChar(30)
  description  String?  @db.Text
  properties   String?  @db.Text
  history      String?  @db.Text
  currentOwner String?
  location     String?
  attributes   Json?
  imageUrl     String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  world        World    @relation(fields: [worldId], references: [id], onDelete: Cascade)
  comments     Comment[]

  @@unique([worldId, slug])
  @@map("items")
}

model Faction {
  id           String   @id @default(cuid())
  worldId      String
  name         String   @db.VarChar(100)
  slug         String
  type         String?  @db.VarChar(50)
  description  String?  @db.Text
  goals        String?  @db.Text
  structure    String?  @db.Text
  headquarters String?
  leadership   Json?
  members      Json?
  allies       Json?
  enemies      Json?
  attributes   Json?
  imageUrl     String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  world        World    @relation(fields: [worldId], references: [id], onDelete: Cascade)
  comments     Comment[]

  @@unique([worldId, slug])
  @@map("factions")
}

model Relationship {
  id            String     @id @default(cuid())
  worldId       String
  sourceType    EntityType
  sourceId      String
  targetType    EntityType
  targetId      String
  type          String     @db.VarChar(50)
  description   String?    @db.Text
  strength      Int?       @default(5)
  isDirectional Boolean    @default(false)
  attributes    Json?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  world         World      @relation(fields: [worldId], references: [id], onDelete: Cascade)

  @@unique([worldId, sourceType, sourceId, targetType, targetId, type])
  @@index([sourceType, sourceId])
  @@index([targetType, targetId])
  @@map("relationships")
}

model Tag {
  id          String      @id @default(cuid())
  worldId     String
  name        String      @db.VarChar(50)
  color       String?     @db.VarChar(7)
  createdAt   DateTime    @default(now())

  world       World       @relation(fields: [worldId], references: [id], onDelete: Cascade)
  characters  Character[]
  locations   Location[]
  events      Event[]
  items       Item[]
  factions    Faction[]

  @@unique([worldId, name])
  @@map("tags")
}

model Collection {
  id          String   @id @default(cuid())
  worldId     String
  name        String   @db.VarChar(100)
  description String?  @db.Text
  items       Json
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  world       World    @relation(fields: [worldId], references: [id], onDelete: Cascade)

  @@map("collections")
}

model Page {
  id          String   @id @default(cuid())
  worldId     String
  title       String   @db.VarChar(150)
  slug        String
  content     String   @db.Text
  parentId    String?
  attributes  Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  world       World    @relation(fields: [worldId], references: [id], onDelete: Cascade)
  parent      Page?    @relation("PageHierarchy", fields: [parentId], references: [id])
  children    Page[]   @relation("PageHierarchy")

  @@unique([worldId, slug])
  @@map("pages")
}

model Comment {
  id         String     @id @default(cuid())
  worldId    String
  entityType EntityType
  entityId   String
  userId     String     @db.Uuid
  content    String     @db.Text
  parentId   String?
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt

  world      World      @relation(fields: [worldId], references: [id], onDelete: Cascade)
  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  parent     Comment?   @relation("CommentThread", fields: [parentId], references: [id])
  replies    Comment[]  @relation("CommentThread")

  @@index([entityType, entityId])
  @@map("comments")
}

model WorldMember {
  id        String     @id @default(cuid())
  worldId   String
  userId    String     @db.Uuid
  role      MemberRole
  invitedBy String     @db.Uuid
  invitedAt DateTime   @default(now())

  world     World      @relation(fields: [worldId], references: [id], onDelete: Cascade)
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  inviter   User       @relation("Invites", fields: [invitedBy], references: [id])

  @@unique([worldId, userId])
  @@map("world_members")
}

model WorldVersion {
  id         String   @id @default(cuid())
  worldId    String
  versionNum Int
  name       String
  snapshot   Json
  createdAt  DateTime @default(now())

  world      World    @relation(fields: [worldId], references: [id], onDelete: Cascade)

  @@unique([worldId, versionNum])
  @@map("world_versions")
}

model Activity {
  id         String     @id @default(cuid())
  worldId    String
  userId     String     @db.Uuid
  entityType EntityType
  entityId   String
  action     String     @db.VarChar(20) // "created", "updated", "deleted"
  metadata   Json?
  createdAt  DateTime   @default(now())

  world      World      @relation(fields: [worldId], references: [id], onDelete: Cascade)
  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([worldId, createdAt])
  @@map("activities")
}

model EntityTemplate {
  id         String     @id @default(cuid())
  userId     String     @db.Uuid
  name       String
  entityType EntityType
  fields     Json
  isPublic   Boolean    @default(false)
  createdAt  DateTime   @default(now())

  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("entity_templates")
}

model Bookmark {
  id        String   @id @default(cuid())
  userId    String   @db.Uuid
  worldId   String
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  world     World    @relation(fields: [worldId], references: [id], onDelete: Cascade)

  @@unique([userId, worldId])
  @@map("bookmarks")
}

enum EntityType {
  CHARACTER
  LOCATION
  EVENT
  ITEM
  FACTION
  PAGE
}

enum MemberRole {
  VIEWER
  COMMENTER
  EDITOR
  ADMIN
}

enum Genre {
  FANTASY
  SCIFI
  MODERN
  HISTORICAL
  HORROR
  CUSTOM
}

enum Privacy {
  PRIVATE
  UNLISTED
  PUBLIC
}
```

---

## Development Roadmap

### Phase 1: MVP (Weeks 1-4)
**Goal:** Prove core value proposition

- [ ] World creation & editing
- [ ] Location management
- [ ] World dashboard
- [ ] Global search
- [ ] Basic RLS policies
- [ ] Deployment to production

**Success Criteria:** Users can create worlds and locations, find them easily

---

### Phase 2: Core Features (Weeks 5-10)
**Goal:** Feature parity with basic worldbuilding tools

- [ ] Character creation & profiles
- [ ] Event timeline
- [ ] Item/artifact database
- [ ] Faction/organization system
- [ ] Entity relationships
- [ ] Tags & categories
- [ ] Export to JSON/Markdown
- [ ] World sharing & permissions
- [ ] Comments & discussions
- [ ] Genre templates

**Success Criteria:** Users can build complete worlds with all entity types and share with collaborators

---

### Phase 3: Advanced Features (Weeks 11-16)
**Goal:** Competitive differentiation

- [ ] AI entity generation
- [ ] AI relationship suggestions
- [ ] Lore consistency checker
- [ ] AI writing prompts
- [ ] World versioning
- [ ] Folders & collections
- [ ] Notes & wiki pages
- [ ] Custom entity templates
- [ ] Import from other formats
- [ ] Public world gallery
- [ ] API access
- [ ] Interactive world maps
- [ ] Timeline visualization
- [ ] Family trees / org charts
- [ ] Statistics & analytics
- [ ] Obsidian plugin (separate repo)

**Success Criteria:** Power users adopt WorldCrafter as primary tool, citing unique AI features

---

### Phase 4: ChatGPT Integration (Weeks 17-20)
**Goal:** Future-forward conversational interface

- [ ] MCP server implementation
- [ ] OAuth authorization flow
- [ ] Conversational UI widgets (inline, PiP, fullscreen)
- [ ] Widget bundling pipeline
- [ ] ChatGPT Apps SDK submission
- [ ] Real-time collaboration (Supabase Realtime)
- [ ] Game engine integration (Unity/Unreal)

**Success Criteria:** Users discover WorldCrafter via ChatGPT, build worlds conversationally

---

## Success Metrics

### User Engagement
- Monthly Active Users (MAU)
- Worlds created per user
- Average session duration
- Entities created per world
- Collaboration rate (% of worlds with >1 member)

### Feature Adoption
- % of users using each feature
- AI generation usage rate
- Export/import usage
- ChatGPT integration DAU (Phase 4)

### Quality
- Bug reports per release
- Consistency checker error detection rate
- User satisfaction score (NPS)

### Growth
- User acquisition channels
- Retention rate (D1, D7, D30)
- Viral coefficient (invites sent → signups)

---

## Technical Stack Compatibility Notes

### Next.js 16 + App Router
- ✅ Server Components for data fetching
- ✅ Server Actions for mutations
- ✅ Dynamic routes with parallel routes for modals
- ✅ Streaming for large data sets
- ⚠️ ChatGPT widgets run client-side (bundle separately from RSC)

### Supabase
- ✅ PostgreSQL with Prisma ORM
- ✅ Auth as OAuth authorization server
- ✅ Storage for images/files
- ✅ Realtime for collaboration (Phase 4)
- ✅ Edge Functions for email/webhooks

### Prisma
- ✅ Type-safe queries
- ✅ Migrations for schema evolution
- ✅ RLS via raw SQL
- ⚠️ JSON fields for flexible attributes (validate with Zod)

### React 19
- ✅ Server Components
- ✅ Actions for forms
- ✅ Suspense boundaries for loading states
- ✅ Error boundaries for error handling

### TanStack Query
- ✅ Client-side data fetching in widgets
- ✅ Optimistic updates for realtime feel
- ✅ Cache invalidation after mutations

### Zod
- ✅ Form validation (client + server)
- ✅ Convert to JSON Schema for ChatGPT tools
- ✅ Type inference for TypeScript

### ChatGPT Apps SDK
- ✅ MCP server via Next.js API routes
- ✅ OAuth via Supabase Auth
- ✅ Widgets via Vite bundling
- ⚠️ CORS configuration required
- ⚠️ Asset prefix configuration for iframe

---

## Conclusion

WorldCrafter is positioned to be a **comprehensive, AI-enhanced, multi-genre worldbuilding platform** that serves writers, game masters, developers, and hobbyists. The phased roadmap ensures:

1. **Quick MVP validation** (Phase 1) proves core value
2. **Feature completeness** (Phase 2) achieves market fit
3. **Differentiation** (Phase 3) via AI and advanced tools
4. **Future-forward innovation** (Phase 4) with ChatGPT integration

The current tech stack (Next.js 16, Supabase, Prisma, React 19) is ideally suited for all features, and the standalone-first approach ensures the app delivers value immediately while positioning for ChatGPT Apps SDK integration as a future multiplier.

**Next Steps:** Approve this feature spec, then begin Phase 1 implementation with database schema creation and MVP features.
