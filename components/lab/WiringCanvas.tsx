"use client"

import { useState, useRef, useEffect } from "react"
import { ZoomIn, ZoomOut, RotateCcw, Trash2, Sliders } from "lucide-react"
import { LAB_COMPONENTS } from "@/lib/lab/experimentConfigs"
import { PlacedComponent, WireConnection } from "@/lib/lab/simulationEngine"

interface WiringCanvasProps {
  placedComponents: PlacedComponent[]
  connections: WireConnection[]
  onUpdateComponents: (comps: PlacedComponent[]) => void
  onUpdateConnections: (conns: WireConnection[]) => void
}

export default function WiringCanvas({
  placedComponents,
  connections,
  onUpdateComponents,
  onUpdateConnections
}: WiringCanvasProps) {
  const [zoom, setZoom] = useState(1.0)
  const [activeWireColor, setActiveWireColor] = useState<string>("red")
  const [draggingCompId, setDraggingCompId] = useState<string | null>(null)
  
  // Drawing Wire State
  const [wireStart, setWireStart] = useState<{ compId: string; pinId: string; x: number; y: number } | null>(null)
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  const canvasRef = useRef<HTMLDivElement>(null)
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

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
        onUpdateConnections([...connections, newWire])
      }
      setWireStart(null)
    }
  }

  // Clear Canvas
  const handleClearCanvas = () => {
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
            Wire Type:
          </span>
          <button
            onClick={() => setActiveWireColor("red")}
            className={`w-7 h-7 rounded-full bg-red-600 border-2 transition-all flex items-center justify-center ${
              activeWireColor === "red" ? "border-white scale-110 shadow-lg shadow-red-600/30" : "border-transparent opacity-60 hover:opacity-90"
            }`}
            title="VCC (+5V / +3.3V)"
          >
            <span className="text-[9px] font-bold text-white">VCC</span>
          </button>
          <button
            onClick={() => setActiveWireColor("black")}
            className={`w-7 h-7 rounded-full bg-gray-900 border-2 transition-all flex items-center justify-center ${
              activeWireColor === "black" ? "border-white scale-110 shadow-lg shadow-black/60" : "border-transparent opacity-60 hover:opacity-90"
            }`}
            title="Ground (GND)"
          >
            <span className="text-[9px] font-bold text-gray-400">GND</span>
          </button>
          <button
            onClick={() => setActiveWireColor("yellow")}
            className={`w-7 h-7 rounded-full bg-yellow-500 border-2 transition-all flex items-center justify-center ${
              activeWireColor === "yellow" ? "border-white scale-110 shadow-lg shadow-yellow-500/30" : "border-transparent opacity-60 hover:opacity-90"
            }`}
            title="Signal line (I/O)"
          >
            <span className="text-[9px] font-bold text-black font-semibold">SIG</span>
          </button>
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
              
              const strokeColor = wire.color === "red" ? "#dc2626" : wire.color === "black" ? "#111827" : "#eab308"
              const shadowColor = wire.color === "red" ? "rgba(220,38,38,0.2)" : wire.color === "black" ? "rgba(0,0,0,0.6)" : "rgba(234,179,8,0.2)"

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
                <line
                  x1={wireStart.x}
                  y1={wireStart.y}
                  x2={mousePos.x}
                  y2={mousePos.y}
                  stroke={activeWireColor === "red" ? "#dc2626" : activeWireColor === "black" ? "#4b5563" : "#eab308"}
                  strokeWidth="3"
                  strokeDasharray="5,5"
                />
                <circle
                  cx={mousePos.x}
                  cy={mousePos.y}
                  r="5"
                  fill={activeWireColor === "red" ? "#dc2626" : activeWireColor === "black" ? "#111827" : "#eab308"}
                />
              </g>
            )}
          </svg>

          {/* Render Placed Hardware Components */}
          {placedComponents.map(comp => {
            const def = LAB_COMPONENTS[comp.componentId]
            if (!def) return null

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
                className="absolute border border-gray-800 rounded-xl p-2 select-none shadow-2xl transition-all flex flex-col group"
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
                <div className="flex-1 flex items-center justify-center relative">
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
      </div>
    </div>
  )
}
