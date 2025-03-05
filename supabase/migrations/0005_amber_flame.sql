/*
  # Fix Admin Functions and Permissions
  
  1. Changes
    - Recreate admin functions with proper permissions
    - Add explicit RLS policies for admin access
    - Fix function return types and error handling
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.get_users();
DROP FUNCTION IF EXISTS public.update_user(UUID, JSONB);
DROP FUNCTION IF EXISTS public.delete_user(UUID);

-- Create improved get_users function with proper error handling
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
BEGIN
  -- Check admin access
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.email LIKE '%@thementorprogram.xyz'
  ) THEN
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
END;
$$;

-- Create improved update_user function with proper error handling
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
BEGIN
  -- Check admin access
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.email LIKE '%@thementorprogram.xyz'
  ) THEN
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

-- Create improved delete_user function with proper error handling
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
BEGIN
  -- Check admin access
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.email LIKE '%@thementorprogram.xyz'
  ) THEN
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

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user(UUID) TO authenticated;

-- Add explicit RLS policies for admin access
CREATE POLICY "Admin users can manage all data"
ON public.user_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.email LIKE '%@thementorprogram.xyz'
  )
);

-- Verify function creation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_proc 
    WHERE proname IN ('get_users', 'update_user', 'delete_user')
    AND pronamespace = 'public'::regnamespace
  ) THEN
    RAISE EXCEPTION 'Admin functions were not created properly';
  END IF;
END $$;