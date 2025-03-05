/*
  # Restore Original Database Structure
  
  1. Changes
    - Drop any unintended tables/functions
    - Restore original schema
    - Fix admin functions
*/

-- Drop any unintended tables if they exist
DROP TABLE IF EXISTS public.user_settings CASCADE;

-- Restore original tables if they don't exist
CREATE TABLE IF NOT EXISTS public.webinars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('draft', 'published')),
  theme_id UUID REFERENCES themes(id),
  avatar_id UUID REFERENCES avatars(id),
  scripting_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.slides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webinar_id UUID REFERENCES webinars(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  type TEXT CHECK (type IN ('intro', 'story', 'pain', 'solution', 'offer', 'close')),
  script TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.knowledge_bases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webinar_id UUID REFERENCES webinars(id) ON DELETE CASCADE,
  campaign_outline JSONB,
  audience_data JSONB,
  ultimate_client_goals JSONB,
  webinar_value_proposition JSONB,
  webinar_summary JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE public.webinars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_bases ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own webinars"
ON public.webinars FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own webinars"
ON public.webinars FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own webinars"
ON public.webinars FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own webinars"
ON public.webinars FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Slides policies
CREATE POLICY "Users can manage own slides"
ON public.slides FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.webinars
    WHERE webinars.id = slides.webinar_id
    AND webinars.user_id = auth.uid()
  )
);

-- Knowledge base policies
CREATE POLICY "Users can manage own knowledge bases"
ON public.knowledge_bases FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.webinars
    WHERE webinars.id = knowledge_bases.webinar_id
    AND webinars.user_id = auth.uid()
  )
);

-- Drop and recreate admin functions
DROP FUNCTION IF EXISTS public.get_users();
DROP FUNCTION IF EXISTS public.update_user(UUID, JSONB);
DROP FUNCTION IF EXISTS public.delete_user(UUID);

-- Create get_users function
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

-- Create update_user function
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
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.email LIKE '%@thementorprogram.xyz'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  RETURN QUERY
  UPDATE auth.users
  SET raw_user_meta_data = p_user_metadata
  WHERE id = p_user_id
  RETURNING 
    id,
    email,
    raw_user_meta_data as user_metadata,
    updated_at;
END;
$$;

-- Create delete_user function
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

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user(UUID) TO authenticated;