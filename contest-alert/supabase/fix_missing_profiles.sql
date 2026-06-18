-- Fix missing profiles
-- This script finds any users in auth.users that don't have a record in the public.profiles table
-- and creates a profile for them. This usually happens if you created your account before the 
-- trigger was added to the database.

INSERT INTO public.profiles (id, email, name, role)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', 'Student User'), 
    'student'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);
