-- ============================================
-- CUSTOMERS TABLE MIGRATION
-- Run this in Supabase SQL Editor to add missing columns
-- ============================================

-- Add missing columns to customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS details TEXT,
ADD COLUMN IF NOT EXISTS added_by TEXT,
ADD COLUMN IF NOT EXISTS referred_by TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS tag TEXT DEFAULT 'normal';

-- Add constraints (only if they don't exist)
DO $$
BEGIN
  -- Add status check constraint if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'customers_status_check' AND conrelid = 'public.customers'::regclass
  ) THEN
    ALTER TABLE public.customers 
    ADD CONSTRAINT customers_status_check CHECK (status IN ('active', 'inactive'));
  END IF;
  
  -- Add tag check constraint if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'customers_tag_check' AND conrelid = 'public.customers'::regclass
  ) THEN
    ALTER TABLE public.customers 
    ADD CONSTRAINT customers_tag_check CHECK (tag IN ('special', 'normal'));
  END IF;
END $$;

-- Update existing rows to have default values
UPDATE public.customers SET status = 'active' WHERE status IS NULL;
UPDATE public.customers SET tag = 'normal' WHERE tag IS NULL;

-- ============================================
-- DONE! Customers table now has all required columns.
-- ============================================
