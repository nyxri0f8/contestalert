/**
 * Create Test Users for Contest Alert
 * 
 * Run this SQL in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
 * 
 * This creates:
 *   1. Test Admin  — admin@test.com / admin123456
 *   2. Test Student — student@test.com / student123456
 */

// Since we can't use the service_role key from client-side,
// the best approach is to run SQL directly in the Supabase Dashboard.
// 
// Below is the SQL you need to paste into the SQL Editor.

const SQL = `
-- ============================================================
-- CREATE TEST USERS
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Create Test Admin User
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  raw_app_meta_data,
  aud,
  role,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
) VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001',
  '00000000-0000-0000-0000-000000000000',
  'admin@test.com',
  crypt('admin123456', gen_salt('bf')),
  NOW(),
  '{"role": "admin", "onboarding_completed": true}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  'authenticated',
  'authenticated',
  NOW(),
  NOW(),
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Create admin identity
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001',
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001',
  '{"sub": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001", "email": "admin@test.com"}'::jsonb,
  'email',
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create admin profile
INSERT INTO public.profiles (
  id,
  register_number,
  name,
  department,
  year,
  section,
  phone,
  email,
  role,
  onboarding_completed,
  achievement_points
) VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001',
  'ADMIN001',
  'Test Admin',
  'CSE',
  NULL,
  NULL,
  '+91 9876543210',
  'admin@test.com',
  'admin',
  TRUE,
  0
) ON CONFLICT (id) DO NOTHING;


-- 2. Create Test Student User
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  raw_app_meta_data,
  aud,
  role,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
) VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0002',
  '00000000-0000-0000-0000-000000000000',
  'student@test.com',
  crypt('student123456', gen_salt('bf')),
  NOW(),
  '{"role": "student", "onboarding_completed": true}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  'authenticated',
  'authenticated',
  NOW(),
  NOW(),
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Create student identity
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0002',
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0002',
  '{"sub": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0002", "email": "student@test.com"}'::jsonb,
  'email',
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0002',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create student profile
INSERT INTO public.profiles (
  id,
  register_number,
  name,
  department,
  year,
  section,
  phone,
  email,
  role,
  onboarding_completed,
  achievement_points
) VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0002',
  '312621104001',
  'Test Student',
  'CSE',
  3,
  'A',
  '+91 9876543211',
  'student@test.com',
  'student',
  TRUE,
  0
) ON CONFLICT (id) DO NOTHING;

-- Done! You can now log in with:
-- Admin:   admin@test.com   / admin123456
-- Student: student@test.com / student123456
`;

console.log(SQL);
