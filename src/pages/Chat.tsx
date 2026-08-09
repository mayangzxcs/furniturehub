import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { Message, Conversation, Profile } from '../lib/types'
import { showToast } from '../lib/toast'

interface ConvWithMeta extends Conversation {
  last_message?: string
  last_message_at?: string
  unread_count?: number
}

export default function Chat() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<ConvWithMeta[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [otherUser, setOtherUser] = useState<Profile | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isAdmin = profile?.role === 'admin'

  useEffect(() => {
    if (!profile) { navigate('/signin'); return }
    loadConversations()
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [profile])

  // Start polling when active conversation changes
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (activeConvId) {
      startPolling(activeConvId)
    }
  }, [activeConvId])

  async function loadConversations() {
    if (!profile) return
    setLoading(true)

    const { data: convs } = await supabase
      .from('conversations')
      .select('*, viewer:profiles!conversations_viewer_id_fkey(*), admin:profiles!conversations_admin_id_fkey(*)')
      .order('created_at', { ascending: false })

    const allConvs = (convs as ConvWithMeta[]) || []

    // Enrich conversations with last message and unread count
    const enrichedConvs = await Promise.all(allConvs.map(async (c) => {
      const [lastMsgRes, unreadRes] = await Promise.all([
        supabase.from('messages').select('content, created_at').eq('conversation_id', c.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        profile ? supabase.from('messages').select('id', { count: 'exact', head: true }).eq('conversation_id', c.id).eq('is_read', false).neq('sender_id', profile.id) : Promise.resolve({ count: 0 }),
      ])
      return {
        ...c,
        last_message: (lastMsgRes.data as { content: string } | null)?.content || '',
        last_message_at: (lastMsgRes.data as { created_at: string } | null)?.created_at || '',
        unread_count: unreadRes.count || 0,
      } as ConvWithMeta
    }))

    if (isAdmin) {
      // Admin: show all conversations (assigned + unassigned)
      setConversations(enrichedConvs)
      // Auto-select first conversation if none selected
      if (!activeConvId && enrichedConvs.length > 0) {
        selectConversation(enrichedConvs[0])
      }
    } else {
      // Viewer: find or create their conversation
      let conv = enrichedConvs.find(c => c.viewer_id === profile.id) || null
      if (!conv) {
        // Create a new conversation
        const { data: admins } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'admin')
          .eq('status', 'active')
          .limit(1)

        const admin = (admins as Profile[])?.[0] || null
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({ viewer_id: profile.id, admin_id: admin?.id || null })
          .select('*, viewer:profiles!conversations_viewer_id_fkey(*), admin:profiles!conversations_admin_id_fkey(*)')
          .single()

        if (newConv) {
          conv = newConv as ConvWithMeta
        }
      }
      if (conv) {
        setConversations([conv])
        selectConversation(conv)
      }
    }
    setLoading(false)
  }

  function selectConversation(conv: ConvWithMeta) {
    setActiveConvId(conv.id)
    const other = isAdmin ? conv.viewer : conv.admin
    setOtherUser(other as Profile | null)
    loadMessages(conv.id)
    // Mark messages as read
    if (conv.unread_count && conv.unread_count > 0) {
      markAsRead(conv.id)
    }
  }

  async function markAsRead(convId: string) {
    if (!profile) return
    await supabase.from('messages').update({ is_read: true }).eq('conversation_id', convId).neq('sender_id', profile.id)
  }

  function startPolling(convId: string) {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      // Refresh conversations list with profiles and unread counts
      const { data: convs } = await supabase
        .from('conversations')
        .select('*, viewer:profiles!conversations_viewer_id_fkey(*), admin:profiles!conversations_admin_id_fkey(*)')
        .order('created_at', { ascending: false })
      if (convs) {
        const enriched = await Promise.all((convs as ConvWithMeta[]).map(async (c) => {
          const [lastMsgRes, unreadRes] = await Promise.all([
            supabase.from('messages').select('content, created_at').eq('conversation_id', c.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
            profile ? supabase.from('messages').select('id', { count: 'exact', head: true }).eq('conversation_id', c.id).eq('is_read', false).neq('sender_id', profile.id) : Promise.resolve({ count: 0 }),
          ])
          return {
            ...c,
            last_message: (lastMsgRes.data as { content: string } | null)?.content || '',
            last_message_at: (lastMsgRes.data as { created_at: string } | null)?.created_at || '',
            unread_count: unreadRes.count || 0,
          } as ConvWithMeta
        }))
        setConversations(prev => {
          const map = new Map(prev.map(c => [c.id, c]))
          for (const c of enriched) {
            map.set(c.id, c)
          }
          return Array.from(map.values())
        })
      }

      // Refresh messages for active conversation
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })
      const fresh = (data as any[]) || []
      setMessages(prev => {
        const map = new Map(prev.map(m => [m.id, m]))
        for (const m of fresh) {
          map.set(m.id, {
            ...m,
            sender: m.sender || undefined,
          } as Message)
        }
        return Array.from(map.values()).sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      })
    }, 3000)
  }

  async function loadMessages(convId: string) {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
    const msgs = ((data as any[]) || []).map(m => ({
      ...m,
      sender: m.sender || undefined,
    })) as Message[]
    setMessages(msgs)
    // Scroll messages container to bottom — doesn't affect page scroll
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
      }
    }, 100)
  }

  async function sendMessage() {
    if (!profile || !activeConvId || !newMessage.trim()) return
    const { error } = await supabase.from('messages').insert({
      conversation_id: activeConvId,
      sender_id: profile.id,
      content: newMessage,
    })
    if (error) { showToast('Failed to send message', 'error'); return }
    setNewMessage('')
    await loadMessages(activeConvId)
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    if (isToday) {
      return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  function formatLastSeen(dateStr: string) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  if (loading) return <div className="text-center p-5"><div className="spinner-border text-fh-primary" /></div>

  const activeConv = conversations.find(c => c.id === activeConvId)

  return (
    <div className="fh-page-container" style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <h1 className="fh-section-title">Messages</h1>
      <div className="chat-messenger" style={{ flex: 1, display: 'flex', overflow: 'hidden', borderRadius: '12px', border: '1px solid var(--border)' }}>
        {/* Conversation List - Left Sidebar */}
        <div className="chat-conv-list" style={{
          width: isAdmin ? '340px' : '0',
          minWidth: isAdmin ? '340px' : '0',
          borderRight: isAdmin ? '1px solid var(--border)' : 'none',
          overflowY: 'auto',
          background: 'var(--fh-secondary)',
        }}>
          {isAdmin && conversations.length === 0 && (
            <div className="text-center p-4 text-muted" style={{ fontSize: '0.9rem' }}>
              <i className="bi bi-inbox" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem', opacity: 0.3 }}></i>
              No conversations yet
            </div>
          )}
          {isAdmin && conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => selectConversation(conv)}
              className="chat-conv-item"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                cursor: 'pointer',
                borderBottom: '1px solid var(--border)',
                background: conv.id === activeConvId ? 'var(--accent-bg)' : 'transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (conv.id !== activeConvId) e.currentTarget.style.background = 'var(--accent-bg)' }}
              onMouseLeave={e => { if (conv.id !== activeConvId) e.currentTarget.style.background = 'transparent' }}
            >
              {conv.viewer?.avatar_url ? (
                <img src={conv.viewer.avatar_url} alt="" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: 'var(--fh-accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 600, fontSize: '1rem', flexShrink: 0
                }}>
                  {conv.viewer?.display_name?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--fh-text)' }}>
                    {conv.viewer?.display_name || 'Unknown User'}
                  </strong>
                  {conv.last_message_at && (
                    <span style={{ fontSize: '0.75rem', opacity: 0.5, whiteSpace: 'nowrap', marginLeft: '8px' }}>
                      {formatLastSeen(conv.last_message_at)}
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: '0.85rem',
                  opacity: 0.6,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginTop: '2px',
                }}>
                  {conv.last_message || 'No messages yet'}
                </div>
              </div>
              {conv.unread_count && conv.unread_count > 0 && (
                <span style={{
                  background: 'var(--fh-accent)',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '22px',
                  height: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  flexShrink: 0,
                }}>
                  {conv.unread_count > 9 ? '9+' : conv.unread_count}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Conversation View - Right Panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--fh-secondary)' }}>
          {!activeConv ? (
            <div className="text-center p-5" style={{ margin: 'auto' }}>
              <i className="bi bi-chat-dots" style={{ fontSize: '3rem', opacity: 0.3, color: 'var(--fh-text)' }}></i>
              <p className="mt-3 text-muted">
                {isAdmin ? 'Select a conversation to start chatting' : 'Start a conversation!'}
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="chat-header" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 20px',
                borderBottom: '1px solid var(--border)',
              }}>
                {otherUser?.avatar_url ? (
                  <img src={otherUser.avatar_url} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: 'var(--fh-accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 600, fontSize: '0.95rem',
                  }}>
                    {otherUser?.display_name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--fh-text)' }}>
                    {otherUser?.display_name || 'User'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--fh-accent)' }}>
                    <i className="bi bi-circle-fill" style={{ fontSize: '0.45rem', marginRight: '4px' }}></i>
                    {isAdmin ? 'Viewer' : 'Admin'}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div ref={messagesContainerRef} className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                {messages.length === 0 ? (
                  <div className="text-center text-muted" style={{ marginTop: '40px' }}>
                    <i className="bi bi-chat-dots" style={{ fontSize: '2rem', opacity: 0.3 }}></i>
                    <p className="mt-2">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMine = msg.sender_id === profile?.id
                    return (
                      <div key={msg.id} style={{
                        display: 'flex',
                        justifyContent: isMine ? 'flex-end' : 'flex-start',
                        marginBottom: '10px',
                      }}>
                        <div className="chat-bubble" style={{
                          maxWidth: '70%',
                          padding: '10px 14px',
                          borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          background: isMine ? 'var(--fh-accent)' : 'var(--accent-bg)',
                          color: isMine ? '#fff' : 'var(--fh-text)',
                          fontSize: '0.9rem',
                          lineHeight: 1.4,
                        }}>
                          {msg.content}
                          <div style={{
                            fontSize: '0.7rem',
                            opacity: 0.7,
                            marginTop: '4px',
                            textAlign: 'right',
                            color: isMine ? 'rgba(255,255,255,0.8)' : 'inherit',
                          }}>
                            {formatTime(msg.created_at)} {isMine && (msg.is_read ? '✓✓' : '✓')}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Input */}
              <div className="chat-input-area" style={{
                display: 'flex',
                gap: '10px',
                padding: '14px 20px',
                borderTop: '1px solid var(--border)',
              }}>
                <input
                  type="text"
                  className="fh-form-control"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  style={{ borderRadius: '24px', padding: '10px 16px' }}
                />
                <button className="btn-fh-primary btn" onClick={sendMessage} disabled={!newMessage.trim()} style={{ borderRadius: '50%', width: '42px', height: '42px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-send"></i>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}