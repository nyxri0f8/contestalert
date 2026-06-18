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
