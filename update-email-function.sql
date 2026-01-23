-- ============================================
-- CREATE FUNCTION TO UPDATE LOGIN EMAIL
-- Run this ONCE in Supabase SQL Editor
-- ============================================

-- This function allows updating the auth.users email directly
-- It bypasses Supabase's strict email validation

CREATE OR REPLACE FUNCTION public.update_user_email(new_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update the auth.users email for current user
    UPDATE auth.users 
    SET 
        email = new_email,
        updated_at = NOW()
    WHERE id = auth.uid();
    
    -- Also update the profiles table to keep in sync
    UPDATE public.profiles 
    SET 
        email = new_email,
        updated_at = NOW()
    WHERE id = auth.uid();
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_user_email(TEXT) TO authenticated;

-- ============================================
-- DONE! Now the profile page can update login email.
-- ============================================
