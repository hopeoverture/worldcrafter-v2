# WorldCrafter Complete Schema Reference

This document contains the complete database schema patterns for the WorldCrafter application based on the PRD requirements. Use these patterns when implementing core WorldCrafter features.

## Table of Contents

1. [Core Entity Types](#core-entity-types)
2. [Polymorphic Relationships](#polymorphic-relationships)
3. [Tags System](#tags-system)
4. [Comments System](#comments-system)
5. [Activity Logging](#activity-logging)
6. [World Versioning](#world-versioning)
7. [World Membership](#world-membership)
8. [Collections](#collections)
9. [Wiki Pages](#wiki-pages)
10. [Bookmarks](#bookmarks)
11. [Privacy Levels](#privacy-levels)
12. [Complete Example Schema](#complete-example-schema)

---

## Core Entity Types

WorldCrafter has multiple entity types that can be related to each other. Define this enum for use across the schema:

```prisma
enum EntityType {
  WORLD
  CHARACTER
  LOCATION
  ITEM
  EVENT
  FACTION
  CONCEPT
  NOTE
}
```

This enum is used in polymorphic relationships to identify which type of entity is being referenced.

---

## Polymorphic Relationships

Polymorphic relationships allow entities to be connected to any other entity type with additional metadata.

### Key Features
- Bidirectional (source and target)
- Typed with EntityType enum
- Relationship strength (1-10)
- Custom relationship type names

### Prisma Schema

```prisma
enum EntityType {
  WORLD
  CHARACTER
  LOCATION
  ITEM
  EVENT
  FACTION
  CONCEPT
  NOTE
}

model Relationship {
  id          String     @id @default(cuid())

  // Source entity (polymorphic)
  sourceType  EntityType @map("source_type")
  sourceId    String     @map("source_id")

  // Target entity (polymorphic)
  targetType  EntityType @map("target_type")
  targetId    String     @map("target_id")

  // Relationship metadata
  type        String     // e.g., "allies", "enemy", "located_in", "owns"
  strength    Int        @default(5) // 1-10 scale
  description String?    @db.Text

  // World context
  worldId     String     @map("world_id")
  createdBy   String     @map("created_by")

  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")

  world World @relation(fields: [worldId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [createdBy], references: [id], onDelete: Cascade)

  // Indexes for performance
  @@index([worldId])
  @@index([sourceType, sourceId])
  @@index([targetType, targetId])
  @@index([createdBy])

  // Ensure unique relationships
  @@unique([sourceType, sourceId, targetType, targetId, type])

  @@map("relationships")
}
```

### Usage Example

```typescript
// Create a relationship: Character "John" is allies with Character "Sarah"
await prisma.relationship.create({
  data: {
    sourceType: 'CHARACTER',
    sourceId: 'character-john-id',
    targetType: 'CHARACTER',
    targetId: 'character-sarah-id',
    type: 'allies',
    strength: 8,
    description: 'Fought together in the Battle of Winterfell',
    worldId: 'world-id',
    createdBy: userId,
  },
});

// Query all relationships for a character
const relationships = await prisma.relationship.findMany({
  where: {
    OR: [
      { sourceType: 'CHARACTER', sourceId: characterId },
      { targetType: 'CHARACTER', targetId: characterId },
    ],
  },
});
```

---

## Tags System

Tags provide a flexible way to categorize and organize entities across the application.

### Key Features
- Reusable tags across entity types
- Polymorphic EntityTag join table
- Auto-generated slugs
- Color coding for visual organization

### Prisma Schema

```prisma
model Tag {
  id          String      @id @default(cuid())
  name        String
  slug        String      @unique
  description String?     @db.Text
  color       String?     // Hex color code, e.g., "#FF5733"
  worldId     String      @map("world_id")
  createdBy   String      @map("created_by")
  createdAt   DateTime    @default(now()) @map("created_at")

  world       World       @relation(fields: [worldId], references: [id], onDelete: Cascade)
  user        User        @relation(fields: [createdBy], references: [id], onDelete: Cascade)
  entityTags  EntityTag[]

  @@unique([worldId, slug])
  @@index([worldId])
  @@index([createdBy])
  @@map("tags")
}

model EntityTag {
  id         String     @id @default(cuid())

  // Polymorphic entity reference
  entityType EntityType @map("entity_type")
  entityId   String     @map("entity_id")

  tagId      String     @map("tag_id")
  createdAt  DateTime   @default(now()) @map("created_at")

  tag Tag @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@unique([entityType, entityId, tagId])
  @@index([entityType, entityId])
  @@index([tagId])
  @@map("entity_tags")
}
```

### Usage Example

```typescript
// Create a tag
const tag = await prisma.tag.create({
  data: {
    name: 'Magic',
    slug: 'magic',
    color: '#9333ea',
    worldId: worldId,
    createdBy: userId,
  },
});

// Tag a character
await prisma.entityTag.create({
  data: {
    entityType: 'CHARACTER',
    entityId: characterId,
    tagId: tag.id,
  },
});

// Find all characters with "Magic" tag
const magicCharacters = await prisma.entityTag.findMany({
  where: {
    entityType: 'CHARACTER',
    tag: { slug: 'magic' },
  },
  include: {
    tag: true,
  },
});
```

---

## Comments System

Threaded comments with support for nested replies.

### Key Features
- Hierarchical structure with parentId
- Polymorphic entity attachment
- Threaded replies
- Soft delete support (optional)

### Prisma Schema

```prisma
model Comment {
  id          String      @id @default(cuid())
  content     String      @db.Text

  // Polymorphic entity reference
  entityType  EntityType  @map("entity_type")
  entityId    String      @map("entity_id")

  // Hierarchical structure
  parentId    String?     @map("parent_id")

  worldId     String      @map("world_id")
  authorId    String      @map("author_id")

  // Soft delete
  isDeleted   Boolean     @default(false) @map("is_deleted")
  deletedAt   DateTime?   @map("deleted_at")

  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")

  // Relations
  world    World     @relation(fields: [worldId], references: [id], onDelete: Cascade)
  author   User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  parent   Comment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies  Comment[] @relation("CommentReplies")

  @@index([entityType, entityId])
  @@index([worldId])
  @@index([authorId])
  @@index([parentId])
  @@map("comments")
}
```

### Usage Example

```typescript
// Create a top-level comment
const comment = await prisma.comment.create({
  data: {
    content: 'This character is really interesting!',
    entityType: 'CHARACTER',
    entityId: characterId,
    worldId: worldId,
    authorId: userId,
  },
});

// Create a reply
await prisma.comment.create({
  data: {
    content: 'I agree! The backstory is compelling.',
    entityType: 'CHARACTER',
    entityId: characterId,
    parentId: comment.id,
    worldId: worldId,
    authorId: anotherUserId,
  },
});

// Get all comments with replies
const comments = await prisma.comment.findMany({
  where: {
    entityType: 'CHARACTER',
    entityId: characterId,
    parentId: null, // Top-level only
    isDeleted: false,
  },
  include: {
    author: true,
    replies: {
      include: {
        author: true,
      },
    },
  },
  orderBy: { createdAt: 'desc' },
});
```

---

## Activity Logging

Track all CRUD operations for audit trails and activity feeds.

### Key Features
- Tracks create, update, delete actions
- Polymorphic entity tracking
- Captures old/new values as JSON
- User attribution

### Prisma Schema

```prisma
enum ActivityAction {
  CREATE
  UPDATE
  DELETE
  ARCHIVE
  RESTORE
}

model ActivityLog {
  id          String         @id @default(cuid())

  action      ActivityAction

  // Polymorphic entity reference
  entityType  EntityType     @map("entity_type")
  entityId    String         @map("entity_id")
  entityName  String?        @map("entity_name") // Denormalized for display

  // Changes tracking
  oldValues   Json?          @map("old_values") // Previous state
  newValues   Json?          @map("new_values") // New state

  worldId     String         @map("world_id")
  userId      String         @map("user_id")

  createdAt   DateTime       @default(now()) @map("created_at")

  world World @relation(fields: [worldId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([worldId])
  @@index([entityType, entityId])
  @@index([userId])
  @@index([createdAt(sort: Desc)])
  @@map("activity_logs")
}
```

### Usage Example

```typescript
// Log character creation
await prisma.activityLog.create({
  data: {
    action: 'CREATE',
    entityType: 'CHARACTER',
    entityId: character.id,
    entityName: character.name,
    newValues: character, // Entire character object
    worldId: worldId,
    userId: userId,
  },
});

// Log character update
await prisma.activityLog.create({
  data: {
    action: 'UPDATE',
    entityType: 'CHARACTER',
    entityId: character.id,
    entityName: character.name,
    oldValues: oldCharacter,
    newValues: updatedCharacter,
    worldId: worldId,
    userId: userId,
  },
});

// Get recent activity for a world
const recentActivity = await prisma.activityLog.findMany({
  where: { worldId },
  include: { user: true },
  orderBy: { createdAt: 'desc' },
  take: 50,
});
```

---

## World Versioning

Snapshot system for tracking world state over time.

### Key Features
- JSON snapshots of entire world state
- Named versions (e.g., "v1.0", "Before the war")
- Restore capability
- Automatic and manual versioning

### Prisma Schema

```prisma
model WorldVersion {
  id          String   @id @default(cuid())
  worldId     String   @map("world_id")
  version     String   // e.g., "v1.0", "2024-01-15"
  name        String?  // e.g., "Before the Great War"
  description String?  @db.Text

  // Snapshot data (entire world state as JSON)
  snapshot    Json

  createdBy   String   @map("created_by")
  createdAt   DateTime @default(now()) @map("created_at")

  world World @relation(fields: [worldId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [createdBy], references: [id], onDelete: Cascade)

  @@index([worldId])
  @@index([createdBy])
  @@index([createdAt(sort: Desc)])
  @@map("world_versions")
}
```

### Usage Example

```typescript
// Create a version snapshot
const snapshot = {
  characters: await prisma.character.findMany({ where: { worldId } }),
  locations: await prisma.location.findMany({ where: { worldId } }),
  // ... other entities
};

await prisma.worldVersion.create({
  data: {
    worldId: worldId,
    version: 'v1.0',
    name: 'Initial Release',
    description: 'First complete version of the world',
    snapshot: snapshot,
    createdBy: userId,
  },
});

// List all versions
const versions = await prisma.worldVersion.findMany({
  where: { worldId },
  orderBy: { createdAt: 'desc' },
  select: {
    id: true,
    version: true,
    name: true,
    createdAt: true,
    user: { select: { name: true } },
  },
});

// Restore from version
const version = await prisma.worldVersion.findUnique({
  where: { id: versionId },
});
// Use version.snapshot to restore entities
```

---

## World Membership

Collaborative world building with role-based permissions.

### Key Features
- 5 role types with escalating permissions
- Per-world membership
- Invitation system support
- Role hierarchy: Viewer < Commenter < Editor < Admin < Owner

### Prisma Schema

```prisma
enum MemberRole {
  VIEWER      // Can only view
  COMMENTER   // Can view and comment
  EDITOR      // Can view, comment, and edit
  ADMIN       // Can manage members and settings
  OWNER       // Full control
}

model WorldMember {
  id        String     @id @default(cuid())
  worldId   String     @map("world_id")
  userId    String     @map("user_id")
  role      MemberRole @default(VIEWER)

  // Invitation tracking
  invitedBy String?    @map("invited_by")
  invitedAt DateTime?  @map("invited_at")
  joinedAt  DateTime   @default(now()) @map("joined_at")

  createdAt DateTime   @default(now()) @map("created_at")
  updatedAt DateTime   @updatedAt @map("updated_at")

  world     World @relation(fields: [worldId], references: [id], onDelete: Cascade)
  user      User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  inviter   User? @relation("MemberInvitations", fields: [invitedBy], references: [id], onDelete: SetNull)

  @@unique([worldId, userId])
  @@index([worldId])
  @@index([userId])
  @@index([role])
  @@map("world_members")
}
```

### Usage Example

```typescript
// Add a member to a world
await prisma.worldMember.create({
  data: {
    worldId: worldId,
    userId: newUserId,
    role: 'EDITOR',
    invitedBy: currentUserId,
    invitedAt: new Date(),
  },
});

// Update member role
await prisma.worldMember.update({
  where: {
    worldId_userId: {
      worldId: worldId,
      userId: userId,
    },
  },
  data: {
    role: 'ADMIN',
  },
});

// Get all members of a world
const members = await prisma.worldMember.findMany({
  where: { worldId },
  include: {
    user: {
      select: { id: true, name: true, email: true },
    },
    inviter: {
      select: { name: true },
    },
  },
  orderBy: [
    { role: 'asc' }, // Owners first
    { joinedAt: 'asc' },
  ],
});

// Check if user has permission
const member = await prisma.worldMember.findUnique({
  where: {
    worldId_userId: { worldId, userId },
  },
});
const canEdit = ['EDITOR', 'ADMIN', 'OWNER'].includes(member?.role);
```

---

## Collections

Curated groups of entities with custom ordering.

### Key Features
- JSON array of entity references
- Custom ordering
- Privacy settings
- Mixed entity types

### Prisma Schema

```prisma
enum Privacy {
  PRIVATE   // Only visible to creator
  UNLISTED  // Visible with direct link
  PUBLIC    // Visible to all
}

model Collection {
  id          String   @id @default(cuid())
  name        String
  description String?  @db.Text

  // Array of items: [{ type: 'CHARACTER', id: 'xyz' }, ...]
  items       Json     @default("[]")

  worldId     String   @map("world_id")
  createdBy   String   @map("created_by")
  privacy     Privacy  @default(PRIVATE)

  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  world World @relation(fields: [worldId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [createdBy], references: [id], onDelete: Cascade)

  @@index([worldId])
  @@index([createdBy])
  @@index([privacy])
  @@map("collections")
}
```

### Usage Example

```typescript
// Create a collection
const collection = await prisma.collection.create({
  data: {
    name: 'Main Characters',
    description: 'The primary protagonists of the story',
    items: [
      { type: 'CHARACTER', id: 'char-1' },
      { type: 'CHARACTER', id: 'char-2' },
      { type: 'CHARACTER', id: 'char-3' },
    ],
    worldId: worldId,
    createdBy: userId,
    privacy: 'PUBLIC',
  },
});

// Add item to collection
const currentItems = collection.items as Array<{ type: string; id: string }>;
await prisma.collection.update({
  where: { id: collection.id },
  data: {
    items: [...currentItems, { type: 'CHARACTER', id: 'char-4' }],
  },
});

// Reorder items
await prisma.collection.update({
  where: { id: collection.id },
  data: {
    items: reorderedItems,
  },
});
```

---

## Wiki Pages

Hierarchical documentation system for world lore.

### Key Features
- Hierarchical structure with parentId
- Markdown content
- Tree navigation
- Privacy controls

### Prisma Schema

```prisma
model WikiPage {
  id          String     @id @default(cuid())
  title       String
  slug        String
  content     String     @db.Text // Markdown

  // Hierarchical structure
  parentId    String?    @map("parent_id")
  order       Int        @default(0) // For sibling ordering

  worldId     String     @map("world_id")
  createdBy   String     @map("created_by")
  privacy     Privacy    @default(PRIVATE)

  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")

  world    World      @relation(fields: [worldId], references: [id], onDelete: Cascade)
  user     User       @relation(fields: [createdBy], references: [id], onDelete: Cascade)
  parent   WikiPage?  @relation("WikiPageHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children WikiPage[] @relation("WikiPageHierarchy")

  @@unique([worldId, slug])
  @@index([worldId])
  @@index([parentId])
  @@index([createdBy])
  @@map("wiki_pages")
}
```

### Usage Example

```typescript
// Create a root page
const rootPage = await prisma.wikiPage.create({
  data: {
    title: 'Magic System',
    slug: 'magic-system',
    content: '# Magic System\n\nOverview of how magic works...',
    worldId: worldId,
    createdBy: userId,
    privacy: 'PUBLIC',
  },
});

// Create a child page
await prisma.wikiPage.create({
  data: {
    title: 'Fire Magic',
    slug: 'fire-magic',
    content: '# Fire Magic\n\nDetails about fire spells...',
    parentId: rootPage.id,
    order: 1,
    worldId: worldId,
    createdBy: userId,
    privacy: 'PUBLIC',
  },
});

// Get page hierarchy
const pages = await prisma.wikiPage.findMany({
  where: { worldId, parentId: null },
  include: {
    children: {
      orderBy: { order: 'asc' },
      include: {
        children: true, // One more level
      },
    },
  },
  orderBy: { order: 'asc' },
});
```

---

## Bookmarks

Quick access to favorite entities.

### Key Features
- Polymorphic entity bookmarking
- Per-user favorites
- Custom notes

### Prisma Schema

```prisma
model Bookmark {
  id          String     @id @default(cuid())

  // Polymorphic entity reference
  entityType  EntityType @map("entity_type")
  entityId    String     @map("entity_id")

  userId      String     @map("user_id")
  notes       String?    @db.Text // Optional user notes

  createdAt   DateTime   @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, entityType, entityId])
  @@index([userId])
  @@index([entityType, entityId])
  @@map("bookmarks")
}
```

### Usage Example

```typescript
// Bookmark a character
await prisma.bookmark.create({
  data: {
    entityType: 'CHARACTER',
    entityId: characterId,
    userId: userId,
    notes: 'My favorite character - revisit for campaign',
  },
});

// Get all user bookmarks
const bookmarks = await prisma.bookmark.findMany({
  where: { userId },
  orderBy: { createdAt: 'desc' },
});

// Remove bookmark
await prisma.bookmark.delete({
  where: {
    userId_entityType_entityId: {
      userId: userId,
      entityType: 'CHARACTER',
      entityId: characterId,
    },
  },
});
```

---

## Privacy Levels

Privacy enum used across multiple tables:

```prisma
enum Privacy {
  PRIVATE   // Only visible to creator (and world members with permission)
  UNLISTED  // Visible to anyone with the direct link
  PUBLIC    // Publicly visible and searchable
}
```

### Usage

Apply to any entity that needs visibility control:

```prisma
model World {
  id      String  @id @default(cuid())
  name    String
  privacy Privacy @default(PRIVATE)
  // ...
}

model Character {
  id      String  @id @default(cuid())
  name    String
  privacy Privacy @default(PRIVATE)
  // ...
}
```

---

## Complete Example Schema

Here's how all these patterns come together in a complete Prisma schema:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ============================================================================
// ENUMS
// ============================================================================

enum EntityType {
  WORLD
  CHARACTER
  LOCATION
  ITEM
  EVENT
  FACTION
  CONCEPT
  NOTE
}

enum Privacy {
  PRIVATE
  UNLISTED
  PUBLIC
}

enum MemberRole {
  VIEWER
  COMMENTER
  EDITOR
  ADMIN
  OWNER
}

enum ActivityAction {
  CREATE
  UPDATE
  DELETE
  ARCHIVE
  RESTORE
}

// ============================================================================
// USER MODEL (from Supabase Auth)
// ============================================================================

model User {
  id        String   @id @db.Uuid // Supabase auth.users(id)
  email     String   @unique
  name      String?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  worlds           World[]
  characters       Character[]
  locations        Location[]
  items            Item[]
  relationships    Relationship[]
  tags             Tag[]
  comments         Comment[]
  activityLogs     ActivityLog[]
  worldVersions    WorldVersion[]
  worldMemberships WorldMember[]
  invitedMembers   WorldMember[] @relation("MemberInvitations")
  collections      Collection[]
  wikiPages        WikiPage[]
  bookmarks        Bookmark[]

  @@map("users")
}

// ============================================================================
// WORLD MODEL
// ============================================================================

model World {
  id          String   @id @default(cuid())
  name        String
  description String?  @db.Text
  privacy     Privacy  @default(PRIVATE)
  createdBy   String   @map("created_by")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [createdBy], references: [id], onDelete: Cascade)

  // Relations
  characters    Character[]
  locations     Location[]
  items         Item[]
  relationships Relationship[]
  tags          Tag[]
  comments      Comment[]
  activityLogs  ActivityLog[]
  versions      WorldVersion[]
  members       WorldMember[]
  collections   Collection[]
  wikiPages     WikiPage[]

  @@index([createdBy])
  @@index([privacy])
  @@map("worlds")
}

// ============================================================================
// CORE ENTITY MODELS
// ============================================================================

model Character {
  id          String   @id @default(cuid())
  name        String
  description String?  @db.Text
  privacy     Privacy  @default(PRIVATE)
  worldId     String   @map("world_id")
  createdBy   String   @map("created_by")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  world World @relation(fields: [worldId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [createdBy], references: [id], onDelete: Cascade)

  @@index([worldId])
  @@index([createdBy])
  @@index([privacy])
  @@map("characters")
}

model Location {
  id          String   @id @default(cuid())
  name        String
  description String?  @db.Text
  privacy     Privacy  @default(PRIVATE)
  worldId     String   @map("world_id")
  createdBy   String   @map("created_by")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  world World @relation(fields: [worldId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [createdBy], references: [id], onDelete: Cascade)

  @@index([worldId])
  @@index([createdBy])
  @@index([privacy])
  @@map("locations")
}

model Item {
  id          String   @id @default(cuid())
  name        String
  description String?  @db.Text
  privacy     Privacy  @default(PRIVATE)
  worldId     String   @map("world_id")
  createdBy   String   @map("created_by")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  world World @relation(fields: [worldId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [createdBy], references: [id], onDelete: Cascade)

  @@index([worldId])
  @@index([createdBy])
  @@index([privacy])
  @@map("items")
}

// ============================================================================
// POLYMORPHIC RELATIONSHIPS
// ============================================================================

model Relationship {
  id          String     @id @default(cuid())
  sourceType  EntityType @map("source_type")
  sourceId    String     @map("source_id")
  targetType  EntityType @map("target_type")
  targetId    String     @map("target_id")
  type        String
  strength    Int        @default(5)
  description String?    @db.Text
  worldId     String     @map("world_id")
  createdBy   String     @map("created_by")
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")

  world World @relation(fields: [worldId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [createdBy], references: [id], onDelete: Cascade)

  @@unique([sourceType, sourceId, targetType, targetId, type])
  @@index([worldId])
  @@index([sourceType, sourceId])
  @@index([targetType, targetId])
  @@index([createdBy])
  @@map("relationships")
}

// ============================================================================
// TAGS SYSTEM
// ============================================================================

model Tag {
  id          String      @id @default(cuid())
  name        String
  slug        String
  description String?     @db.Text
  color       String?
  worldId     String      @map("world_id")
  createdBy   String      @map("created_by")
  createdAt   DateTime    @default(now()) @map("created_at")

  world      World       @relation(fields: [worldId], references: [id], onDelete: Cascade)
  user       User        @relation(fields: [createdBy], references: [id], onDelete: Cascade)
  entityTags EntityTag[]

  @@unique([worldId, slug])
  @@index([worldId])
  @@index([createdBy])
  @@map("tags")
}

model EntityTag {
  id         String     @id @default(cuid())
  entityType EntityType @map("entity_type")
  entityId   String     @map("entity_id")
  tagId      String     @map("tag_id")
  createdAt  DateTime   @default(now()) @map("created_at")

  tag Tag @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@unique([entityType, entityId, tagId])
  @@index([entityType, entityId])
  @@index([tagId])
  @@map("entity_tags")
}

// ============================================================================
// COMMENTS SYSTEM
// ============================================================================

model Comment {
  id         String      @id @default(cuid())
  content    String      @db.Text
  entityType EntityType  @map("entity_type")
  entityId   String      @map("entity_id")
  parentId   String?     @map("parent_id")
  worldId    String      @map("world_id")
  authorId   String      @map("author_id")
  isDeleted  Boolean     @default(false) @map("is_deleted")
  deletedAt  DateTime?   @map("deleted_at")
  createdAt  DateTime    @default(now()) @map("created_at")
  updatedAt  DateTime    @updatedAt @map("updated_at")

  world   World     @relation(fields: [worldId], references: [id], onDelete: Cascade)
  author  User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  parent  Comment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies Comment[] @relation("CommentReplies")

  @@index([entityType, entityId])
  @@index([worldId])
  @@index([authorId])
  @@index([parentId])
  @@map("comments")
}

// ============================================================================
// ACTIVITY LOGGING
// ============================================================================

model ActivityLog {
  id         String         @id @default(cuid())
  action     ActivityAction
  entityType EntityType     @map("entity_type")
  entityId   String         @map("entity_id")
  entityName String?        @map("entity_name")
  oldValues  Json?          @map("old_values")
  newValues  Json?          @map("new_values")
  worldId    String         @map("world_id")
  userId     String         @map("user_id")
  createdAt  DateTime       @default(now()) @map("created_at")

  world World @relation(fields: [worldId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([worldId])
  @@index([entityType, entityId])
  @@index([userId])
  @@index([createdAt(sort: Desc)])
  @@map("activity_logs")
}

// ============================================================================
// WORLD VERSIONING
// ============================================================================

model WorldVersion {
  id          String   @id @default(cuid())
  worldId     String   @map("world_id")
  version     String
  name        String?
  description String?  @db.Text
  snapshot    Json
  createdBy   String   @map("created_by")
  createdAt   DateTime @default(now()) @map("created_at")

  world World @relation(fields: [worldId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [createdBy], references: [id], onDelete: Cascade)

  @@index([worldId])
  @@index([createdBy])
  @@index([createdAt(sort: Desc)])
  @@map("world_versions")
}

// ============================================================================
// WORLD MEMBERSHIP
// ============================================================================

model WorldMember {
  id        String     @id @default(cuid())
  worldId   String     @map("world_id")
  userId    String     @map("user_id")
  role      MemberRole @default(VIEWER)
  invitedBy String?    @map("invited_by")
  invitedAt DateTime?  @map("invited_at")
  joinedAt  DateTime   @default(now()) @map("joined_at")
  createdAt DateTime   @default(now()) @map("created_at")
  updatedAt DateTime   @updatedAt @map("updated_at")

  world   World @relation(fields: [worldId], references: [id], onDelete: Cascade)
  user    User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  inviter User? @relation("MemberInvitations", fields: [invitedBy], references: [id], onDelete: SetNull)

  @@unique([worldId, userId])
  @@index([worldId])
  @@index([userId])
  @@index([role])
  @@map("world_members")
}

// ============================================================================
// COLLECTIONS
// ============================================================================

model Collection {
  id          String   @id @default(cuid())
  name        String
  description String?  @db.Text
  items       Json     @default("[]")
  worldId     String   @map("world_id")
  createdBy   String   @map("created_by")
  privacy     Privacy  @default(PRIVATE)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  world World @relation(fields: [worldId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [createdBy], references: [id], onDelete: Cascade)

  @@index([worldId])
  @@index([createdBy])
  @@index([privacy])
  @@map("collections")
}

// ============================================================================
// WIKI PAGES
// ============================================================================

model WikiPage {
  id        String     @id @default(cuid())
  title     String
  slug      String
  content   String     @db.Text
  parentId  String?    @map("parent_id")
  order     Int        @default(0)
  worldId   String     @map("world_id")
  createdBy String     @map("created_by")
  privacy   Privacy    @default(PRIVATE)
  createdAt DateTime   @default(now()) @map("created_at")
  updatedAt DateTime   @updatedAt @map("updated_at")

  world    World      @relation(fields: [worldId], references: [id], onDelete: Cascade)
  user     User       @relation(fields: [createdBy], references: [id], onDelete: Cascade)
  parent   WikiPage?  @relation("WikiPageHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children WikiPage[] @relation("WikiPageHierarchy")

  @@unique([worldId, slug])
  @@index([worldId])
  @@index([parentId])
  @@index([createdBy])
  @@map("wiki_pages")
}

// ============================================================================
// BOOKMARKS
// ============================================================================

model Bookmark {
  id         String     @id @default(cuid())
  entityType EntityType @map("entity_type")
  entityId   String     @map("entity_id")
  userId     String     @map("user_id")
  notes      String?    @db.Text
  createdAt  DateTime   @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, entityType, entityId])
  @@index([userId])
  @@index([entityType, entityId])
  @@map("bookmarks")
}
```

---

## Migration Strategy

When implementing these tables, follow this order to avoid foreign key issues:

1. **Enums first**: EntityType, Privacy, MemberRole, ActivityAction
2. **Core tables**: User (if not exists), World
3. **Entity tables**: Character, Location, Item
4. **Join tables**: Relationship, Tag, EntityTag
5. **Supporting tables**: Comment, ActivityLog, WorldVersion, WorldMember
6. **Feature tables**: Collection, WikiPage, Bookmark

### Example Migration Sequence

```bash
# 1. Create enums and core tables
npx prisma migrate dev --name add_core_schema

# 2. Add entity tables
npx prisma migrate dev --name add_entity_tables

# 3. Add relationship system
npx prisma migrate dev --name add_relationships

# 4. Add tagging system
npx prisma migrate dev --name add_tags_system

# 5. Add comments
npx prisma migrate dev --name add_comments

# 6. Add activity logging
npx prisma migrate dev --name add_activity_logs

# 7. Add versioning
npx prisma migrate dev --name add_world_versions

# 8. Add membership
npx prisma migrate dev --name add_world_members

# 9. Add collections
npx prisma migrate dev --name add_collections

# 10. Add wiki pages
npx prisma migrate dev --name add_wiki_pages

# 11. Add bookmarks
npx prisma migrate dev --name add_bookmarks

# 12. Apply RLS policies for all tables
npm run db:rls
```

---

## Best Practices

1. **Always include worldId**: Most entities belong to a world for data isolation
2. **Use composite indexes**: For polymorphic queries (entityType + entityId)
3. **Denormalize when needed**: Store entityName in ActivityLog for display
4. **Plan RLS policies**: Every table with user data needs RLS
5. **Use JSON wisely**: Good for snapshots and flexible arrays, avoid for searchable data
6. **Test cascade deletes**: Ensure deleting a world properly cleans up all related data
7. **Version snapshots**: Don't store entire DB, only what's needed for restore
8. **Index foreign keys**: Critical for join performance
9. **Consider soft deletes**: For comments and important data
10. **Use transactions**: When creating entities with relationships or tags
