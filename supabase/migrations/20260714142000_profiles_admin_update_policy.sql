-- ============ ADMIN UPDATE POLICY FOR PROFILES ============
-- Allows admins to update any user's profile (e.g., enabling/disabling users)
-- The original schema only had profiles_update_own which restricted updates to
-- the user's own row, preventing admins from enabling/disabling other users.

DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
