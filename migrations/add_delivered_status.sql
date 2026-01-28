-- ============================================
-- MIGRATION: Add 'delivered' to project status enum
-- Run this SQL in Supabase SQL Editor
-- ============================================

-- Drop the existing check constraint
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;

-- Add the new check constraint with 'delivered' option
ALTER TABLE public.projects ADD CONSTRAINT projects_status_check 
  CHECK (status IN ('ongoing', 'pending', 'completed', 'cancelled', 'paused', 'delivered'));

-- Verification
-- SELECT constraint_name, check_clause FROM information_schema.check_constraints WHERE constraint_name = 'projects_status_check';
