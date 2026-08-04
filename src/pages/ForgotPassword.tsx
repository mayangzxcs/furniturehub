import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { showToast } from '../lib/toast'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    setLoading(false)
    if (error) {
      showToast(error.message, 'error')
    } else {
      setSent(true)
      showToast('Reset link sent! Check your email.', 'success')
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card fh-card">
        <h1 className="auth-title">Reset Password</h1>
        {sent ? (
          <div className="text-center">
            <i className="bi bi-envelope-check" style={{ fontSize: '3rem', color: 'var(--fh-success)' }}></i>
            <p className="mt-3">We've sent a password reset link to <strong>{email}</strong></p>
            <Link to="/signin" className="btn-fh-outline btn mt-3">Back to Sign In</Link>
          </div>
        ) : (
          <>
            <p className="auth-subtitle">Enter your email to receive a reset link</p>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="fh-form-label">Email</label>
                <input type="email" className="fh-form-control" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
              </div>
              <button type="submit" className="btn-fh-primary btn w-100 mb-3" disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm" /> : 'Send Reset Link'}
              </button>
            </form>
            <div className="text-center">
              <Link to="/signin" style={{ fontSize: '0.9rem' }}>Back to Sign In</Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
