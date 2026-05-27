"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, Lock, ArrowRight } from "lucide-react"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

// Valid credentials - email: phone number
const VALID_CREDENTIALS: Record<string, string> = {
  "hloshishirdwivedi@gmail.com": "6260087052",
  "rkrohan0718@gmail.com": "8449844821",
  "sid22prakash@gmail.com": "9074423858",
  "ansh.ritesh.singh.2010@gmail.com": "9049410576",
  "jemit57@gmail.com": "437-224-3735",
  "ishinder@gmail.com": "8288898544",
}

export default function LmsLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState("")

  // Countdown timer to June 15, 2026
  useEffect(() => {
    const calculateTimeLeft = () => {
      const targetDate = new Date("2026-06-15").getTime()
      const now = new Date().getTime()
      const difference = targetDate - now

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
        const minutes = Math.floor((difference / 1000 / 60) % 60)
        const seconds = Math.floor((difference / 1000) % 60)

        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`)
      } else {
        setTimeLeft("Season 1 is LIVE!")
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (isSupabaseConfigured()) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        })

        if (authError) {
          setError(authError.message)
        } else if (data.user) {
          localStorage.setItem("lms_user", JSON.stringify({ email: data.user.email }))
          router.push("/lms/dashboard")
        }
      } else {
        // Fallback to static mock credentials list if Supabase env is not configured
        const trimmedEmail = email.trim()
        const trimmedPassword = password.trim()

        // Search dynamic LMS users first
        let usersList: any[] = []
        const storedUsers = localStorage.getItem("roboflix_lms_users")
        if (storedUsers) {
          try {
            usersList = JSON.parse(storedUsers)
          } catch (e) {
            usersList = []
          }
        }

        const matchedUser = usersList.find(
          u => u.email.toLowerCase() === trimmedEmail.toLowerCase() && u.phone === trimmedPassword
        )

        if (matchedUser) {
          if (matchedUser.status === "Active") {
            localStorage.setItem("lms_user", JSON.stringify({ email: trimmedEmail }))
            router.push("/lms/dashboard")
          } else {
            setError("Your RoboFlix LMS subscription access has been revoked. Contact admin.")
          }
        } else if (VALID_CREDENTIALS[trimmedEmail] === trimmedPassword) {
          localStorage.setItem("lms_user", JSON.stringify({ email: trimmedEmail }))
          router.push("/lms/dashboard")
        } else {
          setError("Invalid email or password. (Local Fallback Mode)")
        }
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during login.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">

      {/* Header */}
      <div className="relative z-10 p-6 sm:p-8">
        <Link href="/">
          <div className="flex items-center gap-2 w-fit hover:opacity-80 transition">
            <span className="text-xl sm:text-2xl font-bold">
              ROBO<span className="text-red-600">FLIX</span>
            </span>
          </div>
        </Link>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-center px-4 sm:px-6 gap-8 md:gap-12 pb-8">
        {/* Left side - Welcome Message (mobile first) */}
        <div className="w-full md:w-1/2 order-2 md:order-1">
          <div className="max-w-md mx-auto">
            <h1 className="font-display text-5xl md:text-7xl font-bold text-white mb-6 text-balance">
              Welcome Back to <span className="text-red-600">RoboFlix</span>
            </h1>
            <p className="text-gray-300 mb-8 text-base leading-relaxed">
              Your gateway to mastering robotics. Login with your credentials to access all 5 seasons and continue your building journey.
            </p>

            {/* Countdown Timer */}
            <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-5 mb-8">
              <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold mb-2">Season 1 Launch</p>
              <p className="text-2xl md:text-3xl font-bold text-white font-mono">{timeLeft || "Loading..."}</p>
              <p className="text-red-400 text-sm mt-3 font-semibold">Coming Soon</p>
            </div>

            <p className="text-gray-400 text-sm">
              <span className="text-red-600 font-semibold">Pro tip:</span> Use your registered email and your registered phone number as your password.
            </p>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full md:w-1/2 order-1 md:order-2">
          <div className="max-w-md mx-auto">
            <div className="bg-black/80 border border-red-600/30 rounded-2xl p-8 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-white mb-2">Login</h2>
              <p className="text-gray-400 text-sm mb-8">Access your learning dashboard</p>

              <form onSubmit={handleLogin} className="space-y-5">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-600/20 border border-red-600/50 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 cursor-disabled flex items-center justify-center gap-2 group"
                >
                  {loading ? "Logging in..." : "Login"}
                  {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </button>

                {/* Benefits */}
                <div className="pt-4 border-t border-gray-700 space-y-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">What you get:</p>
                  <p className="flex items-start gap-3 text-sm text-gray-400">
                    <span className="text-red-600 mt-1">✓</span>
                    <span>Access all 54+ episodes</span>
                  </p>
                  <p className="flex items-start gap-3 text-sm text-gray-400">
                    <span className="text-red-600 mt-1">✓</span>
                    <span>Source code & CAD files</span>
                  </p>
                  <p className="flex items-start gap-3 text-sm text-gray-400">
                    <span className="text-red-600 mt-1">✓</span>
                    <span>Live community access</span>
                  </p>
                  <p className="flex items-start gap-3 text-sm text-gray-400">
                    <span className="text-red-600 mt-1">✓</span>
                    <span>Career mentorship</span>
                  </p>
                </div>
              </form>
            </div>

            {/* Back to Home */}
            <p className="text-center text-gray-400 text-sm mt-6">
              Not a member?{" "}
              <Link href="/" className="text-red-600 hover:text-red-500 font-semibold">
                Go back to website
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
