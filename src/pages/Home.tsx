import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { enrichPosts as enrichPostsHelper } from '../lib/enrichPosts'
import type { PostWithRelations, Category } from '../lib/types'
import PostCard from '../components/PostCard'
import PostCardSkeleton from '../components/PostCardSkeleton'
import Lightbox from '../components/Lightbox'

const PAGE_SIZE = 8

export default function Home() {
  const { profile } = useAuth()
  const [posts, setPosts] = useState<PostWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null)

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => setCategories((data as Category[]) || []))
  }, [])

  const fetchPosts = useCallback(async (pageNum: number, replace: boolean) => {
    const from = pageNum * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    let query = supabase
      .from('posts')
      .select(`
        *,
        category:categories(*),
        user:profiles(*),
        post_images(*)
      `)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to)

    const { data, error } = await query
    if (error) { console.error(error); return }

    const enriched = await enrichPostsHelper(data as PostWithRelations[], profile?.id)

    if (replace) {
      setPosts(enriched)
    } else {
      setPosts((prev: PostWithRelations[]) => [...prev, ...enriched])
    }
    setHasMore(enriched.length === PAGE_SIZE)
  }, [profile])


  useEffect(() => {
    setLoading(true)
    fetchPosts(0, true).finally(() => setLoading(false))
  }, [fetchPosts])

  useEffect(() => {
    function onScroll() {
      if (loading || loadingMore || !hasMore) return
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 400) {
        setLoadingMore(true)
        const next = page + 1
        fetchPosts(next, false).finally(() => {
          setPage(next)
          setLoadingMore(false)
        })
      }
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [loading, loadingMore, hasMore, page, fetchPosts])

  const featured = posts.filter(p => p.is_featured)

  return (
    <div>
      {/* Hero Section */}
      <section className="text-center py-5" style={{ background: 'linear-gradient(135deg, var(--fh-secondary) 0%, var(--fh-bg) 100%)' }}>
        <div className="container py-4">
          <h1 className="display-4 fw-bold mb-3" style={{ color: 'var(--fh-primary)' }}>
            Discover Beautiful Furniture
          </h1>
          <p className="lead mb-4" style={{ maxWidth: '1200px', margin: '0 auto', opacity: 0.7 }}>
            Your furniture holds the stories of your life—the laughter shared with friends, the warmth of family gatherings, and the quiet moments of comfort. Buying new means leaving those memories behind, but our expert restoration services give your beloved sofas and chairs a second life at a fraction of the cost. We carefully revive the original beauty and structure of your pieces, ensuring that your home remains filled with comfort, savings, and the beautiful history you’ve built together.
          </p>
          {!profile && (
            <div className="d-flex gap-3 justify-content-center">
              <Link to="/signup" className="btn-fh-primary btn btn-lg">Get Started</Link>
              <Link to="/signin" className="btn-fh-outline btn btn-lg">Sign In</Link>
            </div>
          )}
        </div>
      </section>

      {/* Categories Strip */}
      {categories.length > 0 && (
        <section className="py-4 border-bottom" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
          <div className="container">
            <div className="d-flex gap-3 overflow-auto pb-2">
              {categories.map(cat => (
                <Link key={cat.id} to={`/category/${cat.slug}`} className="category-badge text-decoration-none" style={{ whiteSpace: 'nowrap', fontSize: '1rem', padding: '0.5rem 1.2rem' }}>
                  <i className={`bi ${cat.icon || 'bi-tag-fill'}`}></i>
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <section className="container py-4">
          <h2 className="fh-section-title"><i className="bi bi-star-fill me-2"></i>Featured Furniture</h2>
          <div className="row g-4">
            {featured.slice(0, 3).map(post => (
              <div key={post.id} className="col-md-4">
                <Link to={`/post/${post.id}`} className="text-decoration-none">
                  <div className="fh-card position-relative" style={{ aspectRatio: '1' }}>
                    <img
                      src={post.post_images?.[0]?.medium_url || post.post_images?.[0]?.original_url}
                      alt={post.caption}
                      className="w-100 h-100"
                      style={{ objectFit: 'cover' }}
                      loading="lazy"
                    />
                    <div className="position-absolute bottom-0 start-0 end-0 p-3" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', color: '#fff' }}>
                      <span className="category-badge mb-1">{post.category?.name}</span>
                      <p className="mb-0 fw-semibold text-truncate">{post.caption}</p>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Latest Feed */}
      <section className="container py-4">
        <h2 className="fh-section-title"><i className="bi bi-clock me-2"></i>Latest Furniture</h2>
        {loading ? (
          <div className="row g-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="col-md-6 col-lg-4"><PostCardSkeleton /></div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-image" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
            <p className="mt-3 text-muted">No furniture posts yet. Check back soon!</p>
          </div>
        ) : (
          <div className="row g-4">
            {posts.map(post => (
              <div key={post.id} className="col-md-6 col-lg-4">
                <PostCard post={post} onLightbox={(urls, idx) => setLightbox({ urls, index: idx })} />
              </div>
            ))}
            {loadingMore && [...Array(2)].map((_, i) => <div key={`s${i}`} className="col-md-6 col-lg-4"><PostCardSkeleton /></div>)}
          </div>
        )}
      </section>

      {lightbox && <Lightbox urls={lightbox.urls} startIndex={lightbox.index} onClose={() => setLightbox(null)} />}
    </div>
  )
}
