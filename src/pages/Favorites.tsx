import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { PostWithRelations } from '../lib/types'
import PostCard from '../components/PostCard'
import PostCardSkeleton from '../components/PostCardSkeleton'
import Lightbox from '../components/Lightbox'

export default function Favorites() {
  const { profile } = useAuth()
  const [posts, setPosts] = useState<PostWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null)

  const fetchFavorites = useCallback(() => {
    if (!profile) return
    setLoading(true)
    supabase
      .from('favorites')
      .select(`post:posts(*, category:categories(*), user:profiles(*), post_images(*))`)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to fetch favorites:', error)
          setPosts([])
        } else {
          const posts = ((data as unknown as { post: PostWithRelations }[]) || [])
            .map(row => row.post)
            .filter(Boolean) as PostWithRelations[]
          setPosts(posts)
        }
        setLoading(false)
      })
  }, [profile])

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  return (
    <div className="fh-page-container">
      <h1 className="fh-section-title"><i className="bi bi-bookmark-fill me-2"></i>My Favorites</h1>
      {loading ? (
        <div className="row g-4">{[...Array(3)].map((_, i) => <div key={i} className="col-md-6 col-lg-4"><PostCardSkeleton /></div>)}</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-bookmark" style={{ fontSize: '3rem', opacity: 0.2 }}></i>
          <p className="mt-3 text-muted">No favorites yet.</p>
          <Link to="/feed" className="btn-fh-outline btn mt-2">Browse Feed</Link>
        </div>
      ) : (
        <div className="row g-4">
          {posts.map(p => <div key={p.id} className="col-md-6 col-lg-4 d-flex"><PostCard post={p} onLightbox={(u, i) => setLightbox({ urls: u, index: i })} onFavoriteChange={fetchFavorites} /></div>)}
        </div>
      )}
      {lightbox && <Lightbox urls={lightbox.urls} startIndex={lightbox.index} onClose={() => setLightbox(null)} />}
    </div>
  )
}