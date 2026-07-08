import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../AppContext.jsx'

export default function Login() {
  const [identifier, setIdentifier] = useState('')
  const { loginWithIdentifier } = useApp()
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    if (!identifier.trim()) return
    const isOwner = loginWithIdentifier(identifier)
    navigate(isOwner ? '/profile' : '/')
  }

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

      <form onSubmit={handleSubmit} className="w-full">
        <label className="block text-sm font-medium text-ink/70 mb-2">
          Email or phone number
        </label>
        <input
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="you@example.com or 98765 43210"
          className="w-full rounded-xl2 border border-ink/15 bg-white px-4 py-3.5 text-base outline-none focus:border-accent transition-colors"
          autoComplete="username"
        />
        <button
          type="submit"
          className="w-full mt-4 bg-accent text-white rounded-xl2 py-3.5 font-medium text-base active:bg-accentDark transition-colors"
        >
          Continue
        </button>
        <p className="text-xs text-ink/40 mt-3 text-center">
          Shop owners are recognized automatically — no separate sign-up.
        </p>
        <p className="text-xs text-ink/30 mt-4 text-center">
          Try owner1@pothys.com to preview the owner view, or any other email as a customer.
        </p>
      </form>
    </div>
  )
}
