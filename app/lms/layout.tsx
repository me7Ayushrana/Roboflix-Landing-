"use client"

import { useState, useEffect, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import { X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

export default function LmsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  // ─── 1. Desktop Recommended Mobile Popup States ───
  const [isMobile, setIsMobile] = useState(false)
  const [showDesktopPopup, setShowDesktopPopup] = useState(false)

  useEffect(() => {
    // Only show warning on mobile viewports
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 || /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent)
      setIsMobile(mobile)
      
      const isLoginPage = pathname === "/lms/login"
      if (mobile && !isLoginPage && !sessionStorage.getItem("desktop_popup_dismissed")) {
        // Subtle delay for transition
        setTimeout(() => setShowDesktopPopup(true), 800)
      }
    }
    
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [pathname])

  const dismissDesktopPopup = () => {
    sessionStorage.setItem("desktop_popup_dismissed", "1")
    setShowDesktopPopup(false)
  }

  // ─── 2. Single-Session Lock & Active Status Verification ───
  useEffect(() => {
    const isLoginPage = pathname === "/lms/login"
    if (isLoginPage) return // Do not check session on login page

    const verifySessionAndStatus = async () => {
      if (typeof window === "undefined") return

      const storedUser = localStorage.getItem("lms_user")
      if (!storedUser) {
        router.push("/lms/login")
        return
      }

      try {
        const userObj = JSON.parse(storedUser)
        const userEmail = userObj?.email?.trim().toLowerCase()
        const localSessionId = localStorage.getItem("lms_session_id") || ""

        if (!userEmail) {
          localStorage.removeItem("lms_user")
          localStorage.removeItem("lms_session_id")
          router.push("/lms/login")
          return
        }

        const isAdmin = userEmail === "ayushamit007@gmail.com"

        if (isSupabaseConfigured()) {
          if (isAdmin) {
            // ── Verify Admin Session Concurrency ──
            const { data, error } = await supabase
              .from("roboflix_lms_settings")
              .select("value")
              .eq("key", "admin_session_id")
              .maybeSingle()

            if (!error && data?.value) {
              const activeSessionId = data.value as string
              if (localSessionId && activeSessionId && localSessionId !== activeSessionId) {
                // Logout Admin - Session mismatch detected
                localStorage.removeItem("lms_user")
                localStorage.removeItem("lms_session_id")
                window.location.href = "/lms/login?error=session_expired"
                return
              }
            }
          } else {
            // ── Verify Student Status & Session Concurrency ──
            const { data, error } = await supabase
              .from("roboflix_lms_users")
              .select("status, session_id")
              .eq("email", userEmail)
              .maybeSingle()

            if (error || !data) {
              // Account doesn't exist anymore in Supabase
              localStorage.removeItem("lms_user")
              localStorage.removeItem("lms_session_id")
              window.location.href = "/lms/login?error=access_denied"
              return
            }

            // Check Status Revocation
            if (data.status === "Revoked") {
              localStorage.removeItem("lms_user")
              localStorage.removeItem("lms_session_id")
              window.location.href = "/lms/login?error=access_denied"
              return
            }

            // Check Session Concurrency (Single-Session lock)
            if (localSessionId && data.session_id && localSessionId !== data.session_id) {
              localStorage.removeItem("lms_user")
              localStorage.removeItem("lms_session_id")
              window.location.href = "/lms/login?error=session_expired"
              return
            }
          }
        }
      } catch (err) {
        console.error("Session verification failure:", err)
      }
    }

    // Run active verification on mount
    verifySessionAndStatus()

    // Periodically verify session (every 5 seconds) to handle active logins in other tabs/devices
    const interval = setInterval(verifySessionAndStatus, 5000)

    // Re-verify immediately when window gains focus
    window.addEventListener("focus", verifySessionAndStatus)

    return () => {
      clearInterval(interval)
      window.removeEventListener("focus", verifySessionAndStatus)
    }
  }, [pathname, router])

  return (
    <>
      {children}

      {/* ── DESKTOP RECOMMENDED POPUP (mobile only, once per session) ── */}
      <AnimatePresence>
        {showDesktopPopup && (
          <motion.div
            key="desktop-popup"
            initial={{ opacity: 0, y: 60, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9998] w-[calc(100vw-32px)] max-w-sm pointer-events-auto"
            role="alert"
            aria-live="polite"
          >
            <div className="relative flex items-start gap-3.5 px-4 py-3.5 bg-black/95 border border-red-600/40 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.9)] backdrop-blur-md">
              {/* Glow accent */}
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-red-600/20 via-transparent to-transparent pointer-events-none" />
              {/* Icon */}
              <div className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-xl bg-red-600/15 border border-red-600/30 flex items-center justify-center text-xl">
                🖥️
              </div>
              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm leading-snug">Desktop Recommended</p>
                <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">For the best Roboflix experience, open on a desktop or laptop.</p>
              </div>
              {/* Close */}
              <button
                onClick={dismissDesktopPopup}
                aria-label="Dismiss"
                className="flex-shrink-0 p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors mt-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
