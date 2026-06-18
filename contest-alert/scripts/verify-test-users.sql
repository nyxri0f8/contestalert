-- Quick fix: just verify the test users are ready
-- Paste this in the Supabase SQL Editor and run it

-- Verify auth users exist and are confirmed
SELECT id, email, 
       email_confirmed_at IS NOT NULL AS confirmed, 
       raw_user_meta_data->>'role' AS role,
       raw_user_meta_data->>'onboarding_completed' AS onboarded
FROM auth.users 
WHERE email IN ('admin@test.com', 'student@test.com');

-- Verify profiles exist
SELECT id, email, name, role, onboarding_completed, department
FROM public.profiles 
WHERE email IN ('admin@test.com', 'student@test.com');
