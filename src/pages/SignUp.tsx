import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { showToast } from '../lib/toast'

export default function SignUp() {
  const { signUp, signOut } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      showToast('Passwords do not match', 'error')
      return
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error')
      return
    }
    setLoading(true)
    const { error, requiresVerification, rateLimited } = await signUp(email, password, displayName)
    setLoading(false)
    if (error) {
      showToast(error, 'error')
    } else {
      // Signup succeeded — sign the user out so they're not auto-logged-in
      // (Supabase creates a session on signUp). Then redirect to sign-in.
      if (rateLimited) {
        showToast('Account created! (Confirmation email rate-limited — please try again later)', 'info')
      } else {
        showToast('Account created successfully!', 'success')
      }
      await signOut()
      navigate('/signin')
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card fh-card">
        <h1 className="auth-title">Join FurnitureHub</h1>
        <p className="auth-subtitle">Create your account to start exploring</p>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="fh-form-label">Display Name</label>
            <input type="text" className="fh-form-control" value={displayName} onChange={e => setDisplayName(e.target.value)} required placeholder="Your name" />
          </div>
          <div className="mb-3">
            <label className="fh-form-label">Email</label>
            <input type="email" className="fh-form-control" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div className="mb-3">
            <label className="fh-form-label">Password</label>
            <input type="password" className="fh-form-control" value={password} onChange={e => setPassword(e.target.value)} required placeholder="At least 6 characters" />
          </div>
          <div className="mb-3">
            <label className="fh-form-label">Confirm Password</label>
            <input type="password" className="fh-form-control" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="••••••••" />
          </div>
          <button type="submit" className="btn-fh-primary btn w-100 mb-3" disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm" /> : 'Create Account'}
          </button>
        </form>
        <div className="fh-divider"></div>
        <div className="text-center">
          <span style={{ opacity: 0.6 }}>Already have an account? </span>
          <Link to="/signin" className="fw-semibold">Sign In</Link>
        </div>
      </div>
    </div>
  )
}
