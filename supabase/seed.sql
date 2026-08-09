-- =============================================
-- FurnitureHub Seed Data for Supabase
-- Run this in the Supabase SQL Editor AFTER running the schema migration
-- =============================================

-- ============ CREATE USERS VIA AUTH ============
-- Note: Users must be created via the Supabase Auth API (see seed.ts)
-- The trigger handle_new_user() will auto-create profiles

-- ============ CATEGORIES ============
INSERT INTO categories (name, slug, description, icon) VALUES
  ('Modern', 'modern', 'Clean lines, minimal design, and contemporary elegance.', 'bi-laptop'),
  ('Rustic', 'rustic', 'Natural materials, warm textures, and farmhouse charm.', 'bi-tree'),
  ('Minimalist', 'minimalist', 'Less is more. Simple, functional, and uncluttered.', 'bi-circle'),
  ('Vintage', 'vintage', 'Classic pieces with history, character, and timeless appeal.', 'bi-clock-history'),
  ('Industrial', 'industrial', 'Raw materials, exposed structures, and urban edge.', 'bi-building'),
  ('Scandinavian', 'scandinavian', 'Light, airy, and cozy Nordic-inspired designs.', 'bi-snow')
ON CONFLICT (slug) DO NOTHING;

-- ============ DEMO USERS ============
-- Create demo users via auth (run seed.ts for this)
-- Admin: admin@homeofcomfort.com / admin123
-- Viewer: viewer@homeofcomfort.com / viewer123
-- The handle_new_user() trigger automatically creates profiles

-- ============ SEED POSTS ============
-- Note: Posts are inserted via seed.ts with proper user_id references.
-- The seed.ts script handles:
--   - Creating auth users
--   - Updating profiles with admin/viewer roles
--   - Inserting posts with proper category and user references
--   - Inserting post_images with Unsplash URLs

-- ============ POST STATS FUNCTION ============
-- Already created in the schema migration

-- ============ INCREMENT VIEW FUNCTION ============
-- Already created in the schema migration