-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'webinars') THEN
    CREATE TABLE webinars (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT CHECK (status IN ('draft', 'published')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
    );
  END IF;
END $$;

-- Create themes table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'themes') THEN
    CREATE TABLE themes (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      preview_url TEXT NOT NULL,
      opening_template_id TEXT NOT NULL,
      agenda_template_id TEXT NOT NULL,
      content_template_id TEXT NOT NULL,
      offer_template_id TEXT NOT NULL,
      closing_template_id TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
    );
  END IF;
END $$;

-- Create avatars table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'avatars') THEN
    CREATE TABLE avatars (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      heygen_avatar_id TEXT NOT NULL,
      preview_video_url TEXT NOT NULL,
      preview_photo_url TEXT NOT NULL,
      gender TEXT CHECK (gender IN ('male', 'female')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
    );
  END IF;
END $$;

-- Create user settings table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_settings') THEN
    CREATE TABLE user_settings (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID UNIQUE NOT NULL,
      max_webinars INTEGER DEFAULT 3,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
    );
  END IF;
END $$;

-- Create admin functions
DROP FUNCTION IF EXISTS get_users();
CREATE OR REPLACE FUNCTION get_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  raw_user_meta_data JSONB,
  created_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.email LIKE '%@thementorprogram.xyz'
  ) THEN
    RETURN QUERY
    SELECT 
      au.id,
      au.email,
      au.raw_user_meta_data,
      au.created_at
    FROM auth.users au;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION update_user(
  user_id UUID,
  user_updates JSONB
)
RETURNS void
SECURITY DEFINER 
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.email LIKE '%@thementorprogram.xyz'
  ) THEN
    UPDATE auth.users
    SET raw_user_meta_data = user_updates
    WHERE id = user_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION delete_user(
  user_id UUID
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.email LIKE '%@thementorprogram.xyz'
  ) THEN
    DELETE FROM auth.users WHERE id = user_id;
  END IF;
END;
$$;

-- Enable RLS on all tables
ALTER TABLE webinars ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create admin role if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'admin') THEN
    CREATE ROLE admin;
  END IF;
END
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- RLS Policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'webinars' 
    AND policyname = 'Users can view their own webinars'
  ) THEN
    CREATE POLICY "Users can view their own webinars"
    ON webinars FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'webinars' 
    AND policyname = 'Users can insert their own webinars'
  ) THEN
    CREATE POLICY "Users can insert their own webinars"
    ON webinars FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'webinars' 
    AND policyname = 'Users can update their own webinars'
  ) THEN
    CREATE POLICY "Users can update their own webinars"
    ON webinars FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'webinars' 
    AND policyname = 'Users can delete their own webinars'
  ) THEN
    CREATE POLICY "Users can delete their own webinars"
    ON webinars FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Admin policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'themes' 
    AND policyname = 'Admins can manage themes'
  ) THEN
    CREATE POLICY "Admins can manage themes"
    ON themes FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.email LIKE '%@thementorprogram.xyz'
      )
    );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'avatars' 
    AND policyname = 'Admins can manage avatars'
  ) THEN
    CREATE POLICY "Admins can manage avatars"
    ON avatars FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.email LIKE '%@thementorprogram.xyz'
      )
    );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'user_settings' 
    AND policyname = 'Admins can manage user settings'
  ) THEN
    CREATE POLICY "Admins can manage user settings"
    ON user_settings FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.email LIKE '%@thementorprogram.xyz'
      )
    );
  END IF;
END $$;

-- Create or replace the update_updated_at function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_trigger 
    WHERE tgname = 'update_webinars_updated_at'
  ) THEN
    CREATE TRIGGER update_webinars_updated_at
      BEFORE UPDATE ON webinars
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_trigger 
    WHERE tgname = 'update_themes_updated_at'
  ) THEN
    CREATE TRIGGER update_themes_updated_at
      BEFORE UPDATE ON themes
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_trigger 
    WHERE tgname = 'update_avatars_updated_at'
  ) THEN
    CREATE TRIGGER update_avatars_updated_at
      BEFORE UPDATE ON avatars
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_trigger 
    WHERE tgname = 'update_user_settings_updated_at'
  ) THEN
    CREATE TRIGGER update_user_settings_updated_at
      BEFORE UPDATE ON user_settings
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;