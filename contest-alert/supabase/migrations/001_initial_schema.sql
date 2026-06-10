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
