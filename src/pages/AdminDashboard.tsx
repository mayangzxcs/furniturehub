import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { showToast } from '../lib/toast'
import type { Profile, Category, PostWithRelations, ActivityLog, Rating } from '../lib/types'

type Tab = 'overview' | 'posts' | 'users' | 'categories' | 'comments' | 'ratings' | 'activity'

export default function AdminDashboard() {
  const { profile } = useAuth()
  const [tab, setTab] = useState<Tab>('overview')
  const [stats, setStats] = useState({
    users: 0, activeUsers: 0, disabledUsers: 0, posts: 0, categories: 0,
    comments: 0, likes: 0, shares: 0, messages: 0, ratings: 0,
  })
  const [users, setUsers] = useState<Profile[]>([])
  const [posts, setPosts] = useState<PostWithRelations[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [showPostModal, setShowPostModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [topPosts, setTopPosts] = useState<PostWithRelations[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [ratings, setRatings] = useState<(Rating & { user?: Profile | null })[]>([])
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryFormData, setCategoryFormData] = useState({ name: '', slug: '', description: '', icon: '' })
  const [showEditIconPicker, setShowEditIconPicker] = useState(false)
  const filteredUsers = users.filter(u =>
    u.display_name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  )

  useEffect(() => {
    loadStats()
    loadUsers()
    loadPosts()
    loadCategories()
    loadRatings()
    loadActivity()
  }, [])

  async function loadStats() {
    const [users, activeUsers, disabledUsers, posts, categories, comments, likes, shares, messages, ratingsCount] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'disabled'),
      supabase.from('posts').select('id', { count: 'exact', head: true }),
      supabase.from('categories').select('id', { count: 'exact', head: true }),
      supabase.from('comments').select('id', { count: 'exact', head: true }),
      supabase.from('likes').select('id', { count: 'exact', head: true }),
      supabase.from('shares').select('id', { count: 'exact', head: true }),
      supabase.from('messages').select('id', { count: 'exact', head: true }),
      supabase.from('ratings').select('id', { count: 'exact', head: true }),
    ])
    setStats({
      users: users.count || 0, activeUsers: activeUsers.count || 0, disabledUsers: disabledUsers.count || 0,
      posts: posts.count || 0, categories: categories.count || 0,
      comments: comments.count || 0, likes: likes.count || 0, shares: shares.count || 0,
      messages: messages.count || 0, ratings: ratingsCount.count || 0,
    })
  }

  async function loadUsers() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers((data as Profile[]) || [])
  }

  async function loadPosts() {
    const { data } = await supabase
      .from('posts')
      .select(`*, category:categories(*), user:profiles(*), post_images(*)`)
      .order('created_at', { ascending: false })
    setPosts((data as PostWithRelations[]) || [])

    const postsData = (data as PostWithRelations[]) || []
    if (postsData.length) {
      const likesPromises = postsData.map(p => supabase.from('likes').select('id', { count: 'exact', head: true }).eq('post_id', p.id))
      const likesResults = await Promise.all(likesPromises)
      const sorted = postsData.map((p, i) => ({ ...p, likes_count: likesResults[i].count || 0 }))
        .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
        .slice(0, 5)
      setTopPosts(sorted)
    }
  }

  async function loadCategories() {
    const { data } = await supabase.from('categories').select('*').order('name')
    setCategories((data as Category[]) || [])
  }

  async function loadActivity() {
    const { data } = await supabase
      .from('activity_logs')
      .select('*, user:profiles(*)')
      .order('created_at', { ascending: false })
      .limit(50)
    setActivityLogs((data as ActivityLog[]) || [])
  }

  async function loadRatings() {
    const { data } = await supabase
      .from('ratings')
      .select('*, user:profiles(*)')
      .order('created_at', { ascending: false })
    setRatings((data as (Rating & { user?: Profile | null })[]) || [])
  }

  async function updateUserStatus(userId: string, status: string) {
    const { error } = await supabase.rpc('admin_update_user_status', { p_user_id: userId, p_status: status })
    if (error) { showToast('Failed to update: ' + error.message, 'error'); return }
    showToast(`User ${status}`, 'success')
    loadUsers()
    logActivity('update_user', `Updated user status to ${status}`, { userId, status })
  }

  async function deleteUser(userId: string) {
    if (!confirm('Delete this user? This cannot be undone.')) return
    const { error } = await supabase.rpc('admin_delete_user', { p_user_id: userId })
    if (error) { showToast('Failed to delete: ' + error.message, 'error'); return }
    showToast('User deleted', 'success')
    loadUsers()
    logActivity('delete_user', 'Deleted user', { userId })
  }

  async function deletePost(postId: string) {
    if (!confirm('Delete this post?')) return
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    if (error) { showToast('Failed to delete', 'error'); return }
    showToast('Post deleted', 'success')
    loadPosts()
    logActivity('delete_post', 'Deleted post', { postId })
  }

  async function togglePostFlag(postId: string, flag: 'is_featured' | 'is_trending' | 'is_pinned', value: boolean) {
    await supabase.from('posts').update({ [flag]: value }).eq('id', postId)
    loadPosts()
  }

  async function deleteCategory(catId: string) {
    if (!confirm('Delete this category?')) return
    const { error } = await supabase.from('categories').delete().eq('id', catId)
    if (error) { showToast('Failed to delete', 'error'); return }
    showToast('Category deleted', 'success')
    loadCategories()
  }

  function openEditCategory(cat: Category) {
    setEditingCategory(cat)
    setCategoryFormData({ name: cat.name, slug: cat.slug, description: cat.description, icon: cat.icon })
  }

  async function handleSaveCategory() {
    if (!editingCategory || !categoryFormData.name.trim()) {
      showToast('Please fill in all fields', 'info')
      return
    }

    const { error } = await supabase
      .from('categories')
      .update({
        name: categoryFormData.name,
        slug: categoryFormData.slug || categoryFormData.name.toLowerCase().replace(/\s+/g, '-'),
        description: categoryFormData.description,
        icon: categoryFormData.icon,
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

  async function logActivity(action: string, description: string, metadata: Record<string, unknown> = {}) {
    await supabase.from('activity_logs').insert({ user_id: profile?.id, action, description, metadata })
  }

  const statCards = [
    { label: 'Total Users', value: stats.users, icon: 'bi-people-fill', color: '#7B4F32' },
    { label: 'Active Users', value: stats.activeUsers, icon: 'bi-person-check-fill', color: '#5D7A58' },
    { label: 'Disabled', value: stats.disabledUsers, icon: 'bi-person-x-fill', color: '#D9534F' },
    { label: 'Posts', value: stats.posts, icon: 'bi-images', color: '#C26A4B' },
    { label: 'Categories', value: stats.categories, icon: 'bi-tags-fill', color: '#5D7A58' },
    { label: 'Comments', value: stats.comments, icon: 'bi-chat-dots-fill', color: '#7B4F32' },
    { label: 'Ratings', value: stats.ratings, icon: 'bi-star-fill', color: '#FFD700' },
    { label: 'Likes', value: stats.likes, icon: 'bi-heart-fill', color: '#D9534F' },
    { label: 'Shares', value: stats.shares, icon: 'bi-share-fill', color: '#5bc0de' },
    { label: 'Messages', value: stats.messages, icon: 'bi-envelope-fill', color: '#C26A4B' },
  ]

  return (
    <div className="fh-page-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fh-section-title mb-0"><i className="bi bi-speedometer2 me-2"></i>Admin Dashboard</h1>
        <button className="btn-fh-primary btn" onClick={() => setShowPostModal(true)}><i className="bi bi-plus-lg me-1"></i>New Post</button>
      </div>

      {/* Tabs */}
      <div className="mb-4">
        <div className="d-flex gap-2 flex-wrap">
          {(['overview', 'posts', 'users', 'categories', 'comments', 'ratings', 'activity'] as Tab[]).map(t => (
            <button key={t} className={`btn btn-sm ${tab === t ? 'btn-fh-primary' : 'btn-outline-secondary'}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {tab === 'overview' && (
        <>
          <div className="row g-3 mb-4">
            {statCards.map(s => (
              <div key={s.label} className="col-md-4 col-sm-6">
                <div className="stat-card d-flex align-items-center gap-3">
                  <div className="stat-icon" style={{ background: s.color + '20', color: s.color }}><i className={`bi ${s.icon}`}></i></div>
                  <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
                </div>
              </div>
            ))}
          </div>

          {/* <div className="row g-4">
            <div className="col-lg-6">
              <div className="fh-card p-4">
                <h5 className="mb-3">Monthly Uploads</h5>
                <Line data={{ labels: monthlyData.labels, datasets: [{ label: 'Uploads', data: monthlyData.uploads, borderColor: '#7B4F32', backgroundColor: 'rgba(123,79,50,0.1)', fill: true, tension: 0.3 }] }} options={{ responsive: true, plugins: { legend: { display: false } } }} />
              </div>
            </div>
            <div className="col-lg-6">
              <div className="fh-card p-4">
                <h5 className="mb-3">New Users</h5>
                <Bar data={{ labels: monthlyData.labels, datasets: [{ label: 'Users', data: monthlyData.users, backgroundColor: '#5D7A58' }] }} options={{ responsive: true, plugins: { legend: { display: false } } }} />
              </div>
            </div>
          </div> */}

          <div className="row g-4 mt-2">
            <div className="col-lg-6">
              <div className="fh-card p-4">
                <h5 className="mb-3">Most Popular Furniture</h5>
                {topPosts.length === 0 ? <p className="text-muted">No data yet.</p> : (
                  topPosts.map((p, i) => (
                    <Link to={`/post/${p.id}`} key={p.id} className="d-flex align-items-center gap-3 text-decoration-none mb-2 p-2 rounded" style={{ background: 'rgba(0,0,0,0.02)' }}>
                      <span className="badge bg-fh-primary">{i + 1}</span>
                      {p.post_images?.[0]?.thumbnail_url && <img src={p.post_images[0].thumbnail_url} alt="" className="rounded" style={{ width: '48px', height: '48px', objectFit: 'cover' }} />}
                      <div className="flex-grow-1"><div className="text-truncate" style={{ maxWidth: '200px', color: 'var(--fh-text)' }}>{p.caption}</div></div>
                      <span className="text-danger"><i className="bi bi-heart-fill"></i> {p.likes_count}</span>
                    </Link>
                  ))
                )}
              </div>
            </div>
            {/* <div className="col-lg-6">
              <div className="fh-card p-4">
                <h5 className="mb-3">Recent Activity</h5>
                {activityLogs.length === 0 ? <p className="text-muted">No activity yet.</p> : (
                  activityLogs.slice(0, 8).map(log => (
                    <div key={log.id} className="d-flex gap-2 mb-2" style={{ fontSize: '0.9rem' }}>
                      <i className="bi bi-circle-fill" style={{ fontSize: '0.4rem', marginTop: '0.5rem', color: 'var(--fh-accent)' }}></i>
                      <div><span className="fw-semibold">{log.user?.display_name || 'System'}</span> {log.description}</div>
                    </div>
                  ))
                )}
              </div>
            </div> */}
          </div>
        </>
      )}

      {tab === 'posts' && (
        <div className="fh-card p-3">
          {posts.length === 0 ? <p className="text-muted text-center py-4">No posts yet.</p> : posts.map(p => (
            <div key={p.id} className="d-flex align-items-center gap-3 p-2 mb-2 rounded" style={{ background: 'rgba(0,0,0,0.02)' }}>
              {p.post_images?.[0]?.thumbnail_url && <img src={p.post_images[0].thumbnail_url} alt="" className="rounded" style={{ width: '60px', height: '60px', objectFit: 'cover' }} />}
              <div className="flex-grow-1"><div className="fw-semibold text-truncate" style={{ maxWidth: '300px' }}>{p.caption}</div><div style={{ fontSize: '0.8rem', opacity: 0.5 }}>{p.category?.name || 'Uncategorized'}</div></div>
              <button className={`btn btn-sm ${p.is_featured ? 'btn-warning' : 'btn-outline-warning'}`} onClick={() => togglePostFlag(p.id, 'is_featured', !p.is_featured)} title="Featured"><i className="bi bi-star-fill"></i></button>
              <button className={`btn btn-sm ${p.is_trending ? 'btn-danger' : 'btn-outline-danger'}`} onClick={() => togglePostFlag(p.id, 'is_trending', !p.is_trending)} title="Trending"><i className="bi bi-fire"></i></button>
              <button className={`btn btn-sm ${p.is_pinned ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => togglePostFlag(p.id, 'is_pinned', !p.is_pinned)} title="Pinned"><i className="bi bi-pin-fill"></i></button>
              <Link to={`/post/${p.id}`} className="btn btn-sm btn-outline-secondary"><i className="bi bi-eye"></i></Link>
              <button className="btn btn-sm btn-outline-danger" onClick={() => deletePost(p.id)}><i className="bi bi-trash"></i></button>
            </div>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <div className="fh-card p-3">
          <div className="mb-3">
            <input
              type="text"
              className="fh-form-control"
              placeholder="Search users by name or email..."
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
            />
          </div>
          {filteredUsers.length === 0 ? (
            <p className="text-muted text-center py-4">No users found.</p>
          ) : filteredUsers.map(u => (
            <div key={u.id} className="d-flex align-items-center gap-3 p-2 mb-2 rounded" style={{ background: 'rgba(0,0,0,0.02)' }}>
              {u.avatar_url ? <img src={u.avatar_url} alt="" className="rounded-circle" style={{ width: '40px', height: '40px', objectFit: 'cover' }} /> : <div className="rounded-circle d-flex align-items-center justify-content-center text-white" style={{ width: '40px', height: '40px', background: 'var(--fh-primary)' }}>{u.display_name.charAt(0)}</div>}
              <div className="flex-grow-1">
                <div className="fw-semibold">{u.display_name} {u.role === 'admin' && <span className="badge bg-fh-primary">Admin</span>}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>{u.email} &middot; <span className={u.status === 'active' ? 'text-success' : u.status === 'disabled' ? 'text-danger' : ''}>{u.status}</span></div>
              </div>
              {u.role !== 'admin' && (
                <>
                  {u.status === 'active' ? (
                    <button className="btn btn-sm btn-outline-warning" onClick={() => updateUserStatus(u.id, 'disabled')}><i className="bi bi-shield-exclamation me-1"></i>Disable</button>
                  ) : (
                    <button className="btn btn-sm btn-outline-success" onClick={() => updateUserStatus(u.id, 'active')}><i className="bi bi-check-circle me-1"></i>Enable</button>
                  )}
                  <button className="btn btn-sm btn-outline-danger" onClick={() => deleteUser(u.id)}><i className="bi bi-trash"></i></button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'categories' && (
        <div>
          <button className="btn-fh-accent btn mb-3" onClick={() => setShowCategoryModal(true)}><i className="bi bi-plus-lg me-1"></i>Add Category</button>
          <div className="fh-card p-3">
            {categories.map(c => (
              <div key={c.id} className="d-flex align-items-center gap-3 p-2 mb-2 rounded" style={{ background: 'rgba(0,0,0,0.02)' }}>
                <i className={`bi ${c.icon || 'bi-tag-fill'}`} style={{ fontSize: '1.5rem', color: 'var(--fh-accent)' }}></i>
                <div className="flex-grow-1"><div className="fw-semibold">{c.name}</div><div style={{ fontSize: '0.8rem', opacity: 0.5 }}>{c.description}</div></div>
                <button className="btn btn-sm btn-outline-primary" onClick={() => openEditCategory(c)}><i className="bi bi-pencil-fill"></i> Edit</button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => deleteCategory(c.id)}><i className="bi bi-trash"></i></button>
              </div>
            ))}
          </div>

          {/* Edit Category Modal */}
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
                    value={categoryFormData.name}
                    onChange={e => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  />
                </div>

                <div className="mb-3">
                  <label className="fh-form-label">Slug</label>
                  <input
                    type="text"
                    className="fh-form-control"
                    value={categoryFormData.slug}
                    onChange={e => setCategoryFormData({ ...categoryFormData, slug: e.target.value })}
                  />
                </div>

                <div className="mb-3">
                  <label className="fh-form-label">Description</label>
                  <textarea
                    className="fh-form-control"
                    rows={3}
                    value={categoryFormData.description}
                    onChange={e => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  />
                </div>

                <div className="mb-3">
                  <label className="fh-form-label">Icon</label>
                  <button
                    type="button"
                    className="fh-form-control d-flex align-items-center gap-2"
                    onClick={() => setShowEditIconPicker(!showEditIconPicker)}
                    style={{ background: 'var(--fh-secondary)', border: '1px solid rgba(0,0,0,0.1)', textAlign: 'left', cursor: 'pointer' }}
                  >
                    <i className={`bi ${categoryFormData.icon}`} style={{ fontSize: '1.5rem' }}></i>
                    <span>{categoryFormData.icon}</span>
                    <i className={`bi bi-chevron-down ms-auto`} style={{ fontSize: '0.9rem' }}></i>
                  </button>

                  {showEditIconPicker && (
                    <div style={{ marginTop: '0.75rem', padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.08)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
                        {['bi-tag-fill', 'bi-sofa', 'bi-chair', 'bi-table', 'bi-bed', 'bi-door-closed', 'bi-lamp', 'bi-picture', 'bi-frame', 'bi-box', 'bi-archive', 'bi-grid', 'bi-list', 'bi-cabinet', 'bi-door', 'bi-window', 'bi-briefcase', 'bi-bag', 'bi-basket', 'bi-bookmark'].map(iconName => (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => {
                              setCategoryFormData({ ...categoryFormData, icon: iconName })
                              setShowEditIconPicker(false)
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0.75rem',
                              borderRadius: '8px',
                              border: categoryFormData.icon === iconName ? '2px solid var(--fh-primary)' : '1px solid rgba(0,0,0,0.1)',
                              background: categoryFormData.icon === iconName ? 'rgba(123, 79, 50, 0.1)' : 'white',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              fontSize: '1.5rem',
                            }}
                            title={iconName}
                          >
                            <i className={`bi ${iconName}`}></i>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
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
      )}

      {tab === 'comments' && <CommentsTab onLog={logActivity} />}

      {tab === 'ratings' && (
        <div className="fh-card p-3">
          {ratings.length === 0 ? (
            <p className="text-muted text-center py-4">No ratings yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                    <th>User</th>
                    <th>Rating</th>
                    <th>Comment</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {ratings.map(r => (
                    <tr key={r.id}>
                      <td><strong>{r.user?.display_name || 'Unknown'}</strong></td>
                      <td>
                        <div style={{ color: '#FFD700' }}>
                          {[...Array(r.rating)].map((_, i) => <i key={i} className="bi bi-star-fill"></i>)}
                          {[...Array(5 - r.rating)].map((_, i) => <i key={i} className="bi bi-star" style={{ opacity: 0.3 }}></i>)}
                        </div>
                      </td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.comment || <span style={{ opacity: 0.5 }}>No comment</span>}
                      </td>
                      <td style={{ opacity: 0.6, fontSize: '0.9rem' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={async () => {
                            if (window.confirm('Delete this rating?')) {
                              await supabase.from('ratings').delete().eq('id', r.id)
                              loadRatings()
                              showToast('Rating deleted', 'success')
                            }
                          }}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {tab === 'activity' && (
        <div className="fh-card p-3">
          {activityLogs.length === 0 ? <p className="text-muted text-center py-4">No activity logged.</p> : activityLogs.map(log => (
            <div key={log.id} className="d-flex gap-2 p-2 mb-1 rounded" style={{ background: 'rgba(0,0,0,0.02)', fontSize: '0.9rem' }}>
              <i className="bi bi-clock-history" style={{ color: 'var(--fh-accent)' }}></i>
              <div className="flex-grow-1"><span className="fw-semibold">{log.user?.display_name || 'System'}</span> {log.description}</div>
              <span style={{ opacity: 0.4 }}>{new Date(log.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {showPostModal && <PostModal onClose={() => setShowPostModal(false)} onSaved={() => { loadPosts(); loadStats() }} categories={categories} userId={profile?.id || ''} />}
      {showCategoryModal && <CategoryModal onClose={() => setShowCategoryModal(false)} onSaved={loadCategories} />}
    </div>
  )
}

function CommentsTab({ onLog }: { onLog: (action: string, desc: string, meta?: Record<string, unknown>) => void }) {
  const [comments, setComments] = useState<{ id: string; content: string; created_at: string; post_id: string; user: Profile | null; user_id: string }[]>([])

  useEffect(() => {
    supabase.from('comments').select('*, user:profiles(*)').order('created_at', { ascending: false }).limit(100).then(({ data }) => {
      setComments((data as { id: string; content: string; created_at: string; post_id: string; user: Profile | null; user_id: string }[]) || [])
    })
  }, [])

  async function deleteComment(id: string) {
    if (!confirm('Delete this comment?')) return
    await supabase.from('comments').delete().eq('id', id)
    setComments(prev => prev.filter(c => c.id !== id))
    onLog('delete_comment', 'Deleted a comment', { commentId: id })
  }

  return (
    <div className="fh-card p-3">
      {comments.length === 0 ? <p className="text-muted text-center py-4">No comments yet.</p> : comments.map(c => (
        <div key={c.id} className="d-flex gap-2 p-2 mb-1 rounded" style={{ background: 'rgba(0,0,0,0.02)' }}>
          <div className="flex-grow-1">
            <span className="fw-semibold">{c.user?.display_name || 'Unknown'}</span>: {c.content}
            <div style={{ fontSize: '0.8rem', opacity: 0.4 }}>{new Date(c.created_at).toLocaleString()}</div>
          </div>
          <Link to={`/post/${c.post_id}`} className="btn btn-sm btn-outline-secondary"><i className="bi bi-eye"></i></Link>
          <button className="btn btn-sm btn-outline-danger" onClick={() => deleteComment(c.id)}><i className="bi bi-trash"></i></button>
        </div>
      ))}
    </div>
  )
}

function PostModal({ onClose, onSaved, categories, userId }: { onClose: () => void; onSaved: () => void; categories: Category[]; userId: string }) {
  const [caption, setCaption] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [tags, setTags] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || [])
    setFiles(selected)
    setPreviews(selected.map(f => URL.createObjectURL(f)))
  }

  async function handleUpload() {
    if (!caption.trim() || files.length === 0) { showToast('Add a caption and at least one image', 'error'); return }
    setUploading(true)

    const { data: post } = await supabase.from('posts').insert({
      caption,
      category_id: categoryId || null,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      user_id: userId,
    }).select('*').single() as unknown as { data: { id: string } | null; error: any }

    if (!post) { showToast('Failed to create post', 'error'); setUploading(false); return }

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const { data: uploadResult, error } = await supabase.storage.from('furniture').upload('placeholder', file)
      if (error) { console.error(error); continue }
      const actualPath = uploadResult?.path || ''
      const { data: { publicUrl } } = supabase.storage.from('furniture').getPublicUrl(actualPath)
      await supabase.from('post_images').insert({
        post_id: post.id,
        storage_path: actualPath,
        thumbnail_url: publicUrl,
        medium_url: publicUrl,
        original_url: publicUrl,
        sort_order: i,
      })
    }

    showToast('Post created!', 'success')
    setUploading(false)
    onSaved()
    onClose()
  }

  return (
    <div className="lightbox-overlay" onClick={onClose} style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="fh-card p-4" style={{ maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <h4 className="mb-3">Upload Furniture</h4>
        <div className="mb-3">
          <label className="fh-form-label">Images</label>
          <div className="border rounded p-4 text-center" style={{ borderStyle: 'dashed', cursor: 'pointer' }} onClick={() => document.getElementById('file-input')?.click()}>
            <i className="bi bi-cloud-arrow-up" style={{ fontSize: '2rem', opacity: 0.4 }}></i>
            <p className="mt-2 mb-0" style={{ opacity: 0.6 }}>Click to select images (JPEG, PNG, WEBP - max 20MB)</p>
            <input id="file-input" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFiles} style={{ display: 'none' }} />
          </div>
          {previews.length > 0 && (
            <div className="d-flex gap-2 mt-2 flex-wrap">
              {previews.map((src, i) => <img key={i} src={src} alt="" className="rounded" style={{ width: '80px', height: '80px', objectFit: 'cover' }} />)}
            </div>
          )}
        </div>
        <div className="mb-3">
          <label className="fh-form-label">Caption</label>
          <textarea className="fh-form-control" rows={2} value={caption} onChange={e => setCaption(e.target.value)} placeholder="Describe this furniture..." />
        </div>
        <div className="mb-3">
          <label className="fh-form-label">Category</label>
          <select className="fh-form-control" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
            <option value="">Select category...</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="mb-3">
          <label className="fh-form-label">Tags (comma-separated)</label>
          <input className="fh-form-control" value={tags} onChange={e => setTags(e.target.value)} placeholder="modern, wood, minimalist" />
        </div>
        <div className="d-flex gap-2">
          <button className="btn-fh-primary btn flex-grow-1" onClick={handleUpload} disabled={uploading}>
            {uploading ? <span className="spinner-border spinner-border-sm" /> : 'Upload'}
          </button>
          <button className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

function CategoryModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('bi-tag-fill')
  const [showIconPicker, setShowIconPicker] = useState(false)

  const furnitureIcons = [
    'bi-tag-fill', 'bi-sofa', 'bi-chair', 'bi-table', 'bi-bed',
    'bi-door-closed', 'bi-lamp', 'bi-picture', 'bi-frame', 'bi-box',
    'bi-archive', 'bi-grid', 'bi-list', 'bi-cabinet', 'bi-door',
    'bi-window', 'bi-briefcase', 'bi-bag', 'bi-basket', 'bi-bookmark'
  ]

  async function handleSave() {
    if (!name.trim()) { showToast('Name is required', 'error'); return }
    const slug = name.toLowerCase().replace(/\s+/g, '-')
    const { error } = await supabase.from('categories').insert({ name, slug, description, icon })
    if (error) { showToast('Failed to create category', 'error'); return }
    showToast('Category created!', 'success')
    onSaved()
    onClose()
  }

  return (
    <div className="lightbox-overlay" onClick={onClose} style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="fh-card p-4" style={{ maxWidth: '500px', width: '90%' }} onClick={e => e.stopPropagation()}>
        <h4 className="mb-3">Add Category</h4>
        <div className="mb-3">
          <label className="fh-form-label">Name</label>
          <input className="fh-form-control" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Chairs" />
        </div>
        <div className="mb-3">
          <label className="fh-form-label">Description</label>
          <input className="fh-form-control" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional" />
        </div>
        <div className="mb-3">
          <label className="fh-form-label">Icon</label>
          <button
            type="button"
            className="fh-form-control d-flex align-items-center gap-2"
            onClick={() => setShowIconPicker(!showIconPicker)}
            style={{ background: 'var(--fh-secondary)', border: '1px solid rgba(0,0,0,0.1)', textAlign: 'left', cursor: 'pointer' }}
          >
            <i className={`bi ${icon}`} style={{ fontSize: '1.5rem' }}></i>
            <span>{icon}</span>
            <i className={`bi bi-chevron-down ms-auto`} style={{ fontSize: '0.9rem' }}></i>
          </button>

          {showIconPicker && (
            <div style={{ marginTop: '0.75rem', padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
                {furnitureIcons.map(iconName => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => {
                      setIcon(iconName)
                      setShowIconPicker(false)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: icon === iconName ? '2px solid var(--fh-primary)' : '1px solid rgba(0,0,0,0.1)',
                      background: icon === iconName ? 'rgba(123, 79, 50, 0.1)' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontSize: '1.5rem',
                    }}
                    title={iconName}
                  >
                    <i className={`bi ${iconName}`}></i>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="d-flex gap-2">
          <button className="btn-fh-primary btn flex-grow-1" onClick={handleSave}>Save</button>
          <button className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
