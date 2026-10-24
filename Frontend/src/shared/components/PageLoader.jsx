import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import ScooterLoader from './brand/ScooterLoader'

/**
 * Lightweight route-change loader (CSS only).
 * Avoids framer-motion AnimatePresence — it can throw removeChild errors
 * inside device simulators / StrictMode when the overlay unmounts quickly.
 */
export default function PageLoader() {
  const [isNavigating, setIsNavigating] = useState(false)
  const location = useLocation()

  useEffect(() => {
    if (
      location.pathname.includes('/under-250') ||
      location.pathname.includes('/restaurants/') ||
      location.pathname.includes('/terms') ||
      location.pathname.includes('/privacy') ||
      location.pathname.includes('/support')
    ) {
      setIsNavigating(false)
      return undefined
    }

    setIsNavigating(true)
    const timer = setTimeout(() => setIsNavigating(false), 500)
    return () => clearTimeout(timer)
  }, [location.pathname])

  if (!isNavigating) return null

  return (
    <div
      className="fixed inset-0 z-[999999] bg-[#FFF9F0]/50 dark:bg-black/40 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-200"
      aria-label="Loading page"
    >
      <div className="rounded-3xl border border-[#F1E2D0] bg-white/90 px-6 py-4 fs-shadow dark:border-gray-800 dark:bg-[#2A1A11]">
        <ScooterLoader size={64} />
      </div>
    </div>
  )
}
