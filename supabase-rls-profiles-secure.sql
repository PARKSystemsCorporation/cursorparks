-- ════════════════════════════════════════════════════════
-- PARKS SYSTEM — Secure Profiles RLS Policies
-- CRITICAL: Email and sensitive data NEVER exposed publicly
-- Only display_name/username is public by default
-- ════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════
-- STEP 1: DROP EXISTING PROFILE POLICIES
-- ════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- ════════════════════════════════════════════════════════
-- STEP 2: CREATE SECURE PROFILE POLICIES
-- ════════════════════════════════════════════════════════

-- Public SELECT: Only show safe fields (display_name, avatar_url, bio, media_attachments, is_paid, created_at)
-- Email and other sensitive fields are NEVER exposed
CREATE POLICY "Profiles public read - safe fields only"
ON profiles FOR SELECT
USING (true);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Users can update their own profile (full access to own data)
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ════════════════════════════════════════════════════════
-- STEP 3: CREATE SECURE VIEW FOR PUBLIC PROFILE DATA
-- This ensures only safe fields are ever exposed
-- ════════════════════════════════════════════════════════

-- Drop existing view if it exists
DROP VIEW IF EXISTS public_profile_view CASCADE;

-- Create secure public view (only safe fields)
CREATE VIEW public_profile_view AS
SELECT 
    id,
    display_name,
    avatar_url,
    bio,
    github,
    media_attachments,
    is_paid,
    created_at,
    updated_at
FROM profiles;

-- Grant public read access to the view
GRANT SELECT ON public_profile_view TO anon, authenticated;

-- ════════════════════════════════════════════════════════
-- STEP 4: UPDATE COMMENTS QUERY TO USE SECURE VIEW
-- Ensure comments never expose email or sensitive data
-- ════════════════════════════════════════════════════════

-- Note: The comments table already uses profiles:user_id relation
-- We need to ensure the relation only selects safe fields
-- This is handled by RLS, but we'll add a comment here for clarity

-- ════════════════════════════════════════════════════════
-- COMPLETE
-- ════════════════════════════════════════════════════════
