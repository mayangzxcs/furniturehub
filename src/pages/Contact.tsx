import { useState } from 'react'
import { showToast } from '../lib/toast'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    showToast('Message sent! We\'ll get back to you shortly.', 'success')
    setForm({ name: '', email: '', message: '' })
  }

  const contact = {
    name: 'Mark Nicole Aragon',
    phone: '+44 7393 921037',
    email: 'homeofcomfortbymarkltd@gmail.com',
    address: 'Br6 0up Orpington, Bromley Kent. United Kingdom',
  }

  return (
    <div className="fh-page-container" style={{ maxWidth: '900px' }}>
      <h1 className="fh-section-title">Contact Us</h1>
      
      <div className="row g-4 mb-4">
        {/* Contact Information */}
        <div className="col-md-6">
          <div className="fh-card p-4">
            <h3 style={{ color: 'var(--fh-primary)', marginBottom: '1.5rem' }}>Our Contact Information</h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <h5 style={{ fontSize: '0.95rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Name</h5>
              <p style={{ fontSize: '1.1rem', fontWeight: '500', color: 'var(--fh-text)' }}>{contact.name}</p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h5 style={{ fontSize: '0.95rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Phone</h5>
              <a href={`tel:${contact.phone}`} style={{ fontSize: '1.1rem', fontWeight: '500', color: 'var(--fh-primary)', textDecoration: 'none' }}>
                {contact.phone}
              </a>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h5 style={{ fontSize: '0.95rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Email</h5>
              <a href={`mailto:${contact.email}`} style={{ fontSize: '1.1rem', fontWeight: '500', color: 'var(--fh-primary)', textDecoration: 'none' }}>
                {contact.email}
              </a>
            </div>

            <div>
              <h5 style={{ fontSize: '0.95rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Address</h5>
              <p style={{ fontSize: '1rem', color: 'var(--fh-text)', lineHeight: '1.6' }}>{contact.address}</p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="col-md-6">
          <div className="fh-card p-4">
            <h3 style={{ color: 'var(--fh-primary)', marginBottom: '1.5rem' }}>Send us a Message</h3>
            <p style={{ opacity: 0.7, marginBottom: '1.5rem' }}>Have a question or feedback? We'd love to hear from you.</p>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="fh-form-label">Name</label>
                <input 
                  type="text" 
                  className="fh-form-control" 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="mb-3">
                <label className="fh-form-label">Email</label>
                <input 
                  type="email" 
                  className="fh-form-control" 
                  value={form.email} 
                  onChange={e => setForm({...form, email: e.target.value})} 
                  required 
                />
              </div>
              <div className="mb-3">
                <label className="fh-form-label">Message</label>
                <textarea 
                  className="fh-form-control" 
                  rows={4} 
                  value={form.message} 
                  onChange={e => setForm({...form, message: e.target.value})} 
                  required 
                />
              </div>
              <button type="submit" className="btn-fh-primary btn w-100">Send Message</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
