"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { LogOut, Clock, Lock, Key, X, CheckCircle2, AlertCircle } from "lucide-react"
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

  // Change Password States
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")

  useEffect(() => {
    const loadSeasons = async () => {
      let loadedFromDb = false
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from("roboflix_lms_settings")
            .select("value")
            .eq("key", "seasons_data")
            .maybeSingle()

          if (!error && data && data.value) {
            setSeasonsData(data.value as any)
            localStorage.setItem("roboflix_lms_seasons", JSON.stringify(data.value))
            loadedFromDb = true
          } else if (!error && !data) {
            // Seed cloud database in the background since it is empty!
            await supabase
              .from("roboflix_lms_settings")
              .insert([{ key: "seasons_data", value: SEASONS_DATA, updated_at: new Date().toISOString() }])
            
            setSeasonsData(SEASONS_DATA)
            localStorage.setItem("roboflix_lms_seasons", JSON.stringify(SEASONS_DATA))
            loadedFromDb = true
          }
        } catch (err) {
          console.error("Supabase load seasons error:", err)
        }
      }

      if (!loadedFromDb && typeof window !== "undefined") {
        const stored = localStorage.getItem("roboflix_lms_seasons")
        if (stored) {
          try {
            setSeasonsData(JSON.parse(stored))
          } catch (e) {
            console.error(e)
          }
        } else {
          setSeasonsData(SEASONS_DATA)
          localStorage.setItem("roboflix_lms_seasons", JSON.stringify(SEASONS_DATA))
          
          // Seed cloud database offline fallback
          if (isSupabaseConfigured()) {
            (async () => {
              try {
                await supabase
                  .from("roboflix_lms_settings")
                  .insert([{ key: "seasons_data", value: SEASONS_DATA, updated_at: new Date().toISOString() }])
              } catch (e) {
                console.error("Background seeding error:", e)
              }
            })()
          }
        }
      }
    }

    loadSeasons()
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError("")
    setPasswordSuccess("")

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required.")
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.")
      return
    }

    if (newPassword.length < 4) {
      setPasswordError("New password must be at least 4 characters.")
      return
    }

    if (typeof window !== "undefined") {
      const userEmail = user?.email || ""
      const isAdmin = userEmail.toLowerCase() === "ayushamit007@gmail.com"

      if (isAdmin) {
        try {
          let currentAdminPass = "sexyroboflix"
          
          // 1. Fetch current password from Supabase
          if (isSupabaseConfigured()) {
            try {
              const { data } = await supabase
                .from("roboflix_lms_settings")
                .select("value")
                .eq("key", "admin_password")
                .maybeSingle()
              if (data?.value) {
                currentAdminPass = data.value as string
              }
            } catch (err) {
              console.error("Failed to load admin password:", err)
            }
          }

          // 2. Validate current password
          if (currentPassword !== currentAdminPass) {
            setPasswordError("Current password is incorrect.")
            return
          }

          // 3. Save new password to Supabase
          let isSavedInSupabase = false
          if (isSupabaseConfigured()) {
            try {
              const { error } = await supabase
                .from("roboflix_lms_settings")
                .upsert([{ key: "admin_password", value: newPassword.trim(), updated_at: new Date().toISOString() }], { onConflict: "key" })
              
              if (error) {
                throw error
              }
              isSavedInSupabase = true
            } catch (err) {
              console.error("Failed to update admin password in Supabase:", err)
            }
          }

          if (isSavedInSupabase) {
            setPasswordSuccess("Admin password updated successfully globally! 🎉")
          } else {
            setPasswordSuccess("Admin password updated locally! (offline) 💻")
          }

          // Reset inputs and close modal
          setCurrentPassword("")
          setNewPassword("")
          setConfirmPassword("")
          setTimeout(() => {
            setShowPasswordModal(false)
            setPasswordSuccess("")
          }, 2000)
        } catch (err) {
          setPasswordError("Failed to update admin password. Try again.")
        }
        return
      }

      const stored = localStorage.getItem("roboflix_lms_users")
      if (stored) {
        try {
          const users = JSON.parse(stored)
          
          // Find the student in the dynamic database
          const userIdx = users.findIndex((u: any) => u.email.toLowerCase() === userEmail.toLowerCase())
          
          if (userIdx !== -1) {
            // Verify current password (which is stored in phone field)
            if (users[userIdx].phone !== currentPassword) {
              setPasswordError("Current password is incorrect.")
              return
            }
            
            // Attempt to update in Supabase in real-time
            let isSavedInSupabase = false
            if (isSupabaseConfigured()) {
              try {
                const { error } = await supabase
                  .from("roboflix_lms_users")
                  .update({ phone: newPassword })
                  .eq("email", userEmail)

                if (error) {
                  console.error("Supabase password update error:", error)
                } else {
                  isSavedInSupabase = true
                }
              } catch (err) {
                console.error("Supabase password update exception:", err)
              }
            }

            // Update the password locally
            users[userIdx].phone = newPassword
            localStorage.setItem("roboflix_lms_users", JSON.stringify(users))
            
            if (isSavedInSupabase) {
              setPasswordSuccess("Password updated successfully globally! 🎉")
            } else if (isSupabaseConfigured()) {
              setPasswordSuccess("Password updated locally (offline). 💻")
            } else {
              setPasswordSuccess("Password updated successfully! 🎉")
            }
            
            // Reset input fields
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")
            
            // Auto close after 2 seconds
            setTimeout(() => {
              setShowPasswordModal(false)
              setPasswordSuccess("")
            }, 2000)
          } else {
            setPasswordError("User account not found. Locked to dynamic credentials.")
          }
        } catch (err) {
          setPasswordError("Failed to update password. Try again.")
        }
      } else {
        setPasswordError("Database not found. Contact administrator.")
      }
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
              onClick={() => {
                setPasswordError("")
                setPasswordSuccess("")
                setShowPasswordModal(true)
              }}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded text-sm font-semibold transition-colors text-white"
            >
              <Key className="w-4 h-4 text-red-500" />
              <span className="hidden md:inline">Change Password</span>
            </button>
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

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden text-left"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-red-500" />
                <h3 className="text-xl font-bold text-white">Change Password</h3>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error and Success Indicators */}
            {passwordError && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 text-red-400 rounded-lg flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}
            {passwordSuccess && (
              <div className="mb-4 p-3 bg-emerald-900/20 border border-emerald-500/30 text-emerald-400 rounded-lg flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none rounded-lg px-3.5 py-2 text-sm text-white placeholder-zinc-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none rounded-lg px-3.5 py-2 text-sm text-white placeholder-zinc-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none rounded-lg px-3.5 py-2 text-sm text-white placeholder-zinc-600 transition-colors"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-sm font-semibold transition-colors text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-semibold transition-colors text-white flex items-center gap-1.5"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}


