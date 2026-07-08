import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './AppContext.jsx'
import Login from './screens/Login.jsx'
import MapHome from './screens/MapHome.jsx'
import ShopDetails from './screens/ShopDetails.jsx'
import Profile from './screens/Profile.jsx'

function Gate({ children }) {
  const { session, authLoading } = useApp()
  if (authLoading) {
    return <div className="h-full flex items-center justify-center text-ink/40 text-sm">Loading…</div>
  }
  if (!session) return <Navigate to="/login" replace />
  return children
}

function Shell() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Gate><MapHome /></Gate>} />
      <Route path="/shop/:placeId" element={<Gate><ShopDetails /></Gate>} />
      <Route path="/profile" element={<Gate><Profile /></Gate>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AppProvider>
      <div className="max-w-md mx-auto h-screen bg-paper text-ink font-body relative overflow-hidden">
        <Shell />
      </div>
    </AppProvider>
  )
}
