import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { PostWithRelations, Profile } from '../lib/types'
import PostCard from '../components/PostCard'
import Lightbox from '../components/Lightbox'

export default function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PostWithRelations[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null)
  const [searchType, setSearchType] = useState<'all' | 'posts' | 'users'>('all')

  useEffect(() => {
    if (!query.trim()) { setResults([]); setUsers([]); return }
    setLoading(true)
    const timer = setTimeout(async () => {
      const q = query.trim()
      if (searchType !== 'users') {
        // Search by caption (ilike) OR by tags (array contains)
        const { data } = await supabase
          .from('posts')
          .select(`*, category:categories(*), user:profiles(*), post_images(*)`)
          .or(`caption.ilike.%${q}%,tags.cs.{${q}}`)
          .order('created_at', { ascending: false })
          .limit(20)
        setResults((data as PostWithRelations[]) || [])
      }
      if (searchType !== 'posts') {
        const { data: userData } = await supabase
          .from('profiles')
          .select('*')
          .ilike('display_name', `%${q}%`)
          .limit(10)
        setUsers((userData as Profile[]) || [])
      }
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, searchType])

  return (
    <div className="fh-page-container">
      <h1 className="fh-section-title">Search</h1>
      <div className="fh-card p-4 mb-4">
        <div className="input-group mb-3">
          <span className="input-group-text bg-transparent border-end-0"><i className="bi bi-search"></i></span>
          <input type="text" className="fh-form-control border-start-0" placeholder="Search furniture, captions, tags, or users..." value={query} onChange={e => setQuery(e.target.value)} autoFocus />
        </div>
        <div className="btn-group" role="group">
          {(['all', 'posts', 'users'] as const).map(t => (
            <button key={t} className={`btn btn-sm ${searchType === t ? 'btn-fh-primary' : 'btn-outline-secondary'}`} onClick={() => setSearchType(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </div>
      </div>

      {loading && <div className="text-center py-3"><div className="spinner-border text-fh-primary" /></div>}

      {!loading && query && (
        <>
          {searchType !== 'posts' && users.length > 0 && (
            <div className="mb-4">
              <h4 className="mb-3">Users</h4>
              <div className="row g-3">
                {users.map(u => (
                  <div key={u.id} className="col-md-6">
                    <Link to={`/profile/${u.id}`} className="fh-card p-3 d-flex align-items-center gap-3 text-decoration-none">
                      {u.avatar_url ? <img src={u.avatar_url} alt="" className="rounded-circle" style={{ width: '48px', height: '48px', objectFit: 'cover' }} /> : <div className="rounded-circle d-flex align-items-center justify-content-center text-white" style={{ width: '48px', height: '48px', background: 'var(--fh-primary)' }}>{u.display_name.charAt(0)}</div>}
                      <div><div className="fw-semibold">{u.display_name}</div><div style={{ fontSize: '0.85rem', opacity: 0.6 }}>{u.email}</div></div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
          {searchType !== 'users' && (
            <div>
              <h4 className="mb-3">Furniture Posts</h4>
              {results.length === 0 ? <p className="text-muted">No posts found.</p> : (
                <div className="row g-4">
                  {results.map(p => <div key={p.id} className="col-md-6 col-lg-4"><PostCard post={p} onLightbox={(u, i) => setLightbox({ urls: u, index: i })} /></div>)}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {!query && <div className="text-center py-5"><i className="bi bi-search" style={{ fontSize: '3rem', opacity: 0.2 }}></i><p className="mt-3 text-muted">Start typing to search</p></div>}

      {lightbox && <Lightbox urls={lightbox.urls} startIndex={lightbox.index} onClose={() => setLightbox(null)} />}
    </div>
  )
}
