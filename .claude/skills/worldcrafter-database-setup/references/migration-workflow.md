# Database Migration Workflow for WorldCrafter

This document describes the complete workflow for creating and managing database migrations in WorldCrafter.

## Migration Types

WorldCrafter supports two migration workflows:

### 1. Development Workflow (`db push`)
- **Command**: `npx prisma db push`
- **Use case**: Rapid prototyping, local development
- **Pros**: Fast, no migration files
- **Cons**: No history, not suitable for production

### 2. Production Workflow (`migrate`)
- **Command**: `npx prisma migrate dev`
- **Use case**: Production deployments, team collaboration
- **Pros**: Version control, rollback capability, audit trail
- **Cons**: Slightly slower

**Recommendation**: Use `migrate` workflow for all features that will be deployed.

## Standard Migration Workflow

### Step 1: Update Prisma Schema

Edit `prisma/schema.prisma` to add your changes:

```prisma
model BlogPost {
  id        String   @id @default(cuid())
  title     String
  content   String   @db.Text
  published Boolean  @default(false)
  authorId  String   @map("author_id")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  author User @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@map("blog_posts")
}
```

### Step 2: Validate Schema

```bash
npx prisma validate
```

This checks for syntax errors and relationship issues before creating migration.

### Step 3: Create Migration

```bash
npx prisma migrate dev --name add_blog_posts_table
```

**What this does:**
1. Creates migration file in `prisma/migrations/<timestamp>_add_blog_posts_table/`
2. Applies migration to development database
3. Regenerates Prisma Client with new types
4. Updates `_prisma_migrations` table

**Migration naming conventions:**
- `add_<table>_table` - New table
- `add_<field>_to_<table>` - New field
- `update_<table>_<change>` - Modify existing table
- `add_<table>_indexes` - Add indexes
- `add_<table>_rls` - Add RLS policies

### Step 4: Review Generated Migration

Check `prisma/migrations/<timestamp>_add_blog_posts_table/migration.sql`:

```sql
-- CreateTable
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "author_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "blog_posts_author_id_idx" ON "blog_posts"("author_id");

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_fkey"
  FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

**Verify:**
- Table name is correct (snake_case)
- Column names are correct (snake_case)
- Constraints are appropriate
- Indexes are created

### Step 5: Add RLS Policies (if needed)

Create separate migration for RLS:

```bash
# Create empty migration
npx prisma migrate dev --name add_blog_posts_rls --create-only
```

Edit the generated migration file to add RLS policies:

```sql
-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read published posts
CREATE POLICY "Anyone can read published posts"
  ON public.blog_posts
  FOR SELECT
  USING (published = true);

-- Authors can read own drafts
CREATE POLICY "Authors can read own drafts"
  ON public.blog_posts
  FOR SELECT
  USING (auth.uid() = author_id);

-- Authenticated users can create posts
CREATE POLICY "Authenticated users can create posts"
  ON public.blog_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- Authors can update own posts
CREATE POLICY "Authors can update own posts"
  ON public.blog_posts
  FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Authors can delete own posts
CREATE POLICY "Authors can delete own posts"
  ON public.blog_posts
  FOR DELETE
  USING (auth.uid() = author_id);
```

Apply the migration:

```bash
npx prisma migrate dev
```

Or use the script:

```bash
npm run db:rls
```

### Step 6: Sync to Test Database

```bash
npm run db:test:sync
```

This ensures integration tests run against the latest schema.

### Step 7: Verify Changes

**1. Check Prisma Studio:**
```bash
npx prisma studio
```

**2. Test TypeScript types:**
```typescript
import { prisma } from '@/lib/prisma'

// Should have type completion
const posts = await prisma.blogPost.findMany({
  include: {
    author: true
  }
})
```

**3. Run tests:**
```bash
npm test
npm run test:e2e
```

### Step 8: Commit Migration Files

```bash
git add prisma/schema.prisma
git add prisma/migrations
git commit -m "Add blog posts table with RLS policies"
```

**Important**: Always commit migration files to version control.

## Common Migration Scenarios

### Adding a New Table

```bash
# 1. Update schema.prisma
# 2. Create migration
npx prisma migrate dev --name add_comments_table

# 3. Add RLS (if needed)
npx prisma migrate dev --name add_comments_rls --create-only
# Edit migration file, then:
npx prisma migrate dev
```

### Adding a Field

```bash
# 1. Add field to schema.prisma
# 2. Create migration
npx prisma migrate dev --name add_excerpt_to_blog_posts

# Migration will be generated automatically
```

### Adding a Relationship

```bash
# 1. Add relation field to both models in schema.prisma
# 2. Create migration
npx prisma migrate dev --name add_blog_post_category_relation
```

### Modifying a Field

```bash
# 1. Update field in schema.prisma
# 2. Create migration
npx prisma migrate dev --name update_blog_post_content_to_text

# Example: Change String to Text
# content String       ->  content String @db.Text
```

### Adding Indexes

```bash
# 1. Add @@index to model in schema.prisma
# 2. Create migration
npx prisma migrate dev --name add_blog_posts_indexes
```

### Renaming a Field

**Careful**: Prisma treats renames as drop + create, which loses data!

```bash
# 1. Rename field in schema.prisma
# 2. Create migration with --create-only
npx prisma migrate dev --name rename_content_to_body --create-only

# 3. Edit migration to use ALTER COLUMN instead:
# ❌ Generated (loses data):
# ALTER TABLE "blog_posts" DROP COLUMN "content";
# ALTER TABLE "blog_posts" ADD COLUMN "body" TEXT;

# ✅ Fixed (preserves data):
# ALTER TABLE "blog_posts" RENAME COLUMN "content" TO "body";

# 4. Apply migration
npx prisma migrate dev
```

### Adding Enum

```bash
# 1. Add enum to schema.prisma
# 2. Create migration
npx prisma migrate dev --name add_user_role_enum
```

## Migration Strategies

### Development to Production

**Development:**
```bash
npx prisma migrate dev --name your_migration
```

**Staging:**
```bash
npx prisma migrate deploy
```

**Production:**
```bash
npx prisma migrate deploy
```

**Never use `migrate dev` in production!** It can drop data.

### Working in a Team

**Before starting work:**
```bash
git pull
npx prisma migrate dev  # Apply team's migrations
```

**After creating migration:**
```bash
git add prisma/migrations
git commit -m "Add migration: your_change"
git push
```

**Team member pulls changes:**
```bash
git pull
npx prisma migrate dev  # Applies new migrations
```

### Handling Migration Conflicts

If two developers create migrations simultaneously:

1. **Pull latest changes:**
   ```bash
   git pull
   ```

2. **Resolve conflicts** in `schema.prisma`

3. **Create new migration** that combines both changes:
   ```bash
   npx prisma migrate dev --name merge_migrations
   ```

4. **Delete conflicting migration files** if needed

## Rollback Strategies

### Undo Last Migration (Development Only)

```bash
# Reset to previous migration
npx prisma migrate reset

# Re-apply all migrations except the last one
# Manually delete the last migration folder
npx prisma migrate dev
```

**Warning**: This drops all data!

### Rollback in Production

Create a new "down" migration that reverses changes:

```bash
npx prisma migrate dev --name rollback_blog_posts --create-only
```

Edit to reverse changes:

```sql
-- Drop table
DROP TABLE IF EXISTS "blog_posts";

-- Remove enum (if added)
DROP TYPE IF EXISTS "UserRole";

-- Remove column (if added)
ALTER TABLE "users" DROP COLUMN IF EXISTS "bio";
```

## Database Connection Strings

WorldCrafter uses two connection strings:

### DATABASE_URL (Port 6543 - Transaction Pooler)

```env
DATABASE_URL="postgresql://user:pass@host:6543/db?pgbouncer=true"
```

**Use for:**
- Application queries
- Prisma Client queries
- Most database operations

**Connection pooling**: PgBouncer manages connections efficiently.

### DIRECT_DATABASE_URL (Port 5432 - Direct Connection)

```env
DIRECT_DATABASE_URL="postgresql://user:pass@host:5432/db"
```

**Use for:**
- Migrations (`prisma migrate`)
- Schema changes
- Database management tasks

**Why needed**: PgBouncer doesn't support some migration commands.

## Migration Best Practices

### 1. Use Descriptive Names

```bash
# ✅ Good
npx prisma migrate dev --name add_blog_posts_table
npx prisma migrate dev --name add_published_at_to_posts
npx prisma migrate dev --name add_posts_author_index

# ❌ Bad
npx prisma migrate dev --name update
npx prisma migrate dev --name fix
npx prisma migrate dev --name migration1
```

### 2. One Logical Change Per Migration

```bash
# ✅ Good: Separate migrations
npx prisma migrate dev --name add_comments_table
npx prisma migrate dev --name add_comments_rls

# ❌ Bad: Too many changes in one migration
npx prisma migrate dev --name add_everything
```

### 3. Test Before Committing

```bash
# Run tests
npm test
npm run test:e2e

# Check types
npm run build

# Review migration SQL
cat prisma/migrations/*/migration.sql
```

### 4. Keep Migrations Small

Small migrations are easier to:
- Review
- Debug
- Rollback
- Understand

### 5. Document Complex Migrations

Add comments to migration SQL:

```sql
-- Add blog_posts table
-- This table stores user-generated blog content
-- Related to users table via author_id foreign key

CREATE TABLE "blog_posts" (
  ...
);
```

### 6. Always Review Generated SQL

Prisma sometimes generates unexpected SQL. Always review before applying.

### 7. Backup Before Major Migrations

```bash
# Create database backup (production)
pg_dump DATABASE_URL > backup_$(date +%Y%m%d).sql

# Test migration on staging first
```

### 8. Use Transactions

Migrations are transactional by default in PostgreSQL. If one statement fails, all rollback.

### 9. Test RLS Policies

```typescript
// In integration tests
test('RLS prevents unauthorized access', async () => {
  // Test with different users
})
```

### 10. Version Control Everything

```bash
git add prisma/schema.prisma
git add prisma/migrations/
git commit -m "Descriptive commit message"
```

## Troubleshooting Migrations

### Migration Fails to Apply

**Check:**
1. Database connection string
2. Migration SQL syntax
3. Existing data constraints
4. Foreign key relationships

**Fix:**
```bash
# View error details
npx prisma migrate dev

# Reset and start over (development only)
npx prisma migrate reset
```

### Prisma Client Out of Sync

```bash
# Regenerate client
npx prisma generate

# Restart TypeScript server in IDE
```

### Migration Applied but Types Wrong

```bash
# Regenerate client
npx prisma generate

# Restart dev server
npm run dev
```

### Can't Drop Column with Data

```sql
-- ❌ This will fail if column has data
ALTER TABLE "users" DROP COLUMN "old_field";

-- ✅ Better: Make optional first
ALTER TABLE "users" ALTER COLUMN "old_field" DROP NOT NULL;
-- Then remove in next migration after data migration
```

### Foreign Key Constraint Violations

```sql
-- Check for orphaned records
SELECT * FROM child_table
WHERE parent_id NOT IN (SELECT id FROM parent_table);

-- Fix by removing orphaned records or adding missing parents
```

## Migration Checklist

Before committing a migration:

- [ ] Schema changes reviewed
- [ ] Migration SQL reviewed
- [ ] Descriptive migration name
- [ ] RLS policies added (if needed)
- [ ] Test database synced
- [ ] Integration tests pass
- [ ] Type checking passes (`npm run build`)
- [ ] Migration files committed to git
- [ ] Team notified (if breaking changes)

## Emergency Procedures

### Rollback Production Migration

1. **Stop deployments**
2. **Create rollback migration:**
   ```bash
   npx prisma migrate dev --name rollback_feature --create-only
   ```
3. **Test rollback on staging**
4. **Apply to production:**
   ```bash
   npx prisma migrate deploy
   ```
5. **Verify application works**

### Corrupt Migration State

```bash
# Reset migration state (development only)
npx prisma migrate reset

# Re-apply all migrations
npx prisma migrate dev
```

**Production**: Contact database administrator.

## Resources

- [Prisma Migrate Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Supabase Database Guide](https://supabase.com/docs/guides/database)
- WorldCrafter docs: `docs/RLS_SETUP.md`
- WorldCrafter docs: `SUPABASE_SETUP.md`
