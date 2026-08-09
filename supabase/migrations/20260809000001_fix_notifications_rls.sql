/*
# Fix notifications RLS policy

The previous migration incorrectly allowed anonymous access to notifications.
This fix restricts notifications so users can only read their own.
*/

-- ============ NOTIFICATIONS - Fix: Only users can read their own notifications ============
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
