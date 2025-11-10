-- =====================================================
-- Enable Row Level Security (RLS) on Phase 1 tables
-- =====================================================
-- This migration enables RLS and creates policies for:
-- 1. worlds - Users can CRUD their own worlds
-- 2. locations - Users can CRUD locations in their worlds
-- 3. activities - Users can create and view their own activities
-- =====================================================

-- =====================================================
-- WORLDS TABLE
-- =====================================================

-- Enable RLS on the worlds table
ALTER TABLE worlds ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own worlds
CREATE POLICY "Users can view their own worlds"
  ON worlds
  FOR SELECT
  USING (auth.uid() = "userId");

-- Policy: Users can insert their own worlds
CREATE POLICY "Users can create their own worlds"
  ON worlds
  FOR INSERT
  WITH CHECK (auth.uid() = "userId");

-- Policy: Users can update their own worlds
CREATE POLICY "Users can update their own worlds"
  ON worlds
  FOR UPDATE
  USING (auth.uid() = "userId")
  WITH CHECK (auth.uid() = "userId");

-- Policy: Users can delete their own worlds
CREATE POLICY "Users can delete their own worlds"
  ON worlds
  FOR DELETE
  USING (auth.uid() = "userId");

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON worlds TO authenticated;

-- =====================================================
-- LOCATIONS TABLE
-- =====================================================

-- Enable RLS on the locations table
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view locations in their own worlds
CREATE POLICY "Users can view locations in their own worlds"
  ON locations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM worlds
      WHERE worlds.id = locations."worldId"
      AND worlds."userId" = auth.uid()
    )
  );

-- Policy: Users can insert locations in their own worlds
CREATE POLICY "Users can create locations in their own worlds"
  ON locations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM worlds
      WHERE worlds.id = locations."worldId"
      AND worlds."userId" = auth.uid()
    )
  );

-- Policy: Users can update locations in their own worlds
CREATE POLICY "Users can update locations in their own worlds"
  ON locations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM worlds
      WHERE worlds.id = locations."worldId"
      AND worlds."userId" = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM worlds
      WHERE worlds.id = locations."worldId"
      AND worlds."userId" = auth.uid()
    )
  );

-- Policy: Users can delete locations in their own worlds
CREATE POLICY "Users can delete locations in their own worlds"
  ON locations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM worlds
      WHERE worlds.id = locations."worldId"
      AND worlds."userId" = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON locations TO authenticated;

-- =====================================================
-- ACTIVITIES TABLE
-- =====================================================

-- Enable RLS on the activities table
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own activities
CREATE POLICY "Users can view their own activities"
  ON activities
  FOR SELECT
  USING (auth.uid() = "userId");

-- Policy: Users can insert their own activities
CREATE POLICY "Users can create their own activities"
  ON activities
  FOR INSERT
  WITH CHECK (auth.uid() = "userId");

-- Policy: Users cannot update activities (append-only log)
-- No UPDATE policy - activities are immutable once created

-- Policy: Users can delete their own activities
CREATE POLICY "Users can delete their own activities"
  ON activities
  FOR DELETE
  USING (auth.uid() = "userId");

-- Grant permissions (no UPDATE for activities)
GRANT SELECT, INSERT, DELETE ON activities TO authenticated;

-- =====================================================
-- Grant schema usage
-- =====================================================
GRANT USAGE ON SCHEMA public TO authenticated;

-- =====================================================
-- Verification
-- =====================================================
-- You can verify RLS is enabled by running:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('worlds', 'locations', 'activities');
-- Expected result: rowsecurity = true for all tables

-- You can view policies by running:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename IN ('worlds', 'locations', 'activities')
-- ORDER BY tablename, policyname;
