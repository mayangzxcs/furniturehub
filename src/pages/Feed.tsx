import { Link } from 'react-router-dom'
import { useInfinitePosts } from '../lib/usePosts'
import PostCard from '../components/PostCard'
import PostCardSkeleton from '../components/PostCardSkeleton'
import Lightbox from '../components/Lightbox'
import { useState } from 'react'

export default function Feed() {
  const { posts, loading, loadingMore } = useInfinitePosts()
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null)

  return (
    <div className="fh-page-container">
      <h1 className="fh-section-title">Furniture Feed</h1>
      {loading ? (
        <div className="row g-4">
          {[...Array(6)].map((_, i) => <div key={i} className="col-md-6 col-lg-4"><PostCardSkeleton /></div>)}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-image" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
          <p className="mt-3 text-muted">No furniture posts yet.</p>
          <Link to="/categories" className="btn-fh-outline btn mt-2">Browse Categories</Link>
        </div>
      ) : (
        <div className="row g-4">
          {posts.map(post => (
            <div key={post.id} className="col-md-6 col-lg-4">
              <PostCard post={post} onLightbox={(urls, idx) => setLightbox({ urls, index: idx })} />
            </div>
          ))}
          {loadingMore && [...Array(3)].map((_, i) => <div key={`s${i}`} className="col-md-6 col-lg-4"><PostCardSkeleton /></div>)}
        </div>
      )}
      {lightbox && <Lightbox urls={lightbox.urls} startIndex={lightbox.index} onClose={() => setLightbox(null)} />}
    </div>
  )
}
