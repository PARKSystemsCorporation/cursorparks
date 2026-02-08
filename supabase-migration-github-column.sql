-- ════════════════════════════════════════════════════════
-- PARKS SYSTEM — Add GitHub Column to Profiles
-- Adds github column to existing profiles table
-- ════════════════════════════════════════════════════════

-- Add github column to profiles (if it doesn't exist)
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
-- Update public_profile_view to include github
-- ════════════════════════════════════════════════════════

DROP VIEW IF EXISTS public_profile_view CASCADE;

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
-- COMPLETE
-- ════════════════════════════════════════════════════════
