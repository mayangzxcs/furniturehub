-- =============================================
-- FurnitureHub Seed Data for Supabase
-- Run this in the Supabase SQL Editor AFTER running the schema migration
-- =============================================

-- ============ CREATE USERS VIA AUTH ============
-- Note: Users must be created via the Supabase Auth API (see seed.ts)
-- The trigger handle_new_user() will auto-create profiles

-- ============ CATEGORIES ============
INSERT INTO categories (id, name, slug, description, icon) VALUES
  (gen_random_uuid(), 'Modern', 'modern', 'Clean lines, minimal design, and contemporary elegance.', 'bi-laptop'),
  (gen_random_uuid(), 'Rustic', 'rustic', 'Natural materials, warm textures, and farmhouse charm.', 'bi-tree'),
  (gen_random_uuid(), 'Minimalist', 'minimalist', 'Less is more. Simple, functional, and uncluttered.', 'bi-circle'),
  (gen_random_uuid(), 'Vintage', 'vintage', 'Classic pieces with history, character, and timeless appeal.', 'bi-clock-history'),
  (gen_random_uuid(), 'Industrial', 'industrial', 'Raw materials, exposed structures, and urban edge.', 'bi-building'),
  (gen_random_uuid(), 'Scandinavian', 'scandinavian', 'Light, airy, and cozy Nordic-inspired designs.', 'bi-snow')
ON CONFLICT (slug) DO NOTHING;

-- ============ POSTS ============
-- Note: user_id values must match the auth user IDs created by seed.ts
-- The seed.ts script will handle inserting posts with proper user IDs

-- ============ POST STATS FUNCTION ============
-- Already created in the schema migration

-- ============ INCREMENT VIEW FUNCTION ============
-- Already created in the schema migration