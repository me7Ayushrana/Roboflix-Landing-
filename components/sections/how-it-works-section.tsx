"use client"

import { motion } from "framer-motion"
import { CheckCircle } from "lucide-react"

const steps = [
  {
    number: 1,
    title: "Enroll Once",
    description: "Pay ₹989. Get instant access to all Season 1 episodes, source codes, CAD files and WhatsApp support community. No setup. No waiting. You are building within the hour.",
  },
  {
    number: 2,
    title: "Watch, Build, Repeat",
    description: "Every episode is one project step forward. Watch on any device. Build the actual robot with your hands. Get stuck? WhatsApp us — we reply within 24 hours.",
  },
  {
    number: 3,
    title: "Show What You Built",
    description: "Post your robot. Add it to your resume. Walk into every placement, interview, and opportunity with proof — not just certificates.",
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="px-6 py-24 bg-black/40">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-4">The Process</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            No confusion. No fluff. Here&apos;s exactly what happens.
          </h2>
        </motion.div>

        <div className="space-y-8">
          {steps.map((step, idx) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="flex gap-6 p-6 md:p-8 rounded-xl border border-red-600/20 hover:border-red-600/60 bg-black/60 transition-all duration-300"
            >
              {/* Step Number */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-red-600 text-white font-bold text-lg flex items-center justify-center">
                  {step.number}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                  Step {step.number} — {step.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
