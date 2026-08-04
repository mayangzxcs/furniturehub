import { useState } from 'react'

const faqs = [
  { q: 'How do I create an account?', a: 'Click "Sign Up" in the top navigation, enter your display name, email, and password to create your account.' },
  { q: 'How do I upload furniture?', a: 'Only admin users can upload furniture. If you\'re an admin, go to the Dashboard and click "New Post".' },
  { q: 'Can I save posts for later?', a: 'Yes! Click the bookmark icon on any post to add it to your favorites. View them anytime from the bookmark icon in the navbar.' },
  { q: 'How do I chat with the admin?', a: 'Click the chat icon in the navigation bar to start a conversation with our team.' },
  { q: 'How do I share a post?', a: 'Click the share icon on any post to copy the link or share to Facebook, WhatsApp, X, Pinterest, or email.' },
  { q: 'Can I edit my comments?', a: 'Yes, you can edit or delete your own comments at any time. Admins can delete any comment.' },
  { q: 'Is there a dark mode?', a: 'Yes! Click the moon/sun icon in the navigation bar to toggle between light and dark themes.' },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className="fh-page-container" style={{ maxWidth: '800px' }}>
      <h1 className="fh-section-title">Frequently Asked Questions</h1>
      <div className="fh-card p-4">
        {faqs.map((faq, i) => (
          <div key={i} className="mb-2">
            <button className="btn w-100 text-start d-flex justify-content-between align-items-center p-3" style={{ background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }} onClick={() => setOpen(open === i ? null : i)}>
              <span className="fw-semibold">{faq.q}</span>
              <i className={`bi ${open === i ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
            </button>
            {open === i && <div className="p-3 fade-in" style={{ opacity: 0.8 }}>{faq.a}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
