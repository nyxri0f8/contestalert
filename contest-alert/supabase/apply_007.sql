-- 1. Add missing departments to enum
ALTER TYPE department_type ADD VALUE IF NOT EXISTS 'VLSI';
ALTER TYPE department_type ADD VALUE IF NOT EXISTS 'CSBS';

-- 2. Add form_schema to events
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS form_schema JSONB DEFAULT '[]'::jsonb;

-- 3. Add form_data to registrations
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS form_data JSONB DEFAULT '{}'::jsonb;
