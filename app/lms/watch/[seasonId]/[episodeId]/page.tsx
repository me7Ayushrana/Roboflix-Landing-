"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Menu, X, MessageCircle, Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Maximize, Minimize, Gauge, Settings } from "lucide-react"
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
  
  const season = SEASONS_DATA.find((s) => s.id === seasonId)
  const episode = season?.episodes.find((e) => e.id === episodeId)
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [doubt, setDoubt] = useState("")
  const [showDoubtForm, setShowDoubtForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Custom Video Player States
  const [player, setPlayer] = useState<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(100)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [playbackQuality, setPlaybackQuality] = useState("default")
  const [showQualityMenu, setShowQualityMenu] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // 1. Session verification & login guard bypass for free/preview episodes
  useEffect(() => {
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
  }, [router, episode])

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

  // 2. Initialize YouTube Player API
  useEffect(() => {
    if (isLoading) return

    // Load standard YouTube API script asynchronously
    if (!window.YT) {
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      const firstScriptTag = document.getElementsByTagName("script")[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    }

    const initYTPlayer = () => {
      if (window.YT && window.YT.Player) {
        new window.YT.Player("roboflix-player-iframe", {
          events: {
            onReady: (event: any) => {
              setPlayer(event.target)
              setDuration(event.target.getDuration() || 0)
              event.target.setVolume(volume)
            },
            onStateChange: (event: any) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true)
              } else if (
                event.data === window.YT.PlayerState.PAUSED ||
                event.data === window.YT.PlayerState.ENDED
              ) {
                setIsPlaying(false)
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
    }
  }, [isLoading])

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

  // 4. Handle video switches dynamically
  useEffect(() => {
    if (player && player.loadVideoById) {
      player.loadVideoById({ videoId: currentVideoId })
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(0)
    }
  }, [currentVideoId, player])

  // 5. Fullscreen event handling
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", handleFsChange)
    return () => document.removeEventListener("fullscreenchange", handleFsChange)
  }, [])

  // 6. Keyboard Shortcuts Event Listener (Space to Toggle Play, Arrow Up/Down to Control Volume)
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

      switch (e.code) {
        case "Space":
          e.preventDefault()
          togglePlay()
          break
        case "ArrowUp":
          e.preventDefault()
          setVolume((prev) => {
            const nextVol = Math.min(prev + 5, 100)
            player.setVolume(nextVol)
            if (nextVol > 0 && isMuted) {
              player.unmute()
              setIsMuted(false)
            }
            return nextVol
          })
          break
        case "ArrowDown":
          e.preventDefault()
          setVolume((prev) => {
            const nextVol = Math.max(prev - 5, 0)
            player.setVolume(nextVol)
            if (nextVol === 0 && !isMuted) {
              player.mute()
              setIsMuted(true)
            }
            return nextVol
          })
          break
        case "ArrowRight":
          skipForward()
          break
        case "ArrowLeft":
          skipBackward()
          break
        default:
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [player, isPlaying, volume, isMuted, duration, currentTime])

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
    } else {
      player.playVideo()
      setIsPlaying(true)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!player) return
    const time = parseFloat(e.target.value)
    setCurrentTime(time)
    player.seekTo(time, true)
  }

  const skipForward = () => {
    if (!player) return
    const newTime = Math.min(currentTime + 10, duration)
    setCurrentTime(newTime)
    player.seekTo(newTime, true)
  }

  const skipBackward = () => {
    if (!player) return
    const newTime = Math.max(currentTime - 10, 0)
    setCurrentTime(newTime)
    player.seekTo(newTime, true)
  }

  const toggleMute = () => {
    if (!player) return
    if (isMuted) {
      player.unmute()
      player.setVolume(volume || 50)
      setIsMuted(false)
    } else {
      player.mute()
      setIsMuted(true)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!player) return
    const vol = parseInt(e.target.value)
    setVolume(vol)
    player.setVolume(vol)
    if (vol === 0) {
      player.mute()
      setIsMuted(true)
    } else {
      player.unmute()
      setIsMuted(false)
    }
  }

  const changeSpeed = (speed: number) => {
    if (!player) return
    setPlaybackSpeed(speed)
    player.setPlaybackRate(speed)
    setShowSpeedMenu(false)
  }

  const changeQuality = (quality: string) => {
    if (!player) return
    setPlaybackQuality(quality)
    if (player.setPlaybackQuality) {
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
    } else {
      document.exitFullscreen()
    }
  }

  const getYouTubeEmbedUrl = () => {
    // enablejsapi=1 is REQUIRED to control the iframe programmatically
    // controls=0 disables standard player bar, disablekb=1 disables shortcut keys
    // modestbranding=1 disables logo overlays, fs=0 disables standard fullscreen button
    return `https://www.youtube-nocookie.com/embed/${currentVideoId}?enablejsapi=1&controls=0&disablekb=1&fs=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&autoplay=0&playsinline=1`
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
      <main className="flex gap-0 md:gap-6 px-4 sm:px-6 py-6">
        {/* Video Player - Center */}
        <div className="flex-1 min-w-0 order-2 md:order-1">
          {/* Custom Video Player Container */}
          <div className="mb-6">
            <div 
              ref={containerRef}
              className="relative w-full bg-black rounded-lg overflow-hidden group aspect-video border border-gray-800/80 shadow-2xl"
            >
              {/* YouTube Iframe - 100% dimensions to fit the entire video screen perfectly with zero cropping, using absolute pointer isolation */}
              <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                <iframe
                  id="roboflix-player-iframe"
                  src={getYouTubeEmbedUrl()}
                  title={episode.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  className="w-full h-full border-0 absolute top-0 left-0 pointer-events-none"
                />
              </div>

              {/* Solid black cinematic bar to cover the native YouTube title/share header completely */}
              <div className="absolute top-0 left-0 right-0 h-10 bg-black z-20 pointer-events-none" />

              {/* Solid black cinematic bar to cover the native YouTube logo, share button, and "More videos" button completely */}
              <div className="absolute bottom-0 left-0 right-0 h-10 bg-black z-20 pointer-events-none" />

              {/* Clickable Overlay - Single click to toggle Play/Pause, Double click to toggle Fullscreen */}
              <div 
                onClick={togglePlay}
                onDoubleClick={handleFullscreen}
                className="absolute inset-0 cursor-pointer z-10"
              />

              {/* Premium Pause/Load Overlay - Deeply darkens (0 brightness) and blurs (0 visibility) the YouTube native pause elements */}
              {!isPlaying && (
                <div 
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-lg pointer-events-none transition-all duration-300 z-20 animate-fade-in"
                >
                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-all mb-4">
                    <Play className="w-8 h-8 fill-current text-white ml-1 animate-pulse" />
                  </div>
                  <span className="text-sm font-semibold tracking-widest text-gray-300 uppercase select-none">
                    Click to Resume Lecture
                  </span>
                  <span className="text-[10px] text-gray-500 tracking-wider mt-1 select-none">
                    ROBOFLIX PREMIUM PLATFORM
                  </span>
                </div>
              )}

              {/* Permanent Premium Watermark - Positioned perfectly above the cinematic bottom bar */}
              <div className="absolute bottom-12 right-4 px-3 py-1.5 bg-black/80 backdrop-blur-md border border-gray-800/80 rounded-lg text-[10px] font-bold tracking-widest text-gray-400 select-none pointer-events-none z-20 shadow-lg flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                ROBOFLIX LMS PLAYER
              </div>

              {/* Custom Glassmorphic Controls overlay - high z-index (z-30) to capture click actions */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex flex-col gap-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300 z-30">
                {/* Progress Bar (Timeline Seek) */}
                <div className="flex items-center gap-3 w-full">
                  <span className="text-xs font-mono text-gray-300 select-none">{formatTime(currentTime)}</span>
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="flex-1 h-1.5 bg-gray-700/50 rounded-lg appearance-none cursor-pointer accent-red-600 outline-none focus:ring-1 focus:ring-red-600"
                    style={{
                      background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${(currentTime / (duration || 1)) * 100}%, rgba(55, 65, 81, 0.5) ${(currentTime / (duration || 1)) * 100}%, rgba(55, 65, 81, 0.5) 100%)`
                    }}
                  />
                  <span className="text-xs font-mono text-gray-300 select-none">{formatTime(duration)}</span>
                </div>

                {/* Buttons Container */}
                <div className="flex items-center justify-between w-full">
                  {/* Left side controls: Play/Pause, Seek back/forward, Volume slider */}
                  <div className="flex items-center gap-4">
                    {/* Play/Pause Button */}
                    <button
                      onClick={togglePlay}
                      className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full hover:text-red-500 text-white transition-all active:scale-95"
                      title={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                    </button>

                    {/* Skip Back 10s */}
                    <button
                      onClick={skipBackward}
                      className="p-1.5 hover:text-red-500 text-gray-300 transition-colors"
                      title="Skip Backward 10s"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    {/* Skip Forward 10s */}
                    <button
                      onClick={skipForward}
                      className="p-1.5 hover:text-red-500 text-gray-300 transition-colors"
                      title="Skip Forward 10s"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>

                    {/* Volume controls group */}
                    <div className="flex items-center gap-2 group/volume">
                      <button
                        onClick={toggleMute}
                        className="p-1.5 hover:text-red-500 text-gray-300 transition-colors"
                        title={isMuted ? "Unmute" : "Mute"}
                      >
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-0 group-hover/volume:w-20 transition-all duration-300 origin-left scale-x-0 group-hover/volume:scale-x-100 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600 outline-none"
                      />
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
                        className="p-1.5 hover:text-red-500 text-gray-300 transition-colors flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider"
                        title="Playback Speed"
                      >
                        <Gauge className="w-4 h-4" />
                        <span>{playbackSpeed === 1 ? "Normal" : `${playbackSpeed}x`}</span>
                      </button>

                      {/* Speed Selection Dropdown */}
                      {showSpeedMenu && (
                        <div className="absolute bottom-10 right-0 p-2 bg-gray-900/95 border border-gray-800 rounded-lg shadow-xl flex flex-col gap-1 z-20 min-w-[100px] backdrop-blur-md">
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                            <button
                              key={speed}
                              onClick={() => changeSpeed(speed)}
                              className={`px-3 py-1 text-left text-xs font-semibold rounded hover:bg-red-600 hover:text-white transition-colors ${
                                playbackSpeed === speed ? "text-red-500 bg-red-600/10" : "text-gray-300"
                              }`}
                            >
                              {speed === 1 ? "Normal" : `${speed}x`}
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
                        className="p-1.5 hover:text-red-500 text-gray-300 transition-colors flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider"
                        title="Video Quality"
                      >
                        <Settings className="w-4 h-4" />
                        <span>{getQualityName(playbackQuality)}</span>
                      </button>

                      {/* Quality Selection Dropdown */}
                      {showQualityMenu && (
                        <div className="absolute bottom-10 right-0 p-2 bg-gray-900/95 border border-gray-800 rounded-lg shadow-xl flex flex-col gap-1 z-20 min-w-[100px] backdrop-blur-md">
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
                              className={`px-3 py-1 text-left text-xs font-semibold rounded hover:bg-red-600 hover:text-white transition-colors ${
                                playbackQuality === opt.value ? "text-red-500 bg-red-600/10" : "text-gray-300"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Fullscreen Button */}
                    <button
                      onClick={handleFullscreen}
                      className="p-1.5 hover:text-red-500 text-gray-300 transition-colors"
                      title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    >
                      {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Episode Title & Info */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{episode.title}</h1>
            <p className="text-red-500 font-semibold text-sm uppercase tracking-wider mb-4">{season.title}</p>
            <p className="text-gray-400 text-sm sm:text-base mb-6">{episode.duration}</p>

            {/* Ask Doubt Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => setShowDoubtForm(!showDoubtForm)}
              className="mb-6 flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Ask Doubt on WhatsApp
            </motion.button>

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
                {episode.files.map((file, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-gray-900 border border-gray-800 hover:border-red-600 rounded-lg transition-colors flex items-center gap-3 cursor-pointer hover:bg-gray-800"
                  >
                    <div className="w-10 h-10 bg-red-600/20 rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-red-500 text-sm font-bold">📄</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{file.name}</p>
                      <p className="text-gray-500 text-xs">{file.type}</p>
                    </div>
                  </div>
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
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="w-full md:w-80 order-1 md:order-2 flex flex-col h-fit sticky top-20"
          >
            <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
              {/* All Episodes Header */}
              <div className="p-4 border-b border-gray-800 bg-black/50">
                <h3 className="font-bold text-white text-sm">All Episodes (S1-S5)</h3>
              </div>

              {/* Episodes List */}
              <div className="max-h-[600px] overflow-y-auto">
                {SEASONS_DATA.map((s) => (
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
    </div>
  )
}

