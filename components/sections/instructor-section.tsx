"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"

const instructors = [
  {
    id: "ishinder",
    name: "Ishinder Singh",
    role: "Founder, XAIR AI Robotics · Embedded Systems Engineer",
    photo: "/founder-ishinder.jpg",
    alt: "Ishinder Singh - Founder XAIR AI Robotics",
    bio: [
      "I didn't learn robotics in a classroom. I learned it by breaking things, debugging at 2am, and figuring out why my servo wasn't responding at 3am.",
      <>I run active R&D projects for real clients — hotels, defence, industrial automation. <span className="text-white font-semibold">The robots here are not demo projects. They are real machines built for real deployments.</span></>,
      "I built Roboflix because no college ever taught me what I actually needed. Every episode is what I wish someone had taught me.",
    ],
    tags: ["Embedded Systems", "ROS2", "Defence R&D", "Industrial Automation"],
  },
  {
    id: "ayush",
    name: "Ayush Rana",
    role: "Founder @Ethereal-Nexus · Co-Founder @Roboflix · IoT & Robotics Engineer · Full-Stack Dev",
    photo: "/founder-ayush.jpg",
    alt: "Ayush Rana - Co-Founder Roboflix",
    bio: [
      <>I don&apos;t just study technology — <span className="text-white font-semibold">I ship it.</span></>,
      "While most students are learning frameworks in theory, I've built and deployed some production tools used by real people.",
      "From writing firmware that talks to hardware, to deploying full-stack apps that serve users — I work across the entire stack. Every lesson I teach, I've already battle-tested in the wild.",
    ],
    tags: ["IoT & Robotics", "Full-Stack Dev", "Firmware", "Production Deployments"],
  },
]

export function InstructorSection() {
  const [activeIdx, setActiveIdx] = useState(0)
  const [direction, setDirection] = useState(1)

  const goTo = (idx: number) => {
    setDirection(idx > activeIdx ? 1 : -1)
    setActiveIdx(idx)
  }
  const prev = () => goTo(activeIdx === 0 ? instructors.length - 1 : activeIdx - 1)
  const next = () => goTo(activeIdx === instructors.length - 1 ? 0 : activeIdx + 1)

  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -60 : 60 }),
  }

  const instructor = instructors[activeIdx]

  return (
    <section className="px-6 py-24 bg-black/40">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-4">Your Guides</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-12">
            Who teaches you
          </h2>
        </motion.div>

        {/* Card + Nav Row */}
        <div className="relative max-w-3xl mx-auto">

          {/* Left Arrow */}
          <button
            onClick={prev}
            aria-label="Previous instructor"
            className="absolute -left-5 md:-left-14 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-black border border-red-600/30 hover:border-red-600/80 hover:bg-red-600/10 text-gray-400 hover:text-white shadow-lg transition-all duration-200 group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={next}
            aria-label="Next instructor"
            className="absolute -right-5 md:-right-14 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-black border border-red-600/30 hover:border-red-600/80 hover:bg-red-600/10 text-gray-400 hover:text-white shadow-lg transition-all duration-200 group"
          >
            <ChevronRight className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>

          {/* Animated Card */}
          <div className="overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={instructor.id}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="border border-red-600/20 rounded-xl bg-black/60 p-8 md:p-12 hover:border-red-600/50 transition-all">
                  {/* Photo */}
                  <div className="mb-8 flex justify-center">
                    <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-red-600/40 shadow-lg">
                      <img
                        src={instructor.photo}
                        alt={instructor.alt}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                  </div>

                  {/* Name & Role */}
                  <div className="text-center mb-8">
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">{instructor.name}</h3>
                    <p className="text-red-600 font-semibold text-base md:text-lg leading-snug">{instructor.role}</p>
                  </div>

                  {/* Bio */}
                  <div className="space-y-6 text-gray-300 leading-relaxed">
                    {instructor.bio.map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap justify-center gap-3 mt-8 pt-8 border-t border-gray-700">
                    {instructor.tags.map((tag) => (
                      <span key={tag} className="px-4 py-2 bg-red-600/10 border border-red-600/30 rounded-full text-sm text-gray-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dot indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {instructors.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to instructor ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === activeIdx ? "w-6 bg-red-600" : "w-2 bg-gray-600 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
