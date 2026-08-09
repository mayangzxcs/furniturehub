import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { showToast } from '../lib/toast'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  link?: string
  is_read: boolean
  created_at: string
}

export default function Notifications() {
  const navigate = useNavigate()
  const { profile, loading: authLoading } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && profile?.role !== 'admin') {
      navigate('/')
    }
  }, [profile, authLoading, navigate])

  const loadNotifications = useCallback(async () => {
    if (!profile) return
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setNotifications((data as Notification[]) || [])
    } catch (error) {
      console.error('Failed to load notifications:', error)
      showToast('Failed to load notifications', 'error')
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => {
    loadNotifications()
    
    // Set up real-time subscription
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile?.id}`,
        },
        () => {
          loadNotifications()
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.id, loadNotifications])

  async function markAsRead(id: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
      
      if (error) throw error
      
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      )
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      showToast('Failed to update notification', 'error')
    }
  }

  async function markAllAsRead() {
    try {
      const unreadIds = notifications
        .filter(n => !n.is_read)
        .map(n => n.id)
      
      if (unreadIds.length === 0) {
        showToast('No unread notifications', 'info')
        return
      }
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds)
      
      if (error) throw error
      
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      )
      showToast('All notifications marked as read', 'success')
    } catch (error) {
      console.error('Failed to mark all as read:', error)
      showToast('Failed to update notifications', 'error')
    }
  }

  async function deleteNotification(id: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      setNotifications(prev => prev.filter(n => n.id !== id))
      showToast('Notification deleted', 'success')
    } catch (error) {
      console.error('Failed to delete notification:', error)
      showToast('Failed to delete notification', 'error')
    }
  }

  async function deleteAllRead() {
    try {
      const readIds = notifications
        .filter(n => n.is_read)
        .map(n => n.id)
      
      if (readIds.length === 0) {
        showToast('No read notifications to delete', 'info')
        return
      }
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', readIds)
      
      if (error) throw error
      
      setNotifications(prev => prev.filter(n => !n.is_read))
      showToast('Read notifications deleted', 'success')
    } catch (error) {
      console.error('Failed to delete read notifications:', error)
      showToast('Failed to delete notifications', 'error')
    }
  }

  function handleNotificationClick(notif: Notification) {
    if (!notif.is_read) {
      markAsRead(notif.id)
    }
    if (notif.link) {
      navigate(notif.link)
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

  function getNotificationIcon(type: string) {
    switch (type) {
      case 'new_account':
        return 'bi-person-plus'
      case 'like':
        return 'bi-heart-fill'
      case 'comment':
        return 'bi-chat'
      case 'share':
        return 'bi-share'
      default:
        return 'bi-bell'
    }
  }

  const displayedNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (authLoading || loading) {
    return (
      <div className="fh-page-container text-center p-5">
        <div className="spinner-border text-fh-primary"></div>
      </div>
    )
  }

  return (
    <div className="fh-page-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fh-section-title mb-0">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-muted" style={{ fontSize: '0.9rem' }}>
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button 
            className="btn btn-sm btn-fh-primary"
            onClick={markAllAsRead}
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="mb-3 d-flex gap-2">
        <button
          className={`btn btn-sm ${filter === 'all' ? 'btn-fh-primary' : 'btn-outline-secondary'}`}
          onClick={() => setFilter('all')}
        >
          All ({notifications.length})
        </button>
        <button
          className={`btn btn-sm ${filter === 'unread' ? 'btn-fh-primary' : 'btn-outline-secondary'}`}
          onClick={() => setFilter('unread')}
        >
          Unread ({unreadCount})
        </button>
        {notifications.filter(n => n.is_read).length > 0 && (
          <button
            className="btn btn-sm btn-outline-danger ms-auto"
            onClick={deleteAllRead}
          >
            Clear read
          </button>
        )}
      </div>

      {displayedNotifications.length === 0 ? (
        <div className="text-center py-5">
          <i 
            className="bi bi-inbox" 
            style={{ fontSize: '3rem', opacity: 0.3 }}
          ></i>
          <p className="mt-3 text-muted">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
        </div>
      ) : (
        <div className="row g-3">
          {displayedNotifications.map(notif => (
            <div key={notif.id} className="col-12">
              <div 
                className={`fh-card p-3 fade-in ${!notif.is_read ? 'border-start border-fh-accent' : ''}`}
                style={{
                  cursor: notif.link ? 'pointer' : 'default',
                  backgroundColor: !notif.is_read ? 'rgba(93, 122, 88, 0.05)' : 'transparent',
                  borderLeft: !notif.is_read ? '4px solid var(--fh-accent)' : 'none',
                  transition: 'all var(--fh-transition)',
                }}
                onMouseEnter={e => {
                  if (notif.link) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(93, 122, 88, 0.1)'
                  }
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = !notif.is_read ? 'rgba(93, 122, 88, 0.05)' : 'transparent'
                }}
              >
                <div className="d-flex gap-3">
                  <div style={{ fontSize: '1.5rem', color: 'var(--fh-accent)' }}>
                    <i className={`bi ${getNotificationIcon(notif.type)}`}></i>
                  </div>
                  
                  <div className="flex-grow-1" onClick={() => handleNotificationClick(notif)}>
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h5 className="mb-1" style={{ fontWeight: notif.is_read ? 500 : 600 }}>
                          {notif.title}
                        </h5>
                        <p className="mb-1" style={{ opacity: 0.8, fontSize: '0.95rem' }}>
                          {notif.body}
                        </p>
                        <small style={{ opacity: 0.5 }}>
                          {formatDate(notif.created_at)}
                        </small>
                      </div>
                      {!notif.is_read && (
                        <span 
                          className="badge bg-fh-accent"
                          style={{ marginLeft: '1rem' }}
                        >
                          New
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    {!notif.is_read && (
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={e => {
                          e.stopPropagation()
                          markAsRead(notif.id)
                        }}
                        title="Mark as read"
                      >
                        <i className="bi bi-check2"></i>
                      </button>
                    )}
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={e => {
                        e.stopPropagation()
                        deleteNotification(notif.id)
                      }}
                      title="Delete"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
