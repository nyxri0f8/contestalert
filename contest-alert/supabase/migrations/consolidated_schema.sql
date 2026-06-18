-- Contest Alert Consolidated Database Schema (Optimized & Secured)
-- File: supabase/migrations/consolidated_schema.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. ENUM TYPES
-- ============================================================

CREATE TYPE public.user_role AS ENUM ('student', 'admin');

CREATE TYPE public.event_status AS ENUM ('draft', 'active', 'archived', 'cancelled');

CREATE TYPE public.event_category AS ENUM (
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

CREATE TYPE public.department_type AS ENUM (
  'ECE',
  'CSE',
  'AIDS',
  'AIML',
  'CCE',
  'Biotechnology',
  'Mechanical'
);

CREATE TYPE public.winner_position AS ENUM ('winner', 'runner_up', 'special_mention');

CREATE TYPE public.notification_type AS ENUM (
  'registration_success',
  'ticket_generated',
  'event_updated',
  'event_cancelled',
  'deadline_approaching',
  'winner_declared',
  'general'
);

-- ============================================================
-- 2. TABLES
-- ============================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  register_number TEXT UNIQUE,
  name TEXT NOT NULL,
  department public.department_type,
  year INTEGER CHECK (year >= 1 AND year <= 4),
  section TEXT,
  phone TEXT,
  email TEXT NOT NULL,
  role public.user_role NOT NULL DEFAULT 'student'::public.user_role,
  secondary_email TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  achievement_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category public.event_category NOT NULL,
  department public.department_type,
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
  status public.event_status DEFAULT 'active'::public.event_status,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  ticket_id TEXT NOT NULL UNIQUE,
  team_name TEXT,
  phone TEXT,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID NOT NULL UNIQUE REFERENCES public.registrations(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  checked_in_by UUID REFERENCES public.profiles(id)
);

CREATE TABLE public.winners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  position public.winner_position NOT NULL,
  declared_at TIMESTAMPTZ DEFAULT NOW(),
  declared_by UUID REFERENCES public.profiles(id),
  UNIQUE(event_id, position, user_id)
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type public.notification_type DEFAULT 'general'::public.notification_type,
  is_read BOOLEAN DEFAULT FALSE,
  related_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.event_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX idx_profiles_department ON public.profiles(department);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_register_number ON public.profiles(register_number);

CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_category ON public.events(category);
CREATE INDEX idx_events_department ON public.events(department);
CREATE INDEX idx_events_event_date ON public.events(event_date);
CREATE INDEX idx_events_deadline ON public.events(deadline);

CREATE INDEX idx_registrations_user ON public.registrations(user_id);
CREATE INDEX idx_registrations_event ON public.registrations(event_id);
CREATE INDEX idx_registrations_ticket ON public.registrations(ticket_id);

CREATE INDEX idx_attendance_registration ON public.attendance(registration_id);

CREATE INDEX idx_winners_event ON public.winners(event_id);
CREATE INDEX idx_winners_user ON public.winners(user_id);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;

CREATE INDEX idx_event_views_event ON public.event_views(event_id);
CREATE INDEX idx_event_views_user ON public.event_views(user_id);

-- ============================================================
-- 4. SECURED & OPTIMIZED DATABASE FUNCTIONS
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
-- 5. TRIGGERS
-- ============================================================

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_profile_changed ON public.profiles;
CREATE TRIGGER on_profile_changed
  AFTER INSERT OR UPDATE OF role, onboarding_completed ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_to_auth_metadata();

-- ============================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_views ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 7. CACHED ROW-LEVEL SECURITY POLICIES
-- ============================================================

-- --- A. PROFILES TABLE ---
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING ((SELECT auth.uid()) = id);

CREATE POLICY "profiles_admin_update" ON public.profiles
  FOR UPDATE USING ((SELECT public.is_admin()));

-- --- B. EVENTS TABLE ---
CREATE POLICY "events_select_active" ON public.events
  FOR SELECT USING (status = 'active'::public.event_status OR (SELECT public.is_admin()));

CREATE POLICY "events_insert_admin" ON public.events
  FOR INSERT WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "events_update_admin" ON public.events
  FOR UPDATE USING ((SELECT public.is_admin()));

CREATE POLICY "events_delete_admin" ON public.events
  FOR DELETE USING ((SELECT public.is_admin()));

-- --- C. REGISTRATIONS TABLE ---
CREATE POLICY "registrations_select_own" ON public.registrations
  FOR SELECT USING ((SELECT auth.uid()) = user_id OR (SELECT public.is_admin()));

CREATE POLICY "registrations_insert_own" ON public.registrations
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "registrations_delete_admin" ON public.registrations
  FOR DELETE USING ((SELECT public.is_admin()));

-- --- D. ATTENDANCE TABLE ---
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
CREATE POLICY "winners_select" ON public.winners
  FOR SELECT USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "winners_insert_admin" ON public.winners
  FOR INSERT WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "winners_update_admin" ON public.winners
  FOR UPDATE USING ((SELECT public.is_admin()));

CREATE POLICY "winners_delete_admin" ON public.winners
  FOR DELETE USING ((SELECT public.is_admin()));

-- --- F. NOTIFICATIONS TABLE ---
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "notifications_insert_admin" ON public.notifications
  FOR INSERT WITH CHECK ((SELECT public.is_admin()) OR (SELECT auth.uid()) = user_id);

-- --- G. EVENT VIEWS TABLE ---
CREATE POLICY "event_views_select_admin" ON public.event_views
  FOR SELECT USING ((SELECT public.is_admin()));

CREATE POLICY "event_views_insert" ON public.event_views
  FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- --- H. STORAGE OBJECTS (BUCKET POLICIES) ---
INSERT INTO storage.buckets (id, name, public) VALUES ('event-images', 'event-images', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "event_images_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-images');

CREATE POLICY "event_images_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'event-images' AND (SELECT public.is_admin()));

CREATE POLICY "event_images_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'event-images' AND (SELECT public.is_admin()));

CREATE POLICY "event_images_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'event-images' AND (SELECT public.is_admin()));
