-- ════════════════════════════════════════════════════════
-- PARKS SYSTEM — Secure Storage RLS Policies
-- CRITICAL: This protects user media files
-- ════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════
-- STEP 1: DROP ALL EXISTING STORAGE POLICIES
-- ════════════════════════════════════════════════════════

-- Drop policies for media-photos bucket
DROP POLICY IF EXISTS "Public read access for media-photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to own folder in media-photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files in media-photos" ON storage.objects;

-- Drop policies for media-videos bucket
DROP POLICY IF EXISTS "Public read access for media-videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to own folder in media-videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files in media-videos" ON storage.objects;

-- Drop policies for media-gifs bucket
DROP POLICY IF EXISTS "Public read access for media-gifs" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to own folder in media-gifs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files in media-gifs" ON storage.objects;

-- Drop policies for media-emojis bucket
DROP POLICY IF EXISTS "Public read access for media-emojis" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to own folder in media-emojis" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files in media-emojis" ON storage.objects;

-- ════════════════════════════════════════════════════════
-- STEP 2: CREATE SECURE STORAGE POLICIES
-- ════════════════════════════════════════════════════════

-- ── MEDIA-PHOTOS BUCKET ──────────────────────────────────

-- Public read: Anyone can view photos (they're public media)
CREATE POLICY "Public read access for media-photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'media-photos');

-- Upload: Users can only upload to their own folder
CREATE POLICY "Users can upload to own folder in media-photos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'media-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Update: Users can only update their own files
CREATE POLICY "Users can update own files in media-photos"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'media-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Delete: Users can only delete their own files
CREATE POLICY "Users can delete own files in media-photos"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'media-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- ── MEDIA-VIDEOS BUCKET ──────────────────────────────────

-- Public read: Anyone can view videos (they're public media)
CREATE POLICY "Public read access for media-videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'media-videos');

-- Upload: Users can only upload to their own folder
CREATE POLICY "Users can upload to own folder in media-videos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'media-videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Update: Users can only update their own files
CREATE POLICY "Users can update own files in media-videos"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'media-videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Delete: Users can only delete their own files
CREATE POLICY "Users can delete own files in media-videos"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'media-videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- ── MEDIA-GIFS BUCKET ────────────────────────────────────

-- Public read: Anyone can view GIFs (they're public media)
CREATE POLICY "Public read access for media-gifs"
ON storage.objects FOR SELECT
USING (bucket_id = 'media-gifs');

-- Upload: Users can only upload to their own folder
CREATE POLICY "Users can upload to own folder in media-gifs"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'media-gifs' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Update: Users can only update their own files
CREATE POLICY "Users can update own files in media-gifs"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'media-gifs' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Delete: Users can only delete their own files
CREATE POLICY "Users can delete own files in media-gifs"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'media-gifs' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- ── MEDIA-EMOJIS BUCKET ───────────────────────────────────

-- Public read: Anyone can view emojis (they're public media)
CREATE POLICY "Public read access for media-emojis"
ON storage.objects FOR SELECT
USING (bucket_id = 'media-emojis');

-- Upload: Users can only upload to their own folder
CREATE POLICY "Users can upload to own folder in media-emojis"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'media-emojis' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Update: Users can only update their own files
CREATE POLICY "Users can update own files in media-emojis"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'media-emojis' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Delete: Users can only delete their own files
CREATE POLICY "Users can delete own files in media-emojis"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'media-emojis' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- ════════════════════════════════════════════════════════
-- COMPLETE
-- ════════════════════════════════════════════════════════
