# Prisma Schema Patterns for WorldCrafter

This document contains detailed Prisma schema patterns and best practices for WorldCrafter.

## Naming Conventions

### Models
- **Model name**: PascalCase (e.g., `User`, `BlogPost`, `CommentReply`)
- **Table name**: snake_case using `@@map("table_name")`

```prisma
model BlogPost {
  // fields...
  @@map("blog_posts")
}
```

### Fields
- **Field name**: camelCase in model (e.g., `createdAt`, `authorId`)
- **Column name**: snake_case using `@map("column_name")`

```prisma
model BlogPost {
  createdAt DateTime @default(now()) @map("created_at")
  authorId  String   @map("author_id")
}
```

## Standard Fields

Every model should include these standard fields:

```prisma
model YourModel {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("your_models")
}
```

### Field Explanations

- `id`: Primary key using CUID (Collision-resistant Unique ID)
- `createdAt`: Auto-set timestamp when record is created
- `updatedAt`: Auto-updated timestamp when record changes
- `@@map`: Maps model to snake_case table name

## Field Types

### Strings

```prisma
// Basic string
name String

// With validation (enforced at database level)
email String @unique

// Limited length (not enforced by Prisma, use Zod for validation)
title String

// Text for long content
content String @db.Text

// Optional string
bio String?
```

### Numbers

```prisma
// Integer
age Int

// Float
price Float

// With default
count Int @default(0)

// Optional
score Int?
```

### Booleans

```prisma
// Boolean with default
isPublished Boolean @default(false)
isActive    Boolean @default(true)

// Optional boolean
isVerified Boolean?
```

### Dates

```prisma
// Auto-set on creation
createdAt DateTime @default(now())

// Auto-updated on changes
updatedAt DateTime @updatedAt

// Manual date field
publishedAt DateTime?

// Date only (no time)
birthDate DateTime @db.Date
```

### JSON

```prisma
// JSON field for flexible data
metadata Json?

// Example usage:
// metadata: { theme: "dark", notifications: true }
```

### Enums

```prisma
enum UserRole {
  USER
  ADMIN
  MODERATOR
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model User {
  id   String   @id @default(cuid())
  role UserRole @default(USER)
}

model Post {
  id     String     @id @default(cuid())
  status PostStatus @default(DRAFT)
}
```

## Relationships

### One-to-Many (User has many Posts)

```prisma
model User {
  id    String     @id
  email String     @unique
  posts BlogPost[] // Relation field (not in database)

  @@map("users")
}

model BlogPost {
  id       String @id @default(cuid())
  title    String
  authorId String @map("author_id") // Foreign key

  // Relation: this post belongs to one user
  author User @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@map("blog_posts")
}
```

**Key points:**
- `posts BlogPost[]` is a relation field (not in database)
- `authorId` is the actual foreign key column
- `onDelete: Cascade` means deleting user deletes their posts

### One-to-One (User has one Profile)

```prisma
model User {
  id      String   @id
  email   String   @unique
  profile Profile? // Optional relation

  @@map("users")
}

model Profile {
  id     String @id @default(cuid())
  bio    String?
  userId String @unique @map("user_id") // Must be unique for 1-to-1

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("profiles")
}
```

**Key points:**
- `@unique` on foreign key enforces one-to-one
- Both sides can have optional relation

### Many-to-Many (Posts have many Tags, Tags have many Posts)

**Implicit Many-to-Many** (Prisma manages junction table):
```prisma
model Post {
  id   String @id @default(cuid())
  tags Tag[]

  @@map("posts")
}

model Tag {
  id    String @id @default(cuid())
  name  String @unique
  posts Post[]

  @@map("tags")
}
```

**Explicit Many-to-Many** (You control junction table - recommended):
```prisma
model Post {
  id       String    @id @default(cuid())
  title    String
  postTags PostTag[]

  @@map("posts")
}

model Tag {
  id       String    @id @default(cuid())
  name     String    @unique
  postTags PostTag[]

  @@map("tags")
}

// Junction table with extra fields
model PostTag {
  postId    String   @map("post_id")
  tagId     String   @map("tag_id")
  createdAt DateTime @default(now()) @map("created_at")

  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag  Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([postId, tagId]) // Composite primary key
  @@map("post_tags")
}
```

### Self-Relations (Comments with Replies)

```prisma
model Comment {
  id        String    @id @default(cuid())
  content   String
  parentId  String?   @map("parent_id") // null = top-level comment

  // Self-referencing relations
  parent   Comment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies  Comment[] @relation("CommentReplies")

  @@map("comments")
}
```

## Constraints

### Unique Constraints

```prisma
model User {
  id    String @id @default(cuid())
  email String @unique // Single field unique

  @@map("users")
}

// Composite unique constraint
model Follow {
  followerId String @map("follower_id")
  followedId String @map("followed_id")

  // User can only follow another user once
  @@unique([followerId, followedId])
  @@map("follows")
}
```

### Indexes

```prisma
model BlogPost {
  id        String   @id @default(cuid())
  title     String
  authorId  String   @map("author_id")
  published Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")

  author User @relation(fields: [authorId], references: [id])

  // Single field index
  @@index([authorId])

  // Composite index for common query
  @@index([authorId, published])

  // Index for sorting
  @@index([createdAt(sort: Desc)])

  @@map("blog_posts")
}
```

### Check Constraints (PostgreSQL)

```prisma
model Product {
  id    String @id @default(cuid())
  price Float

  // Price must be positive
  @@check("price_positive", sql: "price > 0")

  @@map("products")
}
```

## onDelete Behaviors

Controls what happens when referenced record is deleted:

```prisma
model BlogPost {
  id       String @id @default(cuid())
  authorId String @map("author_id")

  // CASCADE: Delete posts when user is deleted
  author User @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@map("blog_posts")
}
```

**Available options:**
- `Cascade` - Delete related records (use for owned data)
- `SetNull` - Set foreign key to null (requires optional field)
- `Restrict` - Prevent deletion if references exist
- `NoAction` - Database default (usually Restrict)
- `SetDefault` - Set to default value

**Choosing the right behavior:**
- `Cascade`: User → Posts, Post → Comments (owned data)
- `SetNull`: Post → Category (optional relationship)
- `Restrict`: Category → Posts (prevent deleting category with posts)

## Default Values

```prisma
model User {
  id        String   @id @default(cuid())
  role      UserRole @default(USER)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  points    Int      @default(0)

  @@map("users")
}
```

## Computed Fields (Using `@map`)

Sometimes you need to transform data:

```prisma
model User {
  id        String @id @default(cuid())
  firstName String @map("first_name")
  lastName  String @map("last_name")

  // In application code:
  // const fullName = `${user.firstName} ${user.lastName}`

  @@map("users")
}
```

## Complete Example

```prisma
// User model
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String
  role      UserRole  @default(USER)
  isActive  Boolean   @default(true)
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")

  // Relations
  profile  Profile?
  posts    BlogPost[]
  comments Comment[]

  @@index([email])
  @@map("users")
}

// Profile model (one-to-one)
model Profile {
  id        String   @id @default(cuid())
  bio       String?  @db.Text
  avatarUrl String?  @map("avatar_url")
  userId    String   @unique @map("user_id")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("profiles")
}

// Blog post model (one-to-many)
model BlogPost {
  id          String      @id @default(cuid())
  title       String
  content     String      @db.Text
  excerpt     String?
  published   Boolean     @default(false)
  publishedAt DateTime?   @map("published_at")
  authorId    String      @map("author_id")
  categoryId  String?     @map("category_id")
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")

  // Relations
  author   User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  category Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  comments Comment[]
  postTags PostTag[]

  @@index([authorId])
  @@index([categoryId])
  @@index([published, publishedAt(sort: Desc)])
  @@map("blog_posts")
}

// Category model
model Category {
  id        String     @id @default(cuid())
  name      String     @unique
  slug      String     @unique
  posts     BlogPost[]
  createdAt DateTime   @default(now()) @map("created_at")

  @@map("categories")
}

// Comment model (self-referencing)
model Comment {
  id        String    @id @default(cuid())
  content   String    @db.Text
  authorId  String    @map("author_id")
  postId    String    @map("post_id")
  parentId  String?   @map("parent_id")
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")

  // Relations
  author  User       @relation(fields: [authorId], references: [id], onDelete: Cascade)
  post    BlogPost   @relation(fields: [postId], references: [id], onDelete: Cascade)
  parent  Comment?   @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies Comment[]  @relation("CommentReplies")

  @@index([postId])
  @@index([authorId])
  @@map("comments")
}

// Tag model (many-to-many)
model Tag {
  id        String    @id @default(cuid())
  name      String    @unique
  slug      String    @unique
  postTags  PostTag[]
  createdAt DateTime  @default(now()) @map("created_at")

  @@map("tags")
}

// Junction table for many-to-many
model PostTag {
  postId String @map("post_id")
  tagId  String @map("tag_id")

  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag  Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([postId, tagId])
  @@map("post_tags")
}

// Enum definitions
enum UserRole {
  USER
  ADMIN
  MODERATOR
}
```

## Best Practices

1. **Always use `@@map` for table names** (snake_case)
2. **Always use `@map` for field names** (snake_case in DB)
3. **Include standard fields** (id, createdAt, updatedAt)
4. **Add indexes** for foreign keys and frequently queried fields
5. **Choose appropriate `onDelete` behavior** for relationships
6. **Use enums** for fixed sets of values
7. **Document complex relationships** with comments
8. **Validate data** with Zod schemas (Prisma doesn't validate)
9. **Use `@unique`** for fields that must be unique (email, slug, etc.)
10. **Test migrations** on dev database before production
