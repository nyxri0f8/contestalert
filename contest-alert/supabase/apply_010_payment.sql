-- 1. Add new columns to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS payment_link TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS payment_qr_path TEXT;

-- 2. Add transaction_id to registrations table
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS transaction_id TEXT;

-- 3. Create the event-covers storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-covers', 'event-covers', false)
ON CONFLICT (id) DO NOTHING;

-- 4. Create the payment-qrs storage bucket (Private bucket, accessible via signed URLs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-qrs', 'payment-qrs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for payment-qrs bucket
-- Admins can upload, delete, update
DROP POLICY IF EXISTS "Admins can manage payment QRs" ON storage.objects;
CREATE POLICY "Admins can manage payment QRs"
ON storage.objects
FOR ALL TO authenticated
USING (
    bucket_id = 'payment-qrs' AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
    bucket_id = 'payment-qrs' AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Everyone can read (we use signed URLs but just in case, read access via signed URLs is handled by Supabase automatically, but let's allow read for signed URL generation)
DROP POLICY IF EXISTS "Anyone can view payment QRs" ON storage.objects;
CREATE POLICY "Anyone can view payment QRs"
ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'payment-qrs');

-- 4. Update the register_for_event RPC to handle transaction_id
CREATE OR REPLACE FUNCTION public.register_for_event(
  p_user_id UUID,
  p_event_id UUID,
  p_team_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_is_external_confirmation BOOLEAN DEFAULT FALSE,
  p_form_data JSONB DEFAULT '{}'::jsonb,
  p_transaction_id TEXT DEFAULT NULL
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
    
    IF v_current_count >= COALESCE(v_event.capacity, 9999) THEN
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
  INSERT INTO public.registrations (user_id, event_id, ticket_id, team_name, phone, is_external_confirmation, form_data, transaction_id)
  VALUES (p_user_id, p_event_id, v_ticket_id, p_team_name, p_phone, p_is_external_confirmation, p_form_data, p_transaction_id)
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
