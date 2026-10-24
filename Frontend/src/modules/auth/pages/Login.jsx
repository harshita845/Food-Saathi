import React, { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Link, useNavigate } from "react-router-dom"
import {
  Smartphone,
  ArrowRight,
  Loader2,
  Headphones,
  ChevronDown,
  RotateCcw,
  Edit2,
  CheckCircle2
} from "lucide-react"
import { toast } from "sonner"
import { authAPI, userAPI } from "@food/api"
import { setAuthData } from "@food/utils/auth"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@food/components/ui/dialog"
import { Button } from "@food/components/ui/button"
import { Input } from "@food/components/ui/input"
import { Label } from "@food/components/ui/label"
import { SaathiWordmark, logoMark, BRAND_TAGLINE } from "@/shared/components/brand/FoodSaathiLogo"
import { FloatingFoods } from "@/shared/components/brand/Motion"


export default function UnifiedOTPFastLogin() {
  const RESEND_COOLDOWN_SECONDS = 60
  const [phoneNumber, setPhoneNumber] = useState(() => sessionStorage.getItem("draft_phone_login") || "")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [showNameModal, setShowNameModal] = useState(false)
  const [newName, setNewName] = useState("")
  const [isUpdatingName, setIsUpdatingName] = useState(false)
  const [tempAuth, setTempAuth] = useState(null)
  const [pendingVerify, setPendingVerify] = useState(null)
  const navigate = useNavigate()
  const submitting = useRef(false)

  const normalizedPhone = () => {
    const digits = String(phoneNumber).replace(/\D/g, "").slice(-15)
    return digits.length >= 8 ? digits : ""
  }

  const handleSendOTP = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    const phone = normalizedPhone()
    if (phone.length < 10) {
      toast.error("Please enter a valid 10-digit phone number")
      return
    }
    if (submitting.current) return
    submitting.current = true
    setLoading(true)
    try {
      await authAPI.sendOTP(phoneNumber, "login", null)
      setOtp("")
      setStep(2)
      setResendTimer(RESEND_COOLDOWN_SECONDS)
      toast.success("OTP sent successfully!")
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to send OTP."
      toast.error(msg)
    } finally {
      setLoading(false)
      submitting.current = false
    }
  }

  const handleResendOTP = async () => {
    const phone = normalizedPhone()
    if (phone.length < 10) {
      toast.error("Please enter a valid phone number")
      return
    }
    if (resendTimer > 0 || submitting.current) return
    submitting.current = true
    setLoading(true)
    try {
      await authAPI.sendOTP(phoneNumber, "login", null)
      setOtp("")
      setResendTimer(RESEND_COOLDOWN_SECONDS)
      toast.success("OTP resent successfully.")
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to resend OTP."
      toast.error(msg)
    } finally {
      setLoading(false)
      submitting.current = false
    }
  }

  const handleEditNumber = () => {
    setStep(1)
    setOtp("")
    setResendTimer(0)
    setPendingVerify(null)
    setShowNameModal(false)
    setNewName("")
  }

  const handleVerifyOTP = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    const otpDigits = String(otp).replace(/\D/g, "").slice(0, 6)
    if (otpDigits.length !== 6) {
      toast.error("Please enter the 6-digit OTP")
      return
    }
    if (submitting.current) return
    submitting.current = true
    setLoading(true)
    let fcmToken = null
    let platform = "web"
    try {
      try {
        if (typeof window !== "undefined") {
          if (window.flutter_inappwebview) {
            platform = "mobile"
            const handlerNames = ["getFcmToken", "getFCMToken", "getPushToken", "getFirebaseToken"]
            for (const handlerName of handlerNames) {
              try {
                const t = await window.flutter_inappwebview.callHandler(handlerName, { module: "user" })
                if (t && typeof t === "string" && t.length > 20) {
                  fcmToken = t.trim()
                  break
                }
              } catch (e) {}
            }
          } else {
            fcmToken = localStorage.getItem("fcm_web_registered_token_user") || null
          }
        }
      } catch (e) {
        console.warn("Failed to get FCM token during login", e)
      }

      const response = await authAPI.verifyOTP(phoneNumber, otpDigits, "login", null, null, "user", null, null, fcmToken, platform)
      const data = response?.data?.data || response?.data || {}
      const needsName = data.needsName === true || data.isNewUser === true || (data.user && (!data.user.name || String(data.user.name).trim().length === 0 || String(data.user.name).toLowerCase() === "null"))

      if (needsName) {
        setPendingVerify({ phone: phoneNumber, otp: otpDigits, fcmToken, platform })
        setShowNameModal(true)
        return
      }

      const accessToken = data.accessToken
      const refreshToken = data.refreshToken || null
      const user = data.user

      if (!accessToken || !user) {
        throw new Error("Invalid response from server")
      }

      setAuthData("user", accessToken, user, refreshToken)
      toast.success("Welcome back!")
      navigate("/food/user", { replace: true })
    } catch (err) {
      const status = err?.response?.status
      let msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Invalid OTP. Please try again."
      const nameRequired = /name\s+is\s+required.*first[- ]?time|first[- ]?time.*name\s+is\s+required|first[- ]?time\s*sign\s*up/i.test(String(msg))
      if (nameRequired) {
        setPendingVerify({ phone: phoneNumber, otp: otpDigits, fcmToken, platform })
        setShowNameModal(true)
        return
      }
      if (status === 401) {
        if (/deactivat(ed|e)/i.test(String(msg))) {
          msg = "Your account is deactivated. Please contact support."
        } else {
          msg = "Invalid or expired code, or account not active."
        }
      }
      toast.error(msg)
    } finally {
      setLoading(false)
      submitting.current = false
    }
  }

  const handleNameSubmit = async (e) => {
    e.preventDefault()
    if (!newName.trim()) {
      toast.error("Please enter your name")
      return
    }

    try {
      setIsUpdatingName(true)
      if (pendingVerify) {
        const response = await authAPI.verifyOTP(
          pendingVerify.phone,
          pendingVerify.otp,
          "login",
          newName.trim(),
          null,
          "user",
          null,
          null,
          pendingVerify.fcmToken,
          pendingVerify.platform,
        )
        const data = response?.data?.data || response?.data || {}
        const accessToken = data.accessToken
        const refreshToken = data.refreshToken || null
        const user = data.user

        setAuthData("user", accessToken, user, refreshToken)
        setPendingVerify(null)
        toast.success(`Welcome, ${newName.trim()}!`)
        setShowNameModal(false)
        navigate("/food/user", { replace: true })
        return
      }

      await userAPI.updateProfile({ name: newName.trim() })
      const updatedUser = { ...tempAuth.user, name: newName.trim() }
      setAuthData("user", tempAuth.accessToken, updatedUser, tempAuth.refreshToken)

      toast.success(`Welcome, ${newName.trim()}!`)
      setShowNameModal(false)
      navigate("/food/user", { replace: true })
    } catch (err) {
      toast.error("Failed to update name. You can skip this for now or try again.")
      console.error(err)
    } finally {
      setIsUpdatingName(false)
    }
  }

  useEffect(() => {
    if (step !== 2 || resendTimer <= 0) return
    const intervalId = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(intervalId)
  }, [step, resendTimer])

  return (
    <div className="min-h-screen fs-cream-bg flex justify-center items-center relative overflow-x-hidden font-sans">
      {/* Mobile card on desktop / full screen on mobile */}
      <div className="w-full max-w-[430px] min-h-screen sm:min-h-[880px] bg-[#FDF3E1] sm:rounded-[40px] sm:my-6 sm:shadow-[0_30px_80px_-30px_rgba(58,28,16,0.35)] relative flex flex-col overflow-hidden">
        <div className="absolute inset-0 fs-dots opacity-50 pointer-events-none" />
        <FloatingFoods items={["🍕", "🍔", "🍛", "🍩"]} className="opacity-60" />

        {/* Top bar: SUPPORT */}
        <div className="w-full px-5 pt-5 pb-2 flex items-center justify-between relative z-20">
          <SaathiWordmark size="text-xl" />
          <Link
            to="/user/auth/support"
            className="bg-white px-4 py-1.5 rounded-full shadow-[0_2px_10px_rgba(58,28,16,0.08)] border border-[#F1E2D0] flex items-center gap-2 hover:shadow-md transition-all active:scale-95"
          >
            <Headphones className="w-4 h-4 text-[#F2541B] stroke-[2.5]" />
            <span className="text-[#3A1C10] font-extrabold text-[12px] tracking-wider uppercase">Support</span>
          </Link>
        </div>

        {/* Hero: logo arc + rider */}
        <div className="relative z-10 flex flex-col items-center pt-2">
          <motion.img
            src={logoMark}
            alt="Food Saathi"
            draggable={false}
            initial={{ x: -260, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 70, damping: 13 }}
            className="relative mt-2 h-44 w-auto select-none animate-fs-ride"
          />
        </div>

        {/* Main content */}
        <div className="w-full px-6 flex-1 flex flex-col items-center relative z-20 pt-3 pb-6">
          <motion.div
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="text-center w-full mb-6"
          >
            {step === 1 ? (
              <>
                <h1 className="font-display text-[36px] font-extrabold leading-[1.05] tracking-tight text-[#3A1C10]">
                  Bhookh lagi?
                </h1>
                <div className="font-display text-[36px] font-extrabold leading-[1.05] tracking-tight text-[#F2541B] flex items-center justify-center gap-2">
                  <span>Saathi hai na!</span>
                  <motion.span
                    animate={{ rotate: [0, 14, -8, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.2 }}
                    className="inline-block text-[30px] select-none"
                  >
                    🍕
                  </motion.span>
                </div>
                <p className="font-script text-[#6B4A38] text-[18px] mt-2">
                  Login with your mobile number
                </p>
              </>
            ) : (
              <>
                <h1 className="font-display text-[32px] font-extrabold tracking-tight text-[#3A1C10]">
                  Verify OTP
                </h1>
                <div className="flex items-center justify-center gap-2 mt-1.5 text-[#8C705B] font-medium text-[15px]">
                  <span>Code sent to <strong className="text-[#3A1C10]">+91 {phoneNumber}</strong></span>
                  <button
                    onClick={handleEditNumber}
                    className="p-1 hover:bg-[#FFE4D1] rounded-full text-[#F2541B] transition-colors"
                    title="Change phone number"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}
          </motion.div>

          <div className="w-full max-w-[360px]">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.form
                  key="step-1"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  onSubmit={handleSendOTP}
                  className="w-full flex flex-col items-center"
                >
                  <div className="w-full h-[60px] bg-white rounded-2xl shadow-[0_6px_24px_-10px_rgba(58,28,16,0.25)] border-2 border-transparent px-4 flex items-center transition-all focus-within:border-[#F2541B]/50 focus-within:shadow-[0_10px_30px_-10px_rgba(242,84,27,0.45)]">
                    <div className="flex items-center gap-1 cursor-pointer select-none">
                      <span className="text-lg">🇮🇳</span>
                      <ChevronDown className="w-4 h-4 text-[#8C705B] stroke-[2.2]" />
                    </div>
                    <div className="h-6 w-[1px] bg-[#F1E2D0] mx-3 shrink-0" />
                    <Smartphone className="w-5 h-5 text-[#B9A08A] mr-2.5 shrink-0 stroke-[1.8]" />
                    <div className="flex items-center flex-1 min-w-0">
                      <span className="font-bold text-[#3A1C10] text-[16px] mr-1.5 shrink-0">+91</span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        required
                        autoFocus
                        value={phoneNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 10)
                          setPhoneNumber(val)
                          sessionStorage.setItem("draft_phone_login", val)
                        }}
                        maxLength={10}
                        placeholder="Enter mobile number"
                        className="w-full bg-transparent border-none outline-none !shadow-none text-[#3A1C10] font-semibold text-[16px] tracking-wider placeholder:text-[#B9A08A] placeholder:font-normal placeholder:tracking-normal p-0"
                      />
                    </div>
                    {phoneNumber.length === 10 && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </motion.span>
                    )}
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileTap={{ scale: 0.97 }}
                    className="fs-shine w-full h-[58px] rounded-2xl fs-gradient text-white font-bold text-[17px] fs-shadow hover:brightness-105 transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-70"
                  >
                    {loading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                    ) : (
                      <>
                        <span>Send OTP</span>
                        <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                      </>
                    )}
                  </motion.button>

                  <p className="text-[12px] sm:text-[13px] text-[#8C705B] text-center mt-4">
                    By continuing, you agree to our{" "}
                    <Link
                      to="/profile/terms"
                      className="text-[#3A1C10] font-bold underline decoration-[#F2541B]/50 underline-offset-2 hover:text-[#F2541B] transition-colors"
                    >
                      Terms & Privacy Policy
                    </Link>
                  </p>
                </motion.form>
              ) : (
                <motion.form
                  key="step-2"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  onSubmit={handleVerifyOTP}
                  className="w-full flex flex-col items-center"
                >
                  <div className="flex justify-between gap-2.5 w-full mb-4">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <motion.input
                        key={index}
                        id={`otp-${index}`}
                        type="tel"
                        inputMode="numeric"
                        maxLength={1}
                        required
                        autoFocus={index === 0}
                        value={otp[index] || ""}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0, scale: otp[index] ? [1, 1.12, 1] : 1 }}
                        transition={{ delay: index * 0.04 }}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(-1)
                          const newOtp = otp.split("")
                          newOtp[index] = val || ""
                          const combined = newOtp.join("").slice(0, 6)
                          setOtp(combined)
                          if (index < 5 && val) {
                            document.getElementById(`otp-${index + 1}`)?.focus()
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace") {
                            if (!otp[index] && index > 0) {
                              document.getElementById(`otp-${index - 1}`)?.focus()
                            } else {
                              const newOtp = otp.split("")
                              newOtp[index] = ""
                              setOtp(newOtp.join(""))
                            }
                          }
                        }}
                        className={`w-12 h-14 text-center text-2xl font-bold bg-white border-2 rounded-2xl shadow-[0_4px_14px_-6px_rgba(58,28,16,0.2)] text-[#3A1C10] outline-none transition-colors ${otp[index] ? "border-[#F2541B]" : "border-[#F1E2D0]"}`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between w-full text-xs text-[#8C705B] font-medium px-1 mb-2">
                    {resendTimer > 0 ? (
                      <span>Resend code in <strong className="text-[#3A1C10]">{resendTimer}s</strong></span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={loading}
                        className="text-[#F2541B] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" /> Resend OTP
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleEditNumber}
                      className="text-[#6B4A38] hover:text-[#3A1C10] font-medium cursor-pointer"
                    >
                      Change Number
                    </button>
                  </div>

                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.97 }}
                    disabled={loading || otp.replace(/\D/g, "").length !== 6}
                    className="fs-shine w-full h-[58px] rounded-2xl fs-gradient text-white font-bold text-[17px] fs-shadow hover:brightness-105 transition-all flex items-center justify-center gap-2 mt-3 cursor-pointer disabled:opacity-60"
                  >
                    {loading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                    ) : (
                      <>
                        <span>Verify & Login</span>
                        <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
                      </>
                    )}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Tagline footer */}
        <div className="relative z-10 pb-8 text-center">
          <p className="font-script text-lg text-[#3A1C10]">{BRAND_TAGLINE}</p>
          <span className="mx-auto mt-1 block h-[3px] w-28 rounded-full bg-[#F2541B]" />
        </div>

        {/* New user name modal */}
        <Dialog open={showNameModal} onOpenChange={setShowNameModal}>
          <DialogContent className="sm:max-w-md bg-[#FFF9F0] rounded-3xl p-6 shadow-2xl border-0">
            <img src={logoMark} alt="" className="mx-auto h-20 w-auto animate-fs-ride" />
            <DialogTitle className="font-display text-2xl font-extrabold text-[#3A1C10] text-center">
              Welcome to Food Saathi! 🎉
            </DialogTitle>
            <DialogDescription className="text-center text-[#6B4A38] text-sm mt-1">
              What should we call you? Please enter your name to complete your profile.
            </DialogDescription>
            <form onSubmit={handleNameSubmit} className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label htmlFor="user-name" className="text-xs font-bold text-[#6B4A38] uppercase tracking-wider">
                  Full Name
                </Label>
                <Input
                  id="user-name"
                  placeholder="e.g. Rahul Sharma"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-12 rounded-xl bg-white border-[#F1E2D0] text-[#3A1C10] font-semibold"
                  autoFocus
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isUpdatingName || !newName.trim()}
                className="w-full h-12 rounded-xl fs-gradient text-white font-bold text-base fs-shadow hover:brightness-105"
              >
                {isUpdatingName ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Continue to Food Saathi"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
