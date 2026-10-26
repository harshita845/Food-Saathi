import { Link, useLocation } from "react-router-dom"
import { Tag, User, Home as HomeIcon, UtensilsCrossed, ShoppingBag } from "lucide-react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { getPublicLandingSettings } from "@food/api"
import { useAppLocation } from "@food/hooks/useAppLocation"

export default function BottomNavigation() {
  const location = useLocation()
  const pathname = location.pathname
  const { zoneId } = useAppLocation()
  const [under250PriceLimit, setUnder250PriceLimit] = useState(250)
  const [showDining, setShowDining] = useState(true)

  // Fetch landing settings to get dynamic price limit and features
  useEffect(() => {
    let cancelled = false
    getPublicLandingSettings(zoneId || null)
      .then((settings) => {
        if (cancelled || !settings) return
        if (typeof settings.under250PriceLimit === 'number') {
          setUnder250PriceLimit(settings.under250PriceLimit)
        }
        if (typeof settings.showDining === 'boolean') {
          setShowDining(settings.showDining)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUnder250PriceLimit(250)
          setShowDining(true)
        }
      })
    return () => { cancelled = true }
  }, [zoneId])

  // Check active routes - support both /user/* and /* paths
  const isDining = pathname === "/food/dining" || pathname.startsWith("/food/user/dining")
  const isUnder250 = pathname === "/food/under-250" || pathname.startsWith("/food/user/under-250")
  const isOrders = pathname === "/food/orders" || pathname.startsWith("/food/user/orders")
  const isProfile = pathname === "/food/profile" || pathname.startsWith("/food/user/profile")
  const isHome =
    !isDining &&
    !isUnder250 &&
    !isOrders &&
    !isProfile &&
    (pathname === "/food" ||
      pathname === "/food/" ||
      pathname === "/food/user" ||
      (pathname.startsWith("/food/user") &&
        !pathname.includes("/dining") &&
        !pathname.includes("/under-250") &&
        !pathname.includes("/profile")))

  const tabs = [
    { to: "/food/user/", label: "Home", Icon: HomeIcon, active: isHome },
    { to: "/food/user/under-250", label: `Under ₹${under250PriceLimit}`, Icon: Tag, active: isUnder250 },
    { to: "/food/user/orders", label: "Orders", Icon: ShoppingBag, active: isOrders },
    { to: "/food/user/profile", label: "Profile", Icon: User, active: isProfile },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 w-full z-50 px-3 pb-[max(env(safe-area-inset-bottom,0px),10px)] pl-[max(env(safe-area-inset-left,0px),12px)] pr-[max(env(safe-area-inset-right,0px),12px)] box-border pointer-events-none">
      <nav className="pointer-events-auto relative flex items-center justify-between rounded-[28px] border border-white/70 bg-white/90 px-1.5 py-1.5 shadow-[0_14px_40px_-14px_rgba(58,28,16,0.45)] backdrop-blur-xl dark:border-[#3E2A1F] dark:bg-[#26170E]/95">
        {tabs.map(({ to, label, Icon, active }) => (
          <Link
            key={to}
            to={to}
            state={to.includes('/under-250') ? { resetCategory: true, category: 'all' } : undefined}
            className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2"
          >
            {active && (
              <motion.span
                layoutId="fs-bottom-nav-pill"
                className="absolute inset-0 rounded-[22px] fs-gradient shadow-[0_8px_20px_-8px_rgba(242,84,27,0.7)]"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <motion.span
              className="relative z-10"
              animate={active ? { y: [0, -3, 0], scale: [1, 1.15, 1] } : { y: 0, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Icon className={`h-5 w-5 ${active ? "text-white" : "text-[#8C705B] dark:text-gray-400"}`} strokeWidth={active ? 2.5 : 2} />
            </motion.span>
            <span className={`relative z-10 text-[10px] sm:text-xs ${active ? "font-bold text-white" : "font-semibold text-[#8C705B] dark:text-gray-400"}`}>
              {label}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
