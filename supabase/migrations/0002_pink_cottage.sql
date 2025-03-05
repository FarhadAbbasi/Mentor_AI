/*
  # Fix Admin Functions and Permissions

  1. Changes
    - Grant admin functions execute permission to authenticated users
    - Add proper error handling to admin functions
    - Add proper return types
    - Add proper security checks

  2. Security
    - Functions are security definer
    - Proper schema search path
    - Admin email validation
*/

-- Drop existing functions to recreate them with proper permissions
DROP FUNCTION IF EXISTS get_users();
DROP FUNCTION IF EXISTS update_user(UUID, JSONB);
DROP FUNCTION IF EXISTS delete_user(UUID);

-- Create improved get_users function
CREATE OR REPLACE FUNCTION get_users()
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

-- Create improved update_user function
CREATE OR REPLACE FUNCTION update_user(
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
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.email LIKE '%@thementorprogram.xyz'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
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
CREATE OR REPLACE FUNCTION delete_user(
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
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.email LIKE '%@thementorprogram.xyz'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  RETURN QUERY
  DELETE FROM auth.users 
  WHERE id = p_user_id
  RETURNING id as deleted_user_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_users() TO authenticated;
GRANT EXECUTE ON FUNCTION update_user(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user(UUID) TO authenticated;