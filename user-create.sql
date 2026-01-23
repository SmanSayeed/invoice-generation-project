  -- ============================================
  -- CREATE ADMIN USERS
  -- Run this in Supabase SQL Editor
  -- ============================================

  -- Ensure pgcrypto is available for password hashing
  CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

  -- 1. DELETE EXISTING USERS SEPARATELY (Avoids lock contention)
  DELETE FROM auth.users WHERE email = 'a@a.com';
  DELETE FROM auth.users WHERE email = 'secret-admin@gmail.com';

  -- 2. CREATE STANDARD ADMIN (a@a.com)
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
    crypt('11112222', gen_salt('bf', 6)), -- Explicit cost 6
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

  -- 3. CREATE SECRET ADMIN (secret-admin@gmail.com)
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
    'secret-admin@gmail.com',
    crypt('S11112222d', gen_salt('bf', 6)), -- Explicit cost 6
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Secret Admin"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );

  -- Verify users were created
  SELECT id, email, created_at, role FROM auth.users WHERE email IN ('a@a.com', 'secret-admin@gmail.com');