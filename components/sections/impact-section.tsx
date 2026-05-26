"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const seasons = [
  {
    number: 1,
    image: "/season-1.png",
  },
  {
    number: 2,
    image: "/season-2.png",
  },
  {
    number: 3,
    image: "/season-3.png",
  },
  {
    number: 4,
    image: "/season-4.png",
  },
  {
    number: 5,
    image: "/season-5.png",
  },
]

export function ImpactSection() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)
  const autoPlayTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isAutoPlaying) return

    autoPlayTimer.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % seasons.length)
    }, 5000)

    return () => {
      if (autoPlayTimer.current) clearInterval(autoPlayTimer.current)
    }
  }, [isAutoPlaying])

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + seasons.length) % seasons.length)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % seasons.length)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext()
      } else {
        handlePrev()
      }
    }
  }

  return (
    <section className="px-0 py-24 bg-black/40">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-red-600 uppercase tracking-wider mb-4">5 Seasons</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            Your Robotics <span className="text-red-600">Journey</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-balance text-lg">
            From zero to robotics hero. 5 seasons, 54+ episodes, infinite possibilities.
          </p>
        </div>
      </div>

      {/* Netflix-style Carousel */}
      <div className="relative group w-full">
        {/* Carousel Container */}
        <div
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
          className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[500px] overflow-hidden"
        >
          {/* Carousel Track */}
          <div
            className="flex h-full transition-transform duration-700 ease-out"
            style={{
              transform: `translateX(calc(-${currentIndex * 100}%))`,
            }}
          >
            {seasons.map((season) => (
              <div
                key={season.number}
                className="w-full h-full flex-shrink-0 flex items-center justify-center px-2 sm:px-4"
              >
                <img
                  src={season.image}
                  alt={`Season ${season.number}`}
                  className="h-full w-auto object-contain rounded-lg border border-red-600/20"
                />
              </div>
            ))}
          </div>

          {/* Left Navigation Button */}
          <button
            onClick={handlePrev}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-black/60 hover:bg-red-600 text-white transition-all duration-300"
            aria-label="Previous season"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Right Navigation Button */}
          <button
            onClick={handleNext}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-black/60 hover:bg-red-600 text-white transition-all duration-300"
            aria-label="Next season"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Dot Indicators */}
        <div className="flex justify-center gap-2 mt-6 px-6">
          {seasons.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? "bg-red-600 w-8"
                  : "bg-gray-600 w-2 hover:bg-gray-400"
              }`}
              aria-label={`Go to season ${idx + 1}`}
            />
          ))}
        </div>

        {/* Season Counter */}
        <div className="text-center mt-4 text-gray-400 text-sm">
          Season {currentIndex + 1} of {seasons.length}
        </div>
      </div>
    </section>
  )
}
