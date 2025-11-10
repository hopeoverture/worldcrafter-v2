-- ============================================================================
-- Row-Level Security (RLS) Policy Templates
-- ============================================================================

-- ============================================================================
-- Pattern 1: Users Can Read/Write Own Data
-- Use for: User profiles, settings, private data
-- ============================================================================

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read own profile
CREATE POLICY "Users can read own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update own profile
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can insert own profile (if applicable)
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete own profile (if applicable)
CREATE POLICY "Users can delete own profile"
  ON public.user_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Pattern 2: Public Read, Owner Write
-- Use for: Blog posts, comments, user-generated content
-- ============================================================================

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read all posts
CREATE POLICY "Anyone can read posts"
  ON public.blog_posts
  FOR SELECT
  USING (true);

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

-- ============================================================================
-- Pattern 3: Public Read Published, Owner Read All
-- Use for: Content with draft/published states
-- ============================================================================

-- Enable RLS
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Anyone can read published articles
CREATE POLICY "Anyone can read published articles"
  ON public.articles
  FOR SELECT
  USING (published = true);

-- Authors can read their own drafts
CREATE POLICY "Authors can read own drafts"
  ON public.articles
  FOR SELECT
  USING (auth.uid() = author_id AND published = false);

-- Authenticated users can create articles
CREATE POLICY "Authenticated users can create articles"
  ON public.articles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- Authors can update own articles
CREATE POLICY "Authors can update own articles"
  ON public.articles
  FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Authors can delete own articles
CREATE POLICY "Authors can delete own articles"
  ON public.articles
  FOR DELETE
  USING (auth.uid() = author_id);

-- ============================================================================
-- Pattern 4: Role-Based Access Control (RBAC)
-- Use for: Admin panels, moderation tools
-- ============================================================================

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

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

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Admins can update any user
CREATE POLICY "Admins can update any user"
  ON public.users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'ADMIN'
    )
  );

-- Users can update own profile (limited fields)
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Prevent users from changing their own role
    AND role = (SELECT role FROM public.users WHERE id = auth.uid())
  );

-- ============================================================================
-- Pattern 5: Team/Organization-Based Access
-- Use for: Multi-tenant applications
-- ============================================================================

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Users can read projects in their organization
CREATE POLICY "Users can read org projects"
  ON public.projects
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Users can create projects in their organization
CREATE POLICY "Users can create org projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations
      WHERE user_id = auth.uid()
      AND role IN ('ADMIN', 'MEMBER')
    )
  );

-- Project owners can update their projects
CREATE POLICY "Owners can update projects"
  ON public.projects
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Project owners can delete their projects
CREATE POLICY "Owners can delete projects"
  ON public.projects
  FOR DELETE
  USING (owner_id = auth.uid());

-- ============================================================================
-- Pattern 6: Private Messages/Direct Communications
-- Use for: Messaging, notifications
-- ============================================================================

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
CREATE POLICY "Senders can delete sent messages"
  ON public.messages
  FOR DELETE
  USING (auth.uid() = sender_id);

-- No UPDATE policy (messages are immutable)

-- ============================================================================
-- Pattern 7: Hierarchical/Nested Access
-- Use for: Comments on posts, replies to comments
-- ============================================================================

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

-- Post authors can read comments on their drafts
CREATE POLICY "Authors can read comments on own posts"
  ON public.comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.blog_posts
      WHERE blog_posts.id = comments.post_id
      AND blog_posts.author_id = auth.uid()
    )
  );

-- Authenticated users can create comments on published posts
CREATE POLICY "Authenticated users can comment on published posts"
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

-- ============================================================================
-- Pattern 8: Time-Based Access
-- Use for: Subscriptions, temporary access
-- ============================================================================

-- Enable RLS
ALTER TABLE public.premium_content ENABLE ROW LEVEL SECURITY;

-- Users with active subscription can read premium content
CREATE POLICY "Subscribers can read premium content"
  ON public.premium_content
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE user_id = auth.uid()
      AND expires_at > NOW()
      AND status = 'ACTIVE'
    )
  );

-- ============================================================================
-- Pattern 9: Anonymous Access with Restrictions
-- Use for: Public APIs with rate limiting by user
-- ============================================================================

-- Enable RLS
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read their own logs
CREATE POLICY "Users can read own api logs"
  ON public.api_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert logs
CREATE POLICY "System can insert api logs"
  ON public.api_logs
  FOR INSERT
  WITH CHECK (true);

-- Only admins can delete logs
CREATE POLICY "Admins can delete logs"
  ON public.api_logs
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'ADMIN'
    )
  );

-- ============================================================================
-- Pattern 10: Shared Access Lists
-- Use for: Collaborative documents, shared resources
-- ============================================================================

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Owners can read their documents
CREATE POLICY "Owners can read own documents"
  ON public.documents
  FOR SELECT
  USING (auth.uid() = owner_id);

-- Users with shared access can read documents
CREATE POLICY "Shared users can read documents"
  ON public.documents
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.document_shares
      WHERE document_id = documents.id
    )
  );

-- Owners can update their documents
CREATE POLICY "Owners can update own documents"
  ON public.documents
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Users with edit permission can update documents
CREATE POLICY "Shared editors can update documents"
  ON public.documents
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.document_shares
      WHERE document_id = documents.id
      AND permission = 'EDIT'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.document_shares
      WHERE document_id = documents.id
      AND permission = 'EDIT'
    )
  );

-- Only owners can delete documents
CREATE POLICY "Owners can delete own documents"
  ON public.documents
  FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================================================
-- Helper Functions for Complex Policies
-- ============================================================================

-- Check if user is admin
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

-- Check if user belongs to organization
CREATE OR REPLACE FUNCTION public.user_in_org(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_organizations
    WHERE user_id = auth.uid()
    AND organization_id = org_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has permission for resource
CREATE OR REPLACE FUNCTION public.has_permission(resource_id UUID, required_permission TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.permissions
    WHERE user_id = auth.uid()
    AND resource_id = resource_id
    AND permission = required_permission
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Testing RLS Policies
-- ============================================================================

-- Test as specific user (in psql)
-- SET request.jwt.claim.sub = 'user-uuid-here';
-- SELECT * FROM public.table_name;
-- RESET request.jwt.claim.sub;

-- Test anonymously
-- RESET request.jwt.claim.sub;
-- SELECT * FROM public.table_name;
