-- ════════════════════════════════════════════════════════
-- PARKS SYSTEM — Bio Column Migration
-- Adds bio column to profiles table if it doesn't exist
-- ════════════════════════════════════════════════════════

-- Add bio column to profiles (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'bio'
    ) THEN
        ALTER TABLE profiles ADD COLUMN bio TEXT;
    END IF;
END $$;

-- ════════════════════════════════════════════════════════
-- Update public_profile_view to include bio
-- ════════════════════════════════════════════════════════

DROP VIEW IF EXISTS public_profile_view CASCADE;

CREATE VIEW public_profile_view AS
SELECT 
    id,
    display_name,
    avatar_url,
    bio,
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
