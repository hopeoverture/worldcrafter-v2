-- =====================================================
-- Enable Row Level Security (RLS) on users table
-- =====================================================
-- This migration enables RLS and creates policies that allow:
-- 1. Users to SELECT (read) their own profile
-- 2. Users to UPDATE their own profile (except id and email)
-- =====================================================

-- Enable RLS on the users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies
-- =====================================================

-- Policy: Users can read their own profile
-- Allows authenticated users to SELECT their own user record
CREATE POLICY "Users can view their own profile"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
-- Allows authenticated users to UPDATE their own profile
-- Note: Prisma will handle field-level restrictions in application logic
CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- Trigger to handle new user creation
-- =====================================================
-- When a new user signs up via Supabase Auth, automatically
-- create a corresponding record in the public.users table

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
-- This will fire after a new user is inserted into auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- Grant permissions
-- =====================================================
-- Grant authenticated users access to the users table
GRANT SELECT, UPDATE ON users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- =====================================================
-- Verification
-- =====================================================
-- You can verify RLS is enabled by running:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users';
-- Expected result: rowsecurity = true

-- You can view policies by running:
-- SELECT * FROM pg_policies WHERE tablename = 'users';
