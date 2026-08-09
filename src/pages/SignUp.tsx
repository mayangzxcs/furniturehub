import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { showToast } from '../lib/toast'
import { supabase } from '../lib/supabase'

export default function SignUp() {
  const { signUp, signOut } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
    const { error, requiresVerification } = await signUp(email, password, displayName)
    setLoading(false)
    if (error) {
      showToast(error, 'error')
    } else if (requiresVerification) {
      setVerificationSent(true)
    } else {
      // No email verification required - account created successfully
      // Sign out immediately to prevent auto-login (user must be approved first)
      await signOut()
      // Show the "Account Created" screen instead of redirecting to signin
      setVerificationSent(true)
    }
  }

  if (verificationSent) {
    return (
      <div className="auth-container">
        <div className="auth-card fh-card text-center">
          <div className="mb-4" style={{ fontSize: '3rem' }}>
            <i className="bi bi-clock-history text-warning"></i>
          </div>
          <h1 className="auth-title">Account Created!</h1>
          <p className="auth-subtitle">
            Your account has been created successfully. An administrator will review and activate your account shortly.
          </p>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>
            You'll be able to sign in once your account is approved.
          </p>
          <Link to="/signin" className="btn-fh-primary btn mt-3">Go to Sign In</Link>
        </div>
      </div>
    )
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
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="fh-form-control" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                placeholder="At least 6 characters" 
                style={{ paddingRight: '3rem' }}
              />
              <button 
                type="button" 
                className="btn btn-sm border-0 bg-transparent" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--fh-text)', opacity: 0.6 }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: '1.2rem' }}></i>
              </button>
            </div>
          </div>
          <div className="mb-3">
            <label className="fh-form-label">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="fh-form-control" 
                value={confirm} 
                onChange={e => setConfirm(e.target.value)} 
                required 
                placeholder="••••••••" 
                style={{ paddingRight: '3rem' }}
              />
              <button 
                type="button" 
                className="btn btn-sm border-0 bg-transparent" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--fh-text)', opacity: 0.6 }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: '1.2rem' }}></i>
              </button>
            </div>
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