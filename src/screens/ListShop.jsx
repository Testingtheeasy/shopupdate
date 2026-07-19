import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../AppContext.jsx'
import ClaimShopSearch from '../components/ClaimShopSearch.jsx'

export default function ListShop() {
  const { session } = useApp()
  const navigate = useNavigate()

  // Once claiming succeeds, AppContext flips session.role to 'owner' —
  // as soon as that happens, jump straight to their new Shop Update screen.
  useEffect(() => {
    if (session?.role === 'owner') navigate('/profile', { replace: true })
  }, [session?.role, navigate])

  return (
    <div className="h-full flex flex-col px-6 pt-6 pb-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-ink/60 mb-4 self-start">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="#14231D99" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        Back
      </button>
      <div className="mb-2">
        <h1 className="font-display text-2xl font-600 mb-1">List your business</h1>
        <p className="text-sm text-ink/60">
          Phone-matched shops go live instantly. Everything else is reviewed within 24 hours.
        </p>
      </div>
      <div className="mt-4">
        <ClaimShopSearch />
      </div>
    </div>
  )
}
