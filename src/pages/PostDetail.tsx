import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { showToast } from '../lib/toast'
import type { PostWithRelations, Comment } from '../lib/types'
import Lightbox from '../components/Lightbox'

export default function PostDetail() {
  const { id } = useParams()
  const { profile } = useAuth()
  const [post, setPost] = useState<PostWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [commentsCount, setCommentsCount] = useState(0)
  const [favorited, setFavorited] = useState(false)
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)

  const loadPost = useCallback(async () => {
    if (!id) return
    const { data, error } = await supabase
      .from('posts')
      .select(`*, category:categories(*), user:profiles(*), post_images(*)`)
      .eq('id', id)
      .maybeSingle()

    if (error || !data) { setLoading(false); return }
    const postData = data as PostWithRelations
    postData.post_images = postData.post_images?.sort((a, b) => a.sort_order - b.sort_order)

    const [likesRes, commentsCountRes, sharesRes, favRes] = await Promise.all([
      supabase.from('likes').select('user_id').eq('post_id', id),
      supabase.from('comments').select('id').eq('post_id', id),
      supabase.from('shares').select('id').eq('post_id', id),
      profile ? supabase.from('favorites').select('id').eq('post_id', id).eq('user_id', profile.id).maybeSingle() : Promise.resolve({ data: null }),
    ])

    setPost({
      ...postData,
      likes_count: (likesRes.data || []).length,
      comments_count: (commentsCountRes.data || []).length,
      shares_count: (sharesRes.data || []).length,
      liked_by_me: (likesRes.data || []).some(l => l.user_id === profile?.id),
      favorited_by_me: !!favRes.data,
    })
    setLiked((likesRes.data || []).some(l => l.user_id === profile?.id))
    setLikesCount((likesRes.data || []).length)
    setCommentsCount((commentsCountRes.data || []).length)
    setFavorited(!!favRes.data)
    setLoading(false)
  }, [id, profile])

  const loadComments = useCallback(async () => {
    if (!id) return
    const { data } = await supabase
      .from('comments')
      .select('*, user:profiles(*)')
      .eq('post_id', id)
      .order('created_at', { ascending: true })

    const allComments = (data as Comment[]) || []
    // Build comment tree in O(n) using a map
    const commentMap = new Map<string, Comment>()
    for (const c of allComments) {
      commentMap.set(c.id, { ...c, replies: [] })
    }
    const roots: Comment[] = []
    for (const c of commentMap.values()) {
      if (c.parent_id && commentMap.has(c.parent_id)) {
        commentMap.get(c.parent_id)!.replies!.push(c)
      } else {
        roots.push(c)
      }
    }
    setComments(roots)
  }, [id])

  useEffect(() => { loadPost(); loadComments() }, [loadPost, loadComments])

  // Increment view count via Supabase RPC (fire-and-forget)
  useEffect(() => {
    if (!id) return
    ;(async () => {
      await supabase.rpc('increment_view', { p_post_id: id })
    })()
  }, [id])

   async function handleAddComment() {
     if (!profile) { showToast('Sign in to comment', 'info'); return }
     if (!newComment.trim()) return
     const { error } = await supabase.from('comments').insert({ post_id: id, user_id: profile.id, content: newComment })
     if (error) { showToast('Failed to post comment', 'error'); return }
     setNewComment('')
     setCommentsCount(c => c + 1)
     loadComments()
     if (post && post.user_id !== profile.id) {
       await supabase.from('notifications').insert({
         user_id: post.user_id, type: 'comment', title: 'New Comment',
         body: `${profile.display_name} commented on your post`, link: `/post/${id}`,
       })
     }
   }

   async function handleReply(parentId: string) {
     if (!profile) { showToast('Sign in to reply', 'info'); return }
     if (!replyContent.trim()) return
     const { error } = await supabase.from('comments').insert({ post_id: id, user_id: profile.id, parent_id: parentId, content: replyContent })
     if (error) { showToast('Failed to post reply', 'error'); return }
     setReplyTo(null)
     setReplyContent('')
     setCommentsCount(c => c + 1)
     loadComments()
   }

  async function handleEditComment(commentId: string) {
    if (!editingId || !editContent.trim()) return
    const { error } = await supabase.from('comments').update({ content: editContent }).eq('id', commentId)
    if (error) { showToast('Failed to edit', 'error'); return }
    setEditingId(null)
    setEditContent('')
    loadComments()
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm('Delete this comment?')) return
    const { error } = await supabase.from('comments').delete().eq('id', commentId)
    if (error) { showToast('Failed to delete', 'error'); return }
    setCommentsCount(c => Math.max(0, c - 1))
    loadComments()
  }

  async function toggleLike() {
    if (!profile) { showToast('Sign in to like posts', 'info'); return }
    if (liked) {
      setLiked(false); setLikesCount(c => c - 1)
      await supabase.from('likes').delete().eq('post_id', id).eq('user_id', profile.id)
    } else {
      setLiked(true); setLikesCount(c => c + 1)
      await supabase.from('likes').insert({ post_id: id, user_id: profile.id })
      if (post && post.user_id !== profile.id) {
        await supabase.from('notifications').insert({
          user_id: post.user_id, type: 'like', title: 'New Like',
          body: `${profile.display_name} liked your post`, link: `/post/${id}`,
        })
      }
    }
  }

  async function toggleFavorite() {
    if (!profile) { showToast('Sign in to save favorites', 'info'); return }
    if (favorited) {
      setFavorited(false)
      await supabase.from('favorites').delete().eq('post_id', id).eq('user_id', profile.id)
    } else {
      setFavorited(true)
      await supabase.from('favorites').insert({ post_id: id, user_id: profile.id })
      showToast('Added to favorites', 'success')
    }
  }

  function handleShare(platform: string) {
    const url = `${window.location.origin}/post/${id}`
    const text = encodeURIComponent(post?.caption || 'Check out this furniture!')
    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      messenger: `https://www.facebook.com/dialog/send?link=${encodeURIComponent(url)}&app_id=123456789`,
      whatsapp: `https://wa.me/?text=${text}%20${encodeURIComponent(url)}`,
      x: `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${text}`,
      email: `mailto:?subject=FurnitureHub&body=${text}%20${encodeURIComponent(url)}`,
    }
    if (platform === 'copy') {
      navigator.clipboard.writeText(url)
      showToast('Link copied!', 'success')
    } else if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400')
    }
    if (profile) {
      supabase.from('shares').insert({ post_id: id, user_id: profile.id, platform })
    }
    setShowShareModal(false)
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }

  function renderComment(comment: Comment, depth: number = 0) {
    const isOwn = comment.user_id === profile?.id
    const isAdmin = profile?.role === 'admin'
    const canModify = isOwn || isAdmin
    return (
      <div key={comment.id} className="fade-in" style={{ marginLeft: depth > 0 ? '2rem' : 0, marginTop: '0.75rem' }}>
        <div className="d-flex gap-2">
          {comment.user?.avatar_url ? (
            <img src={comment.user.avatar_url} alt="" className="rounded-circle" style={{ width: '36px', height: '36px', objectFit: 'cover' }} />
          ) : (
            <div className="rounded-circle d-flex align-items-center justify-content-center text-white" style={{ width: '36px', height: '36px', background: 'var(--fh-primary)', fontSize: '0.85rem' }}>
              {comment.user?.display_name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <div className="flex-grow-1">
            <div className="d-flex align-items-baseline gap-2">
              <Link to={`/profile/${comment.user_id}`} className="fw-semibold text-decoration-none" style={{ fontSize: '0.9rem' }}>{comment.user?.display_name || 'Unknown'}</Link>
              <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>{formatDate(comment.created_at)}</span>
            </div>
            {editingId === comment.id ? (
              <div className="mt-1">
                <textarea className="fh-form-control" value={editContent} onChange={e => setEditContent(e.target.value)} rows={2} />
                <div className="d-flex gap-2 mt-1">
                  <button className="btn btn-sm btn-fh-primary" onClick={() => handleEditComment(comment.id)}>Save</button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => { setEditingId(null); setEditContent('') }}>Cancel</button>
                </div>
              </div>
            ) : (
              <p className="mb-1" style={{ fontSize: '0.95rem' }}>{comment.content}</p>
            )}
            <div className="d-flex gap-3" style={{ fontSize: '0.85rem' }}>
              <button className="btn btn-sm btn-link text-decoration-none p-0" onClick={() => { setReplyTo(replyTo === comment.id ? null : comment.id); setReplyContent('') }}>Reply</button>
              {canModify && !isOwn && isAdmin && (
                <button className="btn btn-sm btn-link text-danger text-decoration-none p-0" onClick={() => handleDeleteComment(comment.id)}>Delete</button>
              )}
              {isOwn && editingId !== comment.id && (
                <>
                  <button className="btn btn-sm btn-link text-decoration-none p-0" onClick={() => { setEditingId(comment.id); setEditContent(comment.content) }}>Edit</button>
                  <button className="btn btn-sm btn-link text-danger text-decoration-none p-0" onClick={() => handleDeleteComment(comment.id)}>Delete</button>
                </>
              )}
            </div>
            {replyTo === comment.id && (
              <div className="mt-2">
                <textarea className="fh-form-control" value={replyContent} onChange={e => setReplyContent(e.target.value)} placeholder="Write a reply..." rows={2} />
                <div className="d-flex gap-2 mt-1">
                  <button className="btn btn-sm btn-fh-primary" onClick={() => handleReply(comment.id)}>Reply</button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => { setReplyTo(null); setReplyContent('') }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
        {comment.replies?.map(r => renderComment(r, depth + 1))}
      </div>
    )
  }

  if (loading) {
    return <div className="text-center p-5"><div className="spinner-border text-fh-primary" /></div>
  }
  if (!post) {
    return <div className="text-center py-5"><p>Post not found.</p><Link to="/feed" className="btn-fh-outline btn">Back to Feed</Link></div>
  }

  const images = post.post_images || []

  return (
    <div className="fh-page-container" style={{ maxWidth: '800px' }}>
      <Link to="/feed" className="btn btn-sm btn-outline-secondary mb-3"><i className="bi bi-arrow-left me-1"></i>Back</Link>

      <article className="fh-card fade-in">
        {/* Author */}
        <div className="post-card-header">
          <Link to={post.user_id === profile?.id ? '/profile' : `/profile/${post.user_id}`}>
            {post.user?.avatar_url ? (
              <img src={post.user.avatar_url} alt="" className="post-card-avatar" />
            ) : (
              <div className="post-card-avatar d-flex align-items-center justify-content-center text-white">{post.user?.display_name?.charAt(0).toUpperCase()}</div>
            )}
          </Link>
          <div className="flex-grow-1">
            <div className="post-card-author">{post.user?.display_name || 'Unknown'}</div>
            <div className="post-card-date">{formatDate(post.created_at)}</div>
          </div>
          {post.category && <Link to={`/category/${post.category.slug}`} className="category-badge text-decoration-none"><i className={`bi ${post.category.icon || 'bi-tag-fill'}`}></i>{post.category.name}</Link>}
        </div>

        {/* Images */}
        {images.length > 0 && (
          <div className="position-relative">
            <img
              src={images[0]?.original_url || images[0]?.medium_url}
              alt={post.caption}
              className="w-100"
              style={{ cursor: 'pointer', maxHeight: '600px', objectFit: 'cover' }}
              onClick={() => setLightbox({ urls: images.map(i => i.original_url), index: 0 })}
              loading="lazy"
            />
            {images.length > 1 && (
              <div className="d-flex gap-1 p-2 overflow-auto">
                {images.map((img, i) => (
                  <img key={img.id} src={img.thumbnail_url || img.medium_url} alt="" className="rounded" style={{ width: '80px', height: '80px', objectFit: 'cover', cursor: 'pointer' }} onClick={() => setLightbox({ urls: images.map(im => im.original_url), index: i })} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="post-card-actions">
          <button className={`post-action-btn ${liked ? 'liked' : ''}`} onClick={toggleLike}>
            <i className={`bi ${liked ? 'bi-heart-fill' : 'bi-heart'}`}></i><span>{likesCount}</span>
          </button>
          <div className="post-action-btn"><i className="bi bi-chat"></i><span>{commentsCount}</span></div>
          <button className="post-action-btn" onClick={() => setShowShareModal(true)}><i className="bi bi-share"></i><span>{post.shares_count}</span></button>
          <button className={`post-action-btn ${favorited ? 'favorited' : ''}`} onClick={toggleFavorite} style={{ marginLeft: 'auto' }}>
            <i className={`bi ${favorited ? 'bi-bookmark-fill' : 'bi-bookmark'}`}></i>
          </button>
        </div>

        {/* Caption */}
        <div className="post-card-caption">
          <p className="mb-2">{post.caption}</p>
          {post.tags && (Array.isArray(post.tags) ? post.tags : JSON.parse(post.tags || '[]')).length > 0 && (
            <div className="d-flex gap-2 flex-wrap">
              {(Array.isArray(post.tags) ? post.tags : JSON.parse(post.tags || '[]')).map((tag: string) => <span key={tag} className="text-fh-accent" style={{ fontSize: '0.9rem' }}>#{tag}</span>)}
            </div>
          )}
        </div>
      </article>

      {/* Comments */}
      <section className="mt-4">
        <h3 className="mb-3" style={{ fontSize: '1.4rem' }}>Comments</h3>
        {profile ? (
          <div className="fh-card p-3 mb-3">
            <textarea className="fh-form-control mb-2" placeholder="Write a comment..." rows={2} value={newComment} onChange={e => setNewComment(e.target.value)} />
            <button className="btn btn-fh-primary btn-sm" onClick={handleAddComment} disabled={!newComment.trim()}>Post Comment</button>
          </div>
        ) : (
          <div className="fh-card p-3 mb-3 text-center">
            <p className="text-muted mb-2">Sign in to comment on this post</p>
            <Link to="/signin" className="btn btn-fh-outline btn-sm">Sign In</Link>
          </div>
        )}
        {comments.length === 0 ? (
          <p className="text-muted text-center py-3">No comments yet. Be the first!</p>
        ) : (
          <div className="fh-card p-3">{comments.map(c => renderComment(c))}</div>
        )}
      </section>

      {lightbox && <Lightbox urls={lightbox.urls} startIndex={lightbox.index} onClose={() => setLightbox(null)} />}

      {/* Share Modal */}
      {showShareModal && (
        <div className="lightbox-overlay" onClick={() => setShowShareModal(false)} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="fh-card p-4" style={{ maxWidth: '400px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <h4 className="mb-3">Share Post</h4>
            <div className="row g-2 text-center">
              {[
                { p: 'facebook', icon: 'bi-facebook', label: 'Facebook', color: '#1877F2' },
                { p: 'messenger', icon: 'bi-messenger', label: 'Messenger', color: '#00B2FF' },
                { p: 'whatsapp', icon: 'bi-whatsapp', label: 'WhatsApp', color: '#25D366' },
                { p: 'x', icon: 'bi-twitter-x', label: 'X', color: '#000' },
                { p: 'pinterest', icon: 'bi-pinterest', label: 'Pinterest', color: '#E60023' },
                { p: 'email', icon: 'bi-envelope', label: 'Email', color: '#6c757d' },
                { p: 'copy', icon: 'bi-clipboard', label: 'Copy Link', color: 'var(--fh-primary)' },
              ].map(s => (
                <div key={s.p} className="col-3 mb-3">
                  <button className="btn btn-light d-flex flex-column align-items-center w-100" onClick={() => handleShare(s.p)}>
                    <i className={`bi ${s.icon}`} style={{ fontSize: '1.5rem', color: s.color }}></i>
                    <span style={{ fontSize: '0.75rem' }}>{s.label}</span>
                  </button>
                </div>
              ))}
            </div>
            <button className="btn btn-outline-secondary w-100 mt-2" onClick={() => setShowShareModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
