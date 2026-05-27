"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { Play, Pause, X, RotateCcw, RotateCw, Volume2, VolumeX, Maximize, Minimize, Gauge, Settings } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const TRAILER_VIDEO_ID = "Z0tXgfMPo2s"

// ─── TYPES ───────────────────────────────────────────────────────
type HudType = "play"|"pause"|"mute"|"unmute"|"volume"|"seek-forward"|"seek-backward"|"seek-percent"|"speed"|"fullscreen"|"exit-fullscreen"

// ─── HELPERS ─────────────────────────────────────────────────────
function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s < 10 ? "0" : ""}${s}`
}

export function HeroSection() {
  // ── modal open/close ──
  const [trailerOpen, setTrailerOpen]   = useState(false)

  // ── player API handle ──
  const playerRef    = useRef<any>(null)

  // ── player state ──
  const [playerReady,    setPlayerReady]    = useState(false)
  const [isPlaying,      setIsPlaying]      = useState(false)
  const [duration,       setDuration]       = useState(0)
  const [currentTime,    setCurrentTime]    = useState(0)
  const [volume,         setVolume]         = useState(100)
  const [isMuted,        setIsMuted]        = useState(false)
  const [playbackSpeed,  setPlaybackSpeed]  = useState(1)
  const [showSpeedMenu,  setShowSpeedMenu]  = useState(false)
  const [playbackQuality,setPlaybackQuality]= useState("default")
  const [showQualityMenu,setShowQualityMenu]= useState(false)
  const [isFullscreen,   setIsFullscreen]   = useState(false)
  const [showControls,   setShowControls]   = useState(true)

  // ── DOM refs ──
  const shieldRef       = useRef<HTMLDivElement>(null)
  const containerRef    = useRef<HTMLDivElement>(null)
  const controlsTimeout = useRef<any>(null)

  // ── HUD ──
  const [hud, setHud] = useState<{ type: HudType; label: string; key: number } | null>(null)
  const hudTimeout    = useRef<any>(null)

  // ── title blocker ──
  const [showTitleBlocker, setShowTitleBlocker] = useState(false)
  const titleBlockerTimeout = useRef<any>(null)

  // ── current time ticker ──
  const tickRef = useRef<any>(null)

  // ─── synchronous shield helpers ───────────────────────────────
  const showShield = useCallback(() => {
    if (shieldRef.current) {
      shieldRef.current.style.opacity        = "1"
      shieldRef.current.style.pointerEvents  = "auto"
    }
  }, [])
  const hideShield = useCallback(() => {
    if (shieldRef.current) {
      shieldRef.current.style.opacity        = "0"
      shieldRef.current.style.pointerEvents  = "none"
    }
  }, [])

  // ─── HUD helper ───────────────────────────────────────────────
  const showHUD = useCallback((type: HudType, label: string) => {
    if (hudTimeout.current) clearTimeout(hudTimeout.current)
    setHud({ type, label, key: Date.now() })
    hudTimeout.current = setTimeout(() => setHud(null), 850)
  }, [])

  // ─── title blocker ────────────────────────────────────────────
  const triggerTitleBlocker = useCallback(() => {
    setShowTitleBlocker(true)
    if (titleBlockerTimeout.current) clearTimeout(titleBlockerTimeout.current)
    titleBlockerTimeout.current = setTimeout(() => setShowTitleBlocker(false), 3200)
  }, [])

  // ─── auto-hide controls ───────────────────────────────────────
  const handleMouseMove = useCallback(() => {
    setShowControls(true)
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
    controlsTimeout.current = setTimeout(() => setShowControls(false), 2800)
  }, [])
  const handleMouseLeave = useCallback(() => {
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
    controlsTimeout.current = setTimeout(() => setShowControls(false), 800)
  }, [])

  // ─── current-time ticker ─────────────────────────────────────
  const startTick = useCallback(() => {
    if (tickRef.current) return
    tickRef.current = setInterval(() => {
      if (playerRef.current?.getCurrentTime) {
        setCurrentTime(playerRef.current.getCurrentTime())
      }
    }, 500)
  }, [])
  const stopTick = useCallback(() => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null }
  }, [])

  // ─── fullscreen change listener ───────────────────────────────
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", onFsChange)
    return () => document.removeEventListener("fullscreenchange", onFsChange)
  }, [])

  // ─── init YouTube player when modal opens ─────────────────────
  useEffect(() => {
    if (!trailerOpen) return

    const initPlayer = () => {
      if (!window.YT?.Player) return
      if (playerRef.current) return

      playerRef.current = new window.YT.Player("trailer-iframe", {
        videoId: TRAILER_VIDEO_ID,
        playerVars: {
          autoplay: 1, controls: 0, modestbranding: 0,
          rel: 0, showinfo: 0, iv_load_policy: 3,
          disablekb: 1, fs: 0, cc_load_policy: 0, playsinline: 1,
        },
        events: {
          onReady: (e: any) => {
            setPlayerReady(true)
            setDuration(e.target.getDuration() || 0)
            e.target.setVolume(100)
          },
          onStateChange: (e: any) => {
            const YTS = window.YT.PlayerState
            if (e.data === YTS.PLAYING) {
              hideShield(); setIsPlaying(true); startTick()
            } else if (e.data === YTS.PAUSED) {
              showShield(); setIsPlaying(false); stopTick()
            } else if (e.data === YTS.ENDED) {
              showShield()
              e.target.seekTo(0, true); e.target.pauseVideo()
              setIsPlaying(false); setCurrentTime(0); stopTick()
            } else if (e.data === YTS.BUFFERING) {
              showShield()
            } else {
              showShield()
            }
          },
        },
      })
    }

    if (window.YT?.Player) {
      initPlayer()
    } else if (!document.getElementById("yt-api-script")) {
      const tag = document.createElement("script")
      tag.id = "yt-api-script"
      tag.src = "https://www.youtube.com/iframe_api"
      document.head.appendChild(tag)
      window.onYouTubeIframeAPIReady = initPlayer
    } else {
      window.onYouTubeIframeAPIReady = initPlayer
    }
  }, [trailerOpen, hideShield, showShield, startTick, stopTick])

  // ─── close & cleanup ─────────────────────────────────────────
  const closeTrailer = useCallback(() => {
    stopTick()
    setTrailerOpen(false); setPlayerReady(false)
    setIsPlaying(false); setCurrentTime(0); setDuration(0)
    setShowControls(true); setShowSpeedMenu(false); setShowQualityMenu(false)
    if (playerRef.current) {
      try { playerRef.current.stopVideo() } catch {}
      try { playerRef.current.destroy()  } catch {}
      playerRef.current = null
    }
  }, [stopTick])

  // ─── ESC to close ────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && trailerOpen) closeTrailer() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [trailerOpen, closeTrailer])

  // ─── lock body scroll ────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = trailerOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [trailerOpen])

  // ─── keyboard shortcuts (only when modal is open) ─────────────
  useEffect(() => {
    if (!trailerOpen) return
    const p = playerRef.current

    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return

      switch (e.code) {
        case "Space": case "KeyK":
          e.preventDefault(); togglePlay(); handleMouseMove(); break
        case "KeyF":
          e.preventDefault(); handleFullscreen(); break
        case "KeyM":
          e.preventDefault(); toggleMute(); handleMouseMove(); break
        case "KeyJ":
          e.preventDefault(); skipBackward(10); handleMouseMove(); break
        case "KeyL":
          e.preventDefault(); skipForward(10); handleMouseMove(); break
        case "ArrowRight":
          e.preventDefault(); skipForward(5); handleMouseMove(); break
        case "ArrowLeft":
          e.preventDefault(); skipBackward(5); handleMouseMove(); break
        case "ArrowUp":
          e.preventDefault()
          setVolume(prev => {
            const v = Math.min(prev + 5, 100)
            p?.setVolume(v)
            if (v > 0) { p?.unMute(); setIsMuted(false) }
            showHUD("volume", `Volume ${v}%`)
            return v
          }); handleMouseMove(); break
        case "ArrowDown":
          e.preventDefault()
          setVolume(prev => {
            const v = Math.max(prev - 5, 0)
            p?.setVolume(v)
            if (v === 0) { p?.mute(); setIsMuted(true); showHUD("mute", "Muted") }
            else         { p?.unMute(); setIsMuted(false); showHUD("volume", `Volume ${v}%`) }
            return v
          }); handleMouseMove(); break
        default:
          if (e.key >= "0" && e.key <= "9") {
            e.preventDefault()
            const pct = parseInt(e.key) / 10
            const t = pct * duration
            setCurrentTime(t); p?.seekTo(t, true)
            showHUD("seek-percent", `${pct * 100}% (${formatTime(t)})`); triggerTitleBlocker(); handleMouseMove()
          }
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [trailerOpen, isPlaying, volume, isMuted, duration, currentTime, playbackSpeed]) // eslint-disable-line

  // ─── control functions ────────────────────────────────────────
  const togglePlay = () => {
    const p = playerRef.current; if (!p) return
    if (isPlaying) { p.pauseVideo(); setIsPlaying(false); showHUD("pause", "Paused") }
    else {
      if (!isMuted) {
        p.unMute()
        p.setVolume(volume === 0 ? 50 : volume)
      } else {
        p.mute()
        p.setVolume(0)
      }
      p.playVideo()
      setIsPlaying(true)
      showHUD("play", "Play")
    }
  }

  const skipForward = (secs = 10) => {
    const p = playerRef.current; if (!p) return
    const t = Math.min((p.getCurrentTime?.() ?? currentTime) + secs, duration)
    setCurrentTime(t); p.seekTo(t, true)
    showHUD("seek-forward", `+${secs}s (${formatTime(t)})`); triggerTitleBlocker()
  }

  const skipBackward = (secs = 10) => {
    const p = playerRef.current; if (!p) return
    const t = Math.max((p.getCurrentTime?.() ?? currentTime) - secs, 0)
    setCurrentTime(t); p.seekTo(t, true)
    showHUD("seek-backward", `-${secs}s (${formatTime(t)})`); triggerTitleBlocker()
  }

  const toggleMute = () => {
    const p = playerRef.current; if (!p) return
    if (isMuted) {
      const targetVol = volume || 50
      p.unMute()
      p.setVolume(targetVol)
      setVolume(targetVol)
      setIsMuted(false)
      showHUD("unmute", `Volume ${targetVol}%`)
    }
    else {
      p.mute()
      setIsMuted(true)
      showHUD("mute", "Muted")
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const p = playerRef.current; if (!p) return
    const v = parseInt(e.target.value); setVolume(v); p.setVolume(v)
    if (v === 0) { p.mute(); setIsMuted(true); showHUD("mute", "Muted") }
    else         { p.unMute(); setIsMuted(false); showHUD("volume", `Volume ${v}%`) }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const p = playerRef.current; if (!p) return
    const t = parseFloat(e.target.value); setCurrentTime(t); p.seekTo(t, true); triggerTitleBlocker()
  }

  const changeSpeed = (speed: number) => {
    const p = playerRef.current; if (!p) return
    setPlaybackSpeed(speed); p.setPlaybackRate(speed); setShowSpeedMenu(false); showHUD("speed", `Speed ${speed}x`)
  }

  const changeQuality = (q: string) => {
    const p = playerRef.current; if (!p) return
    setPlaybackQuality(q); setShowQualityMenu(false)
    if (p.loadVideoById) {
      const t = p.getCurrentTime(); const was = isPlaying
      p.loadVideoById({ videoId: TRAILER_VIDEO_ID, startSeconds: t, suggestedQuality: q })
      if (was) setTimeout(() => p.playVideo(), 150)
    } else p.setPlaybackQuality?.(q)
  }

  const getQualityName = (q: string) =>
    ({ hd1080:"1080p", hd720:"720p", large:"480p", medium:"360p", small:"240p", default:"Auto" }[q] ?? "Auto")

  const handleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(()=>{})
      showHUD("fullscreen", "Fullscreen")
    } else {
      document.exitFullscreen()
      showHUD("exit-fullscreen", "Exit Fullscreen")
    }
  }

  const renderHudIcon = () => {
    if (!hud) return null
    const cls = "w-6 h-6"
    switch (hud.type) {
      case "play":           return <Play      className={`${cls} fill-current text-red-500`} />
      case "pause":          return <Pause     className={`${cls} fill-current text-red-500`} />
      case "mute":           return <VolumeX   className={`${cls} text-red-500`} />
      case "unmute":
      case "volume":         return <Volume2   className={`${cls} text-red-500`} />
      case "seek-forward":   return <RotateCw  className={`${cls} text-red-500`} />
      case "seek-backward":  return <RotateCcw className={`${cls} text-red-500`} />
      case "seek-percent":   return <Settings  className={`${cls} text-red-500 animate-spin`} style={{ animationDuration:"3s" }} />
      case "speed":          return <Gauge     className={`${cls} text-red-500`} />
      case "fullscreen":     return <Maximize  className={`${cls} text-red-500`} />
      case "exit-fullscreen":return <Minimize  className={`${cls} text-red-500`} />
      default: return null
    }
  }

  // ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── HERO SECTION ──────────────────────────────────────── */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/30 via-transparent to-transparent" />

        <div className="relative z-10 w-full max-w-5xl mx-auto">
          {/* Thumbnail — clicking opens trailer */}
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
              <div className="absolute inset-0 bg-black/25 sm:bg-black/35 flex items-center justify-center transition-opacity duration-300 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-600/95 sm:bg-red-600/90 backdrop-blur-sm flex items-center justify-center shadow-2xl shadow-red-600/50 scale-100 sm:scale-90 sm:group-hover:scale-100 transition-transform duration-300">
                  <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white fill-white ml-1" />
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
                id="hero-watch-trailer-btn"
                onClick={() => setTrailerOpen(true)}
                className="group w-full sm:w-auto relative flex items-center justify-center gap-3 px-8 py-4 rounded-lg text-base sm:text-lg font-semibold text-white border border-red-600/50 bg-black/60 backdrop-blur-sm hover:border-red-500 hover:bg-red-950/30 transition-all duration-300 overflow-hidden shadow-lg shadow-black/40"
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-red-600/15 to-transparent" />
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
              <div className="flex items-center gap-2"><span className="text-white font-semibold">4.9</span> Rating</div>
              <div className="hidden sm:block w-px h-4 bg-gray-700" />
              <div className="flex items-center gap-2"><span className="text-white font-semibold">50+</span> Founding Students</div>
              <div className="hidden sm:block w-px h-4 bg-gray-700" />
              <div className="flex items-center gap-2"><span className="text-white font-semibold">54+</span> Episodes</div>
              <div className="hidden sm:block w-px h-4 bg-gray-700" />
              <div className="flex items-center gap-2"><span className="text-white font-semibold">3</span> Real Robots Built</div>
              <div className="hidden sm:block w-px h-4 bg-gray-700" />
              <div className="flex items-center gap-2"><span className="text-white font-semibold">30 Day</span> Money Back</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRAILER MODAL ──────────────────────────────────────── */}
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
            <div className="absolute inset-0 bg-black/92 backdrop-blur-md" />

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

                {/* ── TOP HEADER DOCK ── */}
                <div className="flex items-center justify-between px-5 py-3.5 bg-black/70 backdrop-blur-sm border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_#dc2626]" />
                    <span className="text-xs font-bold tracking-widest text-gray-300 uppercase">Roboflix — Official Trailer</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-red-950/40 border border-red-500/30 rounded-full text-[10px] font-bold tracking-widest text-red-500 uppercase">Preview</div>
                    <button
                      onClick={closeTrailer}
                      aria-label="Close trailer"
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-red-600/20 border border-white/10 hover:border-red-500/40 text-gray-400 hover:text-white transition-all duration-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* ── VIDEO PLAYER ── */}
                <div
                  ref={containerRef}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  className="relative w-full aspect-video bg-black overflow-hidden"
                >
                  {/* YT iframe — always present for API control */}
                  <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-auto">
                    <div id="trailer-iframe" className="w-full h-full absolute inset-0 pointer-events-auto" />
                  </div>

                  {/* Privacy shield — synchronous DOM ref, zero flicker */}
                  <div
                    ref={shieldRef}
                    style={{ opacity: 1, pointerEvents: "auto", transition: "opacity 80ms linear" }}
                    className="absolute inset-0 bg-black z-[15]"
                  />

                  {/* Title blocker — covers YouTube native title on seek/play */}
                  <AnimatePresence>
                    {showTitleBlocker && (
                      <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                        className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black via-black/95 to-transparent pointer-events-none z-[25]"
                      />
                    )}
                  </AnimatePresence>

                  {/* Floating top dock inside player — title + badge */}
                  <div className={`absolute top-3 left-3 right-3 px-4 py-2.5 bg-black/80 backdrop-blur-md border border-white/5 rounded-xl flex items-center justify-between transition-all duration-300 z-30 select-none shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] ${showControls ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"}`}>
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_#dc2626]" />
                      <span className="text-xs font-bold tracking-wider text-gray-200 uppercase">Official Trailer</span>
                    </div>
                    <div className="px-3 py-1 bg-red-950/30 border border-red-500/40 rounded-full text-[10px] font-bold tracking-widest text-red-500 uppercase shadow-[0_0_12px_rgba(239,68,68,0.15)]">
                      ROBOFLIX CORE
                    </div>
                  </div>


                  {/* Click overlay — single click play/pause, double click fullscreen */}
                  <div
                    onClick={togglePlay}
                    onDoubleClick={handleFullscreen}
                    className="absolute inset-0 cursor-pointer z-10"
                  />

                  {/* Pause overlay — big play button shown when paused */}
                  {!isPlaying && playerReady && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 pointer-events-none z-20">
                      <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-2xl mb-3">
                        <Play className="w-7 h-7 fill-current text-white ml-1 animate-pulse" />
                      </div>
                      <span className="text-xs font-semibold tracking-widest text-gray-300 uppercase select-none">Click to Play</span>
                    </div>
                  )}

                  {/* Loading spinner */}
                  <AnimatePresence>
                    {!playerReady && (
                      <motion.div
                        initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
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

                  {/* HUD Toast */}
                  <AnimatePresence>
                    {hud && (
                      <motion.div
                        key={hud.key}
                        initial={{ opacity: 0, scale: 0.6, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.6, y: -20 }}
                        transition={{ type: "spring", stiffness: 450, damping: 22 }}
                        className="absolute inset-0 m-auto w-32 h-32 bg-black/85 backdrop-blur-md border border-red-500/10 rounded-2xl flex flex-col items-center justify-center pointer-events-none z-40 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
                      >
                        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-2.5">
                          {renderHudIcon()}
                        </div>
                        <span className="text-[10px] font-extrabold tracking-widest text-gray-200 uppercase font-mono text-center px-2 truncate max-w-full">
                          {hud.label}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ── BOTTOM CONTROL DOCK ── */}
                  <div className={`absolute bottom-3 left-3 right-3 p-3.5 bg-black/80 backdrop-blur-md border border-white/5 rounded-xl flex flex-col gap-3 transition-all duration-300 z-30 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] ${showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>

                    {/* Progress bar */}
                    <div className="flex items-center gap-3 w-full">
                      <span className="text-[11px] font-semibold font-mono text-gray-400 select-none">{formatTime(currentTime)}</span>
                      <input
                        type="range" min={0} max={duration || 100} value={currentTime}
                        onChange={handleSeek}
                        className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-red-600 outline-none hover:h-2 transition-all"
                        style={{ background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${(currentTime/(duration||1))*100}%, rgba(255,255,255,0.1) ${(currentTime/(duration||1))*100}%, rgba(255,255,255,0.1) 100%)` }}
                      />
                      <span className="text-[11px] font-semibold font-mono text-gray-400 select-none">{formatTime(duration)}</span>
                    </div>

                    {/* Buttons row */}
                    <div className="flex items-center justify-between w-full">
                      {/* Left: Play/Pause, Skip, Volume */}
                      <div className="flex items-center gap-3">
                        {/* Play / Pause */}
                        <button onClick={(e) => { e.stopPropagation(); togglePlay() }} title={isPlaying ? "Pause" : "Play"}
                          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg shadow-red-600/35 hover:scale-105 active:scale-95 transition-all">
                          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                        </button>
                        {/* Skip back */}
                        <button onClick={(e) => { e.stopPropagation(); skipBackward() }} title="Rewind 10s"
                          className="p-2 bg-white/5 hover:bg-white/10 rounded-full hover:text-red-500 text-gray-300 transition-all hover:scale-105 active:scale-95">
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        {/* Skip forward */}
                        <button onClick={(e) => { e.stopPropagation(); skipForward() }} title="Forward 10s"
                          className="p-2 bg-white/5 hover:bg-white/10 rounded-full hover:text-red-500 text-gray-300 transition-all hover:scale-105 active:scale-95">
                          <RotateCw className="w-4 h-4" />
                        </button>
                        {/* Volume */}
                        <div className="flex items-center group/vol" onClick={(e) => e.stopPropagation()}>
                          <button onClick={(e) => { e.stopPropagation(); toggleMute() }} title={isMuted ? "Unmute" : "Mute"}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-full hover:text-red-500 text-gray-300 transition-all z-10">
                            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                          </button>
                          <div className="w-0 group-hover/vol:w-20 group-hover/vol:ml-2 overflow-hidden transition-all duration-300 flex items-center h-8"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <input
                              type="range" min={0} max={100} value={isMuted ? 0 : volume}
                              onChange={handleVolumeChange}
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                              className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-red-600 outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right: Speed, Quality, Fullscreen */}
                      <div className="flex items-center gap-3 relative">
                        {/* Speed */}
                        <div className="relative">
                          <button onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(p => !p); setShowQualityMenu(false) }} title="Playback Speed"
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-full hover:text-red-500 text-gray-300 transition-all flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase">
                            <Gauge className="w-3.5 h-3.5" />
                            <span>{playbackSpeed === 1 ? "1.0x" : `${playbackSpeed}x`}</span>
                          </button>
                          {showSpeedMenu && (
                            <div className="absolute bottom-12 right-0 p-2 bg-black/90 border border-white/5 rounded-xl shadow-2xl flex flex-col gap-1 z-20 min-w-[110px] backdrop-blur-lg">
                              {[0.5, 0.75, 1, 1.25, 1.5, 2].map(s => (
                                <button key={s} onClick={(e) => { e.stopPropagation(); changeSpeed(s) }}
                                  className={`px-3 py-1.5 text-left text-xs font-semibold rounded-lg hover:text-white transition-all flex items-center justify-between ${playbackSpeed === s ? "text-red-500 bg-red-600/10" : "text-gray-300"}`}>
                                  <span>{s === 1 ? "Normal" : `${s}x`}</span>
                                  {playbackSpeed === s && <span className="w-1 h-1 rounded-full bg-red-600 animate-ping" />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Quality */}
                        <div className="relative">
                          <button onClick={(e) => { e.stopPropagation(); setShowQualityMenu(p => !p); setShowSpeedMenu(false) }} title="Video Quality"
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-full hover:text-red-500 text-gray-300 transition-all flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase">
                            <Settings className="w-3.5 h-3.5" />
                            <span>{getQualityName(playbackQuality)}</span>
                          </button>
                          {showQualityMenu && (
                            <div className="absolute bottom-12 right-0 p-2 bg-black/90 border border-white/5 rounded-xl shadow-2xl flex flex-col gap-1 z-20 min-w-[110px] backdrop-blur-lg">
                              {[{label:"Auto",value:"default"},{label:"1080p",value:"hd1080"},{label:"720p",value:"hd720"},{label:"480p",value:"large"},{label:"360p",value:"medium"}].map(opt => (
                                <button key={opt.value} onClick={(e) => { e.stopPropagation(); changeQuality(opt.value) }}
                                  className={`px-3 py-1.5 text-left text-xs font-semibold rounded-lg hover:text-white transition-all flex items-center justify-between ${playbackQuality === opt.value ? "text-red-500 bg-red-600/10" : "text-gray-300"}`}>
                                  <span>{opt.label}</span>
                                  {playbackQuality === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* YouTube Redirect Button */}
                        <a
                          href={`https://www.youtube.com/watch?v=${TRAILER_VIDEO_ID}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Watch on YouTube"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 bg-white/5 hover:bg-[#ff0000]/20 rounded-full text-gray-300 hover:text-[#ff0000] transition-all hover:scale-105 active:scale-95 flex items-center justify-center shadow-lg"
                        >
                          <svg
                            className="w-4 h-4 fill-current"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.5 12 3.5 12 3.5s-7.518 0-9.388.553a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.553 9.388.553 9.388.553s7.518 0 9.388-.553a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                        </a>

                        {/* Fullscreen */}
                        <button onClick={(e) => { e.stopPropagation(); handleFullscreen() }} title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                          className="p-2 bg-white/5 hover:bg-white/10 rounded-full hover:text-red-500 text-gray-300 transition-all hover:scale-105 active:scale-95">
                          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── BOTTOM BAR ── */}
                <div className="flex items-center justify-between px-5 py-3 bg-black/70 backdrop-blur-sm border-t border-white/5">
                  <p className="text-xs text-gray-500 tracking-wide">
                    <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white/5 border border-white/10 rounded text-gray-400">Space</kbd>{" "}
                    Play/Pause &nbsp;·&nbsp;
                    <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white/5 border border-white/10 rounded text-gray-400">F</kbd>{" "}
                    Fullscreen &nbsp;·&nbsp;
                    <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white/5 border border-white/10 rounded text-gray-400">ESC</kbd>{" "}
                    Close
                  </p>
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
