"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { BookOpen, Cpu, Sparkles, HelpCircle } from "lucide-react"
import { ExperimentConfig, LAB_COMPONENTS } from "@/lib/lab/experimentConfigs"

interface ComponentPaletteProps {
  config: ExperimentConfig
  onDragStart: (e: React.DragEvent, componentId: string) => void
}

export default function ComponentPalette({ config, onDragStart }: ComponentPaletteProps) {
  const [activeSubTab, setActiveSubTab] = useState<"brief" | "components">("brief")

  const requiredComponents = Object.values(LAB_COMPONENTS).filter(c => 
    config.components.includes(c.id)
  )

  const additionalComponents = Object.values(LAB_COMPONENTS).filter(c => 
    !config.components.includes(c.id)
  )

  return (
    <div className="w-[280px] bg-[#0c0c0c] border-r border-gray-800 flex flex-col h-full flex-shrink-0 text-white select-none">
      {/* Panel Selector Header */}
      <div className="grid grid-cols-2 border-b border-gray-800 text-xs uppercase font-semibold tracking-wider text-center">
        <button
          onClick={() => setActiveSubTab("brief")}
          className={`py-3 flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === "brief"
              ? "text-red-500 border-b-2 border-red-600 bg-red-950/5"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Brief
        </button>
        <button
          onClick={() => setActiveSubTab("components")}
          className={`py-3 flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === "components"
              ? "text-red-500 border-b-2 border-red-600 bg-red-950/5"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          Parts
        </button>
      </div>

      {/* Panel Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeSubTab === "brief" ? (
          <div className="space-y-5">
            <div>
              <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mb-1">
                LMS Virtual Lab
              </p>
              <h2 className="text-base font-bold leading-tight text-white">
                {config.title}
              </h2>
            </div>

            {/* Objective Card */}
            <div className="p-3.5 bg-gray-900/60 border border-gray-800/80 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-red-400 font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                Lesson Objective
              </div>
              <p className="text-xs text-gray-300 leading-relaxed font-sans">
                {config.objective}
              </p>
            </div>

            {/* Hints Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold uppercase tracking-wider">
                <HelpCircle className="w-3.5 h-3.5" />
                Quick Steps
              </div>
              <ul className="space-y-2.5 text-[11px] text-gray-400 font-sans list-disc list-inside leading-relaxed">
                <li>Drag the required parts from the <b>Parts</b> tab onto the central wire grid.</li>
                <li>Hover over hardware connection pins to highlight and draw connections.</li>
                <li>Connect signal lines to the correct designated Arduino pins.</li>
                <li>Ensure power (<b>5V/3V3</b>) and ground (<b>GND</b>) lanes are completely wired.</li>
                <li>Click <b>Run Simulation</b> to test compilation and validation keywords!</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                Hardware Bin
              </h3>
              <p className="text-[10px] text-gray-500">
                Drag parts onto the wire canvas grid below.
              </p>
            </div>

            {/* Required Components Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] text-red-500 font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                Required Components
              </div>
              <div className="grid grid-cols-1 gap-2">
                {requiredComponents.length > 0 ? (
                  requiredComponents.map(item => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, item.id)}
                      className="p-3 bg-gray-900 border border-red-950 hover:border-red-600/40 rounded-xl transition-all cursor-grab active:cursor-grabbing flex items-center gap-3.5 group hover:bg-red-950/5 relative overflow-hidden text-left"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-red-600" />
                      <div className="w-9 h-9 bg-red-600/10 border border-red-500/10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 transition-colors overflow-hidden">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain p-0.5" />
                        ) : (
                          item.icon
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white group-hover:text-red-400 transition-colors truncate">
                          {item.name}
                        </p>
                        <p className="text-[9px] text-gray-500 mt-0.5">
                          {item.pins.length} Pins
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-3 text-gray-600 text-xs italic">
                    No required components.
                  </div>
                )}
              </div>
            </div>

            {/* Additional Components Section */}
            <div className="space-y-2 pt-3 border-t border-gray-800/80">
              <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                Additional Hardware Spares
              </div>
              <div className="grid grid-cols-1 gap-2">
                {additionalComponents.length > 0 ? (
                  additionalComponents.map(item => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, item.id)}
                      className="p-3 bg-gray-950/60 border border-gray-900 hover:border-gray-800 rounded-xl transition-all cursor-grab active:cursor-grabbing flex items-center gap-3 group hover:bg-white/5 relative overflow-hidden opacity-75 hover:opacity-100 text-left"
                    >
                      <div className="w-9 h-9 bg-white/5 border border-white/5 rounded-lg flex items-center justify-center text-lg flex-shrink-0 transition-colors overflow-hidden">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain p-0.5" />
                        ) : (
                          item.icon
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-300 group-hover:text-white transition-colors truncate">
                          {item.name}
                        </p>
                        <p className="text-[9px] text-gray-500 mt-0.5">
                          {item.pins.length} Pins
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-3 text-gray-600 text-xs italic">
                    No hardware spares.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
