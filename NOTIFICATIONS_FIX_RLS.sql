-- ============================================================
-- NOTIFICATIONS FIX - Run this in Supabase SQL Editor
-- ============================================================
--
-- If notifications aren't showing up, this is the fix!
-- The RLS policy was blocking user reads.
--
-- Steps:
-- 1. Go to: supabase.com → Your Project → SQL Editor
-- 2. Create new query
-- 3. Paste this entire file
-- 4. Click "Run"
--
-- ============================================================

-- Fix 1: Allow notifications to be read by the user they're for
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- Fix 2: Allow users to insert their own notifications (optional, for testing)
DROP POLICY IF EXISTS "notifications_insert_own" ON notifications;
CREATE POLICY "notifications_insert_own" ON notifications FOR INSERT
  TO authenticated WITH CHECK (true);

-- Fix 3: Allow users to update their own notifications (mark as read)
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Fix 4: Allow users to delete their own notifications
DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Done! Now notifications should work!
-- ============================================================
