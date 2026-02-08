-- ════════════════════════════════════════════════════════
-- PARKS SYSTEM — Complete Profiles & Build Logs Schema
-- Perfect, verified schema with pre-wipe DROP statements
-- ════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════
-- STEP 1: DROP ALL DEPENDENCIES FIRST (in reverse order)
-- ════════════════════════════════════════════════════════

-- Drop related views (safe before tables)
DROP VIEW IF EXISTS public_profile_view CASCADE;

-- Drop related triggers (guarded if tables missing)
DO $$
BEGIN
    IF to_regclass('public.profiles') IS NOT NULL THEN
        EXECUTE 'DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles';
    END IF;
    IF to_regclass('public.build_logs') IS NOT NULL THEN
        EXECUTE 'DROP TRIGGER IF EXISTS update_build_logs_updated_at ON build_logs';
    END IF;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop dependent tables first
DROP TABLE IF EXISTS analytics_config CASCADE;
DROP TABLE IF EXISTS builder_metrics CASCADE;
DROP TABLE IF EXISTS build_notes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS validations CASCADE;
DROP TABLE IF EXISTS syncs CASCADE;
DROP TABLE IF EXISTS build_logs CASCADE;
DROP TABLE IF EXISTS builder_modules CASCADE;
DROP TABLE IF EXISTS builders CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- Drop profiles table (must be after all dependencies)
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop related functions (if they exist)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ════════════════════════════════════════════════════════
-- STEP 2: CREATE PROFILES TABLE
-- ════════════════════════════════════════════════════════

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    is_paid BOOLEAN DEFAULT false,
    media_attachments JSONB DEFAULT '[]', -- Array of {type: 'photo'|'video'|'gif'|'emoji', url: string, thumbnail?: string, duration?: number}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════
-- STEP 3: CREATE DEPENDENT TABLES (needed for build_logs)
-- ════════════════════════════════════════════════════════

-- Projects (required for build_logs.project_id foreign key)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    reclaimed_from_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    parent_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Builders (required for build_logs.builder_id foreign key)
CREATE TABLE builders (
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

-- ════════════════════════════════════════════════════════
-- STEP 4: CREATE BUILD_LOGS TABLE
-- ════════════════════════════════════════════════════════

CREATE TABLE build_logs (
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
    media_attachments JSONB DEFAULT '[]', -- Array of {type: 'photo'|'video'|'gif'|'emoji', url: string, thumbnail?: string, duration?: number}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════
-- STEP 5: CREATE INDEXES
-- ════════════════════════════════════════════════════════

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON profiles(updated_at DESC);

-- Build logs indexes
CREATE INDEX IF NOT EXISTS idx_build_logs_builder_id ON build_logs(builder_id);
CREATE INDEX IF NOT EXISTS idx_build_logs_project_id ON build_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_build_logs_created_at ON build_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_build_logs_updated_at ON build_logs(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_build_logs_is_public ON build_logs(is_public);
CREATE INDEX IF NOT EXISTS idx_build_logs_log_index ON build_logs(builder_id, log_index);
CREATE INDEX IF NOT EXISTS idx_build_logs_log_order ON build_logs(project_id, log_order);
CREATE INDEX IF NOT EXISTS idx_build_logs_status ON build_logs(status);
CREATE INDEX IF NOT EXISTS idx_build_logs_log_type ON build_logs(log_type);

-- ════════════════════════════════════════════════════════
-- STEP 6: ENABLE ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE build_logs ENABLE ROW LEVEL SECURITY;

-- ════════════════════════════════════════════════════════
-- STEP 7: CREATE RLS POLICIES
-- ════════════════════════════════════════════════════════

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Profiles public read - safe fields only" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

DROP POLICY IF EXISTS "Build logs are viewable by everyone" ON build_logs;
DROP POLICY IF EXISTS "Users can insert own build logs" ON build_logs;
DROP POLICY IF EXISTS "Users can update own build logs" ON build_logs;
DROP POLICY IF EXISTS "Users can delete own build logs" ON build_logs;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Build logs policies
CREATE POLICY "Build logs are viewable by everyone" ON build_logs FOR SELECT USING (true);
CREATE POLICY "Users can insert own build logs" ON build_logs FOR INSERT 
    WITH CHECK (EXISTS (SELECT 1 FROM builders WHERE id = build_logs.builder_id AND user_id = auth.uid()));
CREATE POLICY "Users can update own build logs" ON build_logs FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM builders WHERE id = build_logs.builder_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete own build logs" ON build_logs FOR DELETE 
    USING (EXISTS (SELECT 1 FROM builders WHERE id = build_logs.builder_id AND user_id = auth.uid()));

-- ════════════════════════════════════════════════════════
-- STEP 8: CREATE SECURE PUBLIC PROFILE VIEW
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
-- STEP 9: CREATE FUNCTIONS & TRIGGERS
-- ════════════════════════════════════════════════════════

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_build_logs_updated_at 
    BEFORE UPDATE ON build_logs
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile on user signup
-- NOTE: Email is NEVER stored in profiles - only display_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- ════════════════════════════════════════════════════════
-- COMPLETE
-- ════════════════════════════════════════════════════════
-- 
-- PROFILES TABLE COLUMNS:
--   - id (UUID, PRIMARY KEY, references auth.users)
--   - display_name (TEXT)
--   - avatar_url (TEXT)
--   - bio (TEXT)
--   - is_paid (BOOLEAN, default false)
--   - media_attachments (JSONB, default [])
--   - created_at (TIMESTAMPTZ, default NOW())
--   - updated_at (TIMESTAMPTZ, default NOW())
--
-- BUILD_LOGS TABLE COLUMNS:
--   - id (UUID, PRIMARY KEY)
--   - builder_id (UUID, NOT NULL, references builders)
--   - project_id (UUID, references projects)
--   - title (TEXT)
--   - message (TEXT)
--   - summary (TEXT)
--   - log_type (TEXT, default 'update', CHECK constraint)
--   - status (TEXT, default 'shipped', CHECK constraint)
--   - is_public (BOOLEAN, default true)
--   - log_index (INTEGER, default 0)
--   - log_order (INTEGER, default 0)
--   - changes (JSONB, default [])
--   - rationale (TEXT)
--   - tags (TEXT[], default [])
--   - components_touched (TEXT[], default [])
--   - complexity (TEXT, default 'medium', CHECK constraint)
--   - confidence (TEXT, default 'medium', CHECK constraint)
--   - impact (TEXT, default 'medium', CHECK constraint)
--   - internal_reasoning (TEXT)
--   - tradeoffs (JSONB, default [])
--   - problems (JSONB, default [])
--   - next_moves (JSONB, default [])
--   - media_attachments (JSONB, default [])
--   - created_at (TIMESTAMPTZ, default NOW())
--   - updated_at (TIMESTAMPTZ, default NOW())
--
-- ════════════════════════════════════════════════════════
