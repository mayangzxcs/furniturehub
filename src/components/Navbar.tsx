import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../lib/auth'
import { useTheme } from '../lib/theme'
import { supabase } from '../lib/supabase'
import type { AppNotification } from '../lib/types'

export default function Navbar() {
  const { profile, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!profile) return
    loadNotifications()
    loadUnreadMessages()

    // Poll for unread message count so it updates after messages are read
    const interval = setInterval(() => {
      loadUnreadMessages()
    }, 5000)

    return () => clearInterval(interval)
  }, [profile])

  async function loadUnreadMessages() {
    if (!profile) return
    // Get all conversations the user participates in
    const { data: convs } = await supabase
      .from('conversations')
      .select('id')
      .or(`viewer_id.eq.${profile.id},admin_id.eq.${profile.id}`)

    const convIds = (convs as { id: string }[] || []).map(c => c.id)
    if (convIds.length === 0) { setUnreadMessages(0); return }

    // Count unread messages across all conversations
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('conversation_id', convIds)
      .eq('is_read', false)
      .neq('sender_id', profile.id)

    setUnreadMessages(count || 0)
  }

  async function loadNotifications() {
    if (!profile) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20)
    setNotifications(data as AppNotification[] || [])
    setUnreadCount((data as AppNotification[] || []).filter(n => !n.is_read).length)
  }

   async function markAllRead() {
     if (!profile) return
     await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile.id)
     loadNotifications()
   }

   async function markRead(notificationId: string) {
     if (!profile) return
     await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId)
     loadNotifications()
   }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSignOut() {
    signOut()
    navigate('/')
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className={`fh-navbar navbar navbar-expand-lg ${scrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <Link to="/" className="fh-navbar-brand navbar-brand">
          <i className="bi bi-house-door-fill"></i>
          Home of Comfort by Mark LTD
        </Link>

        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMain">
          <i className="bi bi-list"></i>
        </button>

        <div className="collapse navbar-collapse" id="navMain">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link to="/" className={`fh-nav-link nav-link ${isActive('/') ? 'active' : ''}`}>Home</Link>
            </li>
            <li className="nav-item">
              <Link to="/feed" className={`fh-nav-link nav-link ${isActive('/feed') ? 'active' : ''}`}>Feed</Link>
            </li>
            <li className="nav-item">
              <Link to="/categories" className={`fh-nav-link nav-link ${isActive('/categories') ? 'active' : ''}`}>Categories</Link>
            </li>
            <li className="nav-item">
              <Link to="/trending" className={`fh-nav-link nav-link ${isActive('/trending') ? 'active' : ''}`}>Trending</Link>
            </li>
            {profile?.role === 'admin' && (
              <li className="nav-item">
                <Link to="/admin" className={`fh-nav-link nav-link ${isActive('/admin') ? 'active' : ''}`}>Dashboard</Link>
              </li>
            )}
          </ul>

          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-sm btn-outline-secondary border-0" onClick={toggleTheme} aria-label="Toggle theme">
              <i className={`bi ${theme === 'light' ? 'bi-moon-fill' : 'bi-sun-fill'}`}></i>
            </button>

            {profile ? (
              <>
                <div className="position-relative" ref={notifRef}>
                  <button className="btn btn-sm position-relative" onClick={() => setShowNotifs(!showNotifs)} aria-label="Notifications">
                    <i className="bi bi-bell" style={{ fontSize: '1.3rem' }}></i>
                    {unreadCount > 0 && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.7rem' }}>
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  {showNotifs && (
                    <div className="position-absolute end-0 mt-2 bg-body border rounded-3 shadow" style={{ width: '360px', zIndex: 1050, maxHeight: '400px', overflowY: 'auto' }}>
                      <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                        <strong>Notifications</strong>
                        {unreadCount > 0 && <button className="btn btn-sm btn-link text-decoration-none" onClick={markAllRead}>Mark all read</button>}
                      </div>
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-muted">No notifications yet</div>
                      ) : (
                        notifications.map(n => (
                          <Link 
                            key={n.id} 
                            to={n.link || '/feed'} 
                            className={`notification-item text-decoration-none d-flex gap-2 align-items-start ${!n.is_read ? 'unread' : ''}`}
                            onClick={() => {
                              if (!n.is_read) markRead(n.id)
                              setShowNotifs(false)
                            }}
                          >
                            <i className="bi bi-circle-fill" style={{ fontSize: '0.5rem', color: n.is_read ? 'transparent' : 'var(--fh-accent)', marginTop: '0.5rem' }}></i>
                            <div className="flex-grow-1">
                              <div className="fw-semibold" style={{ fontSize: '0.9rem' }}>{n.title}</div>
                              <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>{n.body}</div>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <Link to="/chat" className="btn btn-sm btn-outline-secondary border-0 position-relative" aria-label="Messages">
                  <i className="bi bi-chat-dots" style={{ fontSize: '1.3rem' }}></i>
                  {unreadMessages > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.65rem', minWidth: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </Link>

                <Link to="/favorites" className="btn btn-sm btn-outline-secondary border-0" aria-label="Favorites">
                  <i className="bi bi-bookmark" style={{ fontSize: '1.3rem' }}></i>
                </Link>

                <button className="btn btn-sm btn-outline-danger border-0" onClick={handleSignOut} aria-label="Sign Out" title="Sign Out">
                  <i className="bi bi-box-arrow-right" style={{ fontSize: '1.3rem' }}></i>
                </button>

                <div className="dropdown">
                  <button className="btn p-0 border-0 bg-transparent" data-bs-toggle="dropdown" aria-label="Profile menu">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.display_name} className="post-card-avatar" style={{ width: '40px', height: '40px' }} />
                    ) : (
                      <div className="post-card-avatar d-flex align-items-center justify-content-center text-white" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
                        {profile.display_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li><span className="dropdown-item-text fw-semibold">{profile.display_name}</span></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li><Link className="dropdown-item" to="/profile"><i className="bi bi-person me-2"></i>Profile</Link></li>
                    <li><Link className="dropdown-item" to="/profile/edit"><i className="bi bi-pencil me-2"></i>Edit Profile</Link></li>
                    {profile.role === 'admin' && (
                      <li><Link className="dropdown-item" to="/admin"><i className="bi bi-speedometer2 me-2"></i>Dashboard</Link></li>
                    )}
                  </ul>
                </div>
              </>
            ) : (
              <>
                <Link to="/signin" className="btn-fh-outline btn">Sign In</Link>
                <Link to="/signup" className="btn-fh-primary btn">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
