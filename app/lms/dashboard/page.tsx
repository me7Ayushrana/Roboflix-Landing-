"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { LogOut, Clock, Lock } from "lucide-react"
import { SEASONS_DATA } from "@/lib/lms-data"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

interface User {
  email: string
}

export default function LmsDashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState("")
  const [seasonsData, setSeasonsData] = useState(SEASONS_DATA)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("roboflix_lms_seasons")
      if (stored) {
        try {
          setSeasonsData(JSON.parse(stored))
        } catch (e) {
          console.error(e)
        }
      } else {
        localStorage.setItem("roboflix_lms_seasons", JSON.stringify(SEASONS_DATA))
      }
    }
  }, [])

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

  useEffect(() => {
    const checkSession = async () => {
      try {
        if (isSupabaseConfigured()) {
          const { data: { session } } = await supabase.auth.getSession()
          if (session && session.user) {
            setUser({ email: session.user.email || "" })
            setIsLoading(false)
            return
          }
        }
        
        // Fallback to local storage if Supabase is not configured or has no active session
        const storedUser = localStorage.getItem("lms_user")
        if (storedUser) {
          setUser(JSON.parse(storedUser))
          setIsLoading(false)
        } else {
          window.location.href = "/lms/login"
        }
      } catch (err) {
        window.location.href = "/lms/login"
      }
    }

    checkSession()
  }, [])

  const handleLogout = async () => {
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut()
      }
    } catch (err) {
      console.error("Error signing out from Supabase:", err)
    } finally {
      localStorage.removeItem("lms_user")
      window.location.href = "/lms/login"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  const season1 = seasonsData[0] || SEASONS_DATA[0]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur border-b border-gray-800">
        <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <span className="text-xl sm:text-2xl font-bold">
              ROBO<span className="text-red-600">FLIX</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {user && (
              user.email.toLowerCase() === (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@roboflix.pro").toLowerCase() ||
              user.email.toLowerCase().includes("admin") ||
              user.email.toLowerCase() === "ayushamit007@gmail.com" ||
              user.email.toLowerCase() === "ishinder.dev@gmail.com"
            ) && (
              <Link
                href="/lms/admin"
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded text-sm font-semibold transition-colors"
              >
                Admin Panel
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-semibold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
        {/* Countdown Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 p-6 sm:p-8 bg-gradient-to-r from-red-600/20 to-red-900/20 border border-red-600/30 rounded-xl"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Season 1: ORIGIN</h2>
              <p className="text-gray-400 text-sm sm:text-base">The System Wakes - Master the fundamentals</p>
            </div>
            <div className="text-center whitespace-nowrap">
              <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold mb-2">Launches in</p>
              <p className="text-3xl sm:text-4xl font-bold text-white font-mono">{timeLeft}</p>
            </div>
          </div>
        </motion.div>

        {/* Continue Watching - Season 1 Only */}
        <section className="mb-16">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
            Continue Watching
          </h2>
          <Link href={`/lms/season/${season1.id}`}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative group overflow-hidden rounded-lg w-full h-32 sm:h-44 cursor-pointer text-left"
            >
              <img
                src={season1.image}
                alt={season1.title}
                className="w-full h-full object-cover group-hover:brightness-60 transition-all duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent group-hover:from-black/60 transition-all flex flex-col justify-center items-start p-4 sm:p-6">
                <p className="text-red-500 font-semibold text-xs sm:text-sm uppercase tracking-wider mb-1">{season1.subtitle}</p>
                <h3 className="text-xl sm:text-3xl font-bold text-white">{season1.title}</h3>
              </div>
            </motion.div>
          </Link>
        </section>

        {/* Latest Releases - All 5 Seasons */}
        <section>
          <h2 className="text-xl sm:text-2xl font-bold mb-6">Latest Releases</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {seasonsData.map((season) => (
              <div key={season.id} className={season.id === 1 ? "cursor-pointer" : "cursor-not-allowed"}>
                {season.id === 1 ? (
                  <Link href={`/lms/season/${season.id}`}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="relative group overflow-hidden rounded-lg w-full h-32 sm:h-40 text-left"
                    >
                      <img
                        src={season.image}
                        alt={season.title}
                        className="w-full h-full object-cover group-hover:brightness-60 transition-all duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent group-hover:from-black/60 transition-all flex flex-col justify-center items-start p-4">
                        <p className="text-red-500 font-semibold text-xs uppercase tracking-wider mb-1">{season.subtitle}</p>
                        <h3 className="text-lg sm:text-xl font-bold text-white">{season.title}</h3>
                      </div>
                    </motion.div>
                  </Link>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="relative overflow-hidden rounded-lg w-full h-32 sm:h-40 text-left"
                  >
                    <img
                      src={season.image}
                      alt={season.title}
                      className="w-full h-full object-cover opacity-30"
                    />
                    <div className="absolute inset-0 bg-black/70 flex flex-col justify-center items-center gap-2">
                      <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
                      <p className="text-red-500 font-semibold text-xs sm:text-sm uppercase tracking-wider">Coming Soon</p>
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}


