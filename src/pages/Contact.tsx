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
      </div>
    </div>
  )
}
