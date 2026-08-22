import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { showToast } from '../lib/toast'
import type { Category } from '../lib/types'
import { useInfinitePosts } from '../lib/usePosts'
import PostCard from '../components/PostCard'
import PostCardSkeleton from '../components/PostCardSkeleton'
import Lightbox from '../components/Lightbox'

export default function Categories() {
  const { profile } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', icon: '' })

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    const { data } = await supabase.from('categories').select('*').order('name')
    const cats = (data as Category[]) || []
    setCategories(cats)
    const countMap: Record<string, number> = {}
    for (const c of cats) {
      const { count } = await supabase.from('posts').select('id', { count: 'exact', head: true }).eq('category_id', c.id)
      countMap[c.id] = count || 0
    }
    setCounts(countMap)
    setLoading(false)
  }

  function openEditModal(cat: Category) {
    setEditingCategory(cat)
    setFormData({ name: cat.name, slug: cat.slug, description: cat.description, icon: cat.icon })
  }

  async function handleSaveCategory() {
    if (!editingCategory || !formData.name.trim()) {
      showToast('Please fill in all fields', 'info')
      return
    }

    const { error } = await supabase
      .from('categories')
      .update({
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
        description: formData.description,
        icon: formData.icon,
      })
      .eq('id', editingCategory.id)

    if (error) {
      showToast('Failed to update category', 'error')
    } else {
      showToast('Category updated successfully', 'success')
      setEditingCategory(null)
      loadCategories()
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!window.confirm('Are you sure you want to delete this category?')) return

    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) {
      showToast('Failed to delete category', 'error')
    } else {
      showToast('Category deleted successfully', 'success')
      loadCategories()
    }
  }

  return (
    <div className="fh-page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="fh-section-title" style={{ margin: 0 }}>Categories</h1>
      </div>

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
              
              {profile?.role === 'admin' && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <button
                    onClick={() => openEditModal(cat)}
                    className="btn-fh-primary btn btn-sm flex-grow-1"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
                  >
                    <i className="bi bi-pencil-fill" style={{ marginRight: '0.3rem' }}></i> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="btn btn-sm flex-grow-1"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem', background: 'var(--fh-error)', color: 'white', border: 'none', borderRadius: 'var(--fh-btn-radius)' }}
                  >
                    <i className="bi bi-trash-fill" style={{ marginRight: '0.3rem' }}></i> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingCategory && (
        <div className="modal-overlay" onClick={() => setEditingCategory(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--fh-primary)', margin: 0 }}>Edit Category</h3>
              <button
                onClick={() => setEditingCategory(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="mb-3">
              <label className="fh-form-label">Category Name</label>
              <input
                type="text"
                className="fh-form-control"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="mb-3">
              <label className="fh-form-label">Slug</label>
              <input
                type="text"
                className="fh-form-control"
                value={formData.slug}
                onChange={e => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>

            <div className="mb-3">
              <label className="fh-form-label">Description</label>
              <textarea
                className="fh-form-control"
                rows={3}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="mb-3">
              <label className="fh-form-label">Icon (Bootstrap Icon Class)</label>
              <input
                type="text"
                className="fh-form-control"
                placeholder="e.g., bi-sofa"
                value={formData.icon}
                onChange={e => setFormData({ ...formData, icon: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setEditingCategory(null)}
                className="btn flex-grow-1"
                style={{ background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: 'var(--fh-btn-radius)', color: 'var(--fh-text)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCategory}
                className="btn-fh-primary btn flex-grow-1"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function CategoryView() {
  const { slug } = useParams()
  const [category, setCategory] = useState<Category | null>(null)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const { posts, loading, loadingMore } = useInfinitePosts({
    filter: (q: any) => q.eq('category_id', categoryId),
    key: categoryId || undefined,
  })
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null)

  useEffect(() => {
    supabase.from('categories').select('*').eq('slug', slug).maybeSingle().then(({ data }) => {
      const cat = data as Category | null
      setCategory(cat)
      setCategoryId(cat?.id || null)
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
      {loading ? (
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
