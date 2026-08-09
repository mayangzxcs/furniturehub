import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { showToast } from '../lib/toast'

export default function SignIn() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      showToast(error, 'error')
    } else {
      showToast('Welcome back!', 'success')
      navigate('/feed')
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card fh-card">
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to your FurnitureHub account</p>
        <form onSubmit={handleSubmit}>
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
            {loading ? <span className="spinner-border spinner-border-sm" /> : 'Sign In'}
          </button>
        </form>
        <div className="text-center mb-3">
          <Link to="/forgot-password" style={{ fontSize: '0.9rem' }}>Forgot password?</Link>
        </div>

        <div className="fh-divider"></div>
        <div className="text-center">
          <span style={{ opacity: 0.6 }}>Don't have an account? </span>
          <Link to="/signup" className="fw-semibold">Sign Up</Link>
        </div>
      </div>
    </div>
  )
}