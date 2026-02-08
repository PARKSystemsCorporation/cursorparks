-- ════════════════════════════════════════════════════════
-- PARKS SYSTEM — Builder Profile Visibility Migration
-- Adds profile visibility and section toggles
-- ════════════════════════════════════════════════════════

ALTER TABLE builders
    ADD COLUMN IF NOT EXISTS profile_visibility TEXT DEFAULT 'public',
    ADD COLUMN IF NOT EXISTS show_public_logs BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS show_stats BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS show_metrics BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS show_modules BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS show_analytics BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS show_notes BOOLEAN DEFAULT true;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'builders_profile_visibility_chk'
    ) THEN
        ALTER TABLE builders
            ADD CONSTRAINT builders_profile_visibility_chk
            CHECK (profile_visibility IN ('public', 'private', 'archived'));
    END IF;
END $$;

-- ════════════════════════════════════════════════════════
-- COMPLETE
-- ════════════════════════════════════════════════════════
