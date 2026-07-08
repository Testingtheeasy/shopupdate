import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../AppContext.jsx'

export default function Login() {
  const { session, authLoading, loginWithGoogle } = useApp()
  const navigate = useNavigate()

  // Once Firebase resolves who's signed in (and their role), route them.
  useEffect(() => {
    if (session) navigate(session.role === 'owner' ? '/profile' : '/', { replace: true })
  }, [session, navigate])

  return (
    <div className="h-full flex flex-col justify-between px-6 pt-14 pb-10">
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

      <div className="w-full">
        <button
          onClick={loginWithGoogle}
          disabled={authLoading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-ink/15 rounded-xl2 py-3.5 font-medium text-base text-ink shadow-sm active:bg-ink/5 transition-colors disabled:opacity-50"
        >
          <GoogleLogo />
          {authLoading ? 'Checking sign-in…' : 'Continue with Google'}
        </button>
        <p className="text-xs text-ink/40 mt-3 text-center">
          Shop owners are recognized automatically by their Google account email —
          no separate sign-up.
        </p>
      </div>
    </div>
  )
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
