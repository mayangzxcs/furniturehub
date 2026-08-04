import { useInfinitePosts } from '../lib/usePosts'
import PostCard from '../components/PostCard'
import PostCardSkeleton from '../components/PostCardSkeleton'
import Lightbox from '../components/Lightbox'
import { useState } from 'react'

export default function Trending() {
  const { posts, loading, loadingMore } = useInfinitePosts({
    filter: (q: any) => q.eq('is_trending', true),
  })
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null)

  return (
    <div className="fh-page-container">
      <div className="text-center mb-4">
        <i className="bi bi-fire" style={{ fontSize: '3rem', color: 'var(--fh-btn)' }}></i>
        <h1 className="fh-section-title mt-2">Trending Furniture</h1>
        <p style={{ opacity: 0.6 }}>The most popular pieces right now</p>
      </div>
      {loading ? (
        <div className="row g-4">{[...Array(3)].map((_, i) => <div key={i} className="col-md-6 col-lg-4"><PostCardSkeleton /></div>)}</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-5"><p className="text-muted">No trending posts yet.</p></div>
      ) : (
        <div className="row g-4">
          {posts.map(p => <div key={p.id} className="col-md-6 col-lg-4"><PostCard post={p} onLightbox={(u, i) => setLightbox({ urls: u, index: i })} /></div>)}
          {loadingMore && [...Array(2)].map((_, i) => <div key={`s${i}`} className="col-md-6 col-lg-4"><PostCardSkeleton /></div>)}
        </div>
      )}
      {lightbox && <Lightbox urls={lightbox.urls} startIndex={lightbox.index} onClose={() => setLightbox(null)} />}
    </div>
  )
}
