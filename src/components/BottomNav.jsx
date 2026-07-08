import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function BottomNav({ ownerMode }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const tabs = [
    { path: '/', label: 'Map', icon: MapIcon },
    { path: '/profile', label: ownerMode ? 'Shop Update' : 'Profile', icon: ProfileIcon },
  ]

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-ink/10 flex z-20">
      {tabs.map((tab) => {
        const active = pathname === tab.path
        const Icon = tab.icon
        return (
          <button key={tab.path} onClick={() => navigate(tab.path)} className="flex-1 flex flex-col items-center gap-1 py-3">
            <Icon active={active} />
            <span className={`text-xs ${active ? 'text-accent font-medium' : 'text-ink/40'}`}>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function MapIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z" stroke={active ? '#2C6E63' : '#9A9488'} strokeWidth="1.8" strokeLinejoin="round" />
      <line x1="9" y1="3" x2="9" y2="18" stroke={active ? '#2C6E63' : '#9A9488'} strokeWidth="1.8" />
      <line x1="15" y1="6" x2="15" y2="21" stroke={active ? '#2C6E63' : '#9A9488'} strokeWidth="1.8" />
    </svg>
  )
}

function ProfileIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={active ? '#2C6E63' : '#9A9488'} strokeWidth="1.8" />
      <path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" stroke={active ? '#2C6E63' : '#9A9488'} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
