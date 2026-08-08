-- ============ RESET AND RESEED ============
-- This migration drops all existing tables and recreates the full schema
-- with seed data. Use this to reset the database to a clean state.
--
-- IMPORTANT: Run this in the Supabase SQL Editor or via supabase db push.
-- This will DELETE ALL EXISTING DATA.

-- ============ STEP 1: DROP ALL TABLES (in reverse dependency order) ============
DROP TABLE IF EXISTS contact_messages CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS shares CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS post_images CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop the trigger function for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Drop the updated_at trigger function
DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS posts_updated_at ON posts;
DROP TRIGGER IF EXISTS conversations_updated_at ON conversations;
DROP TRIGGER IF EXISTS comments_updated_at ON comments;
DROP FUNCTION IF EXISTS update_updated_at();

-- Drop the post stats function
DROP FUNCTION IF EXISTS get_post_stats(uuid);
DROP FUNCTION IF EXISTS increment_view(uuid);

-- ============ STEP 2: RECREATE SCHEMA ============

-- ============ PROFILES ============
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text NOT NULL DEFAULT '',
  avatar_url text DEFAULT '',
  bio text DEFAULT '',
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'pending')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Admin can update any profile (e.g., enable/disable users)
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- ============ CATEGORIES ============
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text DEFAULT '',
  icon text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select_all" ON categories;
CREATE POLICY "categories_select_all" ON categories FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "categories_insert_admin" ON categories;
CREATE POLICY "categories_insert_admin" ON categories FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "categories_update_admin" ON categories;
CREATE POLICY "categories_update_admin" ON categories FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "categories_delete_admin" ON categories;
CREATE POLICY "categories_delete_admin" ON categories FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- ============ POSTS ============
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  caption text NOT NULL DEFAULT '',
  tags text[] DEFAULT '{}',
  is_pinned boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  is_trending boolean NOT NULL DEFAULT false,
  views_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_select_all" ON posts;
CREATE POLICY "posts_select_all" ON posts FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "posts_insert_admin" ON posts;
CREATE POLICY "posts_insert_admin" ON posts FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "posts_update_admin" ON posts;
CREATE POLICY "posts_update_admin" ON posts FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "posts_delete_admin" ON posts;
CREATE POLICY "posts_delete_admin" ON posts FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_posts_category_id ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_is_featured ON posts(is_featured);
CREATE INDEX IF NOT EXISTS idx_posts_is_trending ON posts(is_trending);

-- ============ POST_IMAGES ============
CREATE TABLE IF NOT EXISTS post_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  thumbnail_url text NOT NULL DEFAULT '',
  medium_url text NOT NULL DEFAULT '',
  original_url text NOT NULL DEFAULT '',
  width integer DEFAULT 0,
  height integer DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE post_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "post_images_select_all" ON post_images;
CREATE POLICY "post_images_select_all" ON post_images FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "post_images_insert_admin" ON post_images;
CREATE POLICY "post_images_insert_admin" ON post_images FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "post_images_update_admin" ON post_images;
CREATE POLICY "post_images_update_admin" ON post_images FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "post_images_delete_admin" ON post_images;
CREATE POLICY "post_images_delete_admin" ON post_images FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_post_images_post_id ON post_images(post_id);

-- ============ COMMENTS ============
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select_all" ON comments;
CREATE POLICY "comments_select_all" ON comments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "comments_insert_own" ON comments;
CREATE POLICY "comments_insert_own" ON comments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comments_update_own" ON comments;
CREATE POLICY "comments_update_own" ON comments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comments_delete_own_or_admin" ON comments;
CREATE POLICY "comments_delete_own_or_admin" ON comments FOR DELETE
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- ============ LIKES ============
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "likes_select_all" ON likes;
CREATE POLICY "likes_select_all" ON likes FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "likes_insert_own" ON likes;
CREATE POLICY "likes_insert_own" ON likes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "likes_delete_own" ON likes;
CREATE POLICY "likes_delete_own" ON likes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);

-- ============ SHARES ============
CREATE TABLE IF NOT EXISTS shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  platform text NOT NULL DEFAULT 'copy',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shares_select_all" ON shares;
CREATE POLICY "shares_select_all" ON shares FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "shares_insert_own" ON shares;
CREATE POLICY "shares_insert_own" ON shares FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_shares_post_id ON shares(post_id);

-- ============ FAVORITES ============
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "favorites_select_all" ON favorites;
CREATE POLICY "favorites_select_all" ON favorites FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "favorites_insert_own" ON favorites;
CREATE POLICY "favorites_insert_own" ON favorites FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "favorites_delete_own" ON favorites;
CREATE POLICY "favorites_delete_own" ON favorites FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);

-- ============ CONVERSATIONS ============
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  admin_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(viewer_id)
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_select_participants" ON conversations;
CREATE POLICY "conversations_select_participants" ON conversations FOR SELECT
  TO authenticated USING (auth.uid() = viewer_id OR auth.uid() = admin_id);

DROP POLICY IF EXISTS "conversations_insert_own" ON conversations;
CREATE POLICY "conversations_insert_own" ON conversations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = viewer_id);

DROP POLICY IF EXISTS "conversations_update_participants" ON conversations;
CREATE POLICY "conversations_update_participants" ON conversations FOR UPDATE
  TO authenticated USING (auth.uid() = viewer_id OR auth.uid() = admin_id)
  WITH CHECK (auth.uid() = viewer_id OR auth.uid() = admin_id);

-- ============ MESSAGES ============
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  image_url text DEFAULT '',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select_participants" ON messages;
CREATE POLICY "messages_select_participants" ON messages FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (c.viewer_id = auth.uid() OR c.admin_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "messages_insert_participants" ON messages;
CREATE POLICY "messages_insert_participants" ON messages FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (c.viewer_id = auth.uid() OR c.admin_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "messages_update_participants" ON messages;
CREATE POLICY "messages_update_participants" ON messages FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (c.viewer_id = auth.uid() OR c.admin_id = auth.uid())
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (c.viewer_id = auth.uid() OR c.admin_id = auth.uid())
    )
  );

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'general',
  title text NOT NULL DEFAULT '',
  body text DEFAULT '',
  link text DEFAULT '',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert_own" ON notifications;
CREATE POLICY "notifications_insert_own" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- ============ ACTIVITY_LOGS ============
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  description text DEFAULT '',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity_logs_select_admin" ON activity_logs;
CREATE POLICY "activity_logs_select_admin" ON activity_logs FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "activity_logs_insert_authenticated" ON activity_logs;
CREATE POLICY "activity_logs_insert_authenticated" ON activity_logs FOR INSERT
  TO authenticated WITH CHECK (true);

-- ============ CONTACT_MESSAGES ============
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_messages_insert_all" ON contact_messages;
CREATE POLICY "contact_messages_insert_all" ON contact_messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "contact_messages_select_admin" ON contact_messages;
CREATE POLICY "contact_messages_select_admin" ON contact_messages FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- ============ TRIGGERS ============
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS posts_updated_at ON posts;
CREATE TRIGGER posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS conversations_updated_at ON conversations;
CREATE TRIGGER conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS comments_updated_at ON comments;
CREATE TRIGGER comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============ AUTO-CREATE PROFILE ON SIGNUP ============
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'viewer',
    'pending'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============ POST STATS FUNCTION ============
CREATE OR REPLACE FUNCTION get_post_stats(p_post_id uuid)
RETURNS TABLE(likes_count bigint, comments_count bigint, shares_count bigint, favorites_count bigint)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM likes WHERE likes.post_id = p_post_id),
    (SELECT COUNT(*) FROM comments WHERE comments.post_id = p_post_id),
    (SELECT COUNT(*) FROM shares WHERE shares.post_id = p_post_id),
    (SELECT COUNT(*) FROM favorites WHERE favorites.post_id = p_post_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============ INCREMENT VIEW COUNT ============
CREATE OR REPLACE FUNCTION increment_view(p_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE posts SET views_count = views_count + 1 WHERE id = p_post_id;
END;
$$;

-- ============ STEP 3: SEED DATA ============

-- Seed categories
INSERT INTO categories (id, name, slug, description, icon) VALUES
  (gen_random_uuid(), 'Modern', 'modern', 'Clean lines, minimal design, and contemporary elegance.', 'bi-laptop'),
  (gen_random_uuid(), 'Rustic', 'rustic', 'Natural materials, warm textures, and farmhouse charm.', 'bi-tree'),
  (gen_random_uuid(), 'Minimalist', 'minimalist', 'Less is more. Simple, functional, and uncluttered.', 'bi-circle'),
  (gen_random_uuid(), 'Vintage', 'vintage', 'Classic pieces with history, character, and timeless appeal.', 'bi-clock-history'),
  (gen_random_uuid(), 'Industrial', 'industrial', 'Raw materials, exposed structures, and urban edge.', 'bi-building'),
  (gen_random_uuid(), 'Scandinavian', 'scandinavian', 'Light, airy, and cozy Nordic-inspired designs.', 'bi-snow')
ON CONFLICT (slug) DO NOTHING;

-- Note: User accounts must be created via the Supabase Auth API.
-- The handle_new_user() trigger will auto-create profiles with status='pending'.
-- Admins can then enable users via the Admin Dashboard.
