import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { showToast } from '../lib/toast'
import type { PostWithRelations } from '../lib/types'

interface Props {
  post: PostWithRelations
  onLightbox?: (urls: string[], index: number) => void
  onFavoriteChange?: () => void
}

export default function PostCard({ post, onLightbox, onFavoriteChange }: Props) {
  const { profile } = useAuth()
  const [liked, setLiked] = useState(post.liked_by_me ?? false)
  const [likesCount, setLikesCount] = useState(post.likes_count ?? 0)
  const [commentsCount] = useState(post.comments_count ?? 0)
  const [favorited, setFavorited] = useState(post.favorited_by_me ?? false)
  const [heartAnim, setHeartAnim] = useState(false)

  const images = post.post_images || []
  const primaryImage = images[0]
  const imageUrl = primaryImage?.medium_url || primaryImage?.original_url || ''
  const profileUrl = profile?.id === post.user_id ? '/profile' : `/profile/${post.user_id}`

  async function toggleLike() {
    if (!profile) { showToast('Sign in to like posts', 'info'); return }
    setHeartAnim(true)
    setTimeout(() => setHeartAnim(false), 400)

    if (liked) {
      setLiked(false)
      setLikesCount(c => c - 1)
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', profile.id)
    } else {
      setLiked(true)
      setLikesCount(c => c + 1)
      await supabase.from('likes').insert({ post_id: post.id, user_id: profile.id })
      if (post.user_id !== profile.id) {
        await supabase.from('notifications').insert({
          user_id: post.user_id,
          type: 'like',
          title: '❤️ New Like',
          body: `${profile.display_name} liked your post`,
          link: `/post/${post.id}`,
          is_read: false,
        })
      }
    }
  }

  async function toggleFavorite() {
    if (!profile) { showToast('Sign in to save favorites', 'info'); return }
    if (favorited) {
      setFavorited(false)
      await supabase.from('favorites').delete().eq('post_id', post.id).eq('user_id', profile.id)
      showToast('Removed from favorites', 'info')
      onFavoriteChange?.()
    } else {
      setFavorited(true)
      await supabase.from('favorites').insert({ post_id: post.id, user_id: profile.id })
      showToast('Added to favorites', 'success')
      onFavoriteChange?.()
    }
  }

  function handleShare() {
    if (!profile) { showToast('Sign in to share posts', 'info'); return }
    const url = `${window.location.origin}/post/${post.id}`
    if (navigator.share) {
      navigator.share({ title: 'FurnitureHub', text: post.caption, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url)
      showToast('Link copied to clipboard', 'success')
      supabase.from('shares').insert({ post_id: post.id, user_id: profile?.id, platform: 'copy' })
    }
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = (now.getTime() - d.getTime()) / 1000
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return d.toLocaleDateString()
  }

  return (
    <article className="post-card fade-in h-100 d-flex flex-column">
      <div className="post-card-header">
        <Link to={profileUrl}>
          {post.user?.avatar_url ? (
            <img src={post.user.avatar_url} alt={post.user.display_name} className="post-card-avatar" />
          ) : (
            <div className="post-card-avatar d-flex align-items-center justify-content-center text-white">
              {post.user?.display_name?.charAt(0).toUpperCase() || 'A'}
            </div>
          )}
        </Link>
        <div className="row">
          <div className="flex-grow-1 col-4">
            <Link to={profileUrl} className="post-card-author text-decoration-none">{post.user?.display_name || 'Unknown'}</Link>
            <div className="post-card-date">{formatDate(post.created_at)}</div>
          </div>
          {(post.is_pinned || post.is_featured) && (
            <div className="flex-grow-1 col-2">
              {post.is_featured && (
                <span className="badge bg-fh-accent text-white"><i className="bi bi-star-fill me-1"></i>Featured</span>
              )}
              {post.is_pinned && (
                <span className="badge bg-fh-primary text-white"><i className="bi bi-pin-fill me-1"></i>Pinned</span>
              )}
            </div>
          )}
        </div>
      </div>

      {imageUrl && (
        <div style={{ position: 'relative', cursor: 'pointer', marginTop: post.is_pinned ? '-6.5px' : '' }} onClick={() => onLightbox?.(images.map(i => i.original_url), 0)}>
          <img
            src={imageUrl}
            alt={post.caption}
            className="post-card-image"
            loading="lazy"
            style={{ aspectRatio: '4/3', objectFit: 'cover' }}
          />
          {images.length > 1 && (
            <span className="position-absolute top-0 end-0 m-2 badge bg-dark bg-opacity-75">
              <i className="bi bi-images me-1"></i>{images.length}
            </span>
          )}
        </div>
      )}

      <div className="post-card-actions">
        <button 
          className={`post-action-btn ${liked ? 'liked' : ''} ${!profile ? 'disabled-action' : ''}`} 
          onClick={toggleLike} 
          disabled={!profile}
          title={!profile ? 'Sign in to like posts' : 'Like'}
          aria-label="Like"
        >
          <i className={`bi ${liked ? 'bi-heart-fill heart-anim' : 'bi-heart'} ${heartAnim ? 'heart-anim' : ''}`}></i>
          <span>{likesCount}</span>
        </button>
        <Link to={`/post/${post.id}`} className="post-action-btn text-decoration-none" aria-label="View comments">
          <i className="bi bi-chat"></i>
          <span>{commentsCount}</span>
        </Link>
        <button 
          className={`post-action-btn ${!profile ? 'disabled-action' : ''}`} 
          onClick={handleShare} 
          disabled={!profile}
          title={!profile ? 'Sign in to share posts' : 'Share'}
          aria-label="Share"
        >
          <i className="bi bi-share"></i>
          <span>{post.shares_count ?? 0}</span>
        </button>
        <button 
          className={`post-action-btn ${favorited ? 'favorited' : ''} ${!profile ? 'disabled-action' : ''}`} 
          onClick={toggleFavorite} 
          disabled={!profile}
          title={!profile ? 'Sign in to save favorites' : 'Save to favorites'}
          aria-label="Favorite" 
          style={{ marginLeft: 'auto' }}
        >
          <i className={`bi ${favorited ? 'bi-bookmark-fill' : 'bi-bookmark'}`}></i>
        </button>
      </div>

      <div className="post-card-caption flex-grow-1">
        {post.caption}
      </div>

      {post.category && (
        <div className="px-3 pb-3 mt-auto">
          <Link to={`/category/${post.category.slug}`} className="category-badge text-decoration-none">
            <i className={`bi ${post.category.icon || 'bi-tag-fill'}`}></i>
            {post.category.name}
          </Link>
        </div>
      )}
    </article>
  )
}
