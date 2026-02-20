-- Huddle Database Schema V2 - 3-Tier Architecture
-- Super Admin → Event Organizers → Users
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE TABLES
-- ============================================

-- Profiles table (all users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  linkedin_username TEXT, -- Optional for testing with Google
  twitter_username TEXT,
  instagram_username TEXT,
  github_username TEXT,
  portfolio_url TEXT,
  one_liner TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('super_admin', 'event_organizer', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organizations table (events, colleges, companies)
CREATE TABLE organizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL, -- "TechFest 2024", "IIT Bombay Hackathon"
  slug TEXT UNIQUE NOT NULL, -- "techfest-2024"
  description TEXT,
  logo_url TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id), -- Super admin who onboarded them
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event organizers (link users to organizations)
CREATE TABLE event_organizers (
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'organizer' CHECK (role IN ('owner', 'organizer', 'moderator')),
  added_by UUID REFERENCES profiles(id), -- Who gave them access
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (organization_id, user_id)
);

-- Rooms table (events within organizations)
CREATE TABLE rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, -- "Opening Ceremony", "Workshop Track A"
  code TEXT UNIQUE NOT NULL, -- 6-char join code
  description TEXT,
  created_by UUID REFERENCES profiles(id),
  starts_at TIMESTAMPTZ NOT NULL,
  duration_hours INTEGER NOT NULL DEFAULT 8,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Room classifications (custom roles per room)
CREATE TABLE room_classifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Attendee", "Guest", "Speaker", "Participant", "Jury"
  requires_approval BOOLEAN DEFAULT FALSE, -- Auto-approve or needs organizer approval
  display_order INTEGER DEFAULT 0, -- For sorting in UI
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, name)
);

-- Room members (who's in each room)
CREATE TABLE room_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  classification_id UUID REFERENCES room_classifications(id),
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('approved', 'pending', 'rejected')),
  approved_by UUID REFERENCES profiles(id), -- Event organizer who approved
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- LinkedIn click tracking
CREATE TABLE linkedin_clicks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id),
  clicked_user_id UUID REFERENCES profiles(id), -- Whose LinkedIn was clicked
  clicked_by_user_id UUID REFERENCES profiles(id), -- Who clicked
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_created_by ON organizations(created_by);
CREATE INDEX idx_event_organizers_org ON event_organizers(organization_id);
CREATE INDEX idx_event_organizers_user ON event_organizers(user_id);
CREATE INDEX idx_rooms_code ON rooms(code);
CREATE INDEX idx_rooms_org ON rooms(organization_id);
CREATE INDEX idx_rooms_expires_at ON rooms(expires_at);
CREATE INDEX idx_room_classifications_room ON room_classifications(room_id);
CREATE INDEX idx_room_members_room ON room_members(room_id);
CREATE INDEX idx_room_members_user ON room_members(user_id);
CREATE INDEX idx_room_members_status ON room_members(approval_status);
CREATE INDEX idx_linkedin_clicks_room ON linkedin_clicks(room_id);
CREATE INDEX idx_linkedin_clicks_clicked_user ON linkedin_clicks(clicked_user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Generate unique room code
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Auto-create default classifications when room is created
CREATE OR REPLACE FUNCTION create_default_classifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default "Attendee" classification (auto-approved)
  INSERT INTO room_classifications (room_id, name, requires_approval, display_order)
  VALUES (NEW.id, 'Attendee', FALSE, 1);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_classifications
  AFTER INSERT ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION create_default_classifications();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_clicks ENABLE ROW LEVEL SECURITY;

-- Profiles: Everyone can read, users can update their own
CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Organizations: Everyone can read active orgs
CREATE POLICY "Active organizations are viewable"
  ON organizations FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Super admins can create/update organizations
CREATE POLICY "Super admins can manage organizations"
  ON organizations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Event organizers: Can read their own assignments
CREATE POLICY "Users can view their organizer roles"
  ON event_organizers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Super admins can manage organizer assignments
CREATE POLICY "Super admins can manage organizers"
  ON event_organizers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Rooms: Everyone can read active rooms
CREATE POLICY "Active rooms are viewable"
  ON rooms FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Event organizers can create rooms for their orgs
CREATE POLICY "Event organizers can create rooms"
  ON rooms FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_organizers
      WHERE organization_id = rooms.organization_id
      AND user_id = auth.uid()
    )
  );

-- Event organizers can update their org's rooms
CREATE POLICY "Event organizers can update rooms"
  ON rooms FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_organizers
      WHERE organization_id = rooms.organization_id
      AND user_id = auth.uid()
    )
  );

-- Room classifications: Readable by room members
CREATE POLICY "Classifications viewable by authenticated users"
  ON room_classifications FOR SELECT
  TO authenticated
  USING (true);

-- Event organizers can manage classifications
CREATE POLICY "Event organizers can manage classifications"
  ON room_classifications FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms r
      JOIN event_organizers eo ON eo.organization_id = r.organization_id
      WHERE r.id = room_classifications.room_id
      AND eo.user_id = auth.uid()
    )
  );

-- Room members: Can view members in rooms they've joined (if approved)
CREATE POLICY "Room members viewable by approved members"
  ON room_members FOR SELECT
  TO authenticated
  USING (
    approval_status = 'approved' AND
    EXISTS (
      SELECT 1 FROM room_members rm
      WHERE rm.room_id = room_members.room_id
      AND rm.user_id = auth.uid()
      AND rm.approval_status = 'approved'
    )
  );

-- Users can join rooms (create membership)
CREATE POLICY "Users can join rooms"
  ON room_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own membership
CREATE POLICY "Users can update their membership"
  ON room_members FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Event organizers can approve/reject members
CREATE POLICY "Event organizers can manage members"
  ON room_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms r
      JOIN event_organizers eo ON eo.organization_id = r.organization_id
      WHERE r.id = room_members.room_id
      AND eo.user_id = auth.uid()
    )
  );

-- LinkedIn clicks: Viewable by all
CREATE POLICY "LinkedIn clicks viewable"
  ON linkedin_clicks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can track clicks"
  ON linkedin_clicks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = clicked_by_user_id);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- EVENT ORGANIZERS POLICIES (MISSING!)
-- ============================================

-- Event Organizers: Super admins can see all
CREATE POLICY "Super admins can view all event_organizers"
  ON event_organizers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Event Organizers: Super admins can insert
CREATE POLICY "Super admins can insert event_organizers"
  ON event_organizers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Event Organizers: Super admins can delete
CREATE POLICY "Super admins can delete event_organizers"
  ON event_organizers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Event Organizers: Users can see their own organizations
CREATE POLICY "Users can view their own event_organizer records"
  ON event_organizers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- ROOM MEMBERS POLICIES
-- ============================================

-- Users can see APPROVED members in rooms
CREATE POLICY "Users can view approved room members"
  ON room_members FOR SELECT
  TO authenticated
  USING (approval_status = 'approved');

-- Users can ALWAYS see their OWN membership (even if pending)
CREATE POLICY "Users can view their own membership"
  ON room_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can join rooms (insert themselves)
CREATE POLICY "Users can join rooms"
  ON room_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Event organizers and super admins can see all members in their rooms
CREATE POLICY "Organizers can view all room members"
  ON room_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('event_organizer', 'super_admin')
    )
  );

-- Event organizers and super admins can update memberships (approve/reject)
CREATE POLICY "Organizers can update room members"
  ON room_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('event_organizer', 'super_admin')
    )
  );

-- ============================================
-- DATABASE FUNCTIONS
-- ============================================

-- Function to find user ID by email
CREATE OR REPLACE FUNCTION get_user_id_by_email(email_input TEXT)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id
    FROM auth.users
    WHERE email = email_input
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_id_by_email(TEXT) TO authenticated;

-- Function to update user role (bypasses RLS)
CREATE OR REPLACE FUNCTION update_user_role(
  target_user_id UUID,
  new_role TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Only super_admins can call this
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Only super admins can update user roles';
  END IF;

  -- Update the role
  UPDATE profiles
  SET role = new_role
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_user_role(UUID, TEXT) TO authenticated;

-- ============================================
-- SEED DATA
-- ============================================

-- Set super admin role for your email
UPDATE profiles
SET role = 'super_admin'
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email = 'ayyagariabhinav21@gmail.com'
);
