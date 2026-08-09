-- ============================================================
-- FurnitureHub Notifications System - RLS Policy Fixes
-- ============================================================
-- 
-- Run this SQL in your Supabase Dashboard:
-- 1. Go to supabase.com → Your Project → SQL Editor
-- 2. Create a new query
-- 3. Copy and paste this file
-- 4. Click "Run"
--
-- This fixes the notifications RLS policy to:
-- - Allow authenticated users to read their own notifications
-- - Prevent anonymous access to notifications
-- ============================================================

-- Fix notifications RLS policy: Only users can read their own
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- Done! Notifications system is now properly secured
