import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { Profile as ProfileType, PostWithRelations } from '../lib/types'
import PostCard from '../components/PostCard'
import Lightbox from '../components/Lightbox'

export default function Profile() {
  const { id } = useParams()
  const { profile: currentUser } = useAuth()
  const userId = id || currentUser?.id
  const [user, setUser] = useState<ProfileType | null>(null)
  const [posts, setPosts] = useState<PostWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ posts: 0, likes: 0, favorites: 0 })
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null)

  useEffect(() => {
    if (!userId) return
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle().then(async ({ data }) => {
      setUser(data as ProfileType | null)
      const { data: postData } = await supabase
        .from('posts')
        .select(`*, category:categories(*), user:profiles(*), post_images(*)`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      setPosts((postData as PostWithRelations[]) || [])

      const postIds = (postData as PostWithRelations[])?.map(p => p.id) || []
      if (postIds.length) {
        const { count: likesCount } = await supabase.from('likes').select('id', { count: 'exact', head: true }).in('post_id', postIds)
        const { count: favCount } = await supabase.from('favorites').select('id', { count: 'exact', head: true }).in('post_id', postIds)
        setStats({ posts: (postData as PostWithRelations[])?.length || 0, likes: likesCount || 0, favorites: favCount || 0 })
      }
      setLoading(false)
    })
  }, [userId])

  const isOwn = currentUser?.id === userId

  return (
    <div className="fh-page-container">
      {loading ? (
        <div className="text-center p-5"><div className="spinner-border text-fh-primary" /></div>
      ) : !user ? (
        <div className="text-center py-5"><p>User not found.</p><Link to="/feed" className="btn-fh-outline btn">Back</Link></div>
      ) : (
        <>
          {/* Profile Header */}
          <div className="fh-card p-4 mb-4 text-center">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.display_name} className="rounded-circle mx-auto d-block" style={{ width: '120px', height: '120px', objectFit: 'cover' }} />
            ) : (
              <div className="rounded-circle d-flex align-items-center justify-content-center text-white mx-auto" style={{ width: '120px', height: '120px', background: 'var(--fh-primary)', fontSize: '3rem' }}>
                {user.display_name.charAt(0).toUpperCase()}
              </div>
            )}
            <h2 className="mt-3 mb-1" style={{ color: 'var(--fh-primary)' }}>{user.display_name}</h2>
            <p style={{ opacity: 0.6 }}>{user.email}</p>
            {user.bio && <p className="mt-2" style={{ maxWidth: '500px', margin: '0 auto' }}>{user.bio}</p>}
            {user.role === 'admin' && <span className="badge bg-fh-primary text-white mt-2">Admin</span>}

            <div className="d-flex justify-content-center gap-4 mt-3">
              <div><strong>{stats.posts}</strong><div style={{ fontSize: '0.85rem', opacity: 0.6 }}>Posts</div></div>
              <div><strong>{stats.likes}</strong><div style={{ fontSize: '0.85rem', opacity: 0.6 }}>Likes</div></div>
              <div><strong>{stats.favorites}</strong><div style={{ fontSize: '0.85rem', opacity: 0.6 }}>Favorites</div></div>
            </div>

            {isOwn && <Link to="/profile/edit" className="btn-fh-outline btn mt-3"><i className="bi bi-pencil me-1"></i>Edit Profile</Link>}
            {!isOwn && currentUser && <Link to="/chat" className="btn-fh-primary btn mt-3"><i className="bi bi-chat-dots me-1"></i>Message</Link>}
          </div>

          {/* Posts */}
          <h3 className="mb-3">Posts</h3>
          {posts.length === 0 ? (
            <p className="text-muted text-center py-4">No posts yet.</p>
          ) : (
            <div className="row g-4">
              {posts.map(p => <div key={p.id} className="col-md-6 col-lg-4"><PostCard post={p} onLightbox={(u, i) => setLightbox({ urls: u, index: i })} /></div>)}
            </div>
          )}
        </>
      )}
      {lightbox && <Lightbox urls={lightbox.urls} startIndex={lightbox.index} onClose={() => setLightbox(null)} />}
    </div>
  )
}
