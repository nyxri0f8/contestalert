-- ============================================================
-- Contest Alert: Create Test Users
-- ============================================================
-- INSTRUCTIONS: Paste this entire SQL into the Supabase Dashboard
-- Go to: https://supabase.com/dashboard → Your Project → SQL Editor → New Query
-- Paste this, then click "Run"
-- ============================================================

-- Step 1: Confirm existing unconfirmed test users (if they exist from prior signup attempts)
UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    updated_at = NOW()
WHERE email IN ('admin@test.com', 'student@test.com') 
  AND email_confirmed_at IS NULL;

-- Step 2: Set admin metadata on admin@test.com
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{role}', '"admin"'
    ) || '{"onboarding_completed": true}'::jsonb,
    updated_at = NOW()
WHERE email = 'admin@test.com';

-- Step 3: Set student metadata on student@test.com
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{role}', '"student"'
    ) || '{"onboarding_completed": true}'::jsonb,
    updated_at = NOW()
WHERE email = 'student@test.com';

-- Step 4: Upsert admin profile
INSERT INTO public.profiles (id, email, name, register_number, department, role, onboarding_completed, phone)
SELECT 
  id, 
  'admin@test.com',
  'Test Admin',
  'ADMIN001',
  'CSE'::public.department_type,
  'admin'::public.user_role,
  TRUE,
  '+91 9876543210'
FROM auth.users WHERE email = 'admin@test.com'
ON CONFLICT (id) DO UPDATE SET 
  name = 'Test Admin',
  role = 'admin'::public.user_role,
  onboarding_completed = TRUE;

-- Step 5: Upsert student profile  
INSERT INTO public.profiles (id, email, name, register_number, department, year, section, role, onboarding_completed, phone)
SELECT 
  id,
  'student@test.com',
  'Test Student',
  '312621104001',
  'CSE'::public.department_type,
  3,
  'A',
  'student'::public.user_role,
  TRUE,
  '+91 9876543211'
FROM auth.users WHERE email = 'student@test.com'
ON CONFLICT (id) DO UPDATE SET 
  name = 'Test Student',
  role = 'student'::public.user_role,
  onboarding_completed = TRUE,
  year = 3,
  section = 'A';

-- Step 6: If users DON'T exist yet (first-time setup), create them from scratch
-- This handles the case where the signUp rate-limited before creating the user
DO $$
DECLARE
  admin_id UUID;
  student_id UUID;
BEGIN
  -- Check if admin exists
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@test.com';
  
  IF admin_id IS NULL THEN
    admin_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_user_meta_data, raw_app_meta_data, aud, role, created_at, updated_at,
      confirmation_token, recovery_token
    ) VALUES (
      admin_id,
      '00000000-0000-0000-0000-000000000000',
      'admin@test.com',
      crypt('admin123456', gen_salt('bf')),
      NOW(),
      '{"role": "admin", "onboarding_completed": true}'::jsonb,
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      'authenticated', 'authenticated', NOW(), NOW(), '', ''
    );
    
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (
      admin_id, admin_id,
      jsonb_build_object('sub', admin_id::text, 'email', 'admin@test.com'),
      'email', admin_id::text, NOW(), NOW(), NOW()
    );
    
    INSERT INTO public.profiles (id, email, name, register_number, department, role, onboarding_completed, phone)
    VALUES (admin_id, 'admin@test.com', 'Test Admin', 'ADMIN001', 'CSE', 'admin', TRUE, '+91 9876543210');
  END IF;

  -- Check if student exists
  SELECT id INTO student_id FROM auth.users WHERE email = 'student@test.com';
  
  IF student_id IS NULL THEN
    student_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_user_meta_data, raw_app_meta_data, aud, role, created_at, updated_at,
      confirmation_token, recovery_token
    ) VALUES (
      student_id,
      '00000000-0000-0000-0000-000000000000',
      'student@test.com',
      crypt('student123456', gen_salt('bf')),
      NOW(),
      '{"role": "student", "onboarding_completed": true}'::jsonb,
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      'authenticated', 'authenticated', NOW(), NOW(), '', ''
    );
    
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (
      student_id, student_id,
      jsonb_build_object('sub', student_id::text, 'email', 'student@test.com'),
      'email', student_id::text, NOW(), NOW(), NOW()
    );
    
    INSERT INTO public.profiles (id, email, name, register_number, department, year, section, role, onboarding_completed, phone)
    VALUES (student_id, 'student@test.com', 'Test Student', '312621104001', 'CSE', 3, 'A', 'student', TRUE, '+91 9876543211');
  END IF;
END $$;

-- Verify
SELECT id, email, email_confirmed_at IS NOT NULL AS confirmed, raw_user_meta_data->>'role' AS role
FROM auth.users 
WHERE email IN ('admin@test.com', 'student@test.com');
