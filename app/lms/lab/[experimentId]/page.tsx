"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Cpu, Sparkles, AlertCircle } from "lucide-react"
import { EXPERIMENT_CONFIGS } from "@/lib/lab/experimentConfigs"
import { PlacedComponent, WireConnection, runClientSideSimulation } from "@/lib/lab/simulationEngine"
import ComponentPalette from "@/components/lab/ComponentPalette"
import WiringCanvas from "@/components/lab/WiringCanvas"
import CodeEditor from "@/components/lab/CodeEditor"
import SerialMonitor from "@/components/lab/SerialMonitor"
import { isSupabaseConfigured } from "@/lib/supabase"

interface User {
  email: string
}

export default function VirtualLabPage() {
  const params = useParams()
  const router = useRouter()
  const experimentId = params.experimentId as string

  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load experiment configuration
  const config = EXPERIMENT_CONFIGS[experimentId]

  // Placed components on canvas
  const [placedComponents, setPlacedComponents] = useState<PlacedComponent[]>([])
  
  // Wires connected
  const [connections, setConnections] = useState<WireConnection[]>([])

  // Editor C++ source code
  const [code, setCode] = useState("")

  // Simulation telemetry state
  const [logs, setLogs] = useState<string[]>([])
  const [isSimulating, setIsSimulating] = useState(false)
  const [passed, setPassed] = useState<boolean | null>(null)
  const [xpAwarded, setXpAwarded] = useState(0)
  const [simulationHint, setSimulationHint] = useState<string | undefined>(undefined)

  // Uploading state
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStepText, setUploadStepText] = useState("")

  // 1. Session Protection and Access Control
  useEffect(() => {
    const checkSession = () => {
      try {
        let loggedInEmail = ""
        const storedUser = localStorage.getItem("lms_user")
        if (storedUser) {
          const parsed = JSON.parse(storedUser)
          loggedInEmail = parsed.email || ""
        }

        if (loggedInEmail) {
          setUser({ email: loggedInEmail })
          setIsLoading(false)
        } else {
          // Redirect to login if not logged in
          router.push("/lms/login")
        }
      } catch (err) {
        router.push("/lms/login")
      }
    }

    checkSession()
  }, [router])

  // 2. Load Persisted State from localStorage (Autosave Restore)
  useEffect(() => {
    if (isLoading || !config) return

    const savedCodeKey = `roboflix_lab_code_${config.id}`
    const savedCompsKey = `roboflix_lab_comps_${config.id}`
    const savedConnsKey = `roboflix_lab_conns_${config.id}`

    const localCode = localStorage.getItem(savedCodeKey)
    const localComps = localStorage.getItem(savedCompsKey)
    const localConns = localStorage.getItem(savedConnsKey)

    if (localCode) {
      setCode(localCode)
    } else {
      setCode(config.starterCode)
    }

    if (localComps) {
      try {
        setPlacedComponents(JSON.parse(localComps))
      } catch (e) {
        console.error(e)
      }
    } else {
      setPlacedComponents([])
    }

    if (localConns) {
      try {
        setConnections(JSON.parse(localConns))
      } catch (e) {
        console.error(e)
      }
    } else {
      setConnections([])
    }

    // Reset console output state on load
    setLogs([])
    setPassed(null)
    setXpAwarded(0)
    setSimulationHint(undefined)

  }, [isLoading, config])

  // 3. AutoSave System on State changes
  const autoSave = useCallback((updatedCode: string, updatedComps: PlacedComponent[], updatedConns: WireConnection[]) => {
    if (!config) return
    localStorage.setItem(`roboflix_lab_code_${config.id}`, updatedCode)
    localStorage.setItem(`roboflix_lab_comps_${config.id}`, JSON.stringify(updatedComps))
    localStorage.setItem(`roboflix_lab_conns_${config.id}`, JSON.stringify(updatedConns))
  }, [config])

  const handleCodeChange = (newVal: string) => {
    setCode(newVal)
    autoSave(newVal, placedComponents, connections)
  }

  const handleUpdateComponents = (newComps: PlacedComponent[]) => {
    setPlacedComponents(newComps)
    autoSave(code, newComps, connections)
  }

  const handleUpdateConnections = (newConns: WireConnection[]) => {
    setConnections(newConns)
    autoSave(code, placedComponents, newConns)
  }

  // Drag start from palette
  const handleDragStart = (e: React.DragEvent, componentId: string) => {
    e.dataTransfer.setData("text/plain", componentId)
  }

  // 3b. Upload Code Flashing HUD Simulation
  const handleUploadCode = () => {
    if (!config) return
    setIsUploading(true)
    setUploadProgress(0)
    setUploadStepText("Checking syntax rules & compiling compiler variables...")
    setPassed(null)
    setSimulationHint(undefined)

    const steps = [
      { progress: 15, text: "Compiling code sketch.ino.cpp using avr-g++ compiler..." },
      { progress: 35, text: "Scanning USB serial ports for active microcontrollers..." },
      { progress: 55, text: "Found board on Virtual COM3. Initiating flash upload..." },
      { progress: 75, text: "Writing memory pages: 42% [====          ]" },
      { progress: 90, text: "Writing memory pages: 100% [==========]" },
      { progress: 100, text: "Flash write verification successful! Board resetting..." }
    ]

    let stepIdx = 0
    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        setUploadProgress(steps[stepIdx].progress)
        setUploadStepText(steps[stepIdx].text)
        stepIdx++
      } else {
        clearInterval(interval)
        setIsUploading(false)
        handleRunSimulation()
      }
    }, 450)
  }

  // 4. Run Client-Side Simulation & grading
  const handleRunSimulation = () => {
    if (!config) return
    setIsSimulating(true)
    setLogs(["⚙️ Starting build environment...", "🔨 Checking circuit connectivity rules..."])
    setPassed(null)
    setXpAwarded(0)
    setSimulationHint(undefined)

    // Simulate standard 1.5 seconds microcontroller boot-time delay
    setTimeout(() => {
      const res = runClientSideSimulation(code, placedComponents, connections, config)
      
      setLogs(res.logs)
      setPassed(res.passed)
      setXpAwarded(res.xpAwarded)
      setSimulationHint(res.hint)
      setIsSimulating(false)

      if (res.passed) {
        // Record completed experiment in localStorage to sync back to watch/dashboard pages
        const completed = localStorage.getItem("roboflix_completed_experiments")
        let list: string[] = []
        if (completed) {
          try {
            list = JSON.parse(completed)
          } catch {}
        }
        if (!list.includes(config.id)) {
          list.push(config.id)
          localStorage.setItem("roboflix_completed_experiments", JSON.stringify(list))
        }
      }
    }, 1500)
  }

  const handleClearLogs = () => {
    setLogs([])
    setPassed(null)
    setXpAwarded(0)
    setSimulationHint(undefined)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-mono text-gray-500">Checking lab credentials...</p>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-white text-center">
        <div className="max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-6">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
          <div>
            <h1 className="text-xl font-bold">Experiment Configuration Missing</h1>
            <p className="text-gray-400 text-sm mt-2">
              The Virtual Lab experiment ID <span className="font-mono text-red-400">"{experimentId}"</span> is currently under construction or does not exist.
            </p>
          </div>
          <Link href="/lms/dashboard">
            <button className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-xs font-bold rounded-lg transition-all cursor-pointer">
              Go to Dashboard
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-[#070707] flex flex-col overflow-hidden text-white font-sans antialiased">
      {/* Dynamic RoboFlix Premium Navigation Header */}
      <header className="h-16 border-b border-gray-800 bg-black flex items-center justify-between px-6 flex-shrink-0 z-40 select-none">
        <div className="flex items-center gap-6">
          <Link href="/">
            <span className="text-xl sm:text-2xl font-bold cursor-pointer">
              ROBO<span className="text-red-600">FLIX</span>
            </span>
          </Link>

          {/* Vertical Divider */}
          <span className="h-5 w-[1px] bg-gray-800 hidden sm:inline" />

          {/* Active Lab Title Info */}
          <div className="hidden sm:flex items-center gap-2">
            <Cpu className="w-4 h-4 text-red-600" />
            <span className="text-xs font-mono font-bold text-gray-300 uppercase tracking-widest">
              Virtual Sandbox IDE
            </span>
          </div>
        </div>

        {/* Action Controls & Navigation Link */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-xs font-semibold transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-red-500" />
            Watch Lecture
          </button>
        </div>
      </header>

      {/* Main 3-Panel IDE Content Body */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Panel 1: Draggable Component Palette & instructions */}
        <ComponentPalette
          config={config}
          onDragStart={handleDragStart}
        />

        {/* Panel 2: Snap-to-Grid Wiring Canvas SVG area */}
        <WiringCanvas
          placedComponents={placedComponents}
          connections={connections}
          onUpdateComponents={handleUpdateComponents}
          onUpdateConnections={handleUpdateConnections}
          isSimulating={isSimulating}
          onRun={handleRunSimulation}
          onUpload={handleUploadCode}
          onClear={handleClearLogs}
          passed={passed}
        />

        {/* Panel 3: Code Editor & Serial monitor vertical split */}
        <div className="w-[380px] bg-[#0c0c0c] border-l border-gray-800 flex flex-col h-full flex-shrink-0 min-w-[280px]">
          {/* Top Monaco Editor wrapper */}
          <CodeEditor
            code={code}
            onChange={handleCodeChange}
          />

          {/* Bottom terminal simulated logger */}
          <SerialMonitor
            logs={logs}
            isSimulating={isSimulating}
            onRun={handleRunSimulation}
            onUpload={handleUploadCode}
            onClear={handleClearLogs}
            passed={passed}
            xpAwarded={xpAwarded}
            hint={simulationHint}
          />
        </div>
      </div>

      {/* Code Uploading Progress HUD Overlay */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center select-none"
          >
            <div className="max-w-md w-full mx-4 p-8 bg-gray-900/90 border border-red-650/40 rounded-2xl shadow-[0_30px_70px_rgba(0,0,0,0.95)] text-center space-y-6">
              <div className="w-16 h-16 bg-red-600/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-500 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                <Cpu className="w-8 h-8" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white font-sans uppercase tracking-wider">
                  Uploading Sketch to Board
                </h3>
                <p className="text-[11px] font-mono text-gray-400 h-10 flex items-center justify-center leading-relaxed">
                  {uploadStepText}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden border border-white/5 p-0.5">
                  <motion.div
                    style={{ width: `${uploadProgress}%` }}
                    className="h-full bg-red-600 rounded-full shadow-[0_0_8px_#E50914]"
                    transition={{ ease: "easeInOut" }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-gray-500 font-bold">
                  <span>Virtual COM3</span>
                  <span>{uploadProgress}%</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
