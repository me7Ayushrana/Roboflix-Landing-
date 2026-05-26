"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, PlayCircle, ChevronDown } from "lucide-react"
import { SEASONS_DATA } from "@/lib/lms-data"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

export default function SeasonPage() {
  const params = useParams()
  const router = useRouter()
  const seasonId = parseInt(params.seasonId as string)
  const [seasonsData, setSeasonsData] = useState(SEASONS_DATA)
  const season = seasonsData.find((s) => s.id === seasonId) || SEASONS_DATA.find((s) => s.id === seasonId)
  const [showAllEpisodes, setShowAllEpisodes] = useState(false)
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("roboflix_lms_seasons")
      if (stored) {
        try {
          setSeasonsData(JSON.parse(stored))
        } catch (e) {
          console.error(e)
        }
      }
    }
  }, [])

  useEffect(() => {
    const checkSession = async () => {
      try {
        if (isSupabaseConfigured()) {
          const { data: { session } } = await supabase.auth.getSession()
          if (session && session.user) {
            setIsLoading(false)
            return
          }
        }
        
        // Fallback to local storage if Supabase is not configured or has no active session
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
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl font-medium">Loading...</div>
      </div>
    )
  }

  if (!season) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div>Season not found</div>
      </div>
    )
  }

  // Show 2 episodes by default, show all if button clicked
  const visibleEpisodes = showAllEpisodes ? season.episodes : season.episodes.slice(0, 2)
  const hasMoreEpisodes = season.episodes.length > 2

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur border-b border-gray-800">
        <div className="px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link href="/lms/dashboard" className="hover:text-red-500 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <Link href="/">
            <span className="text-xl sm:text-2xl font-bold">
              ROBO<span className="text-red-600">FLIX</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 py-8 max-w-6xl mx-auto">
        {/* Season Header */}
        <div className="relative h-40 sm:h-56 rounded-lg overflow-hidden mb-8">
          <img
            src={season.image}
            alt={season.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6 sm:p-8">
            <p className="text-red-500 font-semibold text-sm uppercase tracking-wider mb-2">{season.subtitle}</p>
            <h1 className="text-3xl sm:text-5xl font-bold text-white">{season.title}</h1>
          </div>
        </div>

        {/* Season Description */}
        <div className="mb-12">
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-2xl">{season.description}</p>
        </div>

        {/* Episodes Section */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Episodes</h2>
          <div className="space-y-4">
            {visibleEpisodes.map((episode) => (
              <Link key={episode.id} href={`/lms/watch/${season.id}/${episode.id}`}>
                <motion.div
                  whileHover={{ backgroundColor: "rgba(31, 41, 55, 0.8)" }}
                  className="p-5 sm:p-6 bg-gray-900/50 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer group border border-gray-800/50 hover:border-red-600/30"
                >
                  <div className="flex items-start gap-4 sm:gap-6">
                    {/* Play Button */}
                    <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-800 rounded flex-shrink-0 flex items-center justify-center group-hover:bg-red-600/20 transition-colors border border-gray-700">
                      <PlayCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 group-hover:text-red-400" />
                    </div>

                    {/* Episode Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-semibold text-white group-hover:text-red-500 transition-colors mb-2">
                        {episode.title}
                      </h3>
                      <p className="text-gray-400 text-sm sm:text-base mb-3 line-clamp-2">{episode.description}</p>
                      <p className="text-gray-500 text-xs sm:text-sm">{episode.duration}</p>
                    </div>

                    {/* Arrow Icon */}
                    <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0 mt-1 group-hover:text-red-500 transition-colors hidden sm:block" />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>

          {/* Show All Button */}
          {hasMoreEpisodes && !showAllEpisodes && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => setShowAllEpisodes(true)}
              className="mt-6 w-full py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
            >
              Show All {season.episodes.length} Episodes
            </motion.button>
          )}

          {/* Hide Episodes Button */}
          {showAllEpisodes && hasMoreEpisodes && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => setShowAllEpisodes(false)}
              className="mt-6 w-full py-3 px-6 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors border border-gray-700"
            >
              Show Less
            </motion.button>
          )}
        </div>
      </main>
    </div>
  )
}
