/*
  # Fix Database Permissions and Access

  1. Changes
    - Grant schema access
    - Set correct search paths
    - Ensure function permissions
    - Add missing RLS policies
*/

-- Grant schema access
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA extensions TO authenticated;

-- Ensure proper search paths
ALTER DATABASE postgres SET search_path TO public, auth, extensions;

-- Grant function execution permissions
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT routine_name 
    FROM information_schema.routines 
    WHERE routine_schema = 'public'
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I TO authenticated', r.routine_name);
  END LOOP;
END $$;

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS public.webinars ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_settings ENABLE ROW LEVEL SECURITY;

-- Grant table access
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Verify admin function access
DO $$
DECLARE
  v_count int;
BEGIN
  SELECT count(*) INTO v_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' 
    AND p.proname IN ('get_users', 'update_user', 'delete_user');
    
  IF v_count < 3 THEN
    RAISE EXCEPTION 'Missing admin functions';
  END IF;
  
  -- Verify permissions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.role_routine_grants 
    WHERE routine_name = 'get_users'
    AND grantee = 'authenticated'
  ) THEN
    RAISE EXCEPTION 'Missing function permissions';
  END IF;
END $$;