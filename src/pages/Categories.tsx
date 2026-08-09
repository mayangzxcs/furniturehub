import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Category } from '../lib/types'
import { useInfinitePosts } from '../lib/usePosts'
import PostCard from '../components/PostCard'
import PostCardSkeleton from '../components/PostCardSkeleton'
import Lightbox from '../components/Lightbox'

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(async ({ data }) => {
      const cats = (data as Category[]) || []
      setCategories(cats)
      const countMap: Record<string, number> = {}
      for (const c of cats) {
        const { count } = await supabase.from('posts').select('id', { count: 'exact', head: true }).eq('category_id', c.id)
        countMap[c.id] = count || 0
      }
      setCounts(countMap)
      setLoading(false)
    })
  }, [])

  return (
    <div className="fh-page-container">
      <h1 className="fh-section-title">Categories</h1>
      {loading ? (
        <div className="row g-4">{[...Array(6)].map((_, i) => <div key={i} className="col-md-4"><div className="skeleton" style={{ height: '120px' }} /></div>)}</div>
      ) : (
        <div className="row g-4">
          {categories.map(cat => (
            <div key={cat.id} className="col-md-4 col-sm-6">
              <Link to={`/category/${cat.slug}`} className="text-decoration-none">
                <div className="fh-card p-4 text-center fade-in">
                  <i className={`bi ${cat.icon || 'bi-tag-fill'}`} style={{ fontSize: '2.5rem', color: 'var(--fh-accent)' }}></i>
                  <h4 className="mt-2 mb-1" style={{ color: 'var(--fh-text)' }}>{cat.name}</h4>
                  <p style={{ fontSize: '0.9rem', opacity: 0.6 }}>{counts[cat.id] || 0} posts</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function CategoryView() {
  const { slug } = useParams()
  const [category, setCategory] = useState<Category | null>(null)
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined)
  const [categoryLoading, setCategoryLoading] = useState(true)
  const { posts, loading, loadingMore } = useInfinitePosts({
    filter: categoryId ? (q: any) => q.eq('category_id', categoryId) : undefined,
    key: categoryId,
    enabled: !!categoryId,
  })
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null)

  useEffect(() => {
    setCategoryLoading(true)
    setCategoryId(undefined)
    supabase.from('categories').select('*').eq('slug', slug).maybeSingle().then(({ data }) => {
      const cat = data as Category | null
      setCategory(cat)
      setCategoryId(cat?.id || undefined)
      setCategoryLoading(false)
    })
  }, [slug])

  return (
    <div className="fh-page-container">
      {category && (
        <div className="text-center mb-4">
          <i className={`bi ${category.icon || 'bi-tag-fill'}`} style={{ fontSize: '3rem', color: 'var(--fh-accent)' }}></i>
          <h1 className="fh-section-title mt-2">{category.name}</h1>
          <p style={{ opacity: 0.6 }}>{category.description}</p>
        </div>
      )}
      {categoryLoading || loading ? (
        <div className="row g-4">{[...Array(3)].map((_, i) => <div key={i} className="col-md-6 col-lg-4"><PostCardSkeleton /></div>)}</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-5"><p className="text-muted">No posts in this category yet.</p><Link to="/feed" className="btn-fh-outline btn">Back to Feed</Link></div>
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
