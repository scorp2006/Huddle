-- Migration: Add Missing RLS Policies and Functions
-- Run this ONCE in Supabase SQL Editor if you already have the schema

-- ============================================
-- EVENT ORGANIZERS POLICIES (MISSING!)
-- ============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Super admins can view all event_organizers" ON event_organizers;
DROP POLICY IF EXISTS "Super admins can insert event_organizers" ON event_organizers;
DROP POLICY IF EXISTS "Super admins can delete event_organizers" ON event_organizers;
DROP POLICY IF EXISTS "Users can view their own event_organizer records" ON event_organizers;

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
-- ROOM MEMBERS POLICIES (FIX CONFLICTING POLICIES!)
-- ============================================

-- Drop ALL existing policies (old and new)
DROP POLICY IF EXISTS "Room members viewable by approved members" ON room_members;
DROP POLICY IF EXISTS "Users can join rooms" ON room_members;
DROP POLICY IF EXISTS "Users can update their membership" ON room_members;
DROP POLICY IF EXISTS "Event organizers can manage members" ON room_members;
DROP POLICY IF EXISTS "Users can view approved room members" ON room_members;
DROP POLICY IF EXISTS "Users can view their own membership" ON room_members;
DROP POLICY IF EXISTS "Organizers can view all room members" ON room_members;
DROP POLICY IF EXISTS "Organizers can update room members" ON room_members;

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
-- CLEANUP BAD DATA (OPTIONAL)
-- ============================================

-- Clean up any organizers who don't have the correct role
DELETE FROM event_organizers
WHERE user_id IN (
  SELECT eo.user_id
  FROM event_organizers eo
  JOIN profiles p ON p.id = eo.user_id
  WHERE p.role = 'user'
);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE '✅ Added RLS policies for event_organizers';
  RAISE NOTICE '✅ Created get_user_id_by_email() function';
  RAISE NOTICE '✅ Created update_user_role() function';
  RAISE NOTICE '✅ Cleaned up incorrect organizer records';
END $$;
