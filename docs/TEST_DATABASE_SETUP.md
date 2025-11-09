# Test Database Setup Guide

This guide walks you through setting up a separate Supabase project for testing, allowing you to develop and test safely without affecting your production database.

## Why a Separate Test Database?

✅ **Benefits:**

- Test freely without risk to production data
- Run destructive tests (data deletion, schema changes)
- Parallel development (test new features without conflicts)
- Realistic integration testing with actual database
- CI/CD can run tests against real database

❌ **Don't share databases because:**

- Tests can corrupt production data
- RLS policies might not protect against test data pollution
- Performance impact from test operations
- Harder to reset/clean test data

---

## Step 1: Create a New Supabase Project for Testing

### 1.1 Create the Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Choose your organization
4. Fill in project details:
   - **Name:** `worldcrafter-test` (or similar)
   - **Database Password:** Generate a strong password (save it!)
   - **Region:** Same as your production database (for consistency)
   - **Pricing Plan:** Free tier is fine for testing
5. Click **"Create new project"**
6. Wait 2-3 minutes for the project to initialize

### 1.2 Get Your Test Database Credentials

Once the project is ready:

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon/public key** (the long JWT token)

3. Go to **Settings** → **Database** → **Connection String**
4. Select **URI** tab
5. Copy both connection strings:
   - **Transaction pooler** (port 6543) - for queries
   - **Session pooler** (port 5432) - for migrations
6. Replace `[YOUR-PASSWORD]` with your database password

---

## Step 2: Update `.env.test` with Test Database Credentials

Replace the placeholder values in `.env.test`:

```env
# Test Environment Variables
NODE_ENV=test

# Supabase Test Project Configuration
# IMPORTANT: These should point to your separate test project
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-TEST-PROJECT-ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-TEST-PROJECT-ANON-KEY-HERE

# Test Database Connection Strings
# Transaction pooler (port 6543) - Used for Prisma queries
DATABASE_URL="postgresql://postgres.YOUR-TEST-PROJECT-ID:[YOUR-PASSWORD]@aws-X-region.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Direct connection (port 5432) - Used for migrations and direct operations
DIRECT_DATABASE_URL="postgresql://postgres.YOUR-TEST-PROJECT-ID:[YOUR-PASSWORD]@aws-X-region.pooler.supabase.com:5432/postgres"
```

**Important:** Never commit `.env.test` with real credentials to version control!

---

## Step 3: Initialize Test Database Schema

Now that you have a separate test database, you need to apply your Prisma schema to it.

### 3.1 Push Schema to Test Database

```bash
npm run db:test:push
```

This command:

- Uses `.env.test` environment variables
- Pushes your Prisma schema to the test database
- Creates all tables and relationships

**Expected Output:**

```
Environment variables loaded from .env.test
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "postgres"

🚀  Your database is now in sync with your Prisma schema. Done in XXXms
```

### 3.2 Apply Row-Level Security Policies

Since RLS policies are custom SQL, you need to apply them separately:

**Option A: Using Supabase SQL Editor (Recommended)**

1. Go to your **test project** dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `prisma/migrations/sql/001_enable_rls.sql`
4. Paste and run in the SQL Editor
5. Verify policies were created

**Option B: Using the Script (Advanced)**

Temporarily update `.env` to point to test database, run RLS script, then restore:

```bash
# Backup your production .env
cp .env .env.backup

# Copy test credentials to .env temporarily
cp .env.test .env

# Apply RLS policies
npm run db:rls

# Restore production .env
mv .env.backup .env
```

### 3.3 Verify Test Database Setup

```bash
npm run db:test:seed
```

**Expected Output:**

```
🌱 Seeding test database...
Clearing existing data...
Creating test users...
✅ Created 2 test users
🌱 Test database seeded successfully!
```

---

## Step 4: Keeping Databases in Sync

As you develop, you'll make schema changes. Here's how to keep both databases updated:

### Strategy 1: Prisma Migrations (Recommended for Production)

**When you're ready to create a migration:**

1. **Develop locally** (uses production database):

   ```bash
   npm run db:migrate
   # Enter migration name, e.g., "add_worlds_table"
   ```

2. **Apply to test database:**

   ```bash
   npm run db:test:push
   ```

3. **If you added SQL migrations (RLS, triggers, etc.):**
   - Apply them to test database via SQL Editor

### Strategy 2: Schema Push (Faster for Development)

**For rapid prototyping:**

1. **Update** `prisma/schema.prisma`

2. **Push to development database:**

   ```bash
   npm run db:push
   ```

3. **Push to test database:**
   ```bash
   npm run db:test:push
   ```

**Note:** This doesn't create migration files, so it's not recommended for production.

---

## Step 5: Running Tests Against Test Database

### Unit Tests

```bash
npm test
# Automatically uses .env.test via dotenv-cli
```

### Integration Tests

```bash
npm run test:coverage
# Uses .env.test, runs against test database
```

### E2E Tests

E2E tests typically use the dev server, which uses production database. To test E2E with test database:

1. Update `playwright.config.ts` to use test environment
2. Or set environment variables before running:

   ```bash
   # Windows (PowerShell)
   $env:DATABASE_URL=$env:TEST_DATABASE_URL; npm run test:e2e

   # Windows (Command Prompt)
   set DATABASE_URL=%TEST_DATABASE_URL% && npm run test:e2e

   # Unix/Mac
   DATABASE_URL=$TEST_DATABASE_URL npm run test:e2e
   ```

---

## Step 6: Test Data Management

### Seeding Test Data

**Create seed data for common scenarios:**

Edit `scripts/seed-test-db.mjs` to add more test data:

```javascript
// Example: Add test worlds
await prisma.world.createMany({
  data: [
    {
      id: "test-world-1",
      name: "Test World Alpha",
      seed: 12345,
      userId: "test-user-1",
    },
    {
      id: "test-world-2",
      name: "Test World Beta",
      seed: 67890,
      userId: "test-user-2",
    },
  ],
});
```

**Run seed:**

```bash
npm run db:test:seed
```

### Resetting Test Database

**Full reset (nuclear option):**

1. Go to Supabase Dashboard → Test Project
2. Settings → Database → Reset Database Password
3. Re-run schema push and seed:
   ```bash
   npm run db:test:push
   npm run db:test:seed
   ```

**Partial reset (clear data, keep schema):**

Create `scripts/reset-test-db.mjs`:

```javascript
#!/usr/bin/env node
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });
const prisma = new PrismaClient();

async function main() {
  console.log("🗑️  Resetting test database...");

  // Delete in reverse order of dependencies
  await prisma.user.deleteMany({});
  // Add more models as needed

  console.log("✅ Test database reset complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error resetting test database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Add to `package.json`:

```json
"db:test:reset": "dotenv -e .env.test -- node scripts/reset-test-db.mjs"
```

---

## Step 7: CI/CD Configuration

For GitHub Actions (or other CI), you'll need to:

### 7.1 Add Test Database Secrets

In GitHub: **Settings → Secrets and variables → Actions**

Add these secrets:

- `TEST_SUPABASE_URL`
- `TEST_SUPABASE_ANON_KEY`
- `TEST_DATABASE_URL`
- `TEST_DIRECT_DATABASE_URL`

### 7.2 Update Workflow to Use Test Database

Your CI workflow will automatically use these via the test scripts:

```yaml
- name: Run tests with coverage
  run: npm run test:coverage
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
    DIRECT_DATABASE_URL: ${{ secrets.TEST_DIRECT_DATABASE_URL }}
```

---

## Daily Development Workflow

### Starting Development

1. **Morning routine:**

   ```bash
   # Pull latest changes
   git pull

   # Update dependencies if needed
   npm install

   # Sync test database with any schema changes
   npm run db:test:push

   # Run tests to verify everything works
   npm test
   ```

### Making Schema Changes

1. **Update** `prisma/schema.prisma`

2. **Development database:**

   ```bash
   npm run db:push
   # Or: npm run db:migrate for production-ready migration
   ```

3. **Test database:**

   ```bash
   npm run db:test:push
   ```

4. **Run tests:**

   ```bash
   npm test
   ```

5. **Commit changes:**
   ```bash
   git add .
   git commit -m "feat: add worlds table"
   ```

### Before Pushing Code

```bash
# Run all tests
npm run test:all

# Build to catch TypeScript errors
npm run build
```

---

## Troubleshooting

### Issue: "Can't reach database server"

**Solution:**

- Check your test database credentials in `.env.test`
- Verify the test Supabase project is active (not paused)
- Check region and connection string match

### Issue: "Relation does not exist"

**Solution:**

- Run `npm run db:test:push` to sync schema
- Check if you're using the correct environment (`.env.test`)

### Issue: "Permission denied for table"

**Solution:**

- Re-apply RLS policies via SQL Editor
- Check if RLS is enabled: Run in SQL Editor:
  ```sql
  SELECT tablename, rowsecurity
  FROM pg_tables
  WHERE schemaname = 'public';
  ```

### Issue: Tests failing due to RLS

**Solution:**

- Service role key bypasses RLS (don't use in tests)
- Tests should use anon key and authenticate properly
- Or temporarily disable RLS for specific test tables

---

## Best Practices

### ✅ Do:

- Use separate projects for dev, test, and production
- Seed test data via scripts (repeatable)
- Reset test database regularly
- Keep schemas in sync via migrations
- Use meaningful test data (helps debugging)
- Document any manual SQL changes

### ❌ Don't:

- Share databases across environments
- Commit `.env.test` with credentials
- Rely on manual data setup
- Skip RLS policies in test database
- Use production data in tests
- Forget to sync schemas after changes

---

## Quick Reference Commands

```bash
# Push schema to test database
npm run db:test:push

# Seed test data
npm run db:test:seed

# Run unit tests (uses test DB)
npm test

# Run tests with coverage
npm run test:coverage

# Run all tests
npm run test:all

# Open Prisma Studio for test DB
# (Temporarily swap .env with .env.test first)
```

---

## Summary

You now have:

- ✅ Separate Supabase test project
- ✅ `.env.test` configured with test credentials
- ✅ Schema synced to test database
- ✅ RLS policies applied
- ✅ Test data seeding ready
- ✅ Workflow for keeping databases in sync

**Next Steps:**

1. Create your test Supabase project
2. Update `.env.test` with credentials
3. Run `npm run db:test:push`
4. Run `npm run db:test:seed`
5. Run `npm test` to verify setup

Happy testing! 🧪
