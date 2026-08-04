-- ============ PROFILES ============
CREATE TABLE IF NOT EXISTS profiles (
  id CHAR(36) PRIMARY KEY,
  email text NOT NULL,
  display_name text NOT NULL DEFAULT '',
  avatar_url text DEFAULT '',
  bio text DEFAULT '',
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'pending')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============ CATEGORIES ============
CREATE TABLE IF NOT EXISTS categories (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text DEFAULT '',
  icon text DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ POSTS ============
CREATE TABLE IF NOT EXISTS posts (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id CHAR(36) REFERENCES categories(id) ON DELETE SET NULL,
  caption text NOT NULL DEFAULT '',
  tags JSON DEFAULT ('[]'),
  is_pinned boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  is_trending boolean NOT NULL DEFAULT false,
  views_count integer NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============ POST_IMAGES ============
CREATE TABLE IF NOT EXISTS post_images (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  post_id CHAR(36) NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  thumbnail_url text NOT NULL DEFAULT '',
  medium_url text NOT NULL DEFAULT '',
  original_url text NOT NULL DEFAULT '',
  width integer DEFAULT 0,
  height integer DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ COMMENTS ============
CREATE TABLE IF NOT EXISTS comments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  post_id CHAR(36) NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id CHAR(36) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id CHAR(36) REFERENCES comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============ LIKES ============
CREATE TABLE IF NOT EXISTS likes (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  post_id CHAR(36) NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id CHAR(36) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id)
);

-- ============ SHARES ============
CREATE TABLE IF NOT EXISTS shares (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  post_id CHAR(36) NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id CHAR(36) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform text NOT NULL DEFAULT 'copy',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ FAVORITES ============
CREATE TABLE IF NOT EXISTS favorites (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  post_id CHAR(36) NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id CHAR(36) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id)
);

-- ============ CONVERSATIONS ============
CREATE TABLE IF NOT EXISTS conversations (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  viewer_id CHAR(36) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  admin_id CHAR(36) REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE(viewer_id)
);

-- ============ MESSAGES ============
CREATE TABLE IF NOT EXISTS messages (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  conversation_id CHAR(36) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id CHAR(36) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  image_url text DEFAULT '',
  is_read boolean NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'general',
  title text NOT NULL DEFAULT '',
  body text DEFAULT '',
  link text DEFAULT '',
  is_read boolean NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ ACTIVITY_LOGS ============
CREATE TABLE IF NOT EXISTS activity_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  description text DEFAULT '',
  metadata JSON DEFAULT ('{}'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ INDEXES ============
CREATE INDEX idx_posts_category_id ON posts(category_id);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_is_featured ON posts(is_featured);
CREATE INDEX idx_posts_is_trending ON posts(is_trending);

CREATE INDEX idx_post_images_post_id ON post_images(post_id);

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);

CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);

CREATE INDEX idx_shares_post_id ON shares(post_id);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- ============ UPDATED_AT TRIGGER ============
-- Note: MySQL 5.7+ supports DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
-- which handles updated_at automatically for most tables.
-- For tables that need a trigger-based approach (e.g., if you need more control),
-- uncomment the trigger below. However, the column definitions above already
-- use ON UPDATE CURRENT_TIMESTAMP, so triggers are not needed.

-- DELIMITER //
-- CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
--   FOR EACH ROW
-- BEGIN
--   SET NEW.updated_at = CURRENT_TIMESTAMP;
-- END//
-- DELIMITER ;

-- ============ POST STATS FUNCTION ============
DELIMITER //

CREATE FUNCTION get_post_stats(p_post_id CHAR(36))
RETURNS JSON
NOT DETERMINISTIC
READS SQL DATA
SQL SECURITY DEFINER
BEGIN
  DECLARE likes_count BIGINT;
  DECLARE comments_count BIGINT;
  DECLARE shares_count BIGINT;
  DECLARE favorites_count BIGINT;

  SELECT COUNT(*) INTO likes_count FROM likes WHERE likes.post_id = p_post_id;
  SELECT COUNT(*) INTO comments_count FROM comments WHERE comments.post_id = p_post_id;
  SELECT COUNT(*) INTO shares_count FROM shares WHERE shares.post_id = p_post_id;
  SELECT COUNT(*) INTO favorites_count FROM favorites WHERE favorites.post_id = p_post_id;

  RETURN JSON_OBJECT(
    'likes_count', likes_count,
    'comments_count', comments_count,
    'shares_count', shares_count,
    'favorites_count', favorites_count
  );
END//

DELIMITER ;