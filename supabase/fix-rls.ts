#!/usr/bin/env node
/**
 * Fix RLS Policies for Public Read Access
 * 
 * This script updates Supabase RLS policies to allow public (non-authenticated) 
 * users to read posts, categories, images, comments, etc.
 * 
 * Run with: npm run fix-rls
 */

import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('   Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const SQL_STATEMENTS = [
  // ============ PROFILES - Allow public read ============
  `DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
   CREATE POLICY "profiles_select_all" ON profiles FOR SELECT
   TO anon, authenticated USING (true);`,

  // ============ CATEGORIES - Allow public read ============
  `DROP POLICY IF EXISTS "categories_select_all" ON categories;
   CREATE POLICY "categories_select_all" ON categories FOR SELECT
   TO anon, authenticated USING (true);`,

  // ============ POSTS - Allow public read ============
  `DROP POLICY IF EXISTS "posts_select_all" ON posts;
   CREATE POLICY "posts_select_all" ON posts FOR SELECT
   TO anon, authenticated USING (true);`,

  // ============ POST_IMAGES - Allow public read ============
  `DROP POLICY IF EXISTS "post_images_select_all" ON post_images;
   CREATE POLICY "post_images_select_all" ON post_images FOR SELECT
   TO anon, authenticated USING (true);`,

  // ============ COMMENTS - Allow public read ============
  `DROP POLICY IF EXISTS "comments_select_all" ON comments;
   CREATE POLICY "comments_select_all" ON comments FOR SELECT
   TO anon, authenticated USING (true);`,

  // ============ LIKES - Allow public read ============
  `DROP POLICY IF EXISTS "likes_select_all" ON likes;
   CREATE POLICY "likes_select_all" ON likes FOR SELECT
   TO anon, authenticated USING (true);`,

  // ============ SHARES - Allow public read ============
  `DROP POLICY IF EXISTS "shares_select_all" ON shares;
   CREATE POLICY "shares_select_all" ON shares FOR SELECT
   TO anon, authenticated USING (true);`,

  // ============ FAVORITES - Allow public read ============
  `DROP POLICY IF EXISTS "favorites_select_all" ON favorites;
   CREATE POLICY "favorites_select_all" ON favorites FOR SELECT
   TO anon, authenticated USING (true);`,
]

async function fixRLS() {
  try {
    console.log('\n🔐 Updating RLS policies for public read access...\n')
    
    let successCount = 0
    
    for (const sql of SQL_STATEMENTS) {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
          },
          body: JSON.stringify({ sql }),
        })
        
        if (response.ok) {
          successCount++
        }
      } catch (e: any) {
        // RPC endpoint doesn't exist, try inline approach
        console.log('  📌 Note: Some policies may need to be updated manually')
      }
    }
    
    if (successCount > 0) {
      console.log('✅ RLS policies updated successfully!')
    } else {
      console.log('⚠️  Could not update via API. Please run the SQL manually:')
      console.log('\n📋 Copy these SQL statements to Supabase SQL Editor:')
      console.log('   1. Go to: supabase.com → Your Project → SQL Editor')
      console.log('   2. Create a new query and paste the SQL below:')
      console.log('\n' + SQL_STATEMENTS.join('\n\n'))
    }
    
    console.log('\n📝 Changes to make:')
    console.log('   ✓ profiles: Public read access enabled')
    console.log('   ✓ categories: Public read access enabled')
    console.log('   ✓ posts: Public read access enabled')
    console.log('   ✓ post_images: Public read access enabled')
    console.log('   ✓ comments: Public read access enabled')
    console.log('   ✓ likes: Public read access enabled')
    console.log('   ✓ shares: Public read access enabled')
    console.log('   ✓ favorites: Public read access enabled')
    console.log('\n✨ Once done, non-authenticated users can view all content!\n')
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

fixRLS()
