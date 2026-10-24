import React, { useState, useEffect, useRef } from "react"
import { motion, useScroll, useTransform, AnimatePresence, useInView, animate } from "framer-motion"
import { useNavigate } from "react-router-dom"
import api from "@food/api"
import {
  UtensilsCrossed,
  MapPin,
  Star,
  ShoppingBag,
  Clock,
  Zap,
  ShieldCheck,
  Ticket,
  Award,
  ArrowRight,
  Bike,
  Store,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Youtube
} from "lucide-react"
import FoodSaathiLogo, { SaathiWordmark, logoMark, BRAND_TAGLINE } from "@/shared/components/brand/FoodSaathiLogo"
import { FloatingFoods, fadeUp, stagger, spring } from "@/shared/components/brand/Motion"

const SLIDES = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1600&auto=format&fit=crop",
    title: "Food Saathi",
    subtitle: "Garam khana, waqt pe — har din, har gali"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1600&auto=format&fit=crop",
    title: "Your city's favourite kitchens",
    subtitle: "From local dhabas to cafés, all in one app"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=1600&auto=format&fit=crop",
    title: "Desi flavours, delivered",
    subtitle: "Biryani, thali, chaat and everything in between"
  }
]

const CATEGORIES = [
  { emoji: "🍕", name: "Pizza" },
  { emoji: "🍔", name: "Burger" },
  { emoji: "🍛", name: "Thali" },
  { emoji: "🍗", name: "Biryani" },
  { emoji: "🥟", name: "Momos" },
  { emoji: "🍜", name: "Chinese" },
  { emoji: "🌯", name: "Rolls" },
  { emoji: "🍩", name: "Desserts" },
  { emoji: "🥤", name: "Shakes" },
  { emoji: "🥗", name: "Healthy" },
]

const FEATURES = [
  { title: "Lightning Fast Delivery", desc: "Superfast riders bring your food fresh and on time", Icon: Zap, tint: "from-[#FFC93C] to-[#FFA51F]" },
  { title: "Live Order Tracking", desc: "Watch your Saathi ride from the kitchen to your doorstep", Icon: MapPin, tint: "from-[#FF7A3D] to-[#F2541B]" },
  { title: "No Minimum Order", desc: "Order for yourself or the whole gang, no limits", Icon: ShoppingBag, tint: "from-[#FFA51F] to-[#F2541B]" },
  { title: "Huge Discounts & Offers", desc: "Exciting coupons and deals, only on the app", Icon: Ticket, tint: "from-[#F2541B] to-[#C93C0E]" },
  { title: "Saathi GOLD", desc: "Free delivery and extra discounts on every order", Icon: Award, tint: "from-[#FFC93C] to-[#F2541B]" },
  { title: "Safety & Hygiene", desc: "Best-in-class safety standards in every kitchen", Icon: ShieldCheck, tint: "from-[#FF7A3D] to-[#FFA51F]" },
]

/** Counts up to the first number in `value` (keeps any suffix like "+" or "k") once on screen. */
function CountUp({ value }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  const text = String(value ?? "")
  const match = text.match(/[\d,]+(\.\d+)?/)
  const [display, setDisplay] = useState(match ? text.replace(match[0], "0") : text)

  useEffect(() => {
    if (!inView || !match) return
    const target = Number(match[0].replace(/,/g, ""))
    const controls = animate(0, target, {
      duration: 1.6,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(text.replace(match[0], Math.round(v).toLocaleString("en-IN"))),
    })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, text])

  return <span ref={ref}>{display}</span>
}

export default function MasterLandingPage() {
  const navigate = useNavigate()
  const { scrollYProgress } = useScroll()
  const arcRotate = useTransform(scrollYProgress, [0, 0.4], [0, 12])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [landingSettings, setLandingSettings] = useState(null)

  const activeSlides = landingSettings?.heroSlides?.length > 0 ? landingSettings.heroSlides : SLIDES;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeSlides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [activeSlides.length])

  useEffect(() => {
    api.get('/food/landing/settings/public').then(res => {
      if (res.data?.success) {
        setLandingSettings(res.data.data)
      }
    }).catch(err => console.error("Failed to load landing settings", err))
  }, [])

  const slide = activeSlides[currentSlide] || {}
  const stats = [
    { value: landingSettings?.stats?.restaurants || "500+", label: "restaurants", Icon: UtensilsCrossed },
    { value: landingSettings?.stats?.cities || "25+", label: "cities", Icon: MapPin },
    { value: landingSettings?.stats?.orders || "1,00,000+", label: "happy orders", Icon: ShoppingBag },
  ]

  return (
    <div className="min-h-screen fs-cream-bg text-[#3A1C10] overflow-x-hidden relative">
      {/* Top bar */}
      <header className="fixed inset-x-0 top-0 z-[90]" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="mx-auto mt-3 flex max-w-6xl items-center justify-between rounded-full fs-glass border border-white/60 px-3 py-2 shadow-[0_10px_30px_-18px_rgba(58,28,16,0.5)] md:px-5 w-[calc(100%-1.5rem)]">
          <FoodSaathiLogo variant="lockup" size="text-xl md:text-2xl" imgClassName="h-8 md:h-10" animated />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/admin/food/restaurant-delay-alerts")}
              className="hidden sm:inline-flex items-center gap-2 rounded-full border border-[#F1E2D0] bg-white px-4 py-2 text-sm font-semibold text-[#3A1C10] hover:border-[#F2541B]/40"
              aria-label="Open admin restaurant delay alerts"
            >
              <ShieldCheck className="h-4 w-4 text-[#F2541B]" />
              Admin Delay Alerts
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/food/restaurant-delay-alerts")}
              className="sm:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#F1E2D0] bg-white"
              aria-label="Open admin restaurant delay alerts"
            >
              <ShieldCheck className="h-5 w-5 text-[#F2541B]" />
            </button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/food/user")}
              className="inline-flex items-center gap-1.5 rounded-full fs-gradient px-4 py-2.5 text-sm font-bold text-white fs-shadow"
            >
              Order now <ArrowRight className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* 1. HERO */}
      <section className="relative min-h-[100svh] w-full overflow-hidden pt-28 pb-16 md:pt-32">
        <div className="absolute inset-0 fs-dots opacity-60" />
        <FloatingFoods className="opacity-70" />

        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-5 md:grid-cols-2">
          <motion.div variants={stagger(0.1)} initial="hidden" animate="show" className="text-center md:text-left">
            <motion.span variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-[#FFC7A3] bg-white/80 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#C93C0E]">
              <span className="h-2 w-2 rounded-full bg-[#F2541B] fs-pulse" /> Now delivering near you
            </motion.span>

            <AnimatePresence mode="wait">
              <motion.h1
                key={`t-${currentSlide}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.45 }}
                className="font-display mt-5 text-5xl font-extrabold leading-[1.02] tracking-tight md:text-7xl"
              >
                {slide.title === "Food Saathi" || !slide.title ? (
                  <>Bhookh lagi?<br /><span className="fs-text-gradient">Saathi hai na!</span></>
                ) : (
                  slide.title
                )}
              </motion.h1>
            </AnimatePresence>

            <motion.p variants={fadeUp} className="font-script mt-4 text-2xl text-[#6B4A38]">
              {slide.subtitle || BRAND_TAGLINE}
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:justify-center md:justify-start">
              <motion.button
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.96 }}
                transition={spring}
                onClick={() => navigate("/food/user")}
                className="fs-shine inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl fs-gradient px-5 py-3.5 text-[15px] font-bold text-white fs-shadow"
              >
                <UtensilsCrossed className="h-5 w-5" /> Order food
              </motion.button>
              <motion.button
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.96 }}
                transition={spring}
                onClick={() => navigate("/food/restaurant")}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl border-2 border-[#3A1C10]/10 bg-white px-4 py-3.5 text-[15px] font-bold text-[#3A1C10] hover:border-[#F2541B]/40"
              >
                <Store className="h-5 w-5 text-[#F2541B]" /> Partner with us
              </motion.button>
              <motion.button
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.96 }}
                transition={spring}
                onClick={() => navigate("/food/delivery")}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl border-2 border-[#3A1C10]/10 bg-white px-4 py-3.5 text-[15px] font-bold text-[#3A1C10] hover:border-[#FFA51F]/60"
              >
                <Bike className="h-5 w-5 text-[#FFA51F]" /> Ride with us
              </motion.button>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-8 flex items-center justify-center gap-4 md:justify-start">
              <div className="flex -space-x-3">
                {["🧑🏽", "👩🏻", "🧔🏾", "👧🏽"].map((e, i) => (
                  <span key={i} className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#FFE4D1] text-lg">{e}</span>
                ))}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1 text-[#FFA51F]">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="text-sm font-semibold text-[#6B4A38]">Loved by foodies across the city</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Hero visual: rotating food photo inside the logo arc, rider in front */}
          <div className="relative mx-auto aspect-square w-full max-w-[520px]">
            <motion.svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" style={{ rotate: arcRotate }}>
              <motion.path
                d="M40 300 A170 170 0 0 1 360 300"
                fill="none"
                stroke="#F2541B"
                strokeWidth="12"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.4, ease: "easeInOut" }}
              />
            </motion.svg>
            <div className="absolute inset-[13%] overflow-hidden rounded-full border-[10px] border-white fs-shadow">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, scale: 1.15 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9 }}
                  className="h-full w-full"
                >
                  {slide.type === 'video' ? (
                    <video src={slide.image || slide.url} autoPlay loop muted playsInline className="h-full w-full object-cover" />
                  ) : (
                    <img src={slide.image || slide.url} alt="Delicious food" className="h-full w-full object-cover" />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            <motion.img
              src={logoMark}
              alt=""
              aria-hidden="true"
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 60, damping: 14, delay: 0.3 }}
              className="absolute -bottom-2 -left-4 w-[58%] drop-shadow-xl animate-fs-ride"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
              transition={{ delay: 0.8, y: { duration: 3, repeat: Infinity, ease: "easeInOut" } }}
              className="absolute right-0 top-[18%] flex items-center gap-2 rounded-2xl bg-white px-3 py-2 fs-shadow-soft"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF4EC]"><Clock className="h-5 w-5 text-[#F2541B]" /></span>
              <div className="text-left leading-tight">
                <p className="text-[11px] font-semibold text-[#8C705B]">Delivery in</p>
                <p className="text-sm font-extrabold">25 mins</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1, y: [0, 8, 0] }}
              transition={{ delay: 1, y: { duration: 3.4, repeat: Infinity, ease: "easeInOut" } }}
              className="absolute bottom-[14%] right-[2%] flex items-center gap-2 rounded-2xl bg-white px-3 py-2 fs-shadow-soft"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF8EB]"><Star className="h-5 w-5 fill-[#FFA51F] text-[#FFA51F]" /></span>
              <div className="text-left leading-tight">
                <p className="text-[11px] font-semibold text-[#8C705B]">Top rated</p>
                <p className="text-sm font-extrabold">4.8 ★</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Slide indicators */}
        <div className="relative z-10 mt-10 flex justify-center gap-2">
          {activeSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Show slide ${index + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 ${index === currentSlide ? 'w-8 bg-[#F2541B]' : 'w-2.5 bg-[#3A1C10]/20 hover:bg-[#3A1C10]/40'}`}
            />
          ))}
        </div>
      </section>

      {/* 2. CATEGORY MARQUEE */}
      <section className="relative overflow-hidden border-y border-[#F1E2D0] bg-white py-6">
        <div className="flex w-max animate-scroll gap-4" style={{ animationDuration: "28s" }}>
          {[...CATEGORIES, ...CATEGORIES].map((c, i) => (
            <motion.button
              key={i}
              whileHover={{ y: -4, rotate: -2 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => navigate("/food/user")}
              className="flex items-center gap-2 rounded-full border border-[#F1E2D0] bg-[#FFF9F0] px-5 py-3 text-base font-bold text-[#3A1C10] hover:border-[#F2541B]/40"
            >
              <span className="text-2xl">{c.emoji}</span> {c.name}
            </motion.button>
          ))}
        </div>
      </section>

      {/* 3. STATS */}
      <section className="relative py-20">
        <div className="mx-auto max-w-5xl px-5 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="font-display text-4xl font-extrabold leading-tight md:text-6xl"
          >
            Better food for <span className="fs-text-gradient">better people</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 0.1 }}
            className="mx-auto mt-4 max-w-2xl text-lg font-medium text-[#6B4A38]"
          >
            We help you discover new tastes from the best local kitchens, delivered right to your doorstep.
          </motion.p>

          <motion.div
            variants={stagger(0.12)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mt-12 grid gap-4 sm:grid-cols-3"
          >
            {stats.map(({ value, label, Icon }) => (
              <motion.div
                key={label}
                variants={fadeUp}
                whileHover={{ y: -6 }}
                className="rounded-3xl border border-[#F1E2D0] bg-white p-6 fs-shadow-soft"
              >
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl fs-gradient-sunny text-white">
                  <Icon className="h-7 w-7" />
                </span>
                <h3 className="font-display mt-4 text-4xl font-extrabold"><CountUp value={value} /></h3>
                <p className="font-semibold text-[#8C705B]">{label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 4. FEATURES */}
      <section className="relative overflow-hidden bg-[#3A1C10] py-24 text-white">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#F2541B]/30 blur-[100px]" />
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-[#FFA51F]/25 blur-[100px]" />
        <div className="relative mx-auto max-w-6xl px-5">
          <div className="text-center">
            <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#FFC93C]">Features</span>
            <h2 className="font-display mt-4 text-4xl font-extrabold md:text-6xl">What's waiting for you on the app?</h2>
            <p className="font-script mx-auto mt-3 max-w-xl text-xl text-white/75">Khaana bhi, khushiyan bhi, sab ek tap pe</p>
          </div>
          <motion.div
            variants={stagger(0.08)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {FEATURES.map(({ title, desc, Icon, tint }) => (
              <motion.div
                key={title}
                variants={fadeUp}
                whileHover={{ y: -6, rotate: -0.5 }}
                className="group rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur hover:bg-white/10"
              >
                <span className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${tint} text-white shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6`}>
                  <Icon className="h-7 w-7" />
                </span>
                <h3 className="mt-5 text-xl font-bold">{title}</h3>
                <p className="mt-2 text-white/70">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 5. DOWNLOAD THE APP */}
      <section className="flex justify-center px-5 py-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative w-full max-w-5xl overflow-hidden rounded-[40px] fs-gradient p-8 text-white md:p-14"
        >
          <div className="absolute inset-0 fs-dots opacity-30" />
          <div className="relative flex flex-col items-center justify-between gap-10 md:flex-row">
            <div className="flex-1 text-center md:text-left">
              <h2 className="font-display text-4xl font-extrabold leading-tight md:text-5xl">Download the app now!</h2>
              <p className="mt-3 max-w-md text-lg font-medium text-white/85">
                Experience seamless online ordering only on the Food Saathi app
              </p>
              <div className="mt-8 flex justify-center gap-4 md:justify-start">
                <motion.img
                  whileHover={{ y: -3 }}
                  src="https://b.zmtcdn.com/data/webuikit/23e930757c3df49840c482a8638bf5c31556001144.png"
                  alt="Google Play"
                  className="h-12 cursor-pointer object-contain"
                  onClick={() => window.open(landingSettings?.appLinks?.playStore || 'https://play.google.com/store/apps/details?id=com.foodsaathi.user', '_blank')}
                />
                <motion.img
                  whileHover={{ y: -3 }}
                  src="https://b.zmtcdn.com/data/webuikit/9f0c85a5e33adb783fa0aef667075f9e1556003622.png"
                  alt="App Store"
                  className="h-12 cursor-pointer object-contain"
                  onClick={() => window.open(landingSettings?.appLinks?.appStore || '#', '_blank')}
                />
              </div>
            </div>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative flex w-64 flex-col items-center rounded-[36px] border-[8px] border-[#3A1C10] bg-[#FDF3E1] p-5 shadow-2xl"
            >
              <div className="absolute inset-x-0 top-0 mx-auto h-5 w-1/2 rounded-b-2xl bg-[#3A1C10]" />
              <img src={logoMark} alt="" className="mt-4 h-28 w-auto" />
              <SaathiWordmark size="text-3xl" className="mt-1" />
              <p className="font-script mt-1 text-center text-sm text-[#6B4A38]">{BRAND_TAGLINE}</p>
              <div className="mt-4 w-full rounded-2xl bg-white p-3 text-left text-[#3A1C10] fs-shadow-soft">
                <p className="text-xs font-semibold text-[#8C705B]">Your order</p>
                <p className="text-sm font-extrabold">Out for delivery 🛵</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#F1E2D0]">
                  <motion.div className="h-full rounded-full bg-[#F2541B]" animate={{ width: ["20%", "85%", "20%"] }} transition={{ duration: 4, repeat: Infinity }} />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* 6. FOOTER */}
      <footer className="bg-[#2C1A11] pb-10 pt-16 text-white">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mb-14 flex flex-col justify-between gap-12 lg:flex-row">
            <div className="lg:w-1/3">
              <div className="inline-flex items-center gap-3 rounded-3xl bg-[#FDF3E1] px-4 py-3">
                <img src={logoMark} alt="" className="h-12 w-auto" />
                <SaathiWordmark size="text-3xl" />
              </div>
              <p className="font-script mt-4 text-xl text-white/70">{BRAND_TAGLINE}</p>
            </div>

            <div className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-3">
              <div>
                <h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-[#FFC93C]">About Food Saathi</h4>
                <ul className="space-y-3 font-medium text-white/60">
                  {(landingSettings?.footerLinks?.about || [
                    { label: 'Who We Are', url: '#' },
                    { label: 'Blog', url: '#' },
                    { label: 'Work With Us', url: '#' },
                    { label: 'Investor Relations', url: '#' },
                    { label: 'Report Fraud', url: '#' }
                  ]).map((link, i) => (
                    <li key={i}><a href={link.url} className="transition-colors hover:text-white">{link.label}</a></li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-[#FFC93C]">For Restaurants</h4>
                <ul className="space-y-3 font-medium text-white/60">
                  {(landingSettings?.footerLinks?.forRestaurants || [
                    { label: 'Partner With Us', url: '/food/restaurant' },
                    { label: 'Apps For You', url: '#' }
                  ]).map((link, i) => (
                    <li key={i}><a href={link.url} className="transition-colors hover:text-white">{link.label}</a></li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-[#FFC93C]">Learn More</h4>
                <ul className="space-y-3 font-medium text-white/60">
                  {(landingSettings?.footerLinks?.learnMore || [
                    { label: 'Privacy', url: '#' },
                    { label: 'Security', url: '#' },
                    { label: 'Terms', url: '#' },
                    { label: 'Sitemap', url: '#' }
                  ]).map((link, i) => (
                    <li key={i}><a href={link.url} className="transition-colors hover:text-white">{link.label}</a></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-6 border-t border-white/10 pt-8 md:flex-row">
            <div className="flex gap-3">
              {[
                ['linkedin', Linkedin],
                ['instagram', Instagram],
                ['twitter', Twitter],
                ['youtube', Youtube],
                ['facebook', Facebook],
              ].map(([key, Icon]) =>
                (!landingSettings?.socialLinks || landingSettings.socialLinks[key]) ? (
                  <motion.div
                    key={key}
                    whileHover={{ y: -3, scale: 1.08 }}
                    onClick={() => window.open(landingSettings?.socialLinks?.[key] || '#', '_blank')}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-[#F2541B]"
                  >
                    <Icon className="h-5 w-5" />
                  </motion.div>
                ) : null
              )}
            </div>

            <div className="flex gap-4">
              <img
                src="https://b.zmtcdn.com/data/webuikit/23e930757c3df49840c482a8638bf5c31556001144.png"
                alt="Google Play"
                className="h-10 cursor-pointer opacity-70 transition-opacity hover:opacity-100"
                onClick={() => window.open(landingSettings?.appLinks?.playStore || 'https://play.google.com/store/apps/details?id=com.foodsaathi.user', '_blank')}
              />
              <img
                src="https://b.zmtcdn.com/data/webuikit/9f0c85a5e33adb783fa0aef667075f9e1556003622.png"
                alt="App Store"
                className="h-10 cursor-pointer opacity-70 transition-opacity hover:opacity-100"
                onClick={() => window.open(landingSettings?.appLinks?.appStore || '#', '_blank')}
              />
            </div>
          </div>

          <div className="mt-10 text-center text-sm font-medium leading-relaxed text-white/45 md:text-left">
            By continuing past this page, you agree to our Terms of Service, Cookie Policy, Privacy Policy and Content Policies. All trademarks are properties of their respective owners. <br />
            {landingSettings?.copyrightText || '© 2026 Food Saathi™. All rights reserved.'}
          </div>
        </div>
      </footer>
    </div>
  )
}
