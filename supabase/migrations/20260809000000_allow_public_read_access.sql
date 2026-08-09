/*
# Allow public read access for all content

This migration updates RLS policies to allow:
- Anonymous (logged out) users to READ posts, categories, comments, images, etc.
- Only authenticated users to CREATE/UPDATE/DELETE content

This enables the read-only viewing experience for non-authenticated users.
*/

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

-- ============ LIKES - Allow public read (for like counts) ============
DROP POLICY IF EXISTS "likes_select_all" ON likes;
CREATE POLICY "likes_select_all" ON likes FOR SELECT
  TO anon, authenticated USING (true);

-- ============ SHARES - Allow public read (for share counts) ============
DROP POLICY IF EXISTS "shares_select_all" ON shares;
CREATE POLICY "shares_select_all" ON shares FOR SELECT
  TO anon, authenticated USING (true);

-- ============ FAVORITES - Allow public read (for display purposes) ============
DROP POLICY IF EXISTS "favorites_select_all" ON favorites;
CREATE POLICY "favorites_select_all" ON favorites FOR SELECT
  TO anon, authenticated USING (true);

-- ============ NOTIFICATIONS - Allow public read ============
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  TO anon, authenticated USING (auth.uid() = user_id OR auth.uid() IS NULL);
