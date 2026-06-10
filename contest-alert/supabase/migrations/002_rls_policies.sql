-- Contest Alert RLS Policies
-- Migration: 002_rls_policies.sql

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_views ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTION: Check if user is admin
-- ============================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PROFILES POLICIES
-- ============================================================

-- Anyone authenticated can read profiles (for leaderboard, etc.)
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY "profiles_admin_update" ON profiles
  FOR UPDATE USING (is_admin());

-- ============================================================
-- EVENTS POLICIES
-- ============================================================

-- Anyone can read active events (including non-authenticated for landing page)
CREATE POLICY "events_select_active" ON events
  FOR SELECT USING (status = 'active' OR is_admin());

-- Only admins can insert events
CREATE POLICY "events_insert_admin" ON events
  FOR INSERT WITH CHECK (is_admin());

-- Only admins can update events
CREATE POLICY "events_update_admin" ON events
  FOR UPDATE USING (is_admin());

-- Only admins can delete events
CREATE POLICY "events_delete_admin" ON events
  FOR DELETE USING (is_admin());

-- ============================================================
-- REGISTRATIONS POLICIES
-- ============================================================

-- Students can view their own registrations
CREATE POLICY "registrations_select_own" ON registrations
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

-- Students can insert their own registrations (via function)
CREATE POLICY "registrations_insert_own" ON registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only admins can delete registrations
CREATE POLICY "registrations_delete_admin" ON registrations
  FOR DELETE USING (is_admin());

-- ============================================================
-- ATTENDANCE POLICIES
-- ============================================================

-- Students can view their own attendance, admins can view all
CREATE POLICY "attendance_select" ON attendance
  FOR SELECT USING (
    is_admin() OR 
    EXISTS (
      SELECT 1 FROM registrations r 
      WHERE r.id = attendance.registration_id AND r.user_id = auth.uid()
    )
  );

-- Only admins can insert attendance
CREATE POLICY "attendance_insert_admin" ON attendance
  FOR INSERT WITH CHECK (is_admin());

-- Only admins can update attendance
CREATE POLICY "attendance_update_admin" ON attendance
  FOR UPDATE USING (is_admin());

-- ============================================================
-- WINNERS POLICIES
-- ============================================================

-- Everyone authenticated can view winners
CREATE POLICY "winners_select" ON winners
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only admins can manage winners
CREATE POLICY "winners_insert_admin" ON winners
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "winners_update_admin" ON winners
  FOR UPDATE USING (is_admin());

CREATE POLICY "winners_delete_admin" ON winners
  FOR DELETE USING (is_admin());

-- ============================================================
-- NOTIFICATIONS POLICIES
-- ============================================================

-- Users can only read their own notifications
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins can insert notifications for any user
CREATE POLICY "notifications_insert_admin" ON notifications
  FOR INSERT WITH CHECK (is_admin() OR auth.uid() = user_id);

-- ============================================================
-- EVENT VIEWS POLICIES
-- ============================================================

-- Admins can read all views
CREATE POLICY "event_views_select_admin" ON event_views
  FOR SELECT USING (is_admin());

-- Anyone authenticated can insert a view
CREATE POLICY "event_views_insert" ON event_views
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- STORAGE POLICIES (for event cover images)
-- ============================================================

-- Create storage bucket for event images
INSERT INTO storage.buckets (id, name, public) VALUES ('event-images', 'event-images', true)
ON CONFLICT DO NOTHING;

-- Anyone can read event images
CREATE POLICY "event_images_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-images');

-- Only admins can upload event images
CREATE POLICY "event_images_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'event-images' AND is_admin());

-- Only admins can update event images
CREATE POLICY "event_images_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'event-images' AND is_admin());

-- Only admins can delete event images
CREATE POLICY "event_images_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'event-images' AND is_admin());
