/*
  # Fix Admin Functions and Schema Access

  1. Changes
    - Add proper schema search paths
    - Grant schema usage permissions
    - Recreate admin functions with proper access
    - Add proper error handling

  2. Security
    - Ensure proper schema access
    - Add proper role permissions
    - Maintain security definer settings
*/

-- Grant necessary schema access
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Ensure public schema is in search_path
ALTER DATABASE postgres SET search_path TO public, auth, extensions;

-- Drop and recreate functions with proper schema access
DROP FUNCTION IF EXISTS public.get_users();
DROP FUNCTION IF EXISTS public.update_user(UUID, JSONB);
DROP FUNCTION IF EXISTS public.delete_user(UUID);

-- Create improved get_users function
CREATE OR REPLACE FUNCTION public.get_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  user_metadata JSONB,
  created_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
BEGIN
  -- Get current user info
  SELECT id, email INTO v_user_id, v_user_email 
  FROM auth.users 
  WHERE auth.users.id = auth.uid();

  -- Check admin access
  IF v_user_email NOT LIKE '%@thementorprogram.xyz' THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data as user_metadata,
    au.created_at
  FROM auth.users au
  ORDER BY au.created_at DESC;

  -- Handle no results
  IF NOT FOUND THEN
    RETURN;
  END IF;
END;
$$;

-- Create improved update_user function
CREATE OR REPLACE FUNCTION public.update_user(
  p_user_id UUID,
  p_user_metadata JSONB
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  user_metadata JSONB,
  updated_at TIMESTAMPTZ
)
SECURITY DEFINER 
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_email TEXT;
BEGIN
  -- Get current user email
  SELECT email INTO v_user_email 
  FROM auth.users 
  WHERE auth.users.id = auth.uid();

  -- Check admin access
  IF v_user_email NOT LIKE '%@thementorprogram.xyz' THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  RETURN QUERY
  UPDATE auth.users
  SET 
    raw_user_meta_data = p_user_metadata,
    updated_at = now()
  WHERE id = p_user_id
  RETURNING 
    id,
    email,
    raw_user_meta_data as user_metadata,
    updated_at;
END;
$$;

-- Create improved delete_user function
CREATE OR REPLACE FUNCTION public.delete_user(
  p_user_id UUID
)
RETURNS TABLE (
  deleted_user_id UUID
)
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_email TEXT;
BEGIN
  -- Get current user email
  SELECT email INTO v_user_email 
  FROM auth.users 
  WHERE auth.users.id = auth.uid();

  -- Check admin access
  IF v_user_email NOT LIKE '%@thementorprogram.xyz' THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  RETURN QUERY
  DELETE FROM auth.users 
  WHERE id = p_user_id
  RETURNING id as deleted_user_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user(UUID) TO authenticated;

-- Verify function existence
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_proc 
    WHERE proname = 'get_users' 
    AND pronamespace = 'public'::regnamespace
  ) THEN
    RAISE EXCEPTION 'Function public.get_users() was not created properly';
  END IF;
END $$;