"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    question: "Do I need prior coding experience?",
    answer: "No. Season 1 starts from absolute zero. Episode 1 assumes you've never written a single line of code."
  },
  {
    question: "What device do I need?",
    answer: "A laptop (Windows/Mac/Linux) and a smartphone to watch episodes. No high-end PC required."
  },
  {
    question: "What if I miss a live session?",
    answer: "All live sessions are recorded and uploaded within 24 hours. You never miss content."
  },
  {
    question: "Is the ₹989 a one-time payment?",
    answer: "₹989 is your first month (Entry Pass). After that, it's ₹299/month to continue. Cancel anytime — no questions asked."
  },
  {
    question: "What if I don't have access to components?",
    answer: "The moment you enroll, we send you a direct buy-link shopping list for every component. Everything is available on Amazon/Flipkart and fits under ₹1,500."
  },
  {
    question: "Is there a refund policy?",
    answer: "Yes. 30-day money-back guarantee. No questions. No guilt."
  }
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="px-6 py-24 bg-black/40">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-4">FAQ</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white">
            Common questions, honest answers.
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full text-left p-6 bg-black/60 border border-gray-800 rounded-lg hover:border-red-600/40 transition-all"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white text-lg">{faq.question}</h3>
                  <ChevronDown
                    className={`w-5 h-5 text-red-600 transition-transform ${
                      openIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </div>

                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-4 pt-4 border-t border-gray-700"
                    >
                      <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
