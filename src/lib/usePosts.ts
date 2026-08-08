import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './supabase'
import { useAuth } from './auth'
import { enrichPosts as enrichPostsHelper } from './enrichPosts'
import type { PostWithRelations } from './types'

const PAGE_SIZE = 9

interface FetchOptions {
  filter?: (query: any) => any
  orderBy?: { column: string; ascending: boolean }
  extraOrder?: { column: string; ascending: boolean }
  key?: string | number
  enabled?: boolean
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
  const [error, setError] = useState<string | null>(null)

  const enrichPosts = useCallback(async (raw: PostWithRelations[]): Promise<PostWithRelations[]> => {
    return enrichPostsHelper(raw, profileRef.current?.id)
  }, [])

  const fetchPage = useCallback(async (pageNum: number, replace: boolean): Promise<boolean> => {
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
    if (error) {
      console.error('Failed to fetch posts:', error)
      setError('Failed to load posts. Please try again.')
      setHasMore(false)
      return false
    }

    const enriched = await enrichPosts(data as PostWithRelations[])
    if (replace) {
      setPosts(enriched)
    } else {
      setPosts((prev: PostWithRelations[]) => [...prev, ...enriched])
    }
    // hasMore is true only if we got a full page. If we got fewer than PAGE_SIZE, we've reached the end.
    setHasMore(enriched.length === PAGE_SIZE)
    return true
  }, [enrichPosts])

  useEffect(() => {
    // Don't fetch if disabled (e.g., category not loaded yet)
    if (optionsRef.current.enabled === false) {
      setPosts([])
      setLoading(false)
      setHasMore(false)
      return
    }
    setLoading(true)
    setError(null)
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

  return { posts, loading, loadingMore, hasMore, error }
}