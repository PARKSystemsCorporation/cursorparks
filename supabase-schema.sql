-- ════════════════════════════════════════════════════════
-- PARKS SYSTEM — Supabase Schema
-- Complete database schema with IF EXISTS DROP statements
-- ════════════════════════════════════════════════════════

-- Drop tables in reverse dependency order (children first)
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
DROP TABLE IF EXISTS profiles CASCADE;

-- Chat system tables (if they exist)
DROP TABLE IF EXISTS chat_decay CASCADE;
DROP TABLE IF EXISTS chat_long CASCADE;
DROP TABLE IF EXISTS chat_medium CASCADE;
DROP TABLE IF EXISTS chat_message_counter CASCADE;
DROP TABLE IF EXISTS chat_phrases CASCADE;
DROP TABLE IF EXISTS chat_purgatory CASCADE;
DROP TABLE IF EXISTS chat_short CASCADE;
DROP TABLE IF EXISTS cora_config CASCADE;
DROP TABLE IF EXISTS cora_cycle_counter CASCADE;
DROP TABLE IF EXISTS cora_memory CASCADE;
DROP TABLE IF EXISTS decay CASCADE;
DROP TABLE IF EXISTS purgatory CASCADE;
DROP TABLE IF EXISTS live_data CASCADE;
DROP TABLE IF EXISTS live_messages CASCADE;
DROP TABLE IF EXISTS messages CASCADE;

-- ════════════════════════════════════════════════════════
-- CORE TABLES
-- ════════════════════════════════════════════════════════

-- Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    github TEXT,
    is_paid BOOLEAN DEFAULT false,
    media_attachments JSONB DEFAULT '[]', -- Array of {type: 'photo'|'video'|'gif'|'emoji', url: string, thumbnail?: string, duration?: number}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects (optional parent container)
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

-- Builders (main project/builder profiles)
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

-- Build Logs (public build updates)
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
    media_attachments JSONB DEFAULT '[]', -- Array of {type: 'photo'|'video'|'gif'|'emoji', url: string, thumbnail?: string, duration?: number}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Build Notes (private, sync-only notes)
CREATE TABLE IF NOT EXISTS build_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    builder_id UUID REFERENCES builders(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    build_log_id UUID REFERENCES build_logs(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments (public comments on build logs)
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    builder_id UUID REFERENCES builders(id) ON DELETE CASCADE NOT NULL,
    build_log_id UUID REFERENCES build_logs(id) ON DELETE CASCADE,
    content TEXT,
    gif_url TEXT,
    gif_id TEXT,
    media_attachments JSONB DEFAULT '[]', -- Array of {type: 'photo'|'video'|'gif'|'emoji', url: string, thumbnail?: string, duration?: number}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Validations (validates a build/project)
CREATE TABLE IF NOT EXISTS validations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    builder_id UUID REFERENCES builders(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, builder_id)
);

-- Syncs (syncs to someone's profile)
CREATE TABLE IF NOT EXISTS syncs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    builder_id UUID REFERENCES builders(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, builder_id)
);

-- Builder Metrics (analytics snapshots)
CREATE TABLE IF NOT EXISTS builder_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    builder_id UUID REFERENCES builders(id) ON DELETE CASCADE NOT NULL,
    build_log_id UUID REFERENCES build_logs(id) ON DELETE SET NULL,
    metric_type TEXT NOT NULL,
    metrics_snapshot JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics Config (user analytics display preferences)
CREATE TABLE IF NOT EXISTS analytics_config (
    builder_id UUID PRIMARY KEY REFERENCES builders(id) ON DELETE CASCADE,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Builder Modules (optional modules/features)
CREATE TABLE IF NOT EXISTS builder_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    builder_id UUID REFERENCES builders(id) ON DELETE CASCADE NOT NULL,
    module_type TEXT NOT NULL,
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════
-- INDEXES
-- ════════════════════════════════════════════════════════

-- Builders indexes
CREATE INDEX IF NOT EXISTS idx_builders_user_id ON builders(user_id);
CREATE INDEX IF NOT EXISTS idx_builders_project_id ON builders(project_id);
CREATE INDEX IF NOT EXISTS idx_builders_updated_at ON builders(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_builders_state ON builders(state);

-- Build logs indexes
CREATE INDEX IF NOT EXISTS idx_build_logs_builder_id ON build_logs(builder_id);
CREATE INDEX IF NOT EXISTS idx_build_logs_project_id ON build_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_build_logs_created_at ON build_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_build_logs_is_public ON build_logs(is_public);
CREATE INDEX IF NOT EXISTS idx_build_logs_log_index ON build_logs(builder_id, log_index);

-- Build notes indexes
CREATE INDEX IF NOT EXISTS idx_build_notes_builder_id ON build_notes(builder_id);
CREATE INDEX IF NOT EXISTS idx_build_notes_project_id ON build_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_build_notes_build_log_id ON build_notes(build_log_id);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_builder_id ON comments(builder_id);
CREATE INDEX IF NOT EXISTS idx_comments_build_log_id ON comments(build_log_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Validations indexes
CREATE INDEX IF NOT EXISTS idx_validations_user_id ON validations(user_id);
CREATE INDEX IF NOT EXISTS idx_validations_builder_id ON validations(builder_id);

-- Syncs indexes
CREATE INDEX IF NOT EXISTS idx_syncs_user_id ON syncs(user_id);
CREATE INDEX IF NOT EXISTS idx_syncs_builder_id ON syncs(builder_id);

-- Builder metrics indexes
CREATE INDEX IF NOT EXISTS idx_builder_metrics_builder_id ON builder_metrics(builder_id);
CREATE INDEX IF NOT EXISTS idx_builder_metrics_build_log_id ON builder_metrics(build_log_id);
CREATE INDEX IF NOT EXISTS idx_builder_metrics_created_at ON builder_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_builder_metrics_metric_type ON builder_metrics(metric_type);

-- Builder modules indexes
CREATE INDEX IF NOT EXISTS idx_builder_modules_builder_id ON builder_modules(builder_id);
CREATE INDEX IF NOT EXISTS idx_builder_modules_is_active ON builder_modules(is_active);

-- ════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE builders ENABLE ROW LEVEL SECURITY;
ALTER TABLE build_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE build_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE syncs ENABLE ROW LEVEL SECURITY;
ALTER TABLE builder_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE builder_modules ENABLE ROW LEVEL SECURITY;

-- Profiles: Secure public read (safe fields only), users update own
-- Note: For stricter security, use the public_profile_view or the policies in supabase-rls-profiles-secure.sql
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Projects: Users can read all, manage own
CREATE POLICY "Projects are viewable by everyone" ON projects FOR SELECT USING (true);
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

-- Builders: Public read, users manage own
CREATE POLICY "Builders are viewable by everyone" ON builders FOR SELECT USING (true);
CREATE POLICY "Users can insert own builders" ON builders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own builders" ON builders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own builders" ON builders FOR DELETE USING (auth.uid() = user_id);

-- Build Logs: Public read, users manage own
CREATE POLICY "Build logs are viewable by everyone" ON build_logs FOR SELECT USING (true);
CREATE POLICY "Users can insert own build logs" ON build_logs FOR INSERT 
    WITH CHECK (EXISTS (SELECT 1 FROM builders WHERE id = build_logs.builder_id AND user_id = auth.uid()));
CREATE POLICY "Users can update own build logs" ON build_logs FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM builders WHERE id = build_logs.builder_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete own build logs" ON build_logs FOR DELETE 
    USING (EXISTS (SELECT 1 FROM builders WHERE id = build_logs.builder_id AND user_id = auth.uid()));

-- Build Notes: Readable if synced to project owner OR owns project
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
            JOIN syncs s ON s.builder_id = (
                SELECT b.id FROM builders b WHERE b.user_id = p.user_id LIMIT 1
            )
            WHERE p.id = build_notes.project_id AND s.user_id = auth.uid()
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

-- Comments: Public read, authenticated users can post
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Validations: Public read, authenticated users can manage own
CREATE POLICY "Validations are viewable by everyone" ON validations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert validations" ON validations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own validations" ON validations FOR DELETE USING (auth.uid() = user_id);

-- Syncs: Public read, authenticated users can manage own
CREATE POLICY "Syncs are viewable by everyone" ON syncs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert syncs" ON syncs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own syncs" ON syncs FOR DELETE USING (auth.uid() = user_id);

-- Builder Metrics: Public read, system inserts
CREATE POLICY "Builder metrics are viewable by everyone" ON builder_metrics FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert metrics" ON builder_metrics FOR INSERT 
    WITH CHECK (
        EXISTS (SELECT 1 FROM builders WHERE id = builder_metrics.builder_id AND user_id = auth.uid())
    );

-- Analytics Config: Users manage own
CREATE POLICY "Analytics config readable by everyone" ON analytics_config FOR SELECT USING (true);
CREATE POLICY "Users can manage own analytics config" ON analytics_config FOR ALL 
    USING (EXISTS (SELECT 1 FROM builders WHERE id = analytics_config.builder_id AND user_id = auth.uid()));

-- Builder Modules: Public read, users manage own
CREATE POLICY "Builder modules are viewable by everyone" ON builder_modules FOR SELECT USING (true);
CREATE POLICY "Users can manage own builder modules" ON builder_modules FOR ALL 
    USING (EXISTS (SELECT 1 FROM builders WHERE id = builder_modules.builder_id AND user_id = auth.uid()));

-- ════════════════════════════════════════════════════════
-- FUNCTIONS & TRIGGERS
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
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_builders_updated_at BEFORE UPDATE ON builders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_build_logs_updated_at BEFORE UPDATE ON build_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_build_notes_updated_at BEFORE UPDATE ON build_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_config_updated_at BEFORE UPDATE ON analytics_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_builder_modules_updated_at BEFORE UPDATE ON builder_modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile on user signup
-- NOTE: Email is NEVER stored in profiles - only display_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ════════════════════════════════════════════════════════
-- COMPLETE
-- ════════════════════════════════════════════════════════
