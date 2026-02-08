-- ════════════════════════════════════════════════════════
-- PARKS SYSTEM — Complete RLS Policies for Profiles & Build Logs
-- This file includes table creation + RLS policies
-- Run this file if tables don't exist yet
-- CRITICAL: Email and sensitive data NEVER exposed publicly
-- ════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════
-- STEP 1: CREATE TABLES (if they don't exist)
-- ════════════════════════════════════════════════════════

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    github TEXT,
    is_paid BOOLEAN DEFAULT false,
    media_attachments JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create projects table (required for build_logs foreign key)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    reclaimed_from_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    parent_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create builders table (required for build_logs foreign key)
CREATE TABLE IF NOT EXISTS builders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    avatar_initials TEXT,
    role TEXT,
    state TEXT DEFAULT 'active' CHECK (state IN ('active', 'completed', 'paused', 'archived')),
    profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private', 'archived')),
    show_public_logs BOOLEAN DEFAULT true,
    show_stats BOOLEAN DEFAULT true,
    show_metrics BOOLEAN DEFAULT true,
    show_modules BOOLEAN DEFAULT true,
    show_analytics BOOLEAN DEFAULT true,
    show_notes BOOLEAN DEFAULT true,
    tags TEXT[] DEFAULT '{}',
    stack TEXT[] DEFAULT '{}',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ
);

-- Create build_logs table
CREATE TABLE IF NOT EXISTS build_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    builder_id UUID REFERENCES builders(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    title TEXT,
    message TEXT,
    summary TEXT,
    log_type TEXT DEFAULT 'update' CHECK (log_type IN ('update', 'milestone', 'bugfix', 'feature', 'release')),
    status TEXT DEFAULT 'shipped' CHECK (status IN ('shipped', 'in-progress', 'blocked', 'planned')),
    is_public BOOLEAN DEFAULT true,
    log_index INTEGER DEFAULT 0,
    log_order INTEGER DEFAULT 0,
    changes JSONB DEFAULT '[]',
    rationale TEXT,
    tags TEXT[] DEFAULT '{}',
    components_touched TEXT[] DEFAULT '{}',
    complexity TEXT DEFAULT 'medium' CHECK (complexity IN ('low', 'medium', 'high')),
    confidence TEXT DEFAULT 'medium' CHECK (confidence IN ('low', 'medium', 'high')),
    impact TEXT DEFAULT 'medium' CHECK (impact IN ('low', 'medium', 'high')),
    internal_reasoning TEXT,
    tradeoffs JSONB DEFAULT '[]',
    problems JSONB DEFAULT '[]',
    next_moves JSONB DEFAULT '[]',
    media_attachments JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════
-- STEP 2: DROP ALL EXISTING POLICIES AND VIEWS
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

-- Drop view
DROP VIEW IF EXISTS public_profile_view CASCADE;

-- ════════════════════════════════════════════════════════
-- STEP 3: ENABLE ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE build_logs ENABLE ROW LEVEL SECURITY;

-- ════════════════════════════════════════════════════════
-- STEP 4: CREATE SECURE PUBLIC PROFILE VIEW
-- ════════════════════════════════════════════════════════

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
-- STEP 5: CREATE PROFILES RLS POLICIES
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
-- STEP 6: CREATE BUILD_LOGS RLS POLICIES
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
-- This file creates both tables AND RLS policies
-- Use this if tables don't exist yet
--
-- PROFILES TABLE COLUMNS:
--   - id, display_name, avatar_url, bio, is_paid, media_attachments, created_at, updated_at
--
-- BUILD_LOGS TABLE COLUMNS:
--   - id, builder_id, project_id, title, message, summary, log_type, status, is_public,
--     log_index, log_order, changes, rationale, tags, components_touched, complexity,
--     confidence, impact, internal_reasoning, tradeoffs, problems, next_moves,
--     media_attachments, created_at, updated_at
--
-- ════════════════════════════════════════════════════════
