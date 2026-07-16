import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../AppContext.jsx'

export default function Login() {
  const { session, authLoading, loginWithGoogle, loginWithEmailPassword, loginWithPhonePassword, continueAsGuest } = useApp()
  const navigate = useNavigate()

  const [mode, setMode] = useState('google') // 'google' | 'email' | 'phone'
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [googleError, setGoogleError] = useState('')

  useEffect(() => {
    if (session) navigate(session.role === 'owner' ? '/profile' : '/', { replace: true })
  }, [session, navigate])

  async function handleGoogleClick() {
    setGoogleError('')
    try {
      await loginWithGoogle()
    } catch (err) {
      // Show the raw Firebase error code — this is the exact info needed
      // to diagnose Cloud Console / Firebase Console config mismatches.
      setGoogleError(`${err.code || 'unknown-error'}: ${err.message || err}`)
    }
  }

  async function handleEmailSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await loginWithEmailPassword(email.trim(), password, isSignup)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handlePhoneSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await loginWithPhonePassword(phone.trim(), password, isSignup)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="h-full flex flex-col justify-between px-6 pt-12 pb-8 overflow-y-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-3 h-3 rounded-full bg-open inline-block" />
          <span className="w-3 h-3 rounded-full bg-unverified inline-block" />
          <span className="w-3 h-3 rounded-full bg-closed inline-block" />
        </div>
        <h1 className="font-display text-4xl font-600 leading-tight text-ink mt-4">
          Know before<br />you go.
        </h1>
        <p className="text-ink/60 mt-3 text-[15px] leading-relaxed">
          Real shop status, straight from the owner — not a stale hours listing.
        </p>
      </div>

      <div className="w-full mt-8">
        <button
          onClick={handleGoogleClick}
          disabled={authLoading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-ink/15 rounded-xl2 py-3.5 font-medium text-base text-ink shadow-sm active:bg-ink/5 transition-colors disabled:opacity-50"
        >
          <GoogleLogo />
          Continue with Google
        </button>
        {googleError && <p className="text-xs text-closed mt-2 break-words">{googleError}</p>}

        <div className="flex items-center gap-3 my-4">
          <div className="h-px bg-ink/10 flex-1" />
          <span className="text-xs text-ink/40">or</span>
          <div className="h-px bg-ink/10 flex-1" />
        </div>

        <div className="flex rounded-xl overflow-hidden border border-ink/10 mb-4">
          <button onClick={() => { setMode('email'); setError('') }}
                  className={`flex-1 py-2 text-sm font-medium ${mode === 'email' ? 'bg-accent text-white' : 'bg-white text-ink/60'}`}>
            Email
          </button>
          <button onClick={() => { setMode('phone'); setError('') }}
                  className={`flex-1 py-2 text-sm font-medium ${mode === 'phone' ? 'bg-accent text-white' : 'bg-white text-ink/60'}`}>
            Phone
          </button>
        </div>

        {mode === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink/50 mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                     placeholder="you@example.com"
                     className="w-full rounded-xl2 border border-ink/15 bg-white px-4 py-3 text-base outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/50 mb-1.5">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                     placeholder="Min 6 characters"
                     className="w-full rounded-xl2 border border-ink/15 bg-white px-4 py-3 text-base outline-none focus:border-accent" />
            </div>
            {error && <p className="text-xs text-closed">{error}</p>}
            <button type="submit" disabled={submitting}
                    className="w-full bg-accent text-white rounded-xl2 py-3.5 font-medium text-base disabled:opacity-50">
              {submitting ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
            </button>
          </form>
        )}

        {mode === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink/50 mb-1.5">Phone number</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required
                     placeholder="98765 43210"
                     className="w-full rounded-xl2 border border-ink/15 bg-white px-4 py-3 text-base outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/50 mb-1.5">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                     placeholder="Min 6 characters"
                     className="w-full rounded-xl2 border border-ink/15 bg-white px-4 py-3 text-base outline-none focus:border-accent" />
            </div>
            {error && <p className="text-xs text-closed">{error}</p>}
            <button type="submit" disabled={submitting}
                    className="w-full bg-accent text-white rounded-xl2 py-3.5 font-medium text-base disabled:opacity-50">
              {submitting ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
            </button>
          </form>
        )}

        {(mode === 'email' || mode === 'phone') && (
          <button onClick={() => { setIsSignup((v) => !v); setError('') }} className="w-full text-center text-xs text-ink/50 mt-3">
            {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
          </button>
        )}

        <div className="flex items-center gap-3 my-4">
          <div className="h-px bg-ink/10 flex-1" />
          <span className="text-xs text-ink/40">or</span>
          <div className="h-px bg-ink/10 flex-1" />
        </div>

        <button onClick={continueAsGuest} className="w-full text-center text-sm font-medium text-ink/60 py-2">
          Continue as guest
        </button>
        <p className="text-[11px] text-ink/35 mt-1 text-center">
          Browse-only — shop owners must sign in with one of the options above.
        </p>
      </div>
    </div>
  )
}

function friendlyError(err) {
  const code = err?.code || ''
  if (code.includes('email-already-in-use')) return 'An account already exists — try signing in instead.'
  if (code.includes('user-not-found') || code.includes('invalid-credential')) return 'No account found with those details.'
  if (code.includes('wrong-password')) return 'Incorrect password.'
  if (code.includes('weak-password')) return 'Password should be at least 6 characters.'
  return 'Something went wrong. Please try again.'
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 009 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 013.68 9c0-.59.1-1.17.27-1.7V4.97H.98A9 9 0 000 9c0 1.45.35 2.83.98 4.03l2.97-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 00.98 4.97l2.97 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  )
}
