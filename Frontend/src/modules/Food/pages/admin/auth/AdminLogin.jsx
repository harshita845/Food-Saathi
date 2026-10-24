import { useState, useEffect, useRef } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { adminAPI } from "@food/api"
import { setAuthData } from "@food/utils/auth"
import { ShieldCheck, UserCog, Star, Heart, ArrowRight, Loader2, Mail, Lock, Eye, EyeOff, ShieldQuestion } from "lucide-react"
import { Button } from "@food/components/ui/button"
import logoNew from "@/assets/logo.png"
import { SaathiWordmark, logoMark } from "@/shared/components/brand/FoodSaathiLogo"
import { toast } from "sonner"

export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const submitting = useRef(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error("Please fill in all fields")
      return
    }
    if (submitting.current) return
    submitting.current = true
    setLoading(true)

    try {
      const response = await adminAPI.login(email.trim(), password)
      const data = response?.data?.data || response?.data || {}

      const accessToken = data.accessToken
      const adminUser = data.user || data.admin
      const refreshToken = data.refreshToken ?? null

      if (!accessToken || !adminUser || !refreshToken) {
        throw new Error("Invalid response from server")
      }

      setAuthData("admin", accessToken, adminUser, refreshToken)
      toast.success("Welcome, Administrator")
      navigate("/admin/food", { replace: true })
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Login failed. Check your credentials."
      toast.error(msg)
    } finally {
      setLoading(false)
      submitting.current = false
    }
  }

  return (
    <div className="min-h-screen fs-cream-bg dark:bg-[#1A0F09] flex flex-col relative overflow-hidden font-['Poppins']">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent pointer-events-none" />
      <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Content */}
      <div className="absolute top-6 right-6 z-20">
        <Link to="/user/auth/support">
          <Button variant="ghost" className="text-gray-500 hover:text-primary font-semibold flex items-center gap-2">
            <ShieldQuestion className="w-5 h-5" />
            Support
          </Button>
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-[440px]"
        >
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <motion.img
              src={logoMark}
              alt="Food Saathi"
              initial={{ x: -220, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 70, damping: 13 }}
              className="mx-auto h-32 md:h-36 w-auto object-contain animate-fs-ride"
            />
            <div className="mt-1 flex justify-center"><SaathiWordmark size="text-4xl" /></div>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#3A1C10] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[#FFC93C]"
            >
              <ShieldCheck className="h-3 w-3" /> Admin Panel
            </motion.p>
          </div>

          {/* Login Card */}
          <div className="bg-white/80 dark:bg-[#2A1A11]/80 backdrop-blur-2xl rounded-[3rem] p-8 sm:p-12 shadow-[0_40px_80px_-30px_rgba(201,60,14,0.35)] dark:shadow-none border border-white/20 dark:border-gray-800 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

            <div className="mb-10 text-center sm:text-left">
              <h2 className="font-display text-3xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
                Admin Entry
              </h2>
              <div className="h-1 w-10 bg-primary rounded-full mb-3 hidden sm:block" />
              <p className="text-base text-gray-500 dark:text-gray-400 font-medium">
                Authorized access only. Please sign in to continue.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-12 pr-6 py-4 bg-[#FFF9F0] dark:bg-gray-900/50 text-gray-900 dark:text-white border-2 border-[#F1E2D0] focus:border-primary/50 rounded-2xl outline-none transition-all placeholder:text-gray-300 font-bold"
                      placeholder="admin@foodsaathi.in"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Password</label>
                    <Link to="/admin/forgot-password" size="sm" className="text-[10px] font-bold text-gray-400 hover:text-primary uppercase tracking-wider transition-colors">Forgot?</Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-12 pr-12 py-4 bg-[#FFF9F0] dark:bg-gray-900/50 text-gray-900 dark:text-white border-2 border-[#F1E2D0] focus:border-primary/50 rounded-2xl outline-none transition-all placeholder:text-gray-300 font-bold"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="fs-shine w-full py-4.5 fs-gradient hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group overflow-hidden relative"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <span>Enter Dashboard</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
                <motion.div
                  className="absolute inset-0 bg-white/20 translate-x-[-100%]"
                  whileHover={{ translateX: "100%" }}
                  transition={{ duration: 0.6 }}
                />
              </button>
            </form>
          </div>

          <div className="mt-12 flex justify-center items-center gap-6 opacity-30 grayscale hover:opacity-60 transition-opacity">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Secure Access</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Heart className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Admin Control</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}


