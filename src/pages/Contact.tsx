import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { showToast } from '../lib/toast'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sending, setSending] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      showToast('Please fill in all fields', 'error')
      return
    }
    setSending(true)
    const { error } = await supabase.from('contact_messages').insert({
      name: form.name.trim(),
      email: form.email.trim(),
      message: form.message.trim(),
    })
    setSending(false)
    if (error) {
      console.error('Failed to send message:', error)
      showToast('Failed to send message. Please try again.', 'error')
      return
    }
    showToast('Message sent! We\'ll get back to you shortly.', 'success')
    setForm({ name: '', email: '', message: '' })
  }

  return (
    <div className="fh-page-container" style={{ maxWidth: '600px' }}>
      <h1 className="fh-section-title">Contact Us</h1>
      <div className="fh-card p-4">
        <p style={{ opacity: 0.7 }}>Have a question or feedback? We'd love to hear from you.</p>
        <form onSubmit={handleSubmit}>
          <div className="mb-3"><label className="fh-form-label">Name</label><input type="text" className="fh-form-control" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
          <div className="mb-3"><label className="fh-form-label">Email</label><input type="email" className="fh-form-control" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required /></div>
          <div className="mb-3"><label className="fh-form-label">Message</label><textarea className="fh-form-control" rows={4} value={form.message} onChange={e => setForm({...form, message: e.target.value})} required /></div>
          <button type="submit" className="btn-fh-primary btn w-100" disabled={sending}>
            {sending ? <span className="spinner-border spinner-border-sm" /> : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  )
}