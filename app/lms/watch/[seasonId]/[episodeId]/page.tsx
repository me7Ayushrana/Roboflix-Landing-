"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Menu, X, MessageCircle, Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Maximize, Minimize, Gauge, Settings, ExternalLink, Code } from "lucide-react"
import { SEASONS_DATA } from "@/lib/lms-data"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

export default function VideoPlayerPage() {
  const params = useParams()
  const router = useRouter()
  const seasonId = parseInt(params.seasonId as string)
  const episodeId = parseInt(params.episodeId as string)
  
  const [seasonsData, setSeasonsData] = useState(SEASONS_DATA)
  const [seasonsLoaded, setSeasonsLoaded] = useState(false)
  const [iframeVideoId, setIframeVideoId] = useState<string>("")
  const lastLoadedVideoIdRef = useRef<string>("")
  
  const season = seasonsData.find((s) => s.id === seasonId) || SEASONS_DATA.find((s) => s.id === seasonId)
  const episode = season?.episodes.find((e) => e.id === episodeId)

  // Get dynamic YouTube video ID from episode videoUrl
  const getVideoId = (url: string) => {
    let videoId = "yqWX86uT5jM" // Fallback video ID
    if (url) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
      const match = url.match(regExp)
      if (match && match[2].length === 11) {
        videoId = match[2]
      }
    }
    return videoId
  }

  const currentVideoId = getVideoId(episode?.videoUrl || "")

  const isGDriveUrl = (url: string): boolean => {
    return url ? url.includes("drive.google.com") : false
  }

  const getGDriveEmbedUrl = (url: string): string => {
    if (!url) return ""
    // Convert view link to preview link
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
    if (match && match[1]) {
      return `https://drive.google.com/file/d/${match[1]}/preview`
    }
    return url
  }

  const isGdrive = isGDriveUrl(episode?.videoUrl || "")

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
      setSeasonsLoaded(true)
    }

    loadSeasons()
  }, [])
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileDevice, setIsMobileDevice] = useState(false)
  const [showDesktopPopup, setShowDesktopPopup] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [doubt, setDoubt] = useState("")
  const [showDoubtForm, setShowDoubtForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Detect mobile and show popup
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 || /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent)
      setIsMobileDevice(mobile)
      if (mobile) {
        setIsSidebarOpen(false) // Close sidebar by default on mobile
        if (!sessionStorage.getItem("desktop_popup_dismissed")) {
          setTimeout(() => setShowDesktopPopup(true), 1000)
        }
      }
    }
    checkMobile()
  }, [])

  const dismissDesktopPopup = useCallback(() => {
    sessionStorage.setItem("desktop_popup_dismissed", "1")
    setShowDesktopPopup(false)
  }, [])

  // Custom Video Player States
  const [player, setPlayer] = useState<any>(null)
  const playerRef = useRef<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1) // scale from 0 to 1
  const [isMuted, setIsMuted] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [playbackQuality, setPlaybackQuality] = useState("default")
  const [showQualityMenu, setShowQualityMenu] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<any>(null)
  // Privacy shield ref — controlled directly via DOM (synchronous), bypasses React async re-render lag
  const shieldRef = useRef<HTMLDivElement>(null)

  const showShield = () => {
    if (shieldRef.current) {
      shieldRef.current.style.opacity = "1"
      shieldRef.current.style.pointerEvents = "auto"
    }
  }
  const hideShield = () => {
    if (shieldRef.current) {
      shieldRef.current.style.opacity = "0"
      shieldRef.current.style.pointerEvents = "none"
    }
  }

  // HUD state for visual hotkey confirmation (Ultra-premium feature)
  const [hud, setHud] = useState<{
    type: "play" | "pause" | "mute" | "unmute" | "volume" | "seek-forward" | "seek-backward" | "seek-percent" | "speed" | "fullscreen" | "exit-fullscreen";
    label: string;
    key: number;
  } | null>(null)
  const hudTimeoutRef = useRef<any>(null)

  const showHUD = (
    type: "play" | "pause" | "mute" | "unmute" | "volume" | "seek-forward" | "seek-backward" | "seek-percent" | "speed" | "fullscreen" | "exit-fullscreen",
    label: string
  ) => {
    if (hudTimeoutRef.current) {
      clearTimeout(hudTimeoutRef.current)
    }
    setHud({ type, label, key: Date.now() })
    hudTimeoutRef.current = setTimeout(() => {
      setHud(null)
    }, 850)
  }

  // YouTube native title blocker overlay state (privacy control)
  const [showTitleBlocker, setShowTitleBlocker] = useState(false)
  const titleBlockerTimeoutRef = useRef<any>(null)

  const triggerTitleBlocker = () => {
    setShowTitleBlocker(true)
    if (titleBlockerTimeoutRef.current) {
      clearTimeout(titleBlockerTimeoutRef.current)
    }
    titleBlockerTimeoutRef.current = setTimeout(() => {
      setShowTitleBlocker(false)
    }, 3200)
  }

  // 1. Session verification & login guard bypass for free/preview episodes
  useEffect(() => {
    if (!seasonsLoaded) return

    const checkSession = async () => {
      try {
        if (episode && (episode as any).isFree) {
          setIsLoading(false)
          return
        }

        if (isSupabaseConfigured()) {
          const { data: { session } } = await supabase.auth.getSession()
          if (session && session.user) {
            setIsLoading(false)
            return
          }
        }
        
        const storedUser = localStorage.getItem("lms_user")
        if (storedUser) {
          setIsLoading(false)
        } else {
          router.push("/lms/login")
        }
      } catch (err) {
        router.push("/lms/login")
      }
    }

    checkSession()
  }, [router, episode, seasonsLoaded])

  // Set the initial iframe video ID once the seasons are loaded
  useEffect(() => {
    if (!isLoading && currentVideoId && !iframeVideoId) {
      setIframeVideoId(currentVideoId)
    }
  }, [isLoading, currentVideoId, iframeVideoId])



  // 2. Initialize YouTube Player API
  useEffect(() => {
    if (isLoading) return
    if (isGdrive) {
      setPlayer(null)
      playerRef.current = null
      return
    }

    // Load standard YouTube API script asynchronously
    if (!window.YT) {
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      const firstScriptTag = document.getElementsByTagName("script")[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    }

    const initYTPlayer = () => {
      if (window.YT && window.YT.Player) {
        const iframeElement = document.getElementById("roboflix-player-iframe")
        if (!iframeElement) {
          // If not in DOM yet, retry in 100ms
          setTimeout(initYTPlayer, 100)
          return
        }

        new window.YT.Player("roboflix-player-iframe", {
          events: {
            onReady: (event: any) => {
              setPlayer(event.target)
              playerRef.current = event.target
              setDuration(event.target.getDuration() || 0)
              event.target.setVolume(volume * 100)
            },
            onStateChange: (event: any) => {
              const state = event.data
              const YTS = window.YT.PlayerState
              if (state === YTS.PLAYING) {
                // SYNCHRONOUS — hide shield the instant YouTube starts playing, no React delay
                hideShield()
                setIsPlaying(true)
              } else if (state === YTS.PAUSED) {
                // SYNCHRONOUS — show shield the instant YouTube pauses (before any React re-render)
                showShield()
                setIsPlaying(false)
              } else if (state === YTS.ENDED) {
                // SYNCHRONOUS — show shield AND immediately reset video before YouTube can render recommendation grid
                showShield()
                event.target.seekTo(0, true)
                event.target.pauseVideo()
                setIsPlaying(false)
                setCurrentTime(0)
              } else if (state === YTS.BUFFERING) {
                // Keep shield visible during buffering — YouTube shows spinner/UI while buffering
                showShield()
              } else {
                // Unstarted (-1) or Cued (5) — always shield
                showShield()
              }
            }
          }
        })
      }
    }

    if (window.YT && window.YT.Player) {
      initYTPlayer()
    } else {
      window.onYouTubeIframeAPIReady = initYTPlayer
    }

    return () => {
      window.onYouTubeIframeAPIReady = undefined
      if (playerRef.current && playerRef.current.destroy) {
        try {
          playerRef.current.destroy()
        } catch (e) {
          console.error("Error destroying YouTube player:", e)
        }
        playerRef.current = null
      }
      setPlayer(null)
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(0)
    }
  }, [isLoading, isGdrive, currentVideoId])

  // 3. Track current playback position and duration
  useEffect(() => {
    let interval: any
    if (player && isPlaying) {
      interval = setInterval(() => {
        if (player.getCurrentTime) {
          setCurrentTime(player.getCurrentTime())
        }
        if (player.getDuration && duration === 0) {
          setDuration(player.getDuration())
        }
      }, 250)
    }
    return () => clearInterval(interval)
  }, [player, isPlaying, duration])

  // 5. Fullscreen event handling
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", handleFsChange)
    return () => document.removeEventListener("fullscreenchange", handleFsChange)
  }, [])

  // 5.5. Auto-hide player controls on mouse inactivity both in fullscreen and windowed modes
  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true)
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
      setShowTitleBlocker(false)
    } else {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)

      // Trigger the YouTube native title blocker overlay whenever video starts/resumes playing
      triggerTitleBlocker()
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [isPlaying])

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
  }

  // Touch tap handler — toggle controls visibility on first tap, play/pause on second tap (mobile)
  const handleTouchToggleControls = useCallback(() => {
    if (!showControls) {
      setShowControls(true)
      if (isPlaying) {
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
        controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000)
      }
    } else if (player) {
      // Second tap — inline toggle to avoid forward reference
      if (isPlaying) {
        player.pauseVideo()
        setIsPlaying(false)
      } else {
        player.unMute()
        player.playVideo()
        setIsPlaying(true)
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
        controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000)
      }
    }
  }, [showControls, isPlaying, player])

  const handleMouseLeave = () => {
    if (isPlaying) {
      setShowControls(false)
    }
  }

  // 6. Keyboard Shortcuts Event Listener (Space/K to Play/Pause, F for Fullscreen, M for Mute, J/L for 10s Seeks, Arrows for 5s Seeks/Volume, 0-9 for %, Speed Hotkeys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keypresses if typing inside inputs/textareas
      const target = e.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return
      }

      if (!player) return

      // Handle seeking with number keys (0-9)
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault()
        const targetPercent = parseInt(e.key) * 10
        const targetTime = (parseInt(e.key) / 10) * duration
        setCurrentTime(targetTime)
        player.seekTo(targetTime, true)
        showHUD("seek-percent", `Seek to ${targetPercent}%`)
        handleMouseMove()
        triggerTitleBlocker()
        return
      }

      // Handle playback speed adjustments (< and >)
      const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2]
      if (e.key === ">" || (e.shiftKey && e.key === ".")) {
        e.preventDefault()
        const currentIndex = speeds.indexOf(playbackSpeed)
        if (currentIndex < speeds.length - 1) {
          changeSpeed(speeds[currentIndex + 1])
        }
        handleMouseMove()
        return
      }
      if (e.key === "<" || (e.shiftKey && e.key === ",")) {
        e.preventDefault()
        const currentIndex = speeds.indexOf(playbackSpeed)
        if (currentIndex > 0) {
          changeSpeed(speeds[currentIndex - 1])
        }
        handleMouseMove()
        return
      }

      switch (e.code) {
        case "Space":
        case "KeyK":
          e.preventDefault()
          togglePlay()
          handleMouseMove()
          break
        case "KeyF":
          e.preventDefault()
          handleFullscreen()
          break
        case "KeyM":
          e.preventDefault()
          toggleMute()
          handleMouseMove()
          break
        case "KeyJ":
          e.preventDefault()
          skipBackward(10)
          handleMouseMove()
          break
        case "KeyL":
          e.preventDefault()
          skipForward(10)
          handleMouseMove()
          break
        case "ArrowUp":
          e.preventDefault()
          setVolume((prev) => {
            const nextVol = Math.min(prev + 0.05, 1)
            player.setVolume(nextVol * 100)
            if (nextVol > 0 && isMuted) {
              player.unMute()
              setIsMuted(false)
            }
            showHUD("volume", `Volume ${Math.round(nextVol * 100)}%`)
            return nextVol
          })
          handleMouseMove()
          break
        case "ArrowDown":
          e.preventDefault()
          setVolume((prev) => {
            const nextVol = Math.max(prev - 0.05, 0)
            player.setVolume(nextVol * 100)
            if (nextVol === 0 && !isMuted) {
              player.mute()
              setIsMuted(true)
              showHUD("mute", "Muted")
            } else {
              showHUD("volume", `Volume ${Math.round(nextVol * 100)}%`)
            }
            return nextVol
          })
          handleMouseMove()
          break
        case "ArrowRight":
          e.preventDefault()
          skipForward(10)
          handleMouseMove()
          break
        case "ArrowLeft":
          e.preventDefault()
          skipBackward(10)
          handleMouseMove()
          break
        default:
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [player, isPlaying, volume, isMuted, duration, currentTime, playbackSpeed])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl font-medium">Loading...</div>
      </div>
    )
  }

  if (!season || !episode) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div>Episode not found</div>
      </div>
    )
  }

  // Convert seconds to MM:SS format
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  // Handle Ask Doubt button
  const handleAskDoubt = () => {
    if (!doubt.trim()) {
      alert("Please enter your doubt")
      return
    }

    const timestamp = formatTime(Math.floor(currentTime))
    const message = `I have a doubt in ${season.title} - ${episode.title} at ${timestamp}: ${doubt}`
    const whatsappUrl = `https://wa.me/8288898544?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
    
    setDoubt("")
    setShowDoubtForm(false)
  }

  // Custom playback controller functions
  const togglePlay = () => {
    if (!player) return
    if (isPlaying) {
      player.pauseVideo()
      setIsPlaying(false)
      showHUD("pause", "Paused")
    } else {
      if (!isMuted) {
        player.unMute()
        player.setVolume(volume === 0 ? 50 : volume * 100)
      } else {
        player.mute()
        player.setVolume(0)
      }
      player.playVideo()
      setIsPlaying(true)
      showHUD("play", "Play")
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!player) return
    const time = parseFloat(e.target.value)
    setCurrentTime(time)
    player.seekTo(time, true)
    triggerTitleBlocker()
  }

  const skipForward = (seconds = 10) => {
    if (!player) return
    const current = player.getCurrentTime ? player.getCurrentTime() : currentTime
    const newTime = Math.min(current + seconds, duration)
    setCurrentTime(newTime)
    player.seekTo(newTime, true)
    showHUD("seek-forward", `+${seconds}s (${formatTime(newTime)})`)
    triggerTitleBlocker()
  }

  const skipBackward = (seconds = 10) => {
    if (!player) return
    const current = player.getCurrentTime ? player.getCurrentTime() : currentTime
    const newTime = Math.max(current - seconds, 0)
    setCurrentTime(newTime)
    player.seekTo(newTime, true)
    showHUD("seek-backward", `-${seconds}s (${formatTime(newTime)})`)
    triggerTitleBlocker()
  }

  const toggleMute = () => {
    if (!player) return
    if (isMuted) {
      const targetVol = volume || 0.5
      player.unMute()
      player.setVolume(targetVol * 100)
      setVolume(targetVol)
      setIsMuted(false)
      showHUD("unmute", `Volume ${Math.round(targetVol * 100)}%`)
    } else {
      player.mute()
      setIsMuted(true)
      showHUD("mute", "Muted")
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!player) return
    const vol = parseFloat(e.target.value)
    setVolume(vol)
    player.setVolume(vol * 100)
    if (vol === 0) {
      player.mute()
      setIsMuted(true)
      showHUD("mute", "Muted")
    } else {
      player.unMute()
      setIsMuted(false)
      showHUD("volume", `Volume ${Math.round(vol * 100)}%`)
    }
  }

  const changeSpeed = (speed: number) => {
    if (!player) return
    setPlaybackSpeed(speed)
    player.setPlaybackRate(speed)
    setShowSpeedMenu(false)
    showHUD("speed", `Speed ${speed}x`)
  }

  const changeQuality = (quality: string) => {
    if (!player) return
    setPlaybackQuality(quality)
    
    // Modern YouTube API: Force suggested quality by reloading the video seamlessly at the exact same position
    if (player.loadVideoById) {
      const currentTime = player.getCurrentTime()
      const wasPlaying = isPlaying
      
      player.loadVideoById({
        videoId: currentVideoId,
        startSeconds: currentTime,
        suggestedQuality: quality
      })
      
      // Auto-resume playback state if it was playing
      if (wasPlaying) {
        setTimeout(() => {
          player.playVideo()
        }, 150)
      }
    } else if (player.setPlaybackQuality) {
      // Fallback for native API support
      player.setPlaybackQuality(quality)
    }
    
    setShowQualityMenu(false)
  }

  const getQualityName = (q: string) => {
    switch (q) {
      case "hd1080": return "1080p"
      case "hd720": return "720p"
      case "large": return "480p"
      case "medium": return "360p"
      case "small": return "240p"
      case "default": return "Auto"
      default: return "Auto"
    }
  }

  const handleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error("Error entering fullscreen:", err)
      })
      showHUD("fullscreen", "Fullscreen")
    } else {
      document.exitFullscreen()
      showHUD("exit-fullscreen", "Exit Fullscreen")
    }
  }

  const getYouTubeEmbedUrl = () => {
    return `https://www.youtube-nocookie.com/embed/${currentVideoId}?enablejsapi=1&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1&fs=0`
  }

  const renderHudIcon = () => {
    if (!hud) return null
    const size = "w-6 h-6"
    switch (hud.type) {
      case "play":
        return <Play className={`${size} fill-current text-red-500`} />
      case "pause":
        return <Pause className={`${size} fill-current text-red-500`} />
      case "mute":
        return <VolumeX className={`${size} text-red-500`} />
      case "unmute":
      case "volume":
        return <Volume2 className={`${size} text-red-500`} />
      case "seek-forward":
        return <RotateCw className={`${size} text-red-500`} />
      case "seek-backward":
        return <RotateCcw className={`${size} text-red-500`} />
      case "seek-percent":
        return <Settings className={`${size} text-red-500 animate-spin`} style={{ animationDuration: "3s" }} />
      case "speed":
        return <Gauge className={`${size} text-red-500`} />
      case "fullscreen":
        return <Maximize className={`${size} text-red-500`} />
      case "exit-fullscreen":
        return <Minimize className={`${size} text-red-500`} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur border-b border-gray-800">
        <div className="px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link href={`/lms/season/${season.id}`} className="hover:text-red-500 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <Link href="/">
            <span className="text-lg sm:text-xl font-bold">
              ROBO<span className="text-red-600">FLIX</span>
            </span>
          </Link>
          <div className="flex-1" />
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden hover:text-red-500 transition-colors"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col md:flex-row gap-0 md:gap-6 px-2 sm:px-4 md:px-6 py-4 md:py-6">
        {/* Video Player - Center */}
        <div className="flex-1 min-w-0 order-1">
          {/* Custom Video Player Container */}
          <div className="mb-4 md:mb-6">
            <div 
              ref={containerRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onTouchStart={!isGdrive ? handleTouchToggleControls : undefined}
              className="relative w-full bg-[#080808] rounded-[16px] md:rounded-[24px] overflow-hidden aspect-video border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.95)] md:shadow-[0_30px_70px_rgba(0,0,0,0.95)] transition-all duration-300"
            >
              {/* Conditional Video Players */}
              {isGdrive ? (
                <div className="absolute inset-0 w-full h-full">
                  <iframe
                    src={getGDriveEmbedUrl(episode.videoUrl)}
                    title={episode.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    className="w-full h-full border-0 absolute top-0 left-0 z-30 bg-black rounded-[24px]"
                    allowFullScreen
                  />
                </div>
              ) : (
                /* YouTube Iframe - 16:9 aspect crop mask, pointer-isolated, always rendered for API control */
                <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-10">
                  <iframe
                    key={currentVideoId}
                    id="roboflix-player-iframe"
                    src={getYouTubeEmbedUrl()}
                    title={episode.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    className={`w-full h-[calc(100%+120px)] border-0 absolute -top-[60px] left-0 pointer-events-none transition-opacity duration-150 ${
                      isPlaying ? "opacity-100" : "opacity-0"
                    }`}
                    tabIndex={-1}
                  />
                </div>
              )}

              {/* Permanent Privacy Shield — controlled via DOM ref (zero React async delay). Opacity toggled synchronously inside YouTube's own onStateChange callback. Always mounted so there is never a missing-frame gap. */}
              {!isGdrive && (
                <div
                  ref={shieldRef}
                  style={{ opacity: 1, pointerEvents: "auto", transition: "opacity 80ms linear" }}
                  className="absolute inset-0 bg-black z-[15]"
                />
              )}

              {/* YouTube Native Title Blocker Overlay (Privacy Control) - completely blocks native header titles at start/seeks with zero cropping */}
              <AnimatePresence>
                {showTitleBlocker && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black via-black/95 to-transparent pointer-events-none z-25"
                  />
                )}
              </AnimatePresence>

              {/* Premium Top Floating Header Dock - Slides down on hover to cover native YouTube titles */}
              <div 
                className={`absolute top-4 left-4 right-4 px-5 py-3.5 bg-black/80 backdrop-blur-md border border-white/5 rounded-xl flex items-center justify-between transition-all duration-300 z-30 select-none shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] ${
                  showControls ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_#dc2626]" />
                  <span className="text-xs font-bold tracking-wider text-gray-200 uppercase truncate max-w-[280px]">
                    {episode.title}
                  </span>
                </div>
                <div className="px-3.5 py-1.5 bg-red-950/30 border border-red-500/40 rounded-full text-[10px] font-bold tracking-widest text-red-500 uppercase shadow-[0_0_12px_rgba(239,68,68,0.15)]">
                  ROBOFLIX CORE
                </div>
              </div>

              {/* Permanent Premium Subtle Watermark Pill - Floating perfectly above the bottom control dock, covering any possible native logo trace */}
              {!isGdrive && (
                <div 
                  className={`absolute bottom-[92px] right-6 px-3 py-1.5 bg-black/60 backdrop-blur-sm border border-white/5 rounded-full text-[10px] font-semibold tracking-wider text-red-500/80 select-none pointer-none z-20 shadow-2xl flex items-center gap-1.5 transition-all duration-300 ${
                    showControls ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
                  ROBOFLIX PRO
                </div>
              )}

              {/* Clickable Overlay - Single click to toggle Play/Pause, Double click to toggle Fullscreen */}
              {!isGdrive && (
                <div 
                  onClick={togglePlay}
                  onDoubleClick={handleFullscreen}
                  className="absolute inset-0 cursor-pointer z-10"
                />
              )}

              {/* Premium Pause/Load Overlay - 100% opaque solid black to completely cover native pause recommends and logos */}
              {!isGdrive && !isPlaying && (
                <div 
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black pointer-events-none transition-all duration-300 z-20 animate-fade-in"
                >
                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-all mb-4">
                    <Play className="w-8 h-8 fill-current text-white ml-1 animate-pulse" />
                  </div>
                  <span className="text-sm font-semibold tracking-widest text-gray-305 uppercase select-none">
                    Click to Resume Lecture
                  </span>
                </div>
              )}

              {/* Centered Premium Glassmorphic HUD Toast Notification with dynamic crimson pulse glow */}
              {!isGdrive && (
                <AnimatePresence>
                  {hud && (
                    <motion.div
                      key={hud.key}
                      initial={{ opacity: 0, scale: 0.6, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.6, y: -20 }}
                      transition={{ type: "spring", stiffness: 450, damping: 22 }}
                      className="absolute inset-0 m-auto w-32 h-32 bg-black/85 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col items-center justify-center pointer-events-none z-40 shadow-[0_12px_45px_rgba(0,0,0,0.8)] border-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.15)] animate-pulse"
                    >
                      <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-500 mb-2.5 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                        {renderHudIcon()}
                      </div>
                      <span className="text-[10px] font-extrabold tracking-widest text-gray-200 uppercase font-mono text-center px-2 truncate max-w-full">
                        {hud.label}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}

              {/* Custom Widescreen Floating Control Dock - high z-index (z-30) to capture click actions */}
              {!isGdrive && (
                <div 
                  className={`absolute bottom-4 left-4 right-4 p-4 bg-black/80 backdrop-blur-md border border-white/5 rounded-xl flex flex-col gap-3.5 transition-all duration-300 z-30 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] ${
                    showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
                  }`}
                >
                {/* Progress Bar (Timeline Seek) */}
                <div className="flex items-center gap-3.5 w-full">
                  <span className="text-xs font-semibold font-mono text-gray-400 select-none">{formatTime(currentTime)}</span>
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#E50914] outline-none focus:ring-1 focus:ring-[#E50914]/50 hover:h-2 transition-all"
                    style={{
                      background: `linear-gradient(to right, #E50914 0%, #E50914 ${(currentTime / (duration || 1)) * 100}%, rgba(255, 255, 255, 0.1) ${(currentTime / (duration || 1)) * 100}%, rgba(255, 255, 255, 0.1) 100%)`
                    }}
                  />
                  <span className="text-xs font-semibold font-mono text-gray-400 select-none">{formatTime(duration)}</span>
                </div>

                {/* Buttons Container */}
                <div className="flex items-center justify-between w-full">
                  {/* Left side controls: Play/Pause, Seek back/forward, Volume slider */}
                  <div className="flex items-center gap-4">
                    {/* Play/Pause Button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePlay() }}
                      className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg shadow-red-600/35 hover:scale-105 active:scale-95 transition-all"
                      title={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>

                    {/* Skip Back 10s */}
                    <button
                      onClick={(e) => { e.stopPropagation(); skipBackward() }}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-full hover:text-red-500 text-gray-300 transition-all hover:scale-105 active:scale-95"
                      title="Skip Backward 10s"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    {/* Skip Forward 10s */}
                    <button
                      onClick={(e) => { e.stopPropagation(); skipForward() }}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-full hover:text-red-500 text-gray-300 transition-all hover:scale-105 active:scale-95"
                      title="Skip Forward 10s"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>

                    {/* Volume controls group */}
                    <div className="flex items-center group/volume" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleMute() }}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-full hover:text-red-500 text-gray-300 transition-all z-10"
                        title={isMuted ? "Unmute" : "Mute"}
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      <div className="w-0 group-hover/volume:w-20 group-hover/volume:ml-2 overflow-hidden transition-all duration-300 flex items-center h-8"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-[#E50914] outline-none"
                          style={{
                            background: `linear-gradient(to right, #E50914 0%, #E50914 ${(isMuted ? 0 : volume) * 100}%, rgba(255, 255, 255, 0.2) ${(isMuted ? 0 : volume) * 100}%, rgba(255, 255, 255, 0.2) 100%)`
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right side controls: Playback speed, Playback quality, Fullscreen */}
                  <div className="flex items-center gap-4 relative">
                    {/* Playback speed trigger */}
                    <div className="relative">
                      <button
                        onClick={() => {
                          setShowSpeedMenu(!showSpeedMenu)
                          setShowQualityMenu(false)
                        }}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-full hover:text-red-500 text-gray-350 transition-all flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase"
                        title="Playback Speed"
                      >
                        <Gauge className="w-3.5 h-3.5" />
                        <span>{playbackSpeed === 1 ? "1.0x" : `${playbackSpeed}x`}</span>
                      </button>

                      {/* Speed Selection Dropdown */}
                      {showSpeedMenu && (
                        <div className="absolute bottom-12 right-0 p-2 bg-black/90 border border-white/5 rounded-xl shadow-2xl flex flex-col gap-1 z-20 min-w-[110px] backdrop-blur-lg animate-fade-in">
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                            <button
                              key={speed}
                              onClick={() => changeSpeed(speed)}
                              className={`px-3 py-1.5 text-left text-xs font-semibold rounded-lg hover:bg-red-650 hover:text-white transition-all flex items-center justify-between ${
                                playbackSpeed === speed ? "text-red-500 bg-red-600/10" : "text-gray-300"
                              }`}
                            >
                              <span>{speed === 1 ? "Normal" : `${speed}x`}</span>
                              {playbackSpeed === speed && <span className="w-1 h-1 rounded-full bg-red-600 animate-ping" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Playback Quality Trigger */}
                    <div className="relative">
                      <button
                        onClick={() => {
                          setShowQualityMenu(!showQualityMenu)
                          setShowSpeedMenu(false)
                        }}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-full hover:text-red-500 text-gray-355 transition-all flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase"
                        title="Video Quality"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>{getQualityName(playbackQuality)}</span>
                      </button>

                      {/* Quality Selection Dropdown */}
                      {showQualityMenu && (
                        <div className="absolute bottom-12 right-0 p-2 bg-black/90 border border-white/5 rounded-xl shadow-2xl flex flex-col gap-1 z-20 min-w-[110px] backdrop-blur-lg animate-fade-in">
                          {[
                            { label: "Auto", value: "default" },
                            { label: "1080p", value: "hd1080" },
                            { label: "720p", value: "hd720" },
                            { label: "480p", value: "large" },
                            { label: "360p", value: "medium" },
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => changeQuality(opt.value)}
                              className={`px-3 py-1.5 text-left text-xs font-semibold rounded-lg hover:bg-red-650 hover:text-white transition-all flex items-center justify-between ${
                                playbackQuality === opt.value ? "text-red-500 bg-red-600/10" : "text-gray-300"
                              }`}
                            >
                              <span>{opt.label}</span>
                              {playbackQuality === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Fullscreen Button */}
                    <button
                      onClick={handleFullscreen}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-full hover:text-red-500 text-gray-300 transition-all hover:scale-105 active:scale-95"
                      title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    >
                      {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              )}
            </div>
          </div>

          {/* Episode Title & Info */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{episode.title}</h1>
            <p className="text-red-500 font-semibold text-sm uppercase tracking-wider mb-4">{season.title}</p>
            <p className="text-gray-400 text-sm sm:text-base mb-6">{episode.duration}</p>

            <div className="flex flex-wrap items-center gap-3 mb-6">
              {/* Ask Doubt Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => setShowDoubtForm(!showDoubtForm)}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors text-white"
              >
                <MessageCircle className="w-5 h-5" />
                Ask Doubt on WhatsApp
              </motion.button>

              {/* Open Virtual Lab Button */}
              <Link href={`/lms/lab/s${seasonId}e${episodeId}`}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg font-semibold text-white transition-colors cursor-pointer"
                >
                  <Code className="w-5 h-5 text-red-500" />
                  Open Virtual Lab
                </motion.button>
              </Link>
            </div>

            {/* Doubt Form */}
            {showDoubtForm && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-gray-900 border border-gray-800 rounded-lg"
              >
                <p className="text-sm text-gray-400 mb-3">
                  Ask your doubt at <span className="text-white font-semibold">{formatTime(Math.floor(currentTime))}</span>
                </p>
                <textarea
                  value={doubt}
                  onChange={(e) => setDoubt(e.target.value)}
                  placeholder="Describe your doubt here..."
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-red-600 mb-3 text-sm"
                  rows={3}
                />
                <button
                  onClick={handleAskDoubt}
                  className="w-full py-2 bg-red-600 hover:bg-red-700 rounded text-white font-semibold transition-colors text-sm"
                >
                  Send on WhatsApp
                </button>
              </motion.div>
            )}
          </div>

          {/* Episode Description */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-3">Description</h2>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed">{episode.description}</p>
          </div>

          {/* Summary */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-3">Summary</h2>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed">{episode.summary}</p>
          </div>

          {/* Resources */}
          {episode.files.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">Resources & Files</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(episode.files as any[]).map((file, idx) => (
                  <a
                    key={idx}
                    href={file.url || "https://drive.google.com"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 bg-gray-900/60 border border-gray-800 hover:border-red-600/60 rounded-xl transition-all flex items-center justify-between gap-3 group hover:bg-red-950/20 hover:shadow-[0_0_15px_rgba(220,38,38,0.1)] text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-red-600/10 group-hover:bg-red-600/20 border border-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                        <span className="text-red-500 text-sm font-bold">📄</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-semibold text-sm truncate group-hover:text-red-400 transition-colors">{file.name}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{file.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-black/40 border border-white/5 text-gray-400 group-hover:text-red-400 group-hover:border-red-500/20 transition-all flex items-center gap-1">
                        Drive <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Code Snippets */}
          {episode.codes.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Code</h2>
              <div className="space-y-3">
                {episode.codes.map((code, idx) => (
                  <div key={idx} className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
                    <p className="text-red-500 text-xs font-semibold uppercase mb-2">{code.language}</p>
                    <code className="text-gray-300 text-xs sm:text-sm font-mono break-all">{code.snippet}</code>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Episodes Navigation */}
        {isSidebarOpen && (
          <motion.div
            initial={isMobileDevice ? { y: 40, opacity: 0 } : { x: 400, opacity: 0 }}
            animate={isMobileDevice ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 }}
            exit={isMobileDevice ? { y: 40, opacity: 0 } : { x: 400, opacity: 0 }}
            className="w-full md:w-80 order-2 flex flex-col h-fit md:sticky md:top-20"
          >
            <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
              {/* All Episodes Header */}
              <div className="p-4 border-b border-gray-800 bg-black/50">
                <h3 className="font-bold text-white text-sm">All Episodes (S1-S5)</h3>
              </div>

              {/* Episodes List */}
              <div className="max-h-[600px] overflow-y-auto">
                {seasonsData.map((s) => (
                  <div key={s.id}>
                    {/* Season Header */}
                    <div className="px-4 py-3 bg-gray-800/50 text-gray-300 text-xs font-semibold uppercase border-b border-gray-700">
                      {s.title}
                    </div>

                    {/* Season Episodes */}
                    {s.episodes.map((ep) => {
                      const isActive = s.id === season.id && ep.id === episode.id
                      const isClickable = s.id === 1

                      return (
                        <div key={`${s.id}-${ep.id}`}>
                          {isClickable ? (
                            <Link href={`/lms/watch/${s.id}/${ep.id}`}>
                              <div
                                className={`p-3 border-l-2 cursor-pointer transition-colors text-xs sm:text-sm ${
                                  isActive
                                    ? "bg-red-600/20 border-red-600 text-red-500"
                                    : "border-transparent text-gray-300 hover:bg-gray-800/50"
                                }`}
                              >
                                <p className="font-semibold line-clamp-2">{ep.title}</p>
                                <p className="text-gray-500 text-xs mt-1">{ep.duration}</p>
                              </div>
                            </Link>
                          ) : (
                            <div className="p-3 border-l-2 border-transparent text-gray-500 cursor-not-allowed opacity-50 text-xs sm:text-sm">
                              <p className="font-semibold line-clamp-2">{ep.title}</p>
                              <p className="text-gray-600 text-xs mt-1">Coming Soon</p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Desktop Recommended Popup — mobile only, once per session */}
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
          >
            <div className="relative flex items-start gap-3.5 px-4 py-3.5 bg-black/95 border border-red-600/40 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.9)] backdrop-blur-md">
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-red-600/20 via-transparent to-transparent pointer-events-none" />
              <div className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-xl bg-red-600/15 border border-red-600/30 flex items-center justify-center text-xl">
                🖥️
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm leading-snug">Desktop Recommended</p>
                <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">For the best Roboflix experience, open on a desktop or laptop.</p>
              </div>
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
    </div>
  )
}

