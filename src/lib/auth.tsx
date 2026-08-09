import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Profile } from './types'

interface AuthContextValue {
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null; requiresVerification: boolean }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(uid: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle()
    setProfile(data as Profile | null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) {
        loadProfile(data.session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession) {
        ;(async () => {
          await loadProfile(newSession.user.id)
        })()
      } else {
        setProfile(null)
      }
    })

    return () => authListener.subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    // Retry up to 3 times with delay if we hit rate limits (429)
    for (let attempt = 1; attempt <= 3; attempt++) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        if (error.status === 429 && attempt < 3) {
          const delay = attempt * 5000 // 5s, 10s
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        if (error.status === 429) {
          return { error: 'Too many sign-in attempts. Please wait a few minutes and try again.' }
        }
        return { error: error.message }
      }
      
      // Check if user is active before allowing login
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('status')
          .eq('id', data.user.id)
          .maybeSingle()
        
        if (profile && profile.status !== 'active') {
          // Sign out the user immediately
          await supabase.auth.signOut()
          setSession(null)
          setProfile(null)
          if (profile.status === 'pending') {
            return { error: 'Your account is pending approval. Please wait for an administrator to approve your account.' }
          } else if (profile.status === 'disabled') {
            return { error: 'Your account has been disabled. Please contact support.' }
          }
          return { error: 'Your account is not active. Please contact support.' }
        }
      }
      
      return { error: null }
    }
    return { error: 'Sign-in failed. Please try again.' }
  }

  async function signUp(email: string, password: string, displayName: string): Promise<{ error: string | null; requiresVerification: boolean }> {
    // Retry up to 3 times with delay if we hit rate limits (429)
    for (let attempt = 1; attempt <= 3; attempt++) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      })
      if (error) {
        // If rate limited (429), wait and retry
        if (error.status === 429 && attempt < 3) {
          const delay = attempt * 5000 // 5s, 10s
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        if (error.status === 429) {
          return { error: 'Too many sign-up attempts. Please wait a few minutes and try again.', requiresVerification: false }
        }
        return { error: error.message, requiresVerification: false }
      }
      // data.requires_verification will be true — user must verify email first
      return { error: null, requiresVerification: (data as any)?.requires_verification ?? false }
    }
    return { error: 'Sign-up failed. Please try again.', requiresVerification: false }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
    setSession(null)
  }

  async function refreshProfile() {
    if (session) await loadProfile(session.user.id)
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
