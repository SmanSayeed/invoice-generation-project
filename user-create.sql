-- ============================================
-- CREATE ADMIN USER - RUN THIS IN SUPABASE SQL EDITOR
-- ============================================

-- First, delete any existing user with this email
DELETE FROM auth.users WHERE email = 'a@a.com';

-- Create the admin user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'a@a.com',
  crypt('11112222', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Admin"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Verify user was created
SELECT id, email, created_at FROM auth.users WHERE email = 'a@a.com';