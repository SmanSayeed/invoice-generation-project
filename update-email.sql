-- ============================================
-- UPDATE LOGIN EMAIL
-- Run this in Supabase SQL Editor
-- ============================================

-- Change 'a@a.com' to your desired new email
-- Example: Update from 'a@a.com' to 'admin@company.com'

UPDATE auth.users 
SET 
    email = 'admin@company.com',  -- NEW EMAIL
    updated_at = NOW()
WHERE email = 'a@a.com';          -- CURRENT EMAIL

-- Verify the update
SELECT id, email, created_at FROM auth.users WHERE email = 'admin@company.com';
