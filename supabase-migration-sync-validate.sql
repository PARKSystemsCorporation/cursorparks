-- ════════════════════════════════════════════════════════
-- PARKS SYSTEM — Sync/Validate Migration
-- Migrates from follows/stars to syncs/validations
-- Adds reclaim fields and log_order
-- ════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════
-- STEP 1: Add new columns to existing tables
-- ════════════════════════════════════════════════════════

-- Add reclaim fields to projects
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'reclaimed_from_project_id'
    ) THEN
        ALTER TABLE projects ADD COLUMN reclaimed_from_project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'parent_project_id'
    ) THEN
        ALTER TABLE projects ADD COLUMN parent_project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add log_order to build_logs
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'build_logs' AND column_name = 'log_order'
    ) THEN
        ALTER TABLE build_logs ADD COLUMN log_order INTEGER DEFAULT 0;
        -- Set log_order = log_index for existing logs
        UPDATE build_logs SET log_order = log_index WHERE log_order = 0;
    END IF;
END $$;

-- Add project_id to build_notes
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'build_notes' AND column_name = 'project_id'
    ) THEN
        ALTER TABLE build_notes ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
        -- Migrate existing notes: set project_id from builder's project_id
        UPDATE build_notes bn
        SET project_id = (
            SELECT b.project_id FROM builders b WHERE b.id = bn.builder_id LIMIT 1
        )
        WHERE project_id IS NULL;
    END IF;
END $$;

-- ════════════════════════════════════════════════════════
-- STEP 2: Create new tables (syncs and validations)
-- ════════════════════════════════════════════════════════

-- Create syncs table (if doesn't exist)
CREATE TABLE IF NOT EXISTS syncs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    builder_id UUID REFERENCES builders(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, builder_id)
);

-- Create validations table (if doesn't exist)
CREATE TABLE IF NOT EXISTS validations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    builder_id UUID REFERENCES builders(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, builder_id)
);

-- ════════════════════════════════════════════════════════
-- STEP 3: Migrate data from old tables to new tables
-- ════════════════════════════════════════════════════════

-- Migrate follows → syncs (only if follows table exists and syncs is empty)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'follows')
       AND NOT EXISTS (SELECT 1 FROM syncs LIMIT 1) THEN
        INSERT INTO syncs (user_id, builder_id, created_at)
        SELECT user_id, builder_id, created_at FROM follows
        ON CONFLICT (user_id, builder_id) DO NOTHING;
    END IF;
END $$;

-- Migrate stars → validations (only if stars table exists and validations is empty)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stars')
       AND NOT EXISTS (SELECT 1 FROM validations LIMIT 1) THEN
        INSERT INTO validations (user_id, builder_id, created_at)
        SELECT user_id, builder_id, created_at FROM stars
        ON CONFLICT (user_id, builder_id) DO NOTHING;
    END IF;
END $$;

-- ════════════════════════════════════════════════════════
-- STEP 4: Create indexes
-- ════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_syncs_user_id ON syncs(user_id);
CREATE INDEX IF NOT EXISTS idx_syncs_builder_id ON syncs(builder_id);
CREATE INDEX IF NOT EXISTS idx_validations_user_id ON validations(user_id);
CREATE INDEX IF NOT EXISTS idx_validations_builder_id ON validations(builder_id);
CREATE INDEX IF NOT EXISTS idx_build_notes_project_id ON build_notes(project_id);

-- ════════════════════════════════════════════════════════
-- STEP 5: Enable RLS and create policies
-- ════════════════════════════════════════════════════════

ALTER TABLE syncs ENABLE ROW LEVEL SECURITY;
ALTER TABLE validations ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Syncs are viewable by everyone" ON syncs;
DROP POLICY IF EXISTS "Authenticated users can insert syncs" ON syncs;
DROP POLICY IF EXISTS "Users can delete own syncs" ON syncs;
DROP POLICY IF EXISTS "Validations are viewable by everyone" ON validations;
DROP POLICY IF EXISTS "Authenticated users can insert validations" ON validations;
DROP POLICY IF EXISTS "Users can delete own validations" ON validations;

-- Create syncs policies
CREATE POLICY "Syncs are viewable by everyone" ON syncs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert syncs" ON syncs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own syncs" ON syncs FOR DELETE USING (auth.uid() = user_id);

-- Create validations policies
CREATE POLICY "Validations are viewable by everyone" ON validations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert validations" ON validations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own validations" ON validations FOR DELETE USING (auth.uid() = user_id);

-- Update build_notes policies
DROP POLICY IF EXISTS "Build notes readable if synced or owner" ON build_notes;
DROP POLICY IF EXISTS "Users can insert own build notes" ON build_notes;
DROP POLICY IF EXISTS "Users can update own build notes" ON build_notes;
DROP POLICY IF EXISTS "Users can delete own build notes" ON build_notes;

CREATE POLICY "Build notes readable if synced or owner" ON build_notes FOR SELECT 
    USING (
        -- User owns the project
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = build_notes.project_id AND p.user_id = auth.uid()
        )
        OR
        -- User is synced to the project owner
        EXISTS (
            SELECT 1 FROM projects p
            JOIN builders b ON b.user_id = p.user_id
            JOIN syncs s ON s.builder_id = b.id AND s.user_id = auth.uid()
            WHERE p.id = build_notes.project_id
        )
        OR
        -- User owns the builder
        EXISTS (
            SELECT 1 FROM builders b
            WHERE b.id = build_notes.builder_id AND b.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can insert own build notes" ON build_notes FOR INSERT 
    WITH CHECK (
        EXISTS (SELECT 1 FROM builders WHERE id = build_notes.builder_id AND user_id = auth.uid())
    );
CREATE POLICY "Users can update own build notes" ON build_notes FOR UPDATE 
    USING (
        EXISTS (SELECT 1 FROM builders WHERE id = build_notes.builder_id AND user_id = auth.uid())
    );
CREATE POLICY "Users can delete own build notes" ON build_notes FOR DELETE 
    USING (
        EXISTS (SELECT 1 FROM builders WHERE id = build_notes.builder_id AND user_id = auth.uid())
    );

-- ════════════════════════════════════════════════════════
-- COMPLETE
-- ════════════════════════════════════════════════════════
-- Note: Old tables (follows, stars) are NOT dropped automatically
-- Drop them manually after verifying migration:
-- DROP TABLE IF EXISTS follows CASCADE;
-- DROP TABLE IF EXISTS stars CASCADE;
