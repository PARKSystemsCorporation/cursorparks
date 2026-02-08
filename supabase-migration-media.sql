-- ════════════════════════════════════════════════════════
-- PARKS SYSTEM — Media Support Migration
-- Run this if you already have tables and just need to add media columns
-- ════════════════════════════════════════════════════════

-- Add media_attachments column to profiles (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'media_attachments'
    ) THEN
        ALTER TABLE profiles ADD COLUMN media_attachments JSONB DEFAULT '[]';
    END IF;
END $$;

-- Add media_attachments column to build_logs (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'build_logs' AND column_name = 'media_attachments'
    ) THEN
        ALTER TABLE build_logs ADD COLUMN media_attachments JSONB DEFAULT '[]';
    END IF;
END $$;

-- Add media_attachments column to comments (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' AND column_name = 'media_attachments'
    ) THEN
        ALTER TABLE comments ADD COLUMN media_attachments JSONB DEFAULT '[]';
    END IF;
END $$;

-- ════════════════════════════════════════════════════════
-- COMPLETE
-- ════════════════════════════════════════════════════════
