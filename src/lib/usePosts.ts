import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './supabase'
import { useAuth } from './auth'
import type { PostWithRelations } from './types'

const PAGE_SIZE = 9

interface FetchOptions {
  filter?: (query: any) => any
  orderBy?: { column: string; ascending: boolean }
  extraOrder?: { column: string; ascending: boolean }
  key?: string | number
}

export function useInfinitePosts(options: FetchOptions = {}) {
  const { profile } = useAuth()
  const profileRef = useRef(profile)
  profileRef.current = profile
  
  const optionsRef = useRef(options)
  optionsRef.current = options
  
  const [posts, setPosts] = useState<PostWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)

  const enrichPosts = useCallback(async (raw: PostWithRelations[]): Promise<PostWithRelations[]> => {
    if (!raw.length) return []
    const postIds = raw.map(p => p.id)

    const [likesRes, commentsRes, sharesRes, favoritesRes] = await Promise.all([
      supabase.from('likes').select('post_id, user_id').in('post_id', postIds),
      supabase.from('comments').select('post_id').in('post_id', postIds),
      supabase.from('shares').select('post_id').in('post_id', postIds),
      profileRef.current ? supabase.from('favorites').select('post_id').in('post_id', postIds).eq('user_id', profileRef.current.id) : Promise.resolve({ data: [] as any[] }),
    ])

    const likesMap = new Map<string, number>()
    const likedByMe = new Set<string>()
    for (const l of (likesRes.data as any[] || [])) {
      likesMap.set(l.post_id, (likesMap.get(l.post_id) || 0) + 1)
      if (l.user_id === profileRef.current?.id) likedByMe.add(l.post_id)
    }

    const commentsMap = new Map<string, number>()
    for (const c of (commentsRes.data as any[] || [])) {
      commentsMap.set(c.post_id, (commentsMap.get(c.post_id) || 0) + 1)
    }

    const sharesMap = new Map<string, number>()
    for (const s of (sharesRes.data as any[] || [])) {
      sharesMap.set(s.post_id, (sharesMap.get(s.post_id) || 0) + 1)
    }

    const favSet = new Set<string>()
    for (const f of (favoritesRes.data as any[] || [])) {
      favSet.add((f as { post_id: string }).post_id)
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
  }, [])

  const fetchPage = useCallback(async (pageNum: number, replace: boolean) => {
    const from = pageNum * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    let query = supabase
      .from('posts')
      .select(`*, category:categories(*), user:profiles(*), post_images(*)`)
      .range(from, to)

    if (optionsRef.current.extraOrder) {
      query = query.order(optionsRef.current.extraOrder.column, { ascending: optionsRef.current.extraOrder.ascending })
    }
    query = query.order(optionsRef.current.orderBy?.column || 'created_at', { ascending: optionsRef.current.orderBy?.ascending ?? false })

    if (optionsRef.current.filter) {
      query = optionsRef.current.filter(query)
    }

    const { data, error } = await query
    if (error) { console.error(error); return }

    const enriched = await enrichPosts(data as PostWithRelations[])
    if (replace) {
      setPosts(enriched)
    } else {
      setPosts(prev => [...prev, ...enriched])
    }
    setHasMore(enriched.length === PAGE_SIZE)
  }, [enrichPosts])

  useEffect(() => {
    setLoading(true)
    setPage(0)
    fetchPage(0, true).finally(() => setLoading(false))
  }, [fetchPage, options.key])

  useEffect(() => {
    function onScroll() {
      if (loading || loadingMore || !hasMore) return
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 400) {
        setLoadingMore(true)
        const next = page + 1
        fetchPage(next, false).finally(() => {
          setPage(next)
          setLoadingMore(false)
        })
      }
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [loading, loadingMore, hasMore, page, fetchPage])

  return { posts, loading, loadingMore, hasMore }
}
