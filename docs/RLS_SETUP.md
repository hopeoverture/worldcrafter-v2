# Row-Level Security (RLS) Setup Guide

This guide explains how Row-Level Security (RLS) is implemented in WorldCrafter and how to manage it.

## What is RLS?

Row-Level Security (RLS) is a PostgreSQL feature that Supabase uses to control access to individual rows in database tables. With RLS:

- **Database-level security**: Policies are enforced at the database level, not just in your application code
- **Automatic enforcement**: Even if someone bypasses your API, RLS protects your data
- **User-specific access**: Users can only access data they're authorized to see/modify

## Current RLS Implementation

### Users Table

The `users` table has the following RLS policies:

| Policy Name                          | Type   | Description                                           |
| ------------------------------------ | ------ | ----------------------------------------------------- |
| `Users can view their own profile`   | SELECT | Authenticated users can read their own user record    |
| `Users can update their own profile` | UPDATE | Authenticated users can update their own profile data |

### How It Works

1. **User Authentication**: When a user signs in with Supabase Auth, they receive a JWT token containing their user ID
2. **Database Queries**: When your application queries the database, the JWT is used to identify the user
3. **Policy Enforcement**: RLS policies check `auth.uid()` (the authenticated user's ID) against the row's `id` field
4. **Access Control**: Only rows where `auth.uid() = id` are accessible to that user

### Auto-sync with Supabase Auth

A database trigger automatically creates a user record in `public.users` when someone signs up:

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

This ensures every authenticated user has a corresponding profile in your database.

## Setup Instructions

### Prerequisites

1. PostgreSQL client (`psql`) installed on your system
   - **Windows**: Install from [PostgreSQL downloads](https://www.postgresql.org/download/windows/)
   - **Mac**: `brew install postgresql`
   - **Linux**: `sudo apt-get install postgresql-client`

2. Environment variables configured in `.env`:
   ```env
   DIRECT_DATABASE_URL="postgresql://..."
   ```

### Step 1: Push Prisma Schema

First, ensure your database schema is up to date:

```bash
pnpm db:push
# or
npx prisma db push
```

This creates the `users` table in your Supabase database.

### Step 2: Apply RLS Migration

Apply the RLS policies using the helper script:

```bash
pnpm db:rls
# or
node scripts/apply-rls-migration.js
```

This script will:

1. Enable RLS on the `users` table
2. Create SELECT and UPDATE policies
3. Set up the auto-sync trigger with `auth.users`
4. Verify the policies were created successfully

### Step 3: Verify RLS is Working

You can verify RLS is enabled by checking in Supabase Dashboard:

1. Go to **Database** → **Tables** → `users`
2. Click on **Policies** tab
3. You should see two policies listed

Or use SQL:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';

-- View policies
SELECT * FROM pg_policies WHERE tablename = 'users';
```

## Using RLS in Your Application

### Client-Side Queries (Browser)

When using the Supabase client in the browser:

```typescript
import { createClient } from "@/lib/supabase/client";

// This automatically respects RLS policies
const supabase = createClient();

// Users can only read their own profile
const { data: user } = await supabase
  .from("users")
  .select("*")
  .eq("id", userId)
  .single();

// Users can only update their own profile
const { error } = await supabase
  .from("users")
  .update({ name: "New Name" })
  .eq("id", userId);
```

### Server-Side Queries (API Routes, Server Components)

For server-side code, use the authenticated server client:

```typescript
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();

  // RLS policies are automatically enforced
  const { data: user } = await supabase.from("users").select("*").single();

  return Response.json(user);
}
```

### Bypassing RLS (Admin Operations)

**Important**: Only bypass RLS when absolutely necessary and with proper authorization checks!

If you need to perform admin operations:

```typescript
import { createClient } from "@supabase/supabase-js";

// Create a service role client (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // ⚠️ Keep this secret!
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// This bypasses RLS - use with caution!
const { data: allUsers } = await supabase.from("users").select("*");
```

## Adding RLS to New Tables

When you add new tables to your schema, follow this pattern:

1. **Update Prisma Schema**:

   ```prisma
   model Post {
     id        String   @id @default(uuid()) @db.Uuid
     title     String
     content   String
     authorId  String   @db.Uuid // References auth user
     createdAt DateTime @default(now())

     @@map("posts")
   }
   ```

2. **Create SQL Migration**:

   ```sql
   -- Enable RLS
   ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

   -- Allow users to read all posts
   CREATE POLICY "Anyone can view posts"
     ON posts FOR SELECT
     USING (true);

   -- Allow users to create their own posts
   CREATE POLICY "Users can create their own posts"
     ON posts FOR INSERT
     WITH CHECK (auth.uid() = author_id);

   -- Allow users to update their own posts
   CREATE POLICY "Users can update their own posts"
     ON posts FOR UPDATE
     USING (auth.uid() = author_id)
     WITH CHECK (auth.uid() = author_id);

   -- Allow users to delete their own posts
   CREATE POLICY "Users can delete their own posts"
     ON posts FOR DELETE
     USING (auth.uid() = author_id);
   ```

3. **Apply the migration** using `pnpm db:rls` or create a new migration file

## Common RLS Patterns

### Public Read, Authenticated Write

```sql
-- Anyone can read
CREATE POLICY "Public read access" ON table_name
  FOR SELECT USING (true);

-- Only authenticated users can write
CREATE POLICY "Authenticated write access" ON table_name
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```

### Team/Organization-based Access

```sql
-- Users can only access data from their organization
CREATE POLICY "Organization members access" ON table_name
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );
```

### Role-based Access

```sql
-- Admin users can do anything
CREATE POLICY "Admins have full access" ON table_name
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );
```

## Troubleshooting

### "Permission Denied" Errors

If you get permission denied errors:

1. **Check if RLS is enabled**: `SELECT rowsecurity FROM pg_tables WHERE tablename = 'your_table';`
2. **Verify policies exist**: `SELECT * FROM pg_policies WHERE tablename = 'your_table';`
3. **Check if user is authenticated**: Make sure `auth.uid()` returns a valid user ID
4. **Review policy logic**: Ensure the policy conditions match your use case

### Policies Not Working

1. **Clear Supabase cache**: Sometimes policies are cached; try logging out and back in
2. **Check policy order**: Policies are checked in order; make sure there are no conflicting policies
3. **Verify JWT token**: Ensure the user's JWT contains the correct user ID

### Testing RLS Policies

Use Supabase SQL Editor to test policies:

```sql
-- Test as specific user
SET request.jwt.claims.sub TO 'user-uuid-here';

-- Try to access data
SELECT * FROM users;

-- Reset
RESET request.jwt.claims.sub;
```

## Security Best Practices

1. **Always enable RLS on tables with user data**: Never leave tables unprotected
2. **Use `USING` and `WITH CHECK` clauses**:
   - `USING`: Controls which rows are visible for reads/updates/deletes
   - `WITH CHECK`: Controls which rows can be inserted/updated
3. **Test your policies thoroughly**: Create tests to verify access control works as expected
4. **Keep service role key secret**: Never expose the service role key in client-side code
5. **Use granular policies**: Create separate policies for SELECT, INSERT, UPDATE, DELETE
6. **Document your policies**: Always comment complex policies to explain the access logic

## Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase RLS Performance Tips](https://supabase.com/docs/guides/database/postgres/row-level-security#performance)

## Migration Files

- **Main RLS Migration**: `prisma/migrations/sql/001_enable_rls.sql`
- **Apply Script**: `scripts/apply-rls-migration.js`
- **Package Script**: `pnpm db:rls`
