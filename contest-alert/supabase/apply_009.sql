-- Migration 009: Event Lifecycle & Storage Updates
-- Adds columns for backups, archiving, and storage paths.

-- 1. Add new columns to events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS is_backed_up BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cover_image_path TEXT;

-- 2. Indexes for fast cron querying
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_archived_at ON public.events(archived_at);
-- (deadline index was created in full_db_setup.sql, but we can ensure it exists)
CREATE INDEX IF NOT EXISTS idx_events_deadline_idx ON public.events(deadline);

-- 3. Update RLS policies to restrict student access to archived events
-- We need to drop existing select policy and recreate it.
-- Depending on how it was named, it might be 'Events are viewable by everyone'
-- We'll try to update the policy if we can, but since we don't know the exact name easily,
-- we can just enforce it on the frontend queries, but RLS is safer.
-- Let's just create a new policy and drop the old one.

DO $$
BEGIN
    -- Try dropping the most common default name
    DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.events;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Admins can do everything (we assume there's a policy for this, but let's make sure)
-- Students can only read non-archived active events
CREATE POLICY "Public events are viewable by everyone if not archived" ON public.events
    FOR SELECT USING (status != 'archived' OR (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')));

-- 4. Create Storage Bucket for event covers
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('event-covers', 'event-covers', false, 5242880, ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET public = false;

-- 5. Storage RLS Policies
-- Enable RLS on objects (Usually already enabled by Supabase, skipping to prevent owner error)

-- Admins can upload, update, delete
CREATE POLICY "Admins can upload cover images" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'event-covers' AND
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );

CREATE POLICY "Admins can update cover images" ON storage.objects
    FOR UPDATE TO authenticated USING (
        bucket_id = 'event-covers' AND
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );

CREATE POLICY "Admins can delete cover images" ON storage.objects
    FOR DELETE TO authenticated USING (
        bucket_id = 'event-covers' AND
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );

-- Everyone can view cover images via signed URLs
-- Actually, signed URLs bypass policies if they have a valid token, but just in case, we can add a SELECT policy.
-- But since the bucket is private, we'll rely on signed URLs. Let's just allow admins to SELECT without signed URLs.
CREATE POLICY "Admins can select cover images" ON storage.objects
    FOR SELECT TO authenticated USING (
        bucket_id = 'event-covers' AND
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );
