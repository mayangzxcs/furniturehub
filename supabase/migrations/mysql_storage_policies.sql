-- ============ STORAGE FILES (MySQL Version) ============
--
-- MySQL does NOT have row-level security policies, storage.objects tables,
-- or bucket-level access controls like Supabase/PostgreSQL.
--
-- In MySQL, all storage access control must be enforced at the
-- APPLICATION LEVEL (PHP, Node.js, etc.), NOT at the database level.
--
-- This file replaces the Supabase storage policies with:
--   1. A storage_files table to track file metadata
--   2. Documented access rules for your application code
--
-- ============ USAGE NOTES FOR DEVELOPERS ============
--
-- Bucket: furniture
-- Purpose: Public furniture images (posts, avatars, etc.)
--
-- Intended Access Rules (enforce in app code):
--   1. Public read   → anyone can view/read files (SELECT)
--   2. Auth upload   → logged-in users can upload files (INSERT)
--   3. Auth update   → users can update their own files (UPDATE)
--   4. Auth delete   → users can delete their own files (DELETE)
--
-- ==========================================================

-- Track file metadata (replaces Supabase's storage.objects)
CREATE TABLE IF NOT EXISTS storage_files (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  bucket_id text NOT NULL DEFAULT 'furniture',
  name text NOT NULL,
  size BIGINT NOT NULL DEFAULT 0,
  mime_type text DEFAULT '',
  storage_path text NOT NULL,
  owner_id CHAR(36) REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_storage_files_bucket ON storage_files(bucket_id);
CREATE INDEX idx_storage_files_owner ON storage_files(owner_id);

ALTER TABLE storage_files COMMENT = 'Tracks file metadata. Access control must be enforced in application code. Bucket: furniture - Public furniture images. Rules: Public read, Auth upload, Auth update own, Auth delete own.';
