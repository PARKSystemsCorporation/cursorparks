-- ════════════════════════════════════════════════════════
-- PARKS SYSTEM — Profiles Schema (Drop + Create)
-- Includes all profile fields used by the app UI
-- ════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════
-- STEP 1: DROP EXISTING OBJECTS
-- ════════════════════════════════════════════════════════

DROP VIEW IF EXISTS public_profile_view CASCADE;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP FUNCTION IF EXISTS update_profiles_updated_at_column() CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ════════════════════════════════════════════════════════
-- STEP 2: CREATE PROFILES TABLE
-- ════════════════════════════════════════════════════════

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    website TEXT,
    location TEXT,
    twitter TEXT,
    github TEXT,
    is_paid BOOLEAN DEFAULT false,
    media_attachments JSONB DEFAULT '[]', -- Array of {type: 'photo'|'video'|'gif'|'emoji', url: string, thumbnail?: string, duration?: number}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT username_format_chk
        CHECK (
            username IS NULL
            OR username = ''
            OR username ~ '^[A-Za-z0-9_]{3,20}$'
        )
);

-- ════════════════════════════════════════════════════════
-- STEP 3: INDEXES
-- ════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON profiles(updated_at DESC);

-- ════════════════════════════════════════════════════════
-- STEP 4: UPDATED_AT TRIGGER
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_profiles_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_profiles_updated_at_column();

-- ════════════════════════════════════════════════════════
-- STEP 5: PUBLIC PROFILE VIEW (SAFE FIELDS ONLY)
-- ════════════════════════════════════════════════════════

CREATE VIEW public_profile_view AS
SELECT
    id,
    username,
    display_name,
    avatar_url,
    bio,
    website,
    location,
    twitter,
    github,
    media_attachments,
    is_paid,
    created_at,
    updated_at
FROM profiles;

GRANT SELECT ON public_profile_view TO anon, authenticated;

-- ════════════════════════════════════════════════════════
-- COMPLETE
-- ════════════════════════════════════════════════════════
