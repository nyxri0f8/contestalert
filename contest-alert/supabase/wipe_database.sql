-- WARNING: THIS SCRIPT WILL PERMANENTLY DELETE ALL USERS AND APP DATA.
-- It is intended to be used right before production launch.

-- 1. Truncate application tables (this will also delete events and registrations due to CASCADE if configured, but we do them explicitly just in case)
TRUNCATE TABLE public.registrations CASCADE;
TRUNCATE TABLE public.events CASCADE;
TRUNCATE TABLE public.profiles CASCADE;

-- 2. Delete all files from storage buckets
-- NOTE: Supabase SQL does not allow direct deletion from storage tables to prevent data loss.
-- You MUST empty the buckets via the Supabase Dashboard UI:
-- Go to Storage -> event-covers -> Select All -> Delete.
-- Go to Storage -> payment-qrs -> Select All -> Delete.

-- 3. Delete all auth users
-- Deleting from auth.users will automatically cascade and delete linked profiles if we had foreign keys with CASCADE,
-- but we already truncated profiles. 
DELETE FROM auth.users;

-- 4. Reset sequences (if any ID sequences were used, though we use UUIDs mostly)
-- No sequences to reset for UUIDs.

-- Database is now clean and ready for production!
