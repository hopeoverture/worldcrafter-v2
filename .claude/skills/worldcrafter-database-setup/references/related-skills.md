# Related Skills - WorldCrafter Database Setup

This skill is the foundation for data-driven features. It's typically used FIRST before other skills.

## Why Database-Setup Comes First

In the WorldCrafter stack:
```
Data Layer (this skill) → Business Logic (feature-builder) → Security (auth-guard) → Quality (test-generator)
```

The database schema defines:
- What data can be stored (Prisma models)
- Who can access it (RLS policies)
- How it relates (foreign keys)
- Data integrity rules (constraints)

## Skill Orchestration Patterns

### Pattern 1: Complete Feature from Scratch

```
User: "Build a blog with posts and comments"

1. worldcrafter-database-setup (this skill):
   - BlogPost model (id, title, content, authorId)
   - Comment model (id, content, postId, authorId)
   - RLS: users can CRUD own posts/comments

2. worldcrafter-feature-builder:
   - /posts page with form
   - /posts/[id] with comments
   - Server Actions for CRUD

3. worldcrafter-auth-guard:
   - Protect /posts/new
   - Auth checks in Server Actions
```

### Pattern 2: Data Model Only (No UI Yet)

```
User: "Set up database for storing user activity logs"

1. worldcrafter-database-setup (this skill):
   - ActivityLog model
   - RLS: users can read own logs, admins see all
   - Migration

(UI built later when needed)
```

### Pattern 3: Extending Existing Features

```
User: "Add tags to blog posts"

1. worldcrafter-database-setup (this skill):
   - Tag model
   - PostTag junction table (many-to-many)
   - RLS policies

2. Update existing blog UI:
   - worldcrafter-feature-builder: Add tag selection to post form
```

## Integration with Other Skills

### → worldcrafter-feature-builder

**What database-setup provides:**
- Model names: `prisma.blogPost`
- Field names: `title`, `content`, `authorId`
- Types: `BlogPost`, `BlogPostCreateInput`

**How feature-builder uses it:**
```typescript
// Server Action (created by feature-builder)
import { prisma } from '@/lib/prisma'

export async function createPost(data) {
  // Uses BlogPost model from database-setup
  const post = await prisma.blogPost.create({ data })
  return post
}
```

### → worldcrafter-auth-guard

**What database-setup provides:**
- RLS policy patterns
- User ownership fields (`authorId`, `userId`)
- Database-level security baseline

**How auth-guard enhances it:**
```typescript
// Database-setup creates RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can read own posts"
  ON posts USING (auth.uid() = author_id);

// Auth-guard adds application-level checks
export async function deletePost(id) {
  const { user } = await getUser()
  if (!user) return { error: 'Unauthorized' }

  // RLS will also prevent unauthorized access
  await prisma.post.delete({ where: { id } })
}
```

### → worldcrafter-test-generator

**What database-setup provides:**
- Test data structure
- RLS policies to test
- Migration to verify

**How test-generator uses it:**
```typescript
// Integration test (created by test-generator)
test('RLS prevents reading other users posts', async () => {
  const user1Post = await prisma.post.create({
    data: { authorId: 'user1', title: 'Post 1' }
  })

  // Try to read as user2
  // RLS should block this
  const result = await getPost(user1Post.id, 'user2')
  expect(result).toBeNull()
})
```

## When NOT to Use Database-Setup

Skip this skill if:

**Simple pages without data:**
```
User: "Add an about us page"
→ Use worldcrafter-route-creator only (no database needed)
```

**Authentication setup only:**
```
User: "Protect my existing routes"
→ Use worldcrafter-auth-guard only (database already exists)
```

**Testing existing features:**
```
User: "Add tests for my blog feature"
→ Use worldcrafter-test-generator only (database already set up)
```

## Common Mistakes

### Mistake 1: Skipping Database-Setup

```
❌ Wrong:
User: "Build a blog feature"
1. worldcrafter-feature-builder creates form
2. Realizes database is needed
3. Goes back to add database

✅ Correct:
1. worldcrafter-database-setup creates BlogPost model
2. worldcrafter-feature-builder builds UI using the model
```

### Mistake 2: Building UI Before Schema

```
❌ Wrong:
Create form → realize you need different fields → update database → update form

✅ Correct:
Design database schema → build form matching schema → less rework
```

### Mistake 3: Forgetting RLS

```
❌ Wrong:
Create table → skip RLS → data is publicly accessible

✅ Correct:
Create table → set up RLS policies → data is protected from day one
```

## Decision Matrix

| User Request | Use Database-Setup? | Why |
|-------------|-------------------|-----|
| "Create a blog feature" | YES (first) | Feature needs data storage |
| "Add a table for posts" | YES | Explicitly asks for table |
| "Store user preferences" | YES | Implies database storage |
| "Build a contact form" | MAYBE | Depends if storing in DB or just emailing |
| "Add an about page" | NO | Static content, no database |
| "Protect my routes" | NO | Auth only, database exists |
| "Add tests" | NO | Tests only, database exists |

## Best Practices

1. **Design Schema First**
   - Understand data requirements before building UI
   - Prevents rework and schema changes later

2. **Enable RLS Immediately**
   - Security should be built-in, not added later
   - Database-level protection is second layer of defense

3. **Use Migrations**
   - Don't use `db push` in production
   - Migrations provide history and rollback ability

4. **Sync Test Database**
   - Always run `npm run db:test:sync` after schema changes
   - Ensures integration tests use correct schema

5. **Document Relationships**
   - Add comments to complex relationships in schema
   - Makes handoff to feature-builder smoother
