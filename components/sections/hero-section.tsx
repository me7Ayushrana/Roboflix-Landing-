"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { Play, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const TRAILER_VIDEO_ID = "Z0tXgfMPo2s"

export function HeroSection() {
  const [trailerOpen, setTrailerOpen] = useState(false)
  const [playerReady, setPlayerReady] = useState(false)
  const playerRef = useRef<any>(null)
  const shieldRef = useRef<HTMLDivElement>(null)

  // Show / hide the privacy shield synchronously (no React async lag)
  const showShield = useCallback(() => {
    if (shieldRef.current) {
      shieldRef.current.style.opacity = "1"
      shieldRef.current.style.pointerEvents = "auto"
    }
  }, [])
  const hideShield = useCallback(() => {
    if (shieldRef.current) {
      shieldRef.current.style.opacity = "0"
      shieldRef.current.style.pointerEvents = "none"
    }
  }, [])

  // Initialise the YT player once the modal opens
  useEffect(() => {
    if (!trailerOpen) return

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return
      if (playerRef.current) return // already initialised

      playerRef.current = new window.YT.Player("trailer-iframe", {
        videoId: TRAILER_VIDEO_ID,
        playerVars: {
          autoplay: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 0,
          cc_load_policy: 0,
          playsinline: 1,
        },
        events: {
          onReady: () => setPlayerReady(true),
          onStateChange: (e: any) => {
            const YTS = window.YT.PlayerState
            if (e.data === YTS.PLAYING) {
              hideShield()
            } else if (e.data === YTS.ENDED) {
              showShield()
              playerRef.current?.seekTo(0, true)
              playerRef.current?.pauseVideo()
            } else {
              showShield()
            }
          },
        },
      })
    }

    if (window.YT && window.YT.Player) {
      initPlayer()
    } else if (!document.getElementById("yt-api-script")) {
      const tag = document.createElement("script")
      tag.id = "yt-api-script"
      tag.src = "https://www.youtube.com/iframe_api"
      document.head.appendChild(tag)
      window.onYouTubeIframeAPIReady = initPlayer
    } else {
      // Script already loading — wait for callback
      window.onYouTubeIframeAPIReady = initPlayer
    }
  }, [trailerOpen, hideShield, showShield])

  // Close modal and destroy player cleanly
  const closeTrailer = useCallback(() => {
    setTrailerOpen(false)
    setPlayerReady(false)
    if (playerRef.current) {
      try { playerRef.current.stopVideo() } catch {}
      try { playerRef.current.destroy() } catch {}
      playerRef.current = null
    }
  }, [])

  // ESC key to close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && trailerOpen) closeTrailer()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [trailerOpen, closeTrailer])

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = trailerOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [trailerOpen])

  return (
    <>
      {/* ─── HERO SECTION ─────────────────────────────────────── */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/30 via-transparent to-transparent" />

        <div className="relative z-10 w-full max-w-5xl mx-auto">
          {/* Thumbnail — clicking it opens the trailer */}
          <div
            className="mb-12 group cursor-pointer"
            onClick={() => setTrailerOpen(true)}
            role="button"
            aria-label="Watch Roboflix Trailer"
          >
            <div className="relative rounded-xl overflow-hidden border-2 border-red-600/40 shadow-2xl shadow-red-600/30 hover:shadow-red-600/60 transition-all duration-300">
              <img
                src="/hero-thumbnail.png"
                alt="ROBOFLIX: Your Robotics Journey"
                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {/* Play overlay on thumbnail */}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-red-600/90 backdrop-blur-sm flex items-center justify-center shadow-2xl shadow-red-600/50 scale-90 group-hover:scale-100 transition-transform duration-300">
                  <Play className="w-8 h-8 text-white fill-white ml-1" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/20 border border-red-600/60 mb-8">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-red-400">Season 1 Launching June 15 - Founding Batch Open Now</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6 text-white">
              Master Robotics.
              <span className="block text-red-600">Build Your Future.</span>
            </h1>

            <p className="text-base sm:text-lg text-gray-400 max-w-3xl mx-auto mb-2 leading-relaxed text-balance font-semibold">
              Learn to build 3 working robots in just 5 months. No expensive setup needed. Just you, simple materials, and step-by-step lessons that actually make sense.
            </p>

            <p className="text-sm sm:text-base text-red-500/80 max-w-3xl mx-auto mb-4 leading-relaxed text-balance">
              Robotics skills make you stand out everywhere — in college projects, job interviews, and competitions. The best time to start? Right now.
            </p>

            {/* Pricing Highlight */}
            <div className="mb-12 inline-flex items-center justify-center gap-3 px-6 py-3 bg-black/80 border border-red-600/40 rounded-full text-sm sm:text-base">
              <span className="text-white font-semibold">Just ₹989</span>
              <span className="text-gray-500 line-through decoration-red-500 decoration-2">₹2,999</span>
              <span className="text-red-500 font-bold">Limited time</span>
              <span className="text-gray-500">·</span>
              <span className="text-red-500 font-bold">Learn forever</span>
              <span className="text-gray-500">·</span>
              <span className="text-gray-400">Cancel anytime</span>
            </div>

            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="#pricing" className="w-full sm:w-auto">
                <button className="w-full px-8 py-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all duration-300 text-base sm:text-lg shadow-lg shadow-red-600/50">
                  Join Now
                </button>
              </Link>

              {/* ── WATCH TRAILER BUTTON ── */}
              <button
                onClick={() => setTrailerOpen(true)}
                className="group w-full sm:w-auto relative flex items-center justify-center gap-3 px-8 py-4 rounded-lg text-base sm:text-lg font-semibold text-white border border-red-600/50 bg-black/60 backdrop-blur-sm hover:border-red-500 hover:bg-red-950/30 transition-all duration-300 overflow-hidden shadow-lg shadow-black/40"
              >
                {/* Animated glow sweep */}
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-red-600/15 to-transparent" />
                {/* Pulsing play icon */}
                <span className="relative flex items-center justify-center w-7 h-7 rounded-full bg-red-600/20 border border-red-600/60 group-hover:bg-red-600/40 transition-colors duration-300">
                  <Play className="w-3.5 h-3.5 text-red-400 fill-red-400 ml-0.5" />
                </span>
                <span className="relative">Watch Trailer</span>
              </button>

              <Link href="/lms/login" className="w-full sm:w-auto">
                <button className="w-full px-8 py-4 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transition-all duration-300 text-base sm:text-lg border border-gray-600">
                  Go to LMS
                </button>
              </Link>
            </div>

            {/* Trust Bar */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs sm:text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold">4.9</span> Rating
              </div>
              <div className="hidden sm:block w-px h-4 bg-gray-700" />
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold">50+</span> Founding Students
              </div>
              <div className="hidden sm:block w-px h-4 bg-gray-700" />
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold">54+</span> Episodes
              </div>
              <div className="hidden sm:block w-px h-4 bg-gray-700" />
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold">3</span> Real Robots Built
              </div>
              <div className="hidden sm:block w-px h-4 bg-gray-700" />
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold">30 Day</span> Money Back
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRAILER MODAL ────────────────────────────────────── */}
      <AnimatePresence>
        {trailerOpen && (
          <motion.div
            key="trailer-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8"
            onClick={(e) => { if (e.target === e.currentTarget) closeTrailer() }}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />

            {/* Modal card */}
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 16 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-5xl z-10"
            >
              {/* Glow ring */}
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-red-600/50 via-transparent to-red-900/30 pointer-events-none" />

              <div className="relative rounded-2xl overflow-hidden bg-[#0a0a0a] border border-red-600/30 shadow-[0_0_80px_rgba(220,38,38,0.25)]">
                {/* Top bar */}
                <div className="flex items-center justify-between px-5 py-3.5 bg-black/70 backdrop-blur-sm border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_#dc2626]" />
                    <span className="text-xs font-bold tracking-widest text-gray-300 uppercase">Roboflix — Official Trailer</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-red-950/40 border border-red-500/30 rounded-full text-[10px] font-bold tracking-widest text-red-500 uppercase">
                      Preview
                    </div>
                    <button
                      onClick={closeTrailer}
                      aria-label="Close trailer"
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-red-600/20 border border-white/10 hover:border-red-500/40 text-gray-400 hover:text-white transition-all duration-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Video area */}
                <div className="relative w-full aspect-video bg-black overflow-hidden">
                  {/* YT iframe — always present for API */}
                  <div id="trailer-iframe" className="absolute inset-0 w-full h-full pointer-events-none" />

                  {/* Privacy shield — DOM-ref controlled, synchronous, zero flicker */}
                  <div
                    ref={shieldRef}
                    style={{ opacity: 1, pointerEvents: "auto", transition: "opacity 100ms linear" }}
                    className="absolute inset-0 bg-black z-[10]"
                  />

                  {/* Loading spinner (shown until player is ready) */}
                  <AnimatePresence>
                    {!playerReady && (
                      <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0 z-[20] flex flex-col items-center justify-center bg-black gap-4"
                      >
                        <div className="relative w-14 h-14">
                          <div className="absolute inset-0 rounded-full border-2 border-red-600/20" />
                          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-red-600 animate-spin" />
                          <div className="absolute inset-2 rounded-full border border-transparent border-t-red-400/40 animate-spin" style={{ animationDuration: "1.5s", animationDirection: "reverse" }} />
                        </div>
                        <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase animate-pulse">Loading Trailer</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Bottom bar */}
                <div className="flex items-center justify-between px-5 py-3 bg-black/70 backdrop-blur-sm border-t border-white/5">
                  <p className="text-xs text-gray-500 tracking-wide">Press <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white/5 border border-white/10 rounded text-gray-400">ESC</kbd> to close</p>
                  <Link href="#pricing" onClick={closeTrailer}>
                    <button className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold tracking-wider uppercase rounded-lg transition-colors duration-200 shadow-lg shadow-red-600/30">
                      <Play className="w-3 h-3 fill-white" />
                      Join Now
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
