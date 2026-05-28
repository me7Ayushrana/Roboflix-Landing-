"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, Lock, ArrowRight } from "lucide-react"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

// The ONE admin email allowed
const ADMIN_EMAIL = "ayushamit007@gmail.com"

// Default admin password fallback (overridden by Supabase if set)
const DEFAULT_ADMIN_PASSWORD = "sexyroboflix"

export default function LmsLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState("")

  // Initialize default users list in localStorage if it doesn't exist yet
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("roboflix_lms_users")
      const defaultList = [
        { email: "hloshishirdwivedi@gmail.com", phone: "6260087052", status: "Active", tier: "Founding Batch" },
        { email: "rkrohan0718@gmail.com", phone: "8449844821", status: "Active", tier: "Pro" },
        { email: "sid22prakash@gmail.com", phone: "9074423858", status: "Active", tier: "Pro" },
        { email: "ansh.ritesh.singh.2010@gmail.com", phone: "9049410576", status: "Active", tier: "Pro" },
        { email: "jemit57@gmail.com", phone: "437-224-3735", status: "Active", tier: "Founding Batch" },
        { email: "ishinder@gmail.com", phone: "8288898544", status: "Active", tier: "Pro" },
      ]
      if (!stored) {
        localStorage.setItem("roboflix_lms_users", JSON.stringify(defaultList))
      }
    }
  }, [])

  // Parse session concurrency or revocation errors on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const errParam = params.get("error")
      if (errParam === "session_expired") {
        setError("Your account has been logged out because it was logged in on another device. 🖥️")
      } else if (errParam === "access_denied") {
        setError("Access Denied: Your subscription has been revoked or has expired. 🔒")
      }
    }
  }, [])

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
      const trimmedEmail = email.trim().toLowerCase()
      const trimmedPassword = password.trim()

      const isAdminEmail = trimmedEmail === ADMIN_EMAIL

      const sessionId = Math.random().toString(36).substring(2) + Date.now().toString()

      if (isAdminEmail) {
        // Load admin password from Supabase if configured, else use default
        let adminPassword = DEFAULT_ADMIN_PASSWORD
        if (isSupabaseConfigured()) {
          try {
            const { data } = await supabase
              .from("roboflix_lms_settings")
              .select("value")
              .eq("key", "admin_password")
              .maybeSingle()
            if (data?.value) adminPassword = data.value as string
          } catch {}
        }

        if (trimmedPassword === adminPassword) {
          // Track admin session token to enforce single-session control
          if (isSupabaseConfigured()) {
            try {
              await supabase
                .from("roboflix_lms_settings")
                .upsert([{ key: "admin_session_id", value: sessionId, updated_at: new Date().toISOString() }], { onConflict: "key" })
            } catch (e) {
              console.error("Failed to write admin session ID:", e)
            }
          }
          localStorage.setItem("lms_user", JSON.stringify({ email: trimmedEmail }))
          localStorage.setItem("lms_session_id", sessionId)
          router.push("/lms/dashboard")
        } else {
          setError("Invalid administrator password.")
        }
      } else {
        // Look up student record dynamically
        let studentRecord: any = null

        if (isSupabaseConfigured()) {
          try {
            const { data, error } = await supabase
              .from("roboflix_lms_users")
              .select("*")
              .eq("email", trimmedEmail)
              .maybeSingle()

            if (!error && data) {
              studentRecord = {
                email: data.email,
                phone: data.phone,
                status: data.status,
                tier: data.tier
              }
            }
          } catch (e) {
            console.error("Supabase login search error:", e)
          }
        }

        // Fallback to local storage if Supabase lookup failed or wasn't configured
        if (!studentRecord) {
          const storedUsers = localStorage.getItem("roboflix_lms_users")
          if (storedUsers) {
            try {
              const usersList = JSON.parse(storedUsers) as any[]
              const localRecord = usersList.find(u => u.email.toLowerCase() === trimmedEmail)
              if (localRecord) {
                studentRecord = localRecord
              }
            } catch (e) {
              // Ignore
            }
          }
        }

        // Process Authentication State
        if (studentRecord) {
          if (studentRecord.status === "Revoked") {
            setError("Your RoboFlix LMS subscription access has been revoked. Contact admin.")
          } else if (studentRecord.phone === trimmedPassword && studentRecord.status === "Active") {
            // Track student session token to enforce single-session control
            if (isSupabaseConfigured()) {
              try {
                await supabase
                  .from("roboflix_lms_users")
                  .update({ session_id: sessionId })
                  .eq("email", trimmedEmail)
              } catch (e) {
                console.error("Failed to write student session ID:", e)
              }
            }
            localStorage.setItem("lms_user", JSON.stringify({ email: trimmedEmail }))
            localStorage.setItem("lms_session_id", sessionId)
            router.push("/lms/dashboard")
          } else {
            setError("Invalid password.")
          }
        } else {
          setError("Access Denied: No active LMS subscription profile found for this email.")
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
