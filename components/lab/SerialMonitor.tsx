"use client"

import { Play, RotateCcw, Trash2, Award, AlertCircle } from "lucide-react"

interface SerialMonitorProps {
  logs: string[]
  isSimulating: boolean
  onRun: () => void
  onClear: () => void
  passed: boolean | null
  xpAwarded: number
  hint?: string
}

export default function SerialMonitor({
  logs,
  isSimulating,
  onRun,
  onClear,
  passed,
  xpAwarded,
  hint
}: SerialMonitorProps) {
  return (
    <div className="h-[40%] bg-[#0c0c0c] flex flex-col min-h-[160px] text-white">
      {/* Console Header Control bar */}
      <div className="h-10 border-b border-gray-800 bg-[#0d0d0d] flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 font-mono">
            Serial Monitor
          </span>
        </div>

        {/* Console Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            className="p-1 text-gray-500 hover:text-gray-300 transition"
            title="Clear Terminal Output"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={onRun}
            disabled={isSimulating}
            className="flex items-center gap-1.5 px-3 py-1 bg-red-650 hover:bg-red-600 disabled:opacity-50 text-xs font-bold text-white rounded-lg transition-all shadow-lg shadow-red-600/10 cursor-pointer"
          >
            <Play className={`w-3 h-3 ${isSimulating ? "animate-spin" : ""}`} />
            {isSimulating ? "Running..." : "Run"}
          </button>
        </div>
      </div>

      {/* Terminal logs list */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed space-y-1 bg-black/40 custom-scrollbar select-text selection:bg-red-600/30">
        {logs.length > 0 ? (
          logs.map((log, idx) => {
            const isError = log.includes("❌") || log.includes("ERROR")
            const isWarning = log.includes("⚠️") || log.includes("WARNING")
            const isSuccess = log.includes("🎉") || log.includes("SUCCESS") || log.includes("🏆")
            const isSystem = log.includes("[SYSTEM]")
            
            let colorClass = "text-gray-300"
            if (isError) colorClass = "text-red-500 font-bold"
            else if (isWarning) colorClass = "text-yellow-500"
            else if (isSuccess) colorClass = "text-green-400 font-bold"
            else if (isSystem) colorClass = "text-blue-400 font-semibold"

            return (
              <p key={idx} className={colorClass}>
                {log}
              </p>
            )
          })
        ) : (
          <p className="text-gray-600 italic">Console offline. Connect hardware and click Run to start serial telemetry...</p>
        )}
      </div>

      {/* Dynamic Grading Banner Footer overlay */}
      {passed !== null && (
        <div className={`px-4 py-2 border-t flex items-center justify-between text-xs transition-all ${
          passed 
            ? "bg-green-950/20 border-green-800 text-green-400"
            : "bg-yellow-950/20 border-yellow-800/80 text-yellow-400"
        }`}>
          <div className="flex items-center gap-2">
            {passed ? (
              <Award className="w-4 h-4 text-green-400 animate-bounce" />
            ) : (
              <AlertCircle className="w-4 h-4 text-yellow-400" />
            )}
            <span className="font-bold font-sans">
              {passed 
                ? `Experiment Passed! +${xpAwarded} XP awarded! 🏆`
                : `Incorrect Circuit Output: Try Again`
              }
            </span>
          </div>

          {!passed && hint && (
            <p className="text-[10px] text-yellow-500 max-w-[60%] font-sans truncate" title={hint}>
              <b>Hint:</b> {hint}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
