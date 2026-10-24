import React, { useState, useEffect } from 'react'
import AppRoutes from './routes'
import SplashScreen from '@/shared/components/SplashScreen.jsx'
import PageLoader from '@/shared/components/PageLoader.jsx'

import { ThemeProvider } from '@food/context/ThemeContext'
import { cleanupExpiredScopedEntries, readScopedValue, writeScopedValue } from '@food/utils/appStorage'
import ScooterLoader from '@/shared/components/brand/ScooterLoader.jsx'

function App() {
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase()
      if (
        path.includes('/terms') ||
        path.includes('/privacy') ||
        path.includes('/support') ||
        path.includes('/restaurant') ||
        path.includes('/delivery') ||
        path.includes('/admin')
      ) {
        return false
      }
      if (readScopedValue('ui', 'splashShown', { storage: 'session', fallback: false })) {
        return false
      }
    }
    return true
  })

  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    cleanupExpiredScopedEntries({ storage: 'local' })
    cleanupExpiredScopedEntries({ storage: 'session' })
  }, [])

  const handleSplashFinish = () => {
    if (typeof window !== 'undefined') {
      writeScopedValue('ui', 'splashShown', true, { storage: 'session' })
    }
    setShowSplash(false)
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center fs-cream-bg dark:bg-[#1A0F09]">
        <ScooterLoader size={110} label="Aapka khana aa raha hai..." />
      </div>
    )
  }

  return (
    <ThemeProvider>
      <>
        {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
        <PageLoader />
        <AppRoutes />
      </>
    </ThemeProvider>
  )
}

export default App
