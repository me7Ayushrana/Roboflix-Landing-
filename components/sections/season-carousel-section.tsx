'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const seasons = [
  {
    id: 1,
    code: 'S1',
    title: 'ORIGIN',
    subtitle: 'THE SYSTEM WAKES',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/S1%20%281%29-avz4ahw0hI3JddejJeXYP8Ed4bKc9K.png',
  },
  {
    id: 2,
    code: 'S2',
    title: 'CONTROL',
    subtitle: 'BUILD AND CONTROL SOPHISTICATED ROBOTIC ARMS',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/S2%20%281%29-rU2rPX8hGi2c1LOutkX2CoL7hAqFoG.png',
  },
  {
    id: 3,
    code: 'S3',
    title: 'AUTONOMY',
    subtitle: 'AUTONOMOUS ROVER',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/S3%20%281%29-xJgsDujGZ0440jd5eu7f49LdWzxCjA.png',
  },
  {
    id: 4,
    code: 'S4',
    title: 'EVOLUTION',
    subtitle: 'QUADRUPED FROM ZERO',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/S4%20%281%29-pO9BYTlVhXs1Cj6vo4WpSHw5VjVXxy.png',
  },
  {
    id: 5,
    code: 'S5',
    title: 'DOMINATION',
    subtitle: 'WORLD MAP ROBOTICS',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/S5%20%281%29-vpVCImz82kmtIbajCNWs0Pvo4QiVN1.png',
  },
]

export function SeasonCarouselSection() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  }

  const paginate = (newDirection: number) => {
    setDirection(newDirection)
    setCurrentIndex((prevIndex) => (prevIndex + newDirection + seasons.length) % seasons.length)
  }

  const currentSeason = seasons[currentIndex]

  return (
    <section id="seasons" className="relative w-full bg-black py-8 md:py-12 overflow-hidden">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Carousel Container */}
        <div className="relative w-full aspect-video sm:aspect-auto sm:h-80 md:h-96 lg:h-[500px] rounded-xl sm:rounded-2xl overflow-hidden bg-black border border-gray-800">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={(e, info) => {
                const swipeThreshold = 50
                if (info.offset.x < -swipeThreshold) {
                  paginate(1)
                } else if (info.offset.x > swipeThreshold) {
                  paginate(-1)
                }
              }}
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.5 },
              }}
              className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
            >
              <img
                src={currentSeason.image}
                alt={currentSeason.title}
                className="w-full h-full object-contain bg-black select-none pointer-events-none"
              />
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <button
            onClick={() => paginate(-1)}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-red-600/80 hover:bg-red-600 text-white transition-all duration-300 hover:scale-110"
            aria-label="Previous season"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <button
            onClick={() => paginate(1)}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-red-600/80 hover:bg-red-600 text-white transition-all duration-300 hover:scale-110"
            aria-label="Next season"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Dot Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex justify-center gap-2 sm:gap-3 mt-6 sm:mt-8"
        >
          {seasons.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setDirection(idx > currentIndex ? 1 : -1)
                setCurrentIndex(idx)
              }}
              className={`transition-all duration-300 rounded-full ${
                idx === currentIndex
                  ? 'bg-red-600 w-6 sm:w-8 h-2.5 sm:h-3'
                  : 'bg-gray-600 w-2.5 sm:w-3 h-2.5 sm:h-3 hover:bg-gray-500'
              }`}
              aria-label={`Go to season ${idx + 1}`}
            />
          ))}
        </motion.div>

        {/* Season Counter */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-gray-400 text-xs sm:text-sm mt-4 sm:mt-6"
        >
          Season {currentIndex + 1} of {seasons.length}
        </motion.p>
      </div>
    </section>
  )
}
