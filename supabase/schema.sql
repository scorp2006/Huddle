-- Huddle Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (user data)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  linkedin_username TEXT NOT NULL,
  twitter_username TEXT,
  instagram_username TEXT,
  github_username TEXT,
  portfolio_url TEXT,
  one_liner TEXT, -- "Building AI tools" or "CS student at IIT-H"
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'organizer', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rooms table (one per event)
CREATE TABLE rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL, -- "HackXYZ 2026"
  code TEXT UNIQUE NOT NULL, -- 6-char alphanumeric join code
  created_by UUID REFERENCES profiles(id),
  starts_at TIMESTAMPTZ NOT NULL,
  duration_hours INTEGER NOT NULL DEFAULT 8, -- event duration
  expires_at TIMESTAMPTZ NOT NULL, -- auto-calculated: starts_at + (duration * 2)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Room members table (join table)
CREATE TABLE room_members (
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

-- LinkedIn click tracking
CREATE TABLE linkedin_clicks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id),
  clicked_user_id UUID REFERENCES profiles(id), -- whose LinkedIn was clicked
  clicked_by_user_id UUID REFERENCES profiles(id), -- who clicked
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_rooms_code ON rooms(code);
CREATE INDEX idx_rooms_expires_at ON rooms(expires_at);
CREATE INDEX idx_room_members_room_id ON room_members(room_id);
CREATE INDEX idx_room_members_user_id ON room_members(user_id);
CREATE INDEX idx_linkedin_clicks_room_id ON linkedin_clicks(room_id);
CREATE INDEX idx_linkedin_clicks_clicked_user_id ON linkedin_clicks(clicked_user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_clicks ENABLE ROW LEVEL SECURITY;

-- Profiles policies
-- Users can read all profiles
CREATE POLICY "Public profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can update only their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Rooms policies
-- Anyone can read rooms
CREATE POLICY "Rooms are viewable by authenticated users"
  ON rooms FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can create rooms (we'll control this in the app with role checks)
CREATE POLICY "Authenticated users can create rooms"
  ON rooms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Room creator can update their own rooms
CREATE POLICY "Room creators can update their own rooms"
  ON rooms FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Room creator can delete their own rooms
CREATE POLICY "Room creators can delete their own rooms"
  ON rooms FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Room members policies
-- Users can view members of rooms they belong to
CREATE POLICY "Room members are viewable by room members"
  ON room_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM room_members rm
      WHERE rm.room_id = room_members.room_id
      AND rm.user_id = auth.uid()
    )
  );

-- Users can join rooms (insert themselves)
CREATE POLICY "Users can join rooms"
  ON room_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can leave rooms (delete themselves)
CREATE POLICY "Users can leave rooms"
  ON room_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- LinkedIn clicks policies
-- Users can view clicks for profiles they can see
CREATE POLICY "LinkedIn clicks are viewable"
  ON linkedin_clicks FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert clicks
CREATE POLICY "Users can track LinkedIn clicks"
  ON linkedin_clicks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = clicked_by_user_id);

-- Function to generate unique room codes
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; -- Avoid ambiguous chars
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  extracted_username TEXT;
BEGIN
  -- Try to extract LinkedIn username from OAuth metadata
  extracted_username := COALESCE(
    NEW.raw_user_meta_data->>'preferred_username',
    NEW.raw_user_meta_data->>'vanity_name',
    split_part(NEW.raw_user_meta_data->>'public_profile_url', '/in/', 2)
  );

  -- Remove trailing slash if present
  IF extracted_username IS NOT NULL THEN
    extracted_username := split_part(extracted_username, '/', 1);
  END IF;

  INSERT INTO profiles (id, full_name, avatar_url, linkedin_username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    COALESCE(extracted_username, '') -- Auto-fill if available, otherwise set during onboarding
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
