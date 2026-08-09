import { supabase } from './supabase'
import type { PostWithRelations } from './types'

/**
 * Enriches raw posts with likes/comments/shares counts and user interaction state.
 * This is a shared helper used by Home, Profile, Feed, and other pages.
 */
export async function enrichPosts(
  raw: PostWithRelations[],
  currentUserId?: string
): Promise<PostWithRelations[]> {
  if (!raw.length) return []
  const postIds = raw.map(p => p.id)

  const [likesRes, commentsRes, sharesRes, favoritesRes] = await Promise.all([
    supabase.from('likes').select('post_id, user_id').in('post_id', postIds),
    supabase.from('comments').select('post_id').in('post_id', postIds),
    supabase.from('shares').select('post_id').in('post_id', postIds),
    currentUserId
      ? supabase.from('favorites').select('post_id').in('post_id', postIds).eq('user_id', currentUserId)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
  ])

  const likesMap = new Map<string, number>()
  const likedByMe = new Set<string>()
  for (const l of (likesRes.data as { post_id: string; user_id: string }[] || [])) {
    likesMap.set(l.post_id, (likesMap.get(l.post_id) || 0) + 1)
    if (l.user_id === currentUserId) likedByMe.add(l.post_id)
  }

  const commentsMap = new Map<string, number>()
  for (const c of (commentsRes.data as { post_id: string }[] || [])) {
    commentsMap.set(c.post_id, (commentsMap.get(c.post_id) || 0) + 1)
  }

  const sharesMap = new Map<string, number>()
  for (const s of (sharesRes.data as { post_id: string }[] || [])) {
    sharesMap.set(s.post_id, (sharesMap.get(s.post_id) || 0) + 1)
  }

  const favSet = new Set<string>()
  for (const f of (favoritesRes.data as { post_id: string }[] || [])) {
    favSet.add(f.post_id)
  }

  return raw.map(p => ({
    ...p,
    post_images: p.post_images?.sort((a, b) => a.sort_order - b.sort_order),
    likes_count: likesMap.get(p.id) || 0,
    comments_count: commentsMap.get(p.id) || 0,
    shares_count: sharesMap.get(p.id) || 0,
    liked_by_me: likedByMe.has(p.id),
    favorited_by_me: favSet.has(p.id),
  }))
}