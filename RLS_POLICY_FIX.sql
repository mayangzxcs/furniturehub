-- ============================================================
-- FurnitureHub RLS Policies - Allow Public Read Access
-- ============================================================
-- 
-- Run this SQL in your Supabase Dashboard:
-- 1. Go to supabase.com → Your Project → SQL Editor
-- 2. Create a new query
-- 3. Copy and paste this entire file
-- 4. Click "Run"
--
-- This allows non-authenticated (logged-out) users to VIEW
-- all posts, categories, comments, etc. (read-only access)
-- ============================================================

-- ============ PROFILES - Allow public read ============
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

-- ============ CATEGORIES - Allow public read ============
DROP POLICY IF EXISTS "categories_select_all" ON categories;
CREATE POLICY "categories_select_all" ON categories FOR SELECT
  TO anon, authenticated USING (true);

-- ============ POSTS - Allow public read ============
DROP POLICY IF EXISTS "posts_select_all" ON posts;
CREATE POLICY "posts_select_all" ON posts FOR SELECT
  TO anon, authenticated USING (true);

-- ============ POST_IMAGES - Allow public read ============
DROP POLICY IF EXISTS "post_images_select_all" ON post_images;
CREATE POLICY "post_images_select_all" ON post_images FOR SELECT
  TO anon, authenticated USING (true);

-- ============ COMMENTS - Allow public read ============
DROP POLICY IF EXISTS "comments_select_all" ON comments;
CREATE POLICY "comments_select_all" ON comments FOR SELECT
  TO anon, authenticated USING (true);

-- ============ LIKES - Allow public read ============
DROP POLICY IF EXISTS "likes_select_all" ON likes;
CREATE POLICY "likes_select_all" ON likes FOR SELECT
  TO anon, authenticated USING (true);

-- ============ SHARES - Allow public read ============
DROP POLICY IF EXISTS "shares_select_all" ON shares;
CREATE POLICY "shares_select_all" ON shares FOR SELECT
  TO anon, authenticated USING (true);

-- ============ FAVORITES - Allow public read ============
DROP POLICY IF EXISTS "favorites_select_all" ON favorites;
CREATE POLICY "favorites_select_all" ON favorites FOR SELECT
  TO anon, authenticated USING (true);

-- ============================================================
-- Done! Non-authenticated users can now view all content
-- ============================================================
