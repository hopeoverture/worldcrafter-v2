# Row-Level Security (RLS) Policies for WorldCrafter

This document contains RLS policy templates and best practices for securing database tables in WorldCrafter.

## What is Row-Level Security?

Row-Level Security (RLS) is a PostgreSQL/Supabase feature that restricts which rows users can access in database queries. It provides **database-level authorization** as a second layer of defense beyond application-level checks.

**Why RLS is Critical:**
- Prevents data leaks even if application code has bugs
- Enforces authorization at the database level
- Works automatically with Supabase Auth
- Complements but doesn't replace application-level auth checks

## RLS Policy Structure

```sql
CREATE POLICY "policy_name"
  ON table_name
  FOR operation        -- SELECT, INSERT, UPDATE, DELETE, ALL
  TO role              -- authenticated, anon, public (optional)
  USING (condition)    -- Who can see/affect rows
  WITH CHECK (condition) -- What data can be inserted/updated (optional)
```

**Key components:**
- `USING`: Condition for which rows are visible/affected
- `WITH CHECK`: Condition for what can be inserted/updated
- `TO`: Which role the policy applies to (optional, defaults to all)

## Enabling RLS

**Always enable RLS first:**
```sql
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;
```

**Without this, policies won't be enforced!**

## Common RLS Patterns

### 1. Users Can Read Own Data

Most common pattern for user-specific data:

```sql
-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own profile
CREATE POLICY "Users can read own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);
```

**Usage:**
- User profiles
- User settings
- Private user data

### 2. Users Can Update Own Data

```sql
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Key points:**
- `USING`: Which rows can be updated (only own data)
- `WITH CHECK`: Ensures updated data still belongs to user

### 3. Users Can Insert Own Data

```sql
CREATE POLICY "Users can create own posts"
  ON public.blog_posts
  FOR INSERT
  WITH CHECK (auth.uid() = author_id);
```

**Key points:**
- Only `WITH CHECK` needed for INSERT
- Ensures `author_id` matches authenticated user

### 4. Users Can Delete Own Data

```sql
CREATE POLICY "Users can delete own posts"
  ON public.blog_posts
  FOR DELETE
  USING (auth.uid() = author_id);
```

### 5. Public Read, Authenticated Write

Public content that anyone can read, but only authenticated users can create:

```sql
-- Anyone can read published posts
CREATE POLICY "Anyone can read published posts"
  ON public.blog_posts
  FOR SELECT
  USING (published = true);

-- Authenticated users can create posts
CREATE POLICY "Authenticated users can create posts"
  ON public.blog_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);
```

### 6. Public Read, Owner Write

Common for user-generated content:

```sql
-- Anyone can read
CREATE POLICY "Anyone can read posts"
  ON public.blog_posts
  FOR SELECT
  USING (true);

-- Only author can update
CREATE POLICY "Authors can update own posts"
  ON public.blog_posts
  FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Only author can delete
CREATE POLICY "Authors can delete own posts"
  ON public.blog_posts
  FOR DELETE
  USING (auth.uid() = author_id);
```

### 7. Role-Based Access Control (RBAC)

Admin users can access all data:

```sql
-- Admins can read all users
CREATE POLICY "Admins can read all users"
  ON public.users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'ADMIN'
    )
  );

-- Regular users can only read their own data
CREATE POLICY "Users can read own data"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);
```

### 8. Team/Organization-Based Access

Users can access data belonging to their team:

```sql
-- Users can read data from their organization
CREATE POLICY "Users can read org data"
  ON public.projects
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Users can create data for their organization
CREATE POLICY "Users can create org data"
  ON public.projects
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );
```

### 9. Time-Based Access

Access expires after certain time:

```sql
-- Users can only access non-expired content
CREATE POLICY "Access non-expired content"
  ON public.subscriptions
  FOR SELECT
  USING (
    auth.uid() = user_id
    AND expires_at > NOW()
  );
```

### 10. Hierarchical Access (Parent-Child)

Access based on parent relationship:

```sql
-- Users can read comments on posts they authored
CREATE POLICY "Authors can read comments on their posts"
  ON public.comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.blog_posts
      WHERE blog_posts.id = comments.post_id
      AND blog_posts.author_id = auth.uid()
    )
  );
```

## Complete RLS Setup Examples

### Example 1: User Profiles Table

```sql
-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read any profile (public data)
CREATE POLICY "Anyone can read profiles"
  ON public.user_profiles
  FOR SELECT
  USING (true);

-- Users can update only their own profile
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Prevent users from creating profiles (handled by trigger)
-- No INSERT policy = no one can insert
```

### Example 2: Blog Posts Table

```sql
-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read published posts
CREATE POLICY "Anyone can read published posts"
  ON public.blog_posts
  FOR SELECT
  USING (published = true);

-- Authors can read their own drafts
CREATE POLICY "Authors can read own drafts"
  ON public.blog_posts
  FOR SELECT
  USING (auth.uid() = author_id AND published = false);

-- Authenticated users can create posts
CREATE POLICY "Authenticated users can create posts"
  ON public.blog_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- Authors can update their own posts
CREATE POLICY "Authors can update own posts"
  ON public.blog_posts
  FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Authors can delete their own posts
CREATE POLICY "Authors can delete own posts"
  ON public.blog_posts
  FOR DELETE
  USING (auth.uid() = author_id);
```

### Example 3: Comments Table

```sql
-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read comments on published posts
CREATE POLICY "Anyone can read comments on published posts"
  ON public.comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.blog_posts
      WHERE blog_posts.id = comments.post_id
      AND blog_posts.published = true
    )
  );

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
  ON public.comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM public.blog_posts
      WHERE id = post_id
      AND published = true
    )
  );

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON public.comments
  FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON public.comments
  FOR DELETE
  USING (auth.uid() = author_id);
```

### Example 4: Private Messages Table

```sql
-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can read messages they sent or received
CREATE POLICY "Users can read own messages"
  ON public.messages
  FOR SELECT
  USING (
    auth.uid() = sender_id
    OR auth.uid() = recipient_id
  );

-- Users can send messages
CREATE POLICY "Users can send messages"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Users can delete messages they sent
CREATE POLICY "Users can delete sent messages"
  ON public.messages
  FOR DELETE
  USING (auth.uid() = sender_id);

-- Prevent updates (messages are immutable)
-- No UPDATE policy = no one can update
```

## Advanced Patterns

### Using Functions in Policies

```sql
-- Create helper function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Use in policy
CREATE POLICY "Admins can do anything"
  ON public.users
  FOR ALL
  USING (is_admin());
```

### Combining Multiple Conditions

```sql
CREATE POLICY "Complex access rules"
  ON public.documents
  FOR SELECT
  USING (
    -- Owner can always access
    auth.uid() = owner_id
    OR
    -- Shared with user
    auth.uid() IN (
      SELECT user_id FROM public.document_shares
      WHERE document_id = documents.id
    )
    OR
    -- Public documents
    is_public = true
  );
```

### Security Definer Functions

For complex logic that needs elevated privileges:

```sql
CREATE OR REPLACE FUNCTION public.user_has_access(doc_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_access BOOLEAN;
BEGIN
  -- Complex logic here
  SELECT COUNT(*) > 0 INTO has_access
  FROM public.documents d
  LEFT JOIN public.teams t ON d.team_id = t.id
  LEFT JOIN public.team_members tm ON t.id = tm.team_id
  WHERE d.id = doc_id
  AND (
    d.owner_id = auth.uid()
    OR tm.user_id = auth.uid()
  );

  RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Users with access can read"
  ON public.documents
  FOR SELECT
  USING (user_has_access(id));
```

## Testing RLS Policies

### Test as Different Users

```sql
-- Set current user (for testing in psql)
SET request.jwt.claim.sub = 'user-id-here';

-- Run query
SELECT * FROM public.blog_posts;

-- Reset
RESET request.jwt.claim.sub;
```

### Integration Tests

```typescript
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

test('RLS prevents reading other users data', async () => {
  const supabase = await createClient()

  // Try to read another user's private data
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', 'different-user-id')
    .single()

  // Should return no data due to RLS
  expect(data).toBeNull()
})
```

## Common Pitfalls

### 1. Forgetting to Enable RLS

```sql
-- ❌ Wrong: Policies won't work
CREATE POLICY "..." ON public.table ...

-- ✅ Correct: Always enable RLS first
ALTER TABLE public.table ENABLE ROW LEVEL SECURITY;
CREATE POLICY "..." ON public.table ...
```

### 2. Not Testing Policies

Always test policies with different user scenarios before deploying.

### 3. Overly Permissive Policies

```sql
-- ❌ Dangerous: Anyone can do anything
CREATE POLICY "Allow all"
  ON public.sensitive_data
  FOR ALL
  USING (true);

-- ✅ Better: Restrict appropriately
CREATE POLICY "Users can read own data"
  ON public.sensitive_data
  FOR SELECT
  USING (auth.uid() = user_id);
```

### 4. Missing WITH CHECK on INSERT/UPDATE

```sql
-- ❌ Incomplete: User could insert data as another user
CREATE POLICY "Users can insert"
  ON public.posts
  FOR INSERT
  USING (true);

-- ✅ Complete: Enforce ownership
CREATE POLICY "Users can insert own posts"
  ON public.posts
  FOR INSERT
  WITH CHECK (auth.uid() = author_id);
```

## Performance Considerations

### 1. Add Indexes for Policy Conditions

```sql
-- If policy uses user_id frequently
CREATE INDEX idx_posts_user_id ON public.blog_posts(user_id);
```

### 2. Avoid Complex Subqueries

```sql
-- ❌ Slow: Complex subquery runs for every row
CREATE POLICY "Slow policy"
  ON public.documents
  FOR SELECT
  USING (
    id IN (
      SELECT document_id FROM public.complex_view
      WHERE ...lots of joins...
    )
  );

-- ✅ Better: Use simpler conditions or materialized views
```

### 3. Use SECURITY DEFINER Functions

For complex logic, move it to a function that runs once:

```sql
CREATE OR REPLACE FUNCTION check_access()
RETURNS BOOLEAN AS $$
  -- Complex logic here
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Simple policy"
  ON public.table
  FOR SELECT
  USING (check_access());
```

## RLS Policies Template

Use this template for new tables:

```sql
-- Enable RLS
ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;

-- SELECT: Who can read rows?
CREATE POLICY "select_policy_name"
  ON public.your_table
  FOR SELECT
  USING (/* condition */);

-- INSERT: Who can create rows?
CREATE POLICY "insert_policy_name"
  ON public.your_table
  FOR INSERT
  TO authenticated
  WITH CHECK (/* condition */);

-- UPDATE: Who can modify rows?
CREATE POLICY "update_policy_name"
  ON public.your_table
  FOR UPDATE
  USING (/* who can update */)
  WITH CHECK (/* what can be updated */);

-- DELETE: Who can delete rows?
CREATE POLICY "delete_policy_name"
  ON public.your_table
  FOR DELETE
  USING (/* condition */);
```

## Best Practices

1. **Always enable RLS** on tables with user data
2. **Test policies** with different user scenarios
3. **Use descriptive policy names** explaining what they allow
4. **Start restrictive**, then relax as needed
5. **Combine with application-level auth** for defense in depth
6. **Document complex policies** with comments
7. **Add indexes** for fields used in policy conditions
8. **Use transactions** when creating multiple policies
9. **Version control** RLS SQL files
10. **Monitor performance** of policy queries

---

## WorldCrafter-Specific RLS Policies

This section contains RLS policies for all WorldCrafter PRD tables including relationships, tags, comments, activity logs, versions, memberships, collections, wiki pages, and bookmarks.

### Helper Function: Check World Membership

Create this helper function first - it's used by many policies:

```sql
-- Helper function to check if user is a member of a world
CREATE OR REPLACE FUNCTION public.is_world_member(p_world_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.world_members
    WHERE world_id = p_world_id
    AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has minimum role in a world
CREATE OR REPLACE FUNCTION public.has_world_role(
  p_world_id UUID,
  p_user_id UUID,
  p_min_role TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_role_hierarchy TEXT[] := ARRAY['VIEWER', 'COMMENTER', 'EDITOR', 'ADMIN', 'OWNER'];
  v_user_level INT;
  v_required_level INT;
BEGIN
  -- Get user's role
  SELECT role INTO v_role
  FROM public.world_members
  WHERE world_id = p_world_id
  AND user_id = p_user_id;

  IF v_role IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get role levels
  SELECT array_position(v_role_hierarchy, v_role) INTO v_user_level;
  SELECT array_position(v_role_hierarchy, p_min_role) INTO v_required_level;

  RETURN v_user_level >= v_required_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 1. Relationships Table

```sql
-- Enable RLS
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;

-- World members can read relationships
CREATE POLICY "World members can read relationships"
  ON public.relationships
  FOR SELECT
  USING (
    is_world_member(world_id, auth.uid())
  );

-- Editors and above can create relationships
CREATE POLICY "Editors can create relationships"
  ON public.relationships
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_world_role(world_id, auth.uid(), 'EDITOR')
  );

-- Editors and above can update relationships
CREATE POLICY "Editors can update relationships"
  ON public.relationships
  FOR UPDATE
  USING (has_world_role(world_id, auth.uid(), 'EDITOR'))
  WITH CHECK (has_world_role(world_id, auth.uid(), 'EDITOR'));

-- Editors and above can delete relationships
CREATE POLICY "Editors can delete relationships"
  ON public.relationships
  FOR DELETE
  USING (has_world_role(world_id, auth.uid(), 'EDITOR'));
```

### 2. Tags Table

```sql
-- Enable RLS
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- World members can read tags
CREATE POLICY "World members can read tags"
  ON public.tags
  FOR SELECT
  USING (
    is_world_member(world_id, auth.uid())
  );

-- Editors and above can create tags
CREATE POLICY "Editors can create tags"
  ON public.tags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_world_role(world_id, auth.uid(), 'EDITOR')
  );

-- Editors and above can update tags
CREATE POLICY "Editors can update tags"
  ON public.tags
  FOR UPDATE
  USING (has_world_role(world_id, auth.uid(), 'EDITOR'))
  WITH CHECK (has_world_role(world_id, auth.uid(), 'EDITOR'));

-- Editors and above can delete tags
CREATE POLICY "Editors can delete tags"
  ON public.tags
  FOR DELETE
  USING (has_world_role(world_id, auth.uid(), 'EDITOR'));
```

### 3. EntityTag Table

```sql
-- Enable RLS
ALTER TABLE public.entity_tags ENABLE ROW LEVEL SECURITY;

-- World members can read entity tags (via tag's world_id)
CREATE POLICY "World members can read entity tags"
  ON public.entity_tags
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tags
      WHERE tags.id = entity_tags.tag_id
      AND is_world_member(tags.world_id, auth.uid())
    )
  );

-- Editors and above can create entity tags
CREATE POLICY "Editors can create entity tags"
  ON public.entity_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tags
      WHERE tags.id = entity_tags.tag_id
      AND has_world_role(tags.world_id, auth.uid(), 'EDITOR')
    )
  );

-- Editors and above can delete entity tags
CREATE POLICY "Editors can delete entity tags"
  ON public.entity_tags
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tags
      WHERE tags.id = entity_tags.tag_id
      AND has_world_role(tags.world_id, auth.uid(), 'EDITOR')
    )
  );
```

### 4. Comments Table

```sql
-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- World members can read all comments (not deleted)
CREATE POLICY "World members can read comments"
  ON public.comments
  FOR SELECT
  USING (
    is_deleted = false
    AND is_world_member(world_id, auth.uid())
  );

-- Commenters and above can create comments
CREATE POLICY "Commenters can create comments"
  ON public.comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND has_world_role(world_id, auth.uid(), 'COMMENTER')
  );

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON public.comments
  FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON public.comments
  FOR DELETE
  USING (auth.uid() = author_id);

-- Admins can delete any comment
CREATE POLICY "Admins can delete any comment"
  ON public.comments
  FOR DELETE
  USING (has_world_role(world_id, auth.uid(), 'ADMIN'));
```

### 5. ActivityLog Table

```sql
-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- World members can read activity logs
CREATE POLICY "World members can read activity logs"
  ON public.activity_logs
  FOR SELECT
  USING (
    is_world_member(world_id, auth.uid())
  );

-- System creates activity logs (no INSERT policy for users)
-- Activity logs are created by server-side code only
-- No UPDATE or DELETE policies (immutable audit trail)
```

### 6. WorldVersion Table

```sql
-- Enable RLS
ALTER TABLE public.world_versions ENABLE ROW LEVEL SECURITY;

-- World members can read versions
CREATE POLICY "World members can read versions"
  ON public.world_versions
  FOR SELECT
  USING (
    is_world_member(world_id, auth.uid())
  );

-- Only admins and owners can create versions
CREATE POLICY "Admins can create versions"
  ON public.world_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND has_world_role(world_id, auth.uid(), 'ADMIN')
  );

-- Only owners can delete versions
CREATE POLICY "Owners can delete versions"
  ON public.world_versions
  FOR DELETE
  USING (has_world_role(world_id, auth.uid(), 'OWNER'));

-- No UPDATE policy (versions are immutable)
```

### 7. WorldMember Table

```sql
-- Enable RLS
ALTER TABLE public.world_members ENABLE ROW LEVEL SECURITY;

-- Users can read their own memberships
CREATE POLICY "Users can read own memberships"
  ON public.world_members
  FOR SELECT
  USING (auth.uid() = user_id);

-- World members can read all members of their world
CREATE POLICY "Members can read world members"
  ON public.world_members
  FOR SELECT
  USING (
    is_world_member(world_id, auth.uid())
  );

-- Admins and owners can add new members
CREATE POLICY "Admins can add members"
  ON public.world_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_world_role(world_id, auth.uid(), 'ADMIN')
  );

-- Admins can update member roles (but not to OWNER)
CREATE POLICY "Admins can update member roles"
  ON public.world_members
  FOR UPDATE
  USING (
    has_world_role(world_id, auth.uid(), 'ADMIN')
  )
  WITH CHECK (
    has_world_role(world_id, auth.uid(), 'ADMIN')
    AND role != 'OWNER' -- Can't promote to owner
  );

-- Owners can update any member (including to OWNER)
CREATE POLICY "Owners can update any member"
  ON public.world_members
  FOR UPDATE
  USING (
    has_world_role(world_id, auth.uid(), 'OWNER')
  )
  WITH CHECK (
    has_world_role(world_id, auth.uid(), 'OWNER')
  );

-- Admins can remove members (except owners)
CREATE POLICY "Admins can remove members"
  ON public.world_members
  FOR DELETE
  USING (
    has_world_role(world_id, auth.uid(), 'ADMIN')
    AND role != 'OWNER'
  );

-- Owners can remove any member
CREATE POLICY "Owners can remove any member"
  ON public.world_members
  FOR DELETE
  USING (
    has_world_role(world_id, auth.uid(), 'OWNER')
  );

-- Users can remove themselves
CREATE POLICY "Users can leave world"
  ON public.world_members
  FOR DELETE
  USING (auth.uid() = user_id);
```

### 8. Collections Table

```sql
-- Enable RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- Read: Based on privacy level
CREATE POLICY "Read collections based on privacy"
  ON public.collections
  FOR SELECT
  USING (
    privacy = 'PUBLIC'
    OR (privacy = 'UNLISTED' AND true) -- Anyone with link
    OR (privacy = 'PRIVATE' AND auth.uid() = created_by)
    OR is_world_member(world_id, auth.uid())
  );

-- World members can create collections
CREATE POLICY "World members can create collections"
  ON public.collections
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND is_world_member(world_id, auth.uid())
  );

-- Creators can update their own collections
CREATE POLICY "Creators can update own collections"
  ON public.collections
  FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Creators can delete their own collections
CREATE POLICY "Creators can delete own collections"
  ON public.collections
  FOR DELETE
  USING (auth.uid() = created_by);
```

### 9. WikiPage Table

```sql
-- Enable RLS
ALTER TABLE public.wiki_pages ENABLE ROW LEVEL SECURITY;

-- Read: Based on privacy level
CREATE POLICY "Read wiki pages based on privacy"
  ON public.wiki_pages
  FOR SELECT
  USING (
    privacy = 'PUBLIC'
    OR (privacy = 'UNLISTED' AND true)
    OR (privacy = 'PRIVATE' AND auth.uid() = created_by)
    OR is_world_member(world_id, auth.uid())
  );

-- Editors and above can create wiki pages
CREATE POLICY "Editors can create wiki pages"
  ON public.wiki_pages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND has_world_role(world_id, auth.uid(), 'EDITOR')
  );

-- Editors can update any wiki page in their world
CREATE POLICY "Editors can update wiki pages"
  ON public.wiki_pages
  FOR UPDATE
  USING (has_world_role(world_id, auth.uid(), 'EDITOR'))
  WITH CHECK (has_world_role(world_id, auth.uid(), 'EDITOR'));

-- Editors can delete wiki pages
CREATE POLICY "Editors can delete wiki pages"
  ON public.wiki_pages
  FOR DELETE
  USING (has_world_role(world_id, auth.uid(), 'EDITOR'));
```

### 10. Bookmarks Table

```sql
-- Enable RLS
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Users can read their own bookmarks
CREATE POLICY "Users can read own bookmarks"
  ON public.bookmarks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own bookmarks
CREATE POLICY "Users can create own bookmarks"
  ON public.bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookmarks
CREATE POLICY "Users can update own bookmarks"
  ON public.bookmarks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own bookmarks
CREATE POLICY "Users can delete own bookmarks"
  ON public.bookmarks
  FOR DELETE
  USING (auth.uid() = user_id);
```

### 11. Core Entity Tables (World, Character, Location, Item)

These follow the same pattern - members can read based on privacy, editors can CRUD:

```sql
-- Example: Characters table
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

-- Read: Based on privacy and membership
CREATE POLICY "Read characters based on privacy"
  ON public.characters
  FOR SELECT
  USING (
    privacy = 'PUBLIC'
    OR (privacy = 'UNLISTED' AND true)
    OR (privacy = 'PRIVATE' AND auth.uid() = created_by)
    OR is_world_member(world_id, auth.uid())
  );

-- Editors can create characters
CREATE POLICY "Editors can create characters"
  ON public.characters
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND has_world_role(world_id, auth.uid(), 'EDITOR')
  );

-- Editors can update characters
CREATE POLICY "Editors can update characters"
  ON public.characters
  FOR UPDATE
  USING (has_world_role(world_id, auth.uid(), 'EDITOR'))
  WITH CHECK (has_world_role(world_id, auth.uid(), 'EDITOR'));

-- Editors can delete characters
CREATE POLICY "Editors can delete characters"
  ON public.characters
  FOR DELETE
  USING (has_world_role(world_id, auth.uid(), 'EDITOR'));

-- Repeat for: locations, items, events, factions, concepts, notes
```

---

## Complete RLS Setup Script

Here's a complete SQL script to set up all RLS policies for WorldCrafter:

```sql
-- ============================================================================
-- WORLDCRAFTER RLS POLICIES - COMPLETE SETUP
-- ============================================================================

-- Helper functions
CREATE OR REPLACE FUNCTION public.is_world_member(p_world_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.world_members
    WHERE world_id = p_world_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_world_role(
  p_world_id UUID,
  p_user_id UUID,
  p_min_role TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_role_hierarchy TEXT[] := ARRAY['VIEWER', 'COMMENTER', 'EDITOR', 'ADMIN', 'OWNER'];
  v_user_level INT;
  v_required_level INT;
BEGIN
  SELECT role INTO v_role
  FROM public.world_members
  WHERE world_id = p_world_id AND user_id = p_user_id;

  IF v_role IS NULL THEN RETURN FALSE; END IF;

  SELECT array_position(v_role_hierarchy, v_role) INTO v_user_level;
  SELECT array_position(v_role_hierarchy, p_min_role) INTO v_required_level;

  RETURN v_user_level >= v_required_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE public.worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wiki_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Apply policies (use sections above for each table)
-- ... (policies from sections above)
```

---

## Testing RLS Policies

### Test World Membership

```typescript
// Create test users
const user1 = await createTestUser();
const user2 = await createTestUser();

// User1 creates a world
const world = await prisma.world.create({
  data: { name: 'Test World', createdBy: user1.id },
});

// Add user1 as owner
await prisma.worldMember.create({
  data: { worldId: world.id, userId: user1.id, role: 'OWNER' },
});

// User2 tries to read world (should fail)
const supabase2 = createClientAs(user2);
const { data, error } = await supabase2
  .from('worlds')
  .select('*')
  .eq('id', world.id)
  .single();

expect(data).toBeNull(); // RLS blocks access

// Add user2 as viewer
await prisma.worldMember.create({
  data: { worldId: world.id, userId: user2.id, role: 'VIEWER' },
});

// User2 tries again (should succeed)
const { data: worldData } = await supabase2
  .from('worlds')
  .select('*')
  .eq('id', world.id)
  .single();

expect(worldData).toBeTruthy(); // RLS allows access
```

### Test Role Permissions

```typescript
// Viewer tries to edit (should fail)
await expect(
  prisma.character.create({
    data: {
      name: 'Test',
      worldId: world.id,
      createdBy: viewer.id,
    },
  })
).rejects.toThrow();

// Editor creates character (should succeed)
const character = await prisma.character.create({
  data: {
    name: 'Test',
    worldId: world.id,
    createdBy: editor.id,
  },
});

expect(character).toBeTruthy();
```

---

## Performance Optimization

### Indexes for RLS Queries

```sql
-- Add indexes for common RLS lookups
CREATE INDEX idx_world_members_lookup
  ON public.world_members(world_id, user_id);

CREATE INDEX idx_world_members_role
  ON public.world_members(world_id, role);

CREATE INDEX idx_entities_world_privacy
  ON public.characters(world_id, privacy);

CREATE INDEX idx_relationships_polymorphic
  ON public.relationships(source_type, source_id, target_type, target_id);

CREATE INDEX idx_entity_tags_lookup
  ON public.entity_tags(entity_type, entity_id);

CREATE INDEX idx_comments_entity
  ON public.comments(entity_type, entity_id, is_deleted);
```

---

## Migration File Template

Save as `prisma/migrations/[timestamp]_add_worldcrafter_rls/migration.sql`:

```sql
-- Apply all RLS policies from sections above
-- This migration should be run after schema is created

-- 1. Create helper functions
-- 2. Enable RLS on all tables
-- 3. Create policies for each table
-- 4. Add performance indexes

-- See complete script above for full implementation
```
