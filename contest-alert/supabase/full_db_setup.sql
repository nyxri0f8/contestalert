-- Contest Alert Database Schema
-- Migration: 001_initial_schema.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('student', 'admin');

CREATE TYPE event_status AS ENUM ('draft', 'active', 'archived', 'cancelled');

CREATE TYPE event_category AS ENUM (
  'technical',
  'non_technical',
  'hackathon',
  'workshop',
  'symposium',
  'placement',
  'internship',
  'sports',
  'cultural'
);

CREATE TYPE department_type AS ENUM (
  'ECE',
  'CSE',
  'AIDS',
  'AIML',
  'CCE',
  'Biotechnology',
  'Mechanical'
);

CREATE TYPE winner_position AS ENUM ('winner', 'runner_up', 'special_mention');

CREATE TYPE notification_type AS ENUM (
  'registration_success',
  'ticket_generated',
  'event_updated',
  'event_cancelled',
  'deadline_approaching',
  'winner_declared',
  'general'
);

-- ============================================================
-- PROFILES TABLE
-- ============================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  register_number TEXT UNIQUE,
  name TEXT NOT NULL,
  department department_type,
  year INTEGER CHECK (year >= 1 AND year <= 4),
  section TEXT,
  phone TEXT,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  achievement_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_profiles_department ON profiles(department);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_register_number ON profiles(register_number);

-- ============================================================
-- EVENTS TABLE
-- ============================================================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category event_category NOT NULL,
  department department_type,
  cover_image TEXT,
  description TEXT,
  rules TEXT,
  eligibility TEXT,
  venue TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  capacity INTEGER DEFAULT 100,
  fee DECIMAL(10, 2) DEFAULT 0,
  contact_person TEXT,
  contact_email TEXT,
  status event_status DEFAULT 'active',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_department ON events(department);
CREATE INDEX idx_events_event_date ON events(event_date);
CREATE INDEX idx_events_deadline ON events(deadline);

-- ============================================================
-- REGISTRATIONS TABLE
-- ============================================================

CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ticket_id TEXT NOT NULL UNIQUE,
  team_name TEXT,
  phone TEXT,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- Indexes
CREATE INDEX idx_registrations_user ON registrations(user_id);
CREATE INDEX idx_registrations_event ON registrations(event_id);
CREATE INDEX idx_registrations_ticket ON registrations(ticket_id);

-- ============================================================
-- ATTENDANCE TABLE
-- ============================================================

CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID NOT NULL UNIQUE REFERENCES registrations(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  checked_in_by UUID REFERENCES profiles(id)
);

CREATE INDEX idx_attendance_registration ON attendance(registration_id);

-- ============================================================
-- WINNERS TABLE
-- ============================================================

CREATE TABLE winners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  position winner_position NOT NULL,
  declared_at TIMESTAMPTZ DEFAULT NOW(),
  declared_by UUID REFERENCES profiles(id),
  UNIQUE(event_id, position, user_id)
);

CREATE INDEX idx_winners_event ON winners(event_id);
CREATE INDEX idx_winners_user ON winners(user_id);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type DEFAULT 'general',
  is_read BOOLEAN DEFAULT FALSE,
  related_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- ============================================================
-- EVENT VIEWS TABLE (for missed opportunity analytics)
-- ============================================================

CREATE TABLE event_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_event_views_event ON event_views(event_id);
CREATE INDEX idx_event_views_user ON event_views(user_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Generate unique ticket ID: EVT-YYYY-XXXXXX
CREATE OR REPLACE FUNCTION generate_ticket_id()
RETURNS TEXT AS $$
DECLARE
  new_ticket TEXT;
  year_str TEXT;
  random_str TEXT;
  exists_count INTEGER;
BEGIN
  year_str := EXTRACT(YEAR FROM NOW())::TEXT;
  LOOP
    random_str := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    new_ticket := 'EVT-' || year_str || '-' || random_str;
    SELECT COUNT(*) INTO exists_count FROM registrations WHERE ticket_id = new_ticket;
    EXIT WHEN exists_count = 0;
  END LOOP;
  RETURN new_ticket;
END;
$$ LANGUAGE plpgsql;

-- Register for event (atomic with capacity check)
CREATE OR REPLACE FUNCTION register_for_event(
  p_user_id UUID,
  p_event_id UUID,
  p_team_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_event RECORD;
  v_current_count INTEGER;
  v_ticket_id TEXT;
  v_registration_id UUID;
BEGIN
  -- Get event details
  SELECT * INTO v_event FROM events WHERE id = p_event_id AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Event not found or not active');
  END IF;
  
  -- Check deadline
  IF v_event.deadline < NOW() THEN
    RETURN json_build_object('success', false, 'error', 'Registration deadline has passed');
  END IF;
  
  -- Check capacity
  SELECT COUNT(*) INTO v_current_count FROM registrations WHERE event_id = p_event_id;
  
  IF v_current_count >= v_event.capacity THEN
    RETURN json_build_object('success', false, 'error', 'Event is full');
  END IF;
  
  -- Check duplicate registration
  IF EXISTS (SELECT 1 FROM registrations WHERE user_id = p_user_id AND event_id = p_event_id) THEN
    RETURN json_build_object('success', false, 'error', 'Already registered for this event');
  END IF;
  
  -- Generate ticket ID
  v_ticket_id := generate_ticket_id();
  
  -- Create registration
  INSERT INTO registrations (user_id, event_id, ticket_id, team_name, phone)
  VALUES (p_user_id, p_event_id, v_ticket_id, p_team_name, p_phone)
  RETURNING id INTO v_registration_id;
  
  -- Update achievement points (+10 for registration)
  UPDATE profiles SET achievement_points = achievement_points + 10 WHERE id = p_user_id;
  
  -- Create notification
  INSERT INTO notifications (user_id, title, message, type, related_event_id)
  VALUES (
    p_user_id,
    'Registration Successful',
    'You have been registered for ' || v_event.title || '. Your ticket ID is ' || v_ticket_id,
    'registration_success',
    p_event_id
  );
  
  RETURN json_build_object(
    'success', true,
    'registration_id', v_registration_id,
    'ticket_id', v_ticket_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get department leaderboard
CREATE OR REPLACE FUNCTION get_department_leaderboard()
RETURNS TABLE (
  department department_type,
  total_points BIGINT,
  total_registrations BIGINT,
  total_attendance BIGINT,
  total_wins BIGINT,
  attendance_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH dept_registrations AS (
    SELECT p.department, COUNT(*) as reg_count
    FROM registrations r
    JOIN profiles p ON r.user_id = p.id
    WHERE p.department IS NOT NULL
    GROUP BY p.department
  ),
  dept_attendance AS (
    SELECT p.department, COUNT(*) as att_count
    FROM attendance a
    JOIN registrations r ON a.registration_id = r.id
    JOIN profiles p ON r.user_id = p.id
    WHERE p.department IS NOT NULL
    GROUP BY p.department
  ),
  dept_wins AS (
    SELECT p.department,
      SUM(CASE WHEN w.position = 'winner' THEN 1 ELSE 0 END) as win_count,
      SUM(CASE WHEN w.position = 'runner_up' THEN 1 ELSE 0 END) as runner_count
    FROM winners w
    JOIN profiles p ON w.user_id = p.id
    WHERE p.department IS NOT NULL
    GROUP BY p.department
  )
  SELECT 
    d.dept AS department,
    COALESCE(dr.reg_count * 10, 0) + 
    COALESCE(da.att_count * 20, 0) + 
    COALESCE(dw.win_count * 50, 0) + 
    COALESCE(dw.runner_count * 30, 0) AS total_points,
    COALESCE(dr.reg_count, 0) AS total_registrations,
    COALESCE(da.att_count, 0) AS total_attendance,
    COALESCE(dw.win_count, 0) AS total_wins,
    CASE WHEN COALESCE(dr.reg_count, 0) > 0 
      THEN ROUND((COALESCE(da.att_count, 0)::NUMERIC / dr.reg_count) * 100, 1)
      ELSE 0 
    END AS attendance_rate
  FROM (
    SELECT UNNEST(ENUM_RANGE(NULL::department_type)) AS dept
  ) d
  LEFT JOIN dept_registrations dr ON d.dept = dr.department
  LEFT JOIN dept_attendance da ON d.dept = da.department
  LEFT JOIN dept_wins dw ON d.dept = dw.department
  ORDER BY total_points DESC;
END;
$$ LANGUAGE plpgsql;

-- Get event analytics (missed opportunity)
CREATE OR REPLACE FUNCTION get_event_analytics(p_event_id UUID)
RETURNS JSON AS $$
DECLARE
  v_views BIGINT;
  v_registrations BIGINT;
  v_conversion NUMERIC;
  v_dept_breakdown JSON;
BEGIN
  SELECT COUNT(*) INTO v_views FROM event_views WHERE event_id = p_event_id;
  SELECT COUNT(*) INTO v_registrations FROM registrations WHERE event_id = p_event_id;
  
  v_conversion := CASE WHEN v_views > 0 
    THEN ROUND((v_registrations::NUMERIC / v_views) * 100, 1) 
    ELSE 0 
  END;
  
  SELECT json_agg(row_to_json(t)) INTO v_dept_breakdown
  FROM (
    SELECT 
      p.department,
      COUNT(DISTINCT ev.user_id) as views,
      COUNT(DISTINCT r.user_id) as registrations
    FROM event_views ev
    JOIN profiles p ON ev.user_id = p.id
    LEFT JOIN registrations r ON r.event_id = ev.event_id AND r.user_id = ev.user_id
    WHERE ev.event_id = p_event_id AND p.department IS NOT NULL
    GROUP BY p.department
  ) t;
  
  RETURN json_build_object(
    'views', v_views,
    'registrations', v_registrations,
    'conversion_rate', v_conversion,
    'department_breakdown', COALESCE(v_dept_breakdown, '[]'::JSON)
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'New User'),
    'student'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
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
-- Create trigger to automatically sync profiles table updates back to auth.users raw_user_meta_data.
-- This ensures that JWT tokens contain the up-to-date role and onboarding status without querying the database in Next.js middleware.

CREATE OR REPLACE FUNCTION sync_profile_to_auth_metadata()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = 
    coalesce(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'role', NEW.role,
      'onboarding_completed', NEW.onboarding_completed
    )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync profile updates to auth metadata
DROP TRIGGER IF EXISTS on_profile_changed ON profiles;
CREATE TRIGGER on_profile_changed
  AFTER INSERT OR UPDATE OF role, onboarding_completed ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_to_auth_metadata();
-- Migration: 004_optimize_rls_policies.sql
-- Optimizes Row-Level Security (RLS) policies using subquery caching.
-- Hardens SECURITY DEFINER functions with explicit search paths and schema qualifications.

-- ============================================================
-- 1. HARDEN SECURITY DEFINER & INVOKER FUNCTIONS
-- ============================================================

-- A. update_updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = pg_catalog.now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- B. is_admin helper function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin'::public.user_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- C. generate_ticket_id function
CREATE OR REPLACE FUNCTION public.generate_ticket_id()
RETURNS TEXT AS $$
DECLARE
  new_ticket TEXT;
  year_str TEXT;
  random_str TEXT;
  exists_count INTEGER;
BEGIN
  year_str := EXTRACT(YEAR FROM pg_catalog.now())::TEXT;
  LOOP
    random_str := UPPER(SUBSTRING(pg_catalog.md5(pg_catalog.random()::TEXT) FROM 1 FOR 6));
    new_ticket := 'EVT-' || year_str || '-' || random_str;
    SELECT COUNT(*) INTO exists_count FROM public.registrations WHERE ticket_id = new_ticket;
    EXIT WHEN exists_count = 0;
  END LOOP;
  RETURN new_ticket;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- D. register_for_event function
CREATE OR REPLACE FUNCTION public.register_for_event(
  p_user_id UUID,
  p_event_id UUID,
  p_team_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_event RECORD;
  v_current_count INTEGER;
  v_ticket_id TEXT;
  v_registration_id UUID;
BEGIN
  -- Get event details
  SELECT * INTO v_event FROM public.events WHERE id = p_event_id AND status = 'active'::public.event_status;
  
  IF NOT FOUND THEN
    RETURN pg_catalog.json_build_object('success', false, 'error', 'Event not found or not active');
  END IF;
  
  -- Check deadline
  IF v_event.deadline < pg_catalog.now() THEN
    RETURN pg_catalog.json_build_object('success', false, 'error', 'Registration deadline has passed');
  END IF;
  
  -- Check capacity
  SELECT COUNT(*) INTO v_current_count FROM public.registrations WHERE event_id = p_event_id;
  
  IF v_current_count >= v_event.capacity THEN
    RETURN pg_catalog.json_build_object('success', false, 'error', 'Event is full');
  END IF;
  
  -- Check duplicate registration
  IF EXISTS (SELECT 1 FROM public.registrations WHERE user_id = p_user_id AND event_id = p_event_id) THEN
    RETURN pg_catalog.json_build_object('success', false, 'error', 'Already registered for this event');
  END IF;
  
  -- Generate ticket ID
  v_ticket_id := public.generate_ticket_id();
  
  -- Create registration
  INSERT INTO public.registrations (user_id, event_id, ticket_id, team_name, phone)
  VALUES (p_user_id, p_event_id, v_ticket_id, p_team_name, p_phone)
  RETURNING id INTO v_registration_id;
  
  -- Update achievement points (+10 for registration)
  UPDATE public.profiles SET achievement_points = achievement_points + 10 WHERE id = p_user_id;
  
  -- Create notification
  INSERT INTO public.notifications (user_id, title, message, type, related_event_id)
  VALUES (
    p_user_id,
    'Registration Successful',
    'You have been registered for ' || v_event.title || '. Your ticket ID is ' || v_ticket_id,
    'registration_success'::public.notification_type,
    p_event_id
  );
  
  RETURN pg_catalog.json_build_object(
    'success', true,
    'registration_id', v_registration_id,
    'ticket_id', v_ticket_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- E. get_department_leaderboard function
CREATE OR REPLACE FUNCTION public.get_department_leaderboard()
RETURNS TABLE (
  department public.department_type,
  total_points BIGINT,
  total_registrations BIGINT,
  total_attendance BIGINT,
  total_wins BIGINT,
  attendance_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH dept_registrations AS (
    SELECT p.department, COUNT(*) as reg_count
    FROM public.registrations r
    JOIN public.profiles p ON r.user_id = p.id
    WHERE p.department IS NOT NULL
    GROUP BY p.department
  ),
  dept_attendance AS (
    SELECT p.department, COUNT(*) as att_count
    FROM public.attendance a
    JOIN public.registrations r ON a.registration_id = r.id
    JOIN public.profiles p ON r.user_id = p.id
    WHERE p.department IS NOT NULL
    GROUP BY p.department
  ),
  dept_wins AS (
    SELECT p.department,
      SUM(CASE WHEN w.position = 'winner'::public.winner_position THEN 1 ELSE 0 END) as win_count,
      SUM(CASE WHEN w.position = 'runner_up'::public.winner_position THEN 1 ELSE 0 END) as runner_count
    FROM public.winners w
    JOIN public.profiles p ON w.user_id = p.id
    WHERE p.department IS NOT NULL
    GROUP BY p.department
  )
  SELECT 
    d.dept AS department,
    COALESCE(dr.reg_count * 10, 0) + 
    COALESCE(da.att_count * 20, 0) + 
    COALESCE(dw.win_count * 50, 0) + 
    COALESCE(dw.runner_count * 30, 0) AS total_points,
    COALESCE(dr.reg_count, 0) AS total_registrations,
    COALESCE(da.att_count, 0) AS total_attendance,
    COALESCE(dw.win_count, 0) AS total_wins,
    CASE WHEN COALESCE(dr.reg_count, 0) > 0 
      THEN pg_catalog.round((COALESCE(da.att_count, 0)::NUMERIC / dr.reg_count) * 100, 1)
      ELSE 0 
    END AS attendance_rate
  FROM (
    SELECT UNNEST(pg_catalog.enum_range(NULL::public.department_type)) AS dept
  ) d
  LEFT JOIN dept_registrations dr ON d.dept = dr.department
  LEFT JOIN dept_attendance da ON d.dept = da.department
  LEFT JOIN dept_wins dw ON d.dept = dw.department
  ORDER BY total_points DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- F. get_event_analytics function
CREATE OR REPLACE FUNCTION public.get_event_analytics(p_event_id UUID)
RETURNS JSON AS $$
DECLARE
  v_views BIGINT;
  v_registrations BIGINT;
  v_conversion NUMERIC;
  v_dept_breakdown JSON;
BEGIN
  SELECT COUNT(*) INTO v_views FROM public.event_views WHERE event_id = p_event_id;
  SELECT COUNT(*) INTO v_registrations FROM public.registrations WHERE event_id = p_event_id;
  
  v_conversion := CASE WHEN v_views > 0 
    THEN pg_catalog.round((v_registrations::NUMERIC / v_views) * 100, 1) 
    ELSE 0 
  END;
  
  SELECT pg_catalog.json_agg(pg_catalog.row_to_json(t)) INTO v_dept_breakdown
  FROM (
    SELECT 
      p.department,
      COUNT(DISTINCT ev.user_id) as views,
      COUNT(DISTINCT r.user_id) as registrations
    FROM public.event_views ev
    JOIN public.profiles p ON ev.user_id = p.id
    LEFT JOIN public.registrations r ON r.event_id = ev.event_id AND r.user_id = ev.user_id
    WHERE ev.event_id = p_event_id AND p.department IS NOT NULL
    GROUP BY p.department
  ) t;
  
  RETURN pg_catalog.json_build_object(
    'views', v_views,
    'registrations', v_registrations,
    'conversion_rate', v_conversion,
    'department_breakdown', COALESCE(v_dept_breakdown, '[]'::JSON)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- G. handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'New User'),
    'student'::public.user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- H. sync_profile_to_auth_metadata trigger function
CREATE OR REPLACE FUNCTION public.sync_profile_to_auth_metadata()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = 
    coalesce(raw_user_meta_data, '{}'::jsonb) || 
    pg_catalog.jsonb_build_object(
      'role', NEW.role,
      'onboarding_completed', NEW.onboarding_completed
    )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';


-- ============================================================
-- 2. DROP AND RE-CREATE RLS POLICIES WITH SUBQUERY CACHING
-- ============================================================

-- --- A. PROFILES TABLE ---
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING ((SELECT auth.uid()) = id);

CREATE POLICY "profiles_admin_update" ON public.profiles
  FOR UPDATE USING ((SELECT public.is_admin()));

-- --- B. EVENTS TABLE ---
DROP POLICY IF EXISTS "events_select_active" ON public.events;
DROP POLICY IF EXISTS "events_insert_admin" ON public.events;
DROP POLICY IF EXISTS "events_update_admin" ON public.events;
DROP POLICY IF EXISTS "events_delete_admin" ON public.events;

CREATE POLICY "events_select_active" ON public.events
  FOR SELECT USING (status = 'active'::public.event_status OR (SELECT public.is_admin()));

CREATE POLICY "events_insert_admin" ON public.events
  FOR INSERT WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "events_update_admin" ON public.events
  FOR UPDATE USING ((SELECT public.is_admin()));

CREATE POLICY "events_delete_admin" ON public.events
  FOR DELETE USING ((SELECT public.is_admin()));

-- --- C. REGISTRATIONS TABLE ---
DROP POLICY IF EXISTS "registrations_select_own" ON public.registrations;
DROP POLICY IF EXISTS "registrations_insert_own" ON public.registrations;
DROP POLICY IF EXISTS "registrations_delete_admin" ON public.registrations;

CREATE POLICY "registrations_select_own" ON public.registrations
  FOR SELECT USING ((SELECT auth.uid()) = user_id OR (SELECT public.is_admin()));

CREATE POLICY "registrations_insert_own" ON public.registrations
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "registrations_delete_admin" ON public.registrations
  FOR DELETE USING ((SELECT public.is_admin()));

-- --- D. ATTENDANCE TABLE ---
DROP POLICY IF EXISTS "attendance_select" ON public.attendance;
DROP POLICY IF EXISTS "attendance_insert_admin" ON public.attendance;
DROP POLICY IF EXISTS "attendance_update_admin" ON public.attendance;

CREATE POLICY "attendance_select" ON public.attendance
  FOR SELECT USING (
    (SELECT public.is_admin()) OR 
    EXISTS (
      SELECT 1 FROM public.registrations r 
      WHERE r.id = attendance.registration_id AND r.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "attendance_insert_admin" ON public.attendance
  FOR INSERT WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "attendance_update_admin" ON public.attendance
  FOR UPDATE USING ((SELECT public.is_admin()));

-- --- E. WINNERS TABLE ---
DROP POLICY IF EXISTS "winners_select" ON public.winners;
DROP POLICY IF EXISTS "winners_insert_admin" ON public.winners;
DROP POLICY IF EXISTS "winners_update_admin" ON public.winners;
DROP POLICY IF EXISTS "winners_delete_admin" ON public.winners;

CREATE POLICY "winners_select" ON public.winners
  FOR SELECT USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "winners_insert_admin" ON public.winners
  FOR INSERT WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "winners_update_admin" ON public.winners
  FOR UPDATE USING ((SELECT public.is_admin()));

CREATE POLICY "winners_delete_admin" ON public.winners
  FOR DELETE USING ((SELECT public.is_admin()));

-- --- F. NOTIFICATIONS TABLE ---
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_admin" ON public.notifications;

CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "notifications_insert_admin" ON public.notifications
  FOR INSERT WITH CHECK ((SELECT public.is_admin()) OR (SELECT auth.uid()) = user_id);

-- --- G. EVENT VIEWS TABLE ---
DROP POLICY IF EXISTS "event_views_select_admin" ON public.event_views;
DROP POLICY IF EXISTS "event_views_insert" ON public.event_views;

CREATE POLICY "event_views_select_admin" ON public.event_views
  FOR SELECT USING ((SELECT public.is_admin()));

CREATE POLICY "event_views_insert" ON public.event_views
  FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- --- H. STORAGE OBJECTS (BUCKET POLICIES) ---
DROP POLICY IF EXISTS "event_images_select" ON storage.objects;
DROP POLICY IF EXISTS "event_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "event_images_update" ON storage.objects;
DROP POLICY IF EXISTS "event_images_delete" ON storage.objects;

CREATE POLICY "event_images_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-images');

CREATE POLICY "event_images_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'event-images' AND (SELECT public.is_admin()));

CREATE POLICY "event_images_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'event-images' AND (SELECT public.is_admin()));

CREATE POLICY "event_images_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'event-images' AND (SELECT public.is_admin()));
-- ============================================================
-- Migration 005: Internal/External Event System
-- Adds event_type, hosted_by, coordinator details, external link
-- ============================================================

-- 1. New enum types
DO $$ BEGIN
  CREATE TYPE public.event_type AS ENUM ('internal', 'external');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.hosted_by_type AS ENUM ('department', 'innovation_cell', 'clubs', 'others');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add new columns to events table
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS event_type public.event_type DEFAULT 'internal'::public.event_type,
  ADD COLUMN IF NOT EXISTS hosted_by public.hosted_by_type DEFAULT 'department'::public.hosted_by_type,
  ADD COLUMN IF NOT EXISTS hosted_by_name TEXT,
  ADD COLUMN IF NOT EXISTS registration_open TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS registration_close TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS student_coordinator_name TEXT,
  ADD COLUMN IF NOT EXISTS student_coordinator_phone TEXT,
  ADD COLUMN IF NOT EXISTS student_coordinator_email TEXT,
  ADD COLUMN IF NOT EXISTS faculty_coordinator_name TEXT,
  ADD COLUMN IF NOT EXISTS faculty_coordinator_phone TEXT,
  ADD COLUMN IF NOT EXISTS faculty_coordinator_email TEXT,
  ADD COLUMN IF NOT EXISTS external_link TEXT;

-- 3. Add is_external_confirmation to registrations
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS is_external_confirmation BOOLEAN DEFAULT FALSE;

-- 4. Backfill: set existing events as internal, copy contact_person → faculty_coordinator_name
UPDATE public.events
SET
  event_type = 'internal',
  faculty_coordinator_name = COALESCE(faculty_coordinator_name, contact_person),
  faculty_coordinator_email = COALESCE(faculty_coordinator_email, contact_email),
  registration_close = COALESCE(registration_close, deadline)
WHERE event_type IS NULL OR faculty_coordinator_name IS NULL;

-- 5. Index on event_type for filtered queries
CREATE INDEX IF NOT EXISTS idx_events_event_type ON public.events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_hosted_by ON public.events(hosted_by);

-- 6. Updated register_for_event to handle external confirmation
CREATE OR REPLACE FUNCTION public.register_for_event(
  p_user_id UUID,
  p_event_id UUID,
  p_team_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_is_external_confirmation BOOLEAN DEFAULT FALSE
)
RETURNS JSON AS $$
DECLARE
  v_event RECORD;
  v_current_count INTEGER;
  v_ticket_id TEXT;
  v_registration_id UUID;
BEGIN
  -- Get event details
  SELECT * INTO v_event FROM public.events WHERE id = p_event_id AND status = 'active'::public.event_status;
  
  IF NOT FOUND THEN
    RETURN pg_catalog.json_build_object('success', false, 'error', 'Event not found or not active');
  END IF;
  
  -- For internal events: check deadline and capacity
  IF v_event.event_type = 'internal'::public.event_type THEN
    -- Check deadline (use registration_close if set, else deadline)
    IF COALESCE(v_event.registration_close, v_event.deadline) < pg_catalog.now() THEN
      RETURN pg_catalog.json_build_object('success', false, 'error', 'Registration deadline has passed');
    END IF;
    
    -- Check capacity
    SELECT COUNT(*) INTO v_current_count FROM public.registrations WHERE event_id = p_event_id;
    
    IF v_current_count >= v_event.capacity THEN
      RETURN pg_catalog.json_build_object('success', false, 'error', 'Event is full');
    END IF;
  END IF;
  
  -- Check duplicate registration
  IF EXISTS (SELECT 1 FROM public.registrations WHERE user_id = p_user_id AND event_id = p_event_id) THEN
    RETURN pg_catalog.json_build_object('success', false, 'error', 'Already registered for this event');
  END IF;
  
  -- Generate ticket ID
  v_ticket_id := public.generate_ticket_id();
  
  -- Create registration
  INSERT INTO public.registrations (user_id, event_id, ticket_id, team_name, phone, is_external_confirmation)
  VALUES (p_user_id, p_event_id, v_ticket_id, p_team_name, p_phone, p_is_external_confirmation)
  RETURNING id INTO v_registration_id;
  
  -- Update achievement points (+10 for registration)
  UPDATE public.profiles SET achievement_points = achievement_points + 10 WHERE id = p_user_id;
  
  -- Create notification
  INSERT INTO public.notifications (user_id, title, message, type, related_event_id)
  VALUES (
    p_user_id,
    CASE WHEN p_is_external_confirmation 
      THEN 'External Registration Confirmed'
      ELSE 'Registration Successful'
    END,
    CASE WHEN p_is_external_confirmation
      THEN 'You confirmed your external registration for ' || v_event.title || '. Ticket: ' || v_ticket_id
      ELSE 'You have been registered for ' || v_event.title || '. Your ticket ID is ' || v_ticket_id
    END,
    'registration_success'::public.notification_type,
    p_event_id
  );
  
  RETURN pg_catalog.json_build_object(
    'success', true,
    'registration_id', v_registration_id,
    'ticket_id', v_ticket_id,
    'is_external', p_is_external_confirmation
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
-- Migration: 006_add_secondary_email.sql
-- Add secondary_email column to profiles table for backup email address

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS secondary_email TEXT;
