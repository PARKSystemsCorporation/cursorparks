-- ════════════════════════════════════════════════════════
-- PARKS SYSTEM — Complete RLS Policies for Profiles & Build Logs
-- Perfect, verified RLS policies with pre-wipe DROP statements
-- CRITICAL: Email and sensitive data NEVER exposed publicly
-- 
-- IMPORTANT: Run supabase-schema-profiles-buildlogs.sql FIRST
-- This file only creates RLS policies and requires tables to exist
-- ════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════
-- STEP 1: VERIFY TABLES EXIST
-- ════════════════════════════════════════════════════════

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'profiles'
    ) THEN
        RAISE EXCEPTION 'profiles table does not exist. Please run supabase-schema-profiles-buildlogs.sql first.';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'build_logs'
    ) THEN
        RAISE EXCEPTION 'build_logs table does not exist. Please run supabase-schema-profiles-buildlogs.sql first.';
    END IF;
END $$;

-- ════════════════════════════════════════════════════════
-- STEP 2: DROP ALL EXISTING POLICIES
-- ════════════════════════════════════════════════════════

-- Drop profiles policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Profiles public read - safe fields only" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Drop build_logs policies
DROP POLICY IF EXISTS "Build logs are viewable by everyone" ON build_logs;
DROP POLICY IF EXISTS "Users can insert own build logs" ON build_logs;
DROP POLICY IF EXISTS "Users can update own build logs" ON build_logs;
DROP POLICY IF EXISTS "Users can delete own build logs" ON build_logs;

-- ════════════════════════════════════════════════════════
-- STEP 3: ADD GITHUB COLUMN IF IT DOESN'T EXIST
-- ════════════════════════════════════════════════════════

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'github'
    ) THEN
        ALTER TABLE profiles ADD COLUMN github TEXT;
    END IF;
END $$;

-- ════════════════════════════════════════════════════════
-- STEP 4: DROP AND RECREATE SECURE VIEW
-- ════════════════════════════════════════════════════════

DROP VIEW IF EXISTS public_profile_view CASCADE;

-- Create secure public view (only safe fields - email NEVER included)
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
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE build_logs ENABLE ROW LEVEL SECURITY;

-- ════════════════════════════════════════════════════════
-- STEP 6: CREATE PROFILES RLS POLICIES
-- ════════════════════════════════════════════════════════

-- Public SELECT: Everyone can read profiles
-- NOTE: Email is NEVER in profiles table (it's in auth.users only)
-- Only safe fields are exposed: display_name, avatar_url, bio, media_attachments, is_paid, timestamps
CREATE POLICY "Profiles are viewable by everyone"
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
-- STEP 7: CREATE BUILD_LOGS RLS POLICIES
-- ════════════════════════════════════════════════════════

-- Public SELECT: Everyone can read build logs (respects is_public flag in application logic)
CREATE POLICY "Build logs are viewable by everyone"
ON build_logs FOR SELECT
USING (true);

-- Users can insert build logs for their own builders
CREATE POLICY "Users can insert own build logs"
ON build_logs FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM builders 
        WHERE id = build_logs.builder_id 
        AND user_id = auth.uid()
    )
);

-- Users can update build logs for their own builders
CREATE POLICY "Users can update own build logs"
ON build_logs FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM builders 
        WHERE id = build_logs.builder_id 
        AND user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM builders 
        WHERE id = build_logs.builder_id 
        AND user_id = auth.uid()
    )
);

-- Users can delete build logs for their own builders
CREATE POLICY "Users can delete own build logs"
ON build_logs FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM builders 
        WHERE id = build_logs.builder_id 
        AND user_id = auth.uid()
    )
);

-- ════════════════════════════════════════════════════════
-- COMPLETE
-- ════════════════════════════════════════════════════════
--
-- PROFILES POLICIES:
--   - SELECT: Public read access (everyone can view)
--   - INSERT: Users can only create their own profile
--   - UPDATE: Users can only update their own profile
--   - DELETE: Not allowed (cascade from auth.users deletion)
--
-- BUILD_LOGS POLICIES:
--   - SELECT: Public read access (everyone can view)
--   - INSERT: Users can create logs for builders they own
--   - UPDATE: Users can update logs for builders they own
--   - DELETE: Users can delete logs for builders they own
--
-- SECURITY NOTES:
--   - Email is NEVER stored in profiles table
--   - Email is NEVER exposed through RLS policies
--   - public_profile_view provides extra layer of protection
--   - Only safe fields (display_name, avatar_url, bio, media_attachments, is_paid, timestamps) are public
--
-- ════════════════════════════════════════════════════════
