"use client"

import { useState, useRef, useEffect } from "react"
import { ZoomIn, ZoomOut, RotateCcw, Trash2, Sliders, Cpu, Play, Pause, Undo } from "lucide-react"
import { LAB_COMPONENTS } from "@/lib/lab/experimentConfigs"
import { PlacedComponent, WireConnection } from "@/lib/lab/simulationEngine"

interface WiringCanvasProps {
  placedComponents: PlacedComponent[]
  connections: WireConnection[]
  onUpdateComponents: (comps: PlacedComponent[]) => void
  onUpdateConnections: (conns: WireConnection[]) => void
  isSimulating?: boolean
  onRun?: () => void
  onUpload?: () => void
  onClear?: () => void
  passed?: boolean | null
}

export default function WiringCanvas({
  placedComponents,
  connections,
  onUpdateComponents,
  onUpdateConnections,
  isSimulating,
  onRun,
  onUpload,
  onClear,
  passed
}: WiringCanvasProps) {
  const [zoom, setZoom] = useState(1.0)
  const [activeWireColor, setActiveWireColor] = useState<string>("red")
  const [draggingCompId, setDraggingCompId] = useState<string | null>(null)
  
  // Drawing Wire State
  const [wireStart, setWireStart] = useState<{ compId: string; pinId: string; x: number; y: number } | null>(null)
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  const canvasRef = useRef<HTMLDivElement>(null)
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Undo history stack for wire connections
  const [connectionsHistory, setConnectionsHistory] = useState<WireConnection[][]>([])

  // Mouse scroll wheel & trackpad pinch-to-zoom event listener
  useEffect(() => {
    const canvasDiv = canvasRef.current
    if (!canvasDiv) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY < 0 ? 0.05 : -0.05
      setZoom(prev => Math.min(1.5, Math.max(0.6, prev + delta)))
    }

    canvasDiv.addEventListener("wheel", handleWheel, { passive: false })
    return () => canvasDiv.removeEventListener("wheel", handleWheel)
  }, [])

  const handleUndo = () => {
    if (connectionsHistory.length === 0) return
    const prev = connectionsHistory[connectionsHistory.length - 1]
    setConnectionsHistory(hist => hist.slice(0, -1))
    onUpdateConnections(prev)
  }

  // Snaps coordinate to a 10px grid
  const snapToGrid = (val: number): number => {
    return Math.round(val / 10) * 10
  }

  // Handle Drag Over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Handle Drop from Component Palette
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!canvasRef.current) return

    const componentId = e.dataTransfer.getData("text/plain")
    if (!componentId || !LAB_COMPONENTS[componentId]) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = snapToGrid((e.clientX - rect.left - 50) / zoom)
    const y = snapToGrid((e.clientY - rect.top - 40) / zoom)

    const newComp: PlacedComponent = {
      id: `${componentId}_${Date.now()}`,
      componentId,
      x: Math.max(10, x),
      y: Math.max(10, y)
    }

    onUpdateComponents([...placedComponents, newComp])
  }

  // Handle Dragging Placed Components on Canvas
  const handleCanvasMouseDown = (e: React.MouseEvent, plCompId: string) => {
    e.stopPropagation()
    const comp = placedComponents.find(c => c.id === plCompId)
    if (!comp || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const mouseX = (e.clientX - rect.left) / zoom
    const mouseY = (e.clientY - rect.top) / zoom

    dragOffset.current = {
      x: mouseX - comp.x,
      y: mouseY - comp.y
    }
    setDraggingCompId(plCompId)
  }

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const mouseX = (e.clientX - rect.left) / zoom
    const mouseY = (e.clientY - rect.top) / zoom

    // Update dragging component position
    if (draggingCompId) {
      const updated = placedComponents.map(c => {
        if (c.id === draggingCompId) {
          const rawX = mouseX - dragOffset.current.x
          const rawY = mouseY - dragOffset.current.y
          return {
            ...c,
            x: Math.max(10, snapToGrid(rawX)),
            y: Math.max(10, snapToGrid(rawY))
          }
        }
        return c
      })
      onUpdateComponents(updated)
    }

    // Update mouse position for wire drawing line preview
    if (wireStart) {
      setMousePos({ x: mouseX, y: mouseY })
    }
  }

  const handleCanvasMouseUp = () => {
    setDraggingCompId(null)
  }

  // Cancel drawing wire on escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setWireStart(null)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [wireStart])

  // Get absolute Pin Coordinates for connecting wires
  const getPinCoords = (plCompId: string, pinId: string) => {
    const comp = placedComponents.find(c => c.id === plCompId)
    if (!comp) return { x: 0, y: 0 }

    const def = LAB_COMPONENTS[comp.componentId]
    if (!def) return { x: 0, y: 0 }

    const pin = def.pins.find(p => p.id === pinId)
    if (!pin) return { x: 0, y: 0 }

    return {
      x: comp.x + pin.x,
      y: comp.y + pin.y
    }
  }

  // Click on a Pin
  const handlePinClick = (e: React.MouseEvent, plCompId: string, pinId: string) => {
    e.stopPropagation()
    const coords = getPinCoords(plCompId, pinId)

    if (!wireStart) {
      // Start Drawing Wire
      setWireStart({
        compId: plCompId,
        pinId,
        x: coords.x,
        y: coords.y
      })
      setMousePos({ x: coords.x, y: coords.y })
    } else {
      // Connect / Complete Drawing Wire
      if (wireStart.compId === plCompId && wireStart.pinId === pinId) {
        // Cannot connect pin to itself
        setWireStart(null)
        return
      }

      // Check if duplicate wire connection already exists
      const duplicate = connections.some(w => 
        (w.fromComponentId === wireStart.compId && w.fromPinId === wireStart.pinId && w.toComponentId === plCompId && w.toPinId === pinId) ||
        (w.fromComponentId === plCompId && w.fromPinId === pinId && w.toComponentId === wireStart.compId && w.toPinId === wireStart.pinId)
      )

      if (!duplicate) {
        const newWire: WireConnection = {
          fromComponentId: wireStart.compId,
          fromPinId: wireStart.pinId,
          toComponentId: plCompId,
          toPinId: pinId,
          color: activeWireColor
        }
        setConnectionsHistory(prev => [...prev, connections])
        onUpdateConnections([...connections, newWire])
      }
      setWireStart(null)
    }
  }

  // Clear Canvas
  const handleClearCanvas = () => {
    setConnectionsHistory(prev => [...prev, connections])
    onUpdateComponents([])
    onUpdateConnections([])
    setWireStart(null)
  }

  // Auto Arrange components nicely
  const handleAutoArrange = () => {
    const arranged = placedComponents.map((c, idx) => ({
      ...c,
      x: 100 + (idx % 3) * 200,
      y: 80 + Math.floor(idx / 3) * 160
    }))
    onUpdateComponents(arranged)
    onUpdateConnections([]) // Wires reset for neatness
    setWireStart(null)
  }

  const handleDeleteComponent = (compId: string) => {
    setConnectionsHistory(prev => [...prev, connections])
    onUpdateComponents(placedComponents.filter(c => c.id !== compId))
    onUpdateConnections(connections.filter(conn => 
      conn.fromComponentId !== compId && conn.toComponentId !== compId
    ))
  }

  return (
    <div className="flex-1 bg-[#070707] flex flex-col relative h-full overflow-hidden text-white select-none">
      
      {/* Top Wiring Ribbon Toolbar */}
      <div className="h-14 border-b border-gray-800 bg-[#0d0d0d] flex items-center justify-between px-5">
        {/* Wire Colors */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mr-2">
            Wire Color:
          </span>
          {[
            { id: "red", bg: "bg-red-600", label: "RED", title: "VCC (+5V / +3.3V)" },
            { id: "black", bg: "bg-gray-900", label: "BLK", title: "Ground (GND)" },
            { id: "yellow", bg: "bg-yellow-500", label: "YEL", title: "Signal (SIG)" },
            { id: "green", bg: "bg-green-500", label: "GRN", title: "Signal (SIG)" },
            { id: "blue", bg: "bg-blue-500", label: "BLU", title: "Signal (SIG)" },
            { id: "purple", bg: "bg-purple-500", label: "PUR", title: "Signal (SIG)" },
            { id: "orange", bg: "bg-orange-500", label: "ORN", title: "Signal (SIG)" },
            { id: "cyan", bg: "bg-cyan-500", label: "CYN", title: "Signal (SIG)" }
          ].map(c => (
            <button
              key={c.id}
              onClick={() => setActiveWireColor(c.id)}
              className={`w-7 h-7 rounded-full ${c.bg} border-2 transition-all flex items-center justify-center ${
                activeWireColor === c.id ? "border-white scale-110 shadow-lg" : "border-transparent opacity-60 hover:opacity-90"
              }`}
              title={c.title}
            >
              <span className={`text-[8px] font-bold ${c.id === "black" ? "text-gray-400" : c.id === "yellow" ? "text-black" : "text-white"}`}>
                {c.label}
              </span>
            </button>
          ))}
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#141414] border border-gray-800 rounded-lg p-0.5">
            <button
              onClick={() => setZoom(Math.max(0.6, zoom - 0.1))}
              className="p-1.5 hover:text-red-500 text-gray-400 transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono w-10 text-center font-bold text-gray-500">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}
              className="p-1.5 hover:text-red-500 text-gray-400 transition"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleAutoArrange}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141414] hover:bg-white/5 border border-gray-800 rounded-lg text-xs font-semibold text-gray-300 hover:text-white transition"
            title="Auto Arrange Grid"
          >
            <Sliders className="w-3.5 h-3.5 text-red-500" />
            Grid
          </button>

          <button
            onClick={() => setZoom(1.0)}
            className="p-1.5 bg-[#141414] hover:bg-white/5 border border-gray-800 rounded-lg text-gray-400 hover:text-white transition"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleUndo}
            disabled={connectionsHistory.length === 0}
            className="p-1.5 bg-[#141414] hover:bg-white/5 border border-gray-800 disabled:opacity-30 rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
            title="Undo Last Connection"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleClearCanvas}
            className="p-1.5 bg-red-650/10 hover:bg-red-600 border border-red-900/30 hover:border-red-600 rounded-lg text-red-400 hover:text-white transition"
            title="Clear Workspace"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid Canvas Workspace */}
      <div
        ref={canvasRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        className="flex-1 relative overflow-auto custom-scrollbar cursor-crosshair"
        style={{
          backgroundImage: "radial-gradient(#222 1px, transparent 1px)",
          backgroundSize: "20px 20px"
        }}
      >
        {/* Connection Instruction Prompt Overlay */}
        {wireStart && (
          <div className="absolute top-4 left-4 z-10 py-1.5 px-3 bg-red-650/90 border border-red-500/20 backdrop-blur rounded-lg text-[10px] uppercase font-bold tracking-widest text-white shadow-lg animate-pulse">
            📍 Selecting Target Pin... press [ESC] to Cancel
          </div>
        )}

        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
            width: "2000px",
            height: "2000px"
          }}
          className="absolute top-0 left-0"
        >
          {/* Wire SVG Layer */}
          <svg className="absolute inset-0 pointer-events-none w-full h-full">
            {/* Draw Permanent Wires */}
            {connections.map((wire, idx) => {
              const start = getPinCoords(wire.fromComponentId, wire.fromPinId)
              const end = getPinCoords(wire.toComponentId, wire.toPinId)
              
              // Draw an elegant curved cubic bezier wire paths
              const dx = Math.abs(end.x - start.x) * 0.4
              const dy = Math.abs(end.y - start.y) * 0.4
              const path = `M ${start.x} ${start.y} C ${start.x + dx} ${start.y + (end.y > start.y ? dy : -dy)} ${end.x - dx} ${end.y + (end.y > start.y ? -dy : dy)} ${end.x} ${end.y}`
              
              let strokeColor = "#eab308"
              let shadowColor = "rgba(234,179,8,0.2)"
              
              if (wire.color === "red") {
                strokeColor = "#ef4444"
                shadowColor = "rgba(239,68,68,0.3)"
              } else if (wire.color === "black") {
                strokeColor = "#1f2937"
                shadowColor = "rgba(31,41,55,0.4)"
              } else if (wire.color === "yellow") {
                strokeColor = "#eab308"
                shadowColor = "rgba(234,179,8,0.3)"
              } else if (wire.color === "green") {
                strokeColor = "#22c55e"
                shadowColor = "rgba(34,197,94,0.3)"
              } else if (wire.color === "blue") {
                strokeColor = "#3b82f6"
                shadowColor = "rgba(59,130,246,0.3)"
              } else if (wire.color === "purple") {
                strokeColor = "#a855f7"
                shadowColor = "rgba(168,85,247,0.3)"
              } else if (wire.color === "orange") {
                strokeColor = "#f97316"
                shadowColor = "rgba(249,115,22,0.3)"
              } else if (wire.color === "cyan") {
                strokeColor = "#06b6d4"
                shadowColor = "rgba(6,182,212,0.3)"
              }

              return (
                <g key={idx}>
                  {/* Glowing Outline */}
                  <path
                    d={path}
                    fill="none"
                    stroke={shadowColor}
                    strokeWidth="7"
                    strokeLinecap="round"
                  />
                  {/* Core Wire */}
                  <path
                    d={path}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    className="transition-all"
                  />
                </g>
              )
            })}

            {/* Draw Wire Drawing Preview */}
            {wireStart && (
              <g>
                {(() => {
                  let previewColor = "#eab308"
                  if (activeWireColor === "red") previewColor = "#ef4444"
                  else if (activeWireColor === "black") previewColor = "#4b5563"
                  else if (activeWireColor === "yellow") previewColor = "#eab308"
                  else if (activeWireColor === "green") previewColor = "#22c55e"
                  else if (activeWireColor === "blue") previewColor = "#3b82f6"
                  else if (activeWireColor === "purple") previewColor = "#a855f7"
                  else if (activeWireColor === "orange") previewColor = "#f97316"
                  else if (activeWireColor === "cyan") previewColor = "#06b6d4"
                  
                  return (
                    <>
                      <line
                        x1={wireStart.x}
                        y1={wireStart.y}
                        x2={mousePos.x}
                        y2={mousePos.y}
                        stroke={previewColor}
                        strokeWidth="3"
                        strokeDasharray="5,5"
                      />
                      <circle
                        cx={mousePos.x}
                        cy={mousePos.y}
                        r="5"
                        fill={previewColor}
                      />
                    </>
                  )
                })()}
              </g>
            )}
          </svg>

          {/* Render Placed Hardware Components */}
          {placedComponents.map(comp => {
            const def = LAB_COMPONENTS[comp.componentId]
            if (!def) return null

            const isImageComponent = !!def.imageUrl

            if (isImageComponent) {
              return (
                <div
                  key={comp.id}
                  style={{
                    left: comp.x,
                    top: comp.y,
                    width: def.width,
                    height: def.height,
                  }}
                  className="absolute select-none group cursor-grab active:cursor-grabbing z-20"
                  onMouseDown={(e) => handleCanvasMouseDown(e, comp.id)}
                >
                  {/* Delete Button */}
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => handleDeleteComponent(comp.id)}
                    className="absolute -top-3 -right-3 w-6 h-6 bg-red-650 hover:bg-red-600 rounded-full border border-red-900/30 flex items-center justify-center text-[10px] text-white opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-xl cursor-pointer z-40"
                    title="Remove Component"
                  >
                    ✕
                  </button>

                  {/* Realistic Top-down Image with hover outline glow */}
                  <div className="w-full h-full relative transition-all duration-200 group-hover:drop-shadow-[0_0_12px_rgba(239,68,68,0.5)] group-hover:scale-[1.02]">
                    <img
                      src={def.imageUrl}
                      alt={def.name}
                      className="w-full h-full object-contain select-none pointer-events-none"
                      style={{ mixBlendMode: "screen" }}
                    />
                  </div>

                  {/* Render Connective Pins as Realistic Brass/Gold Solder Pads / Header Sockets */}
                  {def.pins.map(pin => (
                    <button
                      key={pin.id}
                      style={{
                        left: pin.x - 7,
                        top: pin.y - 7
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => handlePinClick(e, comp.id, pin.id)}
                      className={`absolute w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center group/pin cursor-pointer transition-all duration-150 z-30 ${
                        wireStart?.compId === comp.id && wireStart?.pinId === pin.id
                          ? "bg-red-600 border-red-400 scale-125 animate-pulse shadow-[0_0_8px_#ef4444]"
                          : "bg-black/90 hover:bg-red-600/60 border-[#c2a649] hover:border-red-400 shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
                      }`}
                    >
                      {/* Tiny center node */}
                      <span className="w-1.5 h-1.5 bg-[#d8b4fe]/40 group-hover/pin:bg-white rounded-full transition-colors" />
                      
                      {/* Tooltip Label */}
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 py-0.5 px-1.5 bg-black/95 border border-gray-800 text-[8px] font-mono text-gray-300 rounded opacity-0 group-hover/pin:opacity-100 transition duration-150 pointer-events-none whitespace-nowrap z-50 shadow-2xl">
                        {pin.label}
                      </span>
                    </button>
                  ))}
                </div>
              )
            }

            // Fallback for standard cards (like Breadboard, Potentiometer, active boards without custom textures)
            return (
              <div
                key={comp.id}
                style={{
                  left: comp.x,
                  top: comp.y,
                  width: def.width,
                  height: def.height,
                  borderColor: def.color + "33",
                  backgroundColor: "#0d0d0df2"
                }}
                className="absolute border border-gray-800 rounded-xl p-2 select-none shadow-2xl transition-all flex flex-col group z-20"
                onMouseDown={(e) => handleCanvasMouseDown(e, comp.id)}
              >
                {/* Delete Button */}
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => handleDeleteComponent(comp.id)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-650 hover:bg-red-600 rounded-full border border-red-900/30 flex items-center justify-center text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg cursor-pointer"
                  title="Remove Component"
                >
                  ✕
                </button>

                {/* Hardware header */}
                <div className="flex items-center gap-1.5 border-b border-gray-800 pb-1.5 mb-1 text-left">
                  <span className="text-sm">{def.icon}</span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-300 truncate tracking-wide">
                      {def.name}
                    </p>
                  </div>
                </div>

                {/* SVG/HTML Body preview block */}
                <div className="flex-1 flex items-center justify-center relative overflow-hidden rounded-lg">
                  <div
                    style={{ backgroundColor: def.color + "1a", borderColor: def.color + "44" }}
                    className="w-full h-full rounded border border-dashed flex items-center justify-center text-[9px] uppercase tracking-widest font-mono text-gray-500"
                  >
                    {def.id.slice(0, 8)}
                  </div>
                </div>

                {/* Render Connective Pins */}
                {def.pins.map(pin => (
                  <button
                    key={pin.id}
                    style={{
                      left: pin.x - 6,
                      top: pin.y - 6
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => handlePinClick(e, comp.id, pin.id)}
                    className={`absolute w-3.5 h-3.5 rounded-full border flex items-center justify-center group/pin cursor-pointer transition ${
                      wireStart?.compId === comp.id && wireStart?.pinId === pin.id
                        ? "bg-red-600 border-red-400 scale-125 animate-pulse"
                        : "bg-gray-800 hover:bg-red-600/50 border-gray-600 hover:border-red-400"
                    }`}
                  >
                    {/* Tiny Center Pin Node */}
                    <span className="w-1.5 h-1.5 bg-gray-400 group-hover/pin:bg-white rounded-full" />
                    
                    {/* Tooltip Label */}
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 py-0.5 px-1.5 bg-black border border-gray-800 text-[8px] font-mono text-gray-300 rounded opacity-0 group-hover/pin:opacity-100 transition pointer-events-none whitespace-nowrap z-50">
                      {pin.label}
                    </span>
                  </button>
                ))}
              </div>
            )
          })}
        </div>

        {/* Floating Simulation Control Deck */}
        {onUpload && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#0c0c0cd8] border border-red-500/20 shadow-[0_15px_50px_rgba(0,0,0,0.85)] backdrop-blur-md px-6 py-3 rounded-full flex items-center gap-5 transition-all hover:border-red-500/40 select-none">
            <div className="flex items-center gap-2 pr-3 border-r border-gray-800">
              <span className={`w-2.5 h-2.5 rounded-full ${isSimulating ? "bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" : passed ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : passed === false ? "bg-red-500 shadow-[0_0_8px_#ef4444]" : "bg-yellow-500 animate-pulse shadow-[0_0_8px_#eab308]"} transition-all`} />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
                {isSimulating ? "SIMULATION RUNNING" : passed ? "PASSED" : passed === false ? "FAILED" : "STANDBY"}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Verify/Compile Button */}
              <button
                onClick={onRun}
                disabled={isSimulating}
                className="flex items-center justify-center gap-1.5 px-4 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-50 border border-white/10 rounded-full text-xs font-bold text-gray-300 hover:text-white transition-all cursor-pointer"
                title="Verify & Compile Code Sketch"
              >
                Verify
              </button>

              {/* Upload & Play Button */}
              <button
                onClick={onUpload}
                disabled={isSimulating}
                className="flex items-center justify-center gap-1.5 px-5 py-1.5 bg-red-650 hover:bg-red-600 disabled:opacity-50 text-xs font-bold text-white rounded-full transition-all shadow-lg shadow-red-600/20 cursor-pointer"
                title="Flash Sketch to Board & Start Loop"
              >
                <Cpu className="w-3.5 h-3.5" />
                Upload & Run
              </button>

              {/* Clear Board Reset Button */}
              <button
                onClick={onClear}
                className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-gray-400 hover:text-white transition cursor-pointer"
                title="Reset Simulated State"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
