import React, { useEffect, useRef, useState } from 'react'
import { useApp } from '../AppContext.jsx'

// Multi-step claim flow:
// 1. Search & select the real shop (Google Places Autocomplete)
// 2. If Google has a phone number on file for that listing, ask the owner
//    to confirm their number — if it matches, auto-approve instantly.
// 3. If there's no Google phone to match against, or it doesn't match,
//    fall through to a short verification form (name, phone, optional GST,
//    note) — the shop is created immediately so the owner can explore, but
//    stays "pending" (unverified to customers) until manually approved.
export default function ClaimShopSearch({ ownerId }) {
  const { claimShop } = useApp()
  const inputRef = useRef(null)
  const [step, setStep] = useState('search') // search | phone_match | form | done
  const [place, setPlace] = useState(null)
  const [phoneInput, setPhoneInput] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ ownerName: '', phone: '', gst: '', note: '' })

  useEffect(() => {
    if (!window.google?.maps?.places || !inputRef.current || step !== 'search') return
    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ['place_id', 'name', 'geometry', 'formatted_address', 'formatted_phone_number'],
    })
    const listener = autocomplete.addListener('place_changed', () => {
      const p = autocomplete.getPlace()
      if (!p?.place_id) return
      setPlace(p)
      setStep(p.formatted_phone_number ? 'phone_match' : 'form')
    })
    return () => window.google.maps.event.removeListener(listener)
  }, [step])

  function normalizePhone(p) {
    return (p || '').replace(/\D/g, '').slice(-10) // last 10 digits, ignores country code formatting
  }

  async function handlePhoneMatch(e) {
    e.preventDefault()
    setError('')
    const matches = normalizePhone(phoneInput) === normalizePhone(place.formatted_phone_number)
    if (matches) {
      await submitClaim('auto_approved', { ownerPhone: normalizePhone(phoneInput) })
    } else {
      setForm((f) => ({ ...f, phone: phoneInput }))
      setStep('form')
    }
  }

  async function handleFormSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.ownerName.trim() || !form.phone.trim()) {
      setError('Name and phone are required.')
      return
    }
    await submitClaim('pending', {
      ownerName: form.ownerName.trim(),
      ownerPhone: normalizePhone(form.phone),
      gstNumber: form.gst.trim(),
      verificationNote: form.note.trim(),
    })
  }

  async function submitClaim(verificationStatus, extra) {
    setSubmitting(true)
    try {
      await claimShop(ownerId, place, { verificationStatus, ...extra })
      setStep('done')
    } catch (err) {
      console.error('claimShop failed:', err)
      setError(`Could not link this shop — ${err.code || err.message || 'unknown error'}`)
      setSubmitting(false)
    }
  }

  if (step === 'done') {
    // Parent Profile screen will switch away automatically once the shop
    // appears in the live shops list — this is just a brief confirmation.
    return (
      <div className="bg-white rounded-xl2 border border-ink/10 p-5 text-center">
        <p className="font-display text-lg font-600 mb-1">Almost there</p>
        <p className="text-sm text-ink/60">Setting up your shop…</p>
      </div>
    )
  }

  if (step === 'phone_match') {
    return (
      <div className="bg-white rounded-xl2 border border-ink/10 p-5 space-y-4">
        <div>
          <p className="font-display text-lg font-600 mb-1">Confirm it's your shop</p>
          <p className="text-sm text-ink/60">
            Google has a phone number on file for <b>{place.name}</b>. Enter your number to verify instantly.
          </p>
        </div>
        <form onSubmit={handlePhoneMatch} className="space-y-3">
          <input
            type="tel"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            placeholder="98765 43210"
            required
            className="w-full rounded-xl2 border border-ink/15 bg-paper px-4 py-3 text-base outline-none focus:border-accent"
          />
          {error && <p className="text-xs text-closed">{error}</p>}
          <button type="submit" disabled={submitting} className="w-full bg-accent text-white rounded-xl2 py-3 font-medium disabled:opacity-50">
            {submitting ? 'Checking…' : 'Verify'}
          </button>
        </form>
        <button onClick={() => setStep('form')} className="w-full text-xs text-ink/40 text-center">
          Number doesn't match Google's records? Fill a short form instead
        </button>
      </div>
    )
  }

  if (step === 'form') {
    return (
      <div className="bg-white rounded-xl2 border border-ink/10 p-5 space-y-4">
        <div>
          <p className="font-display text-lg font-600 mb-1">Verify your shop</p>
          <p className="text-sm text-ink/60">
            We couldn't auto-verify <b>{place.name}</b> against Google's records. Share a few details —
            your shop stays visible to you while we review, and goes live to customers once approved.
          </p>
        </div>
        <form onSubmit={handleFormSubmit} className="space-y-3">
          <input value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                 placeholder="Your name" required
                 className="w-full rounded-xl2 border border-ink/15 bg-paper px-4 py-3 text-base outline-none focus:border-accent" />
          <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                 placeholder="Phone number" required
                 className="w-full rounded-xl2 border border-ink/15 bg-paper px-4 py-3 text-base outline-none focus:border-accent" />
          <input value={form.gst} onChange={(e) => setForm({ ...form, gst: e.target.value })}
                 placeholder="GST number (optional)"
                 className="w-full rounded-xl2 border border-ink/15 bg-paper px-4 py-3 text-base outline-none focus:border-accent" />
          <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
                    placeholder="Anything that helps us verify this is your shop (optional)" rows={3}
                    className="w-full rounded-xl2 border border-ink/15 bg-paper px-4 py-3 text-sm outline-none focus:border-accent resize-none" />
          {error && <p className="text-xs text-closed">{error}</p>}
          <button type="submit" disabled={submitting} className="w-full bg-accent text-white rounded-xl2 py-3 font-medium disabled:opacity-50">
            {submitting ? 'Submitting…' : 'Submit for review'}
          </button>
        </form>
      </div>
    )
  }

  // step === 'search'
  return (
    <div className="bg-white rounded-xl2 border border-ink/10 p-5 text-center">
      <p className="font-display text-lg font-600 mb-1">Link your shop</p>
      <p className="text-sm text-ink/60 mb-4">
        Search for your shop exactly as it appears on Google Maps — this connects
        your account to that real listing so customers see your live status.
      </p>
      <div className="bg-paper rounded-xl2 border border-ink/10 flex items-center px-4 py-3 gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-ink/40">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input ref={inputRef} type="text" placeholder="Search your shop name"
               className="w-full outline-none text-[15px] bg-transparent placeholder:text-ink/35" />
      </div>
      <p className="text-[11px] text-ink/35 mt-3">
        Don't see it? Make sure your business is listed on Google Maps first, then try again here.
      </p>
    </div>
  )
}
