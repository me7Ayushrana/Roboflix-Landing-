import { ExperimentConfig } from "./experimentConfigs"

export interface WireConnection {
  fromComponentId: string
  fromPinId: string
  toComponentId: string
  toPinId: string
  color: string
}

export interface PlacedComponent {
  id: string
  componentId: string
  x: number
  y: number
}

export interface SimulationResult {
  success: boolean
  logs: string[]
  passed: boolean
  xpAwarded: number
  hint?: string
}

export function runClientSideSimulation(
  code: string,
  placedComponents: PlacedComponent[],
  connections: WireConnection[],
  config: ExperimentConfig
): SimulationResult {
  const logs: string[] = []
  let passed = false
  const xpAwarded = 100

  // 1. Basic Syntax Validation
  const hasSetup = code.includes("void setup()") || code.includes("void setup (")
  const hasLoop = code.includes("void loop()") || code.includes("void loop (")

  if (!hasSetup || !hasLoop) {
    return {
      success: false,
      logs: [
        "❌ COMPILATION ERROR: Sketch must contain both 'void setup()' and 'void loop()' functions.",
      ],
      passed: false,
      xpAwarded: 0,
      hint: "Add both void setup() { ... } and void loop() { ... } to your Arduino sketch."
    }
  }

  // Count braces
  const openBraces = (code.match(/\{/g) || []).length
  const closeBraces = (code.match(/\}/g) || []).length
  if (openBraces !== closeBraces) {
    return {
      success: false,
      logs: [
        `❌ COMPILATION ERROR: Mismatched curly braces. Found ${openBraces} '{' and ${closeBraces} '}'.`,
      ],
      passed: false,
      xpAwarded: 0,
      hint: "Make sure all open curly braces '{' have a matching closing brace '}'."
    }
  }

  // Check semi-colons inside functions
  const lines = code.split("\n")
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (
      line.length > 0 &&
      !line.startsWith("//") &&
      !line.startsWith("/*") &&
      !line.startsWith("*") &&
      !line.endsWith(";") &&
      !line.endsWith("{") &&
      !line.endsWith("}") &&
      !line.startsWith("#define") &&
      !line.startsWith("#include") &&
      !line.startsWith("void") &&
      !line.includes("if") &&
      !line.includes("else") &&
      !line.includes("while") &&
      !line.includes("for")
    ) {
      return {
        success: false,
        logs: [
          `❌ COMPILATION ERROR (Line ${i + 1}): Missing semicolon at end of statement.`,
          `> ${line}`
        ],
        passed: false,
        xpAwarded: 0,
        hint: "Every standard execution line in C++ must end with a semicolon ';'."
      }
    }
  }

  logs.push("⚙️ Compiling Sketch...")
  logs.push("✨ Compilation Successful! Uploading to Microcontroller...")
  logs.push(`[00:00:00] [SYSTEM] Sketch size: 3412 bytes. Dynamic memory: 184 bytes.`)
  logs.push("[00:00:00] [SYSTEM] Waking up board peripherals...")

  // 2. Hardware Wiring Connection Verification
  // Check if expected components are wired
  const hasArduino = placedComponents.some(c => c.componentId === "arduino-uno" || c.componentId === "esp32")
  if (!hasArduino) {
    return {
      success: true,
      logs: [
        ...logs,
        "⚠️ WARNING: Microcontroller board (Arduino Uno / ESP32) is missing from the canvas!",
        "[00:00:01] [SYSTEM] Board offline. Simulation halted."
      ],
      passed: false,
      xpAwarded: 0,
      hint: "Drag an Arduino Uno R3 or ESP32 from the component palette onto the board first."
    }
  }

  // Check required components for this specific experiment config
  const missingRequired = config.components.filter(reqId => {
    return !placedComponents.some(pc => pc.componentId === reqId)
  })

  if (missingRequired.length > 0) {
    return {
      success: true,
      logs: [
        ...logs,
        `⚠️ WARNING: Missing required components for this experiment: ${missingRequired.join(", ")}`,
        "[00:00:01] [SYSTEM] Simulation stopped due to missing peripherals."
      ],
      passed: false,
      xpAwarded: 0,
      hint: `Make sure you place the following components on the wiring canvas: ${missingRequired.map(id => id.toUpperCase()).join(", ")}`
    }
  }

  // 3. Dynamic Interactive Code Output Simulation
  // We parse the lines of code and generate simulated console serial outputs
  let timestamp = 0
  const formatTime = (sec: number) => {
    const min = Math.floor(sec / 60).toString().padStart(2, "0")
    const s = (sec % 60).toString().padStart(2, "0")
    return `[00:${min}:${s}]`
  }

  // Parse lines to detect setup and loop prints
  const setupPrints: string[] = []
  const loopPrints: string[] = []

  let inSetup = false
  let inLoop = false

  for (const line of lines) {
    const cleanLine = line.trim()
    if (cleanLine.includes("void setup")) inSetup = true
    if (cleanLine.includes("void loop")) inLoop = true
    if (cleanLine.startsWith("}") && inSetup) inSetup = false
    if (cleanLine.startsWith("}") && inLoop) inLoop = false

    const serialPrintMatch = cleanLine.match(/Serial\.print(?:ln)?\s*\(\s*"(.*?)"\s*\)/)
    if (serialPrintMatch) {
      const printVal = serialPrintMatch[1]
      if (inSetup) setupPrints.push(printVal)
      else if (inLoop) loopPrints.push(printVal)
      else setupPrints.push(printVal) // Default
    }
  }

  // Print Setup Outputs
  if (setupPrints.length > 0) {
    setupPrints.forEach(p => {
      logs.push(`${formatTime(timestamp++)} ${p}`)
    })
  } else {
    logs.push(`${formatTime(timestamp++)} [SERIAL] Serial monitor initialized at 9600 baud.`)
  }

  // Loop simulation runs for a simulated 5 iterations
  const isUltrasonicExperiment = config.id === "s1e3" || config.id === "s1e7"
  const isMotorExperiment = config.id === "s1e4" || config.id === "s1e7"
  const isServoExperiment = config.id === "s1e6"
  const isButtonExperiment = config.id === "s1e2"

  for (let i = 0; i < 5; i++) {
    timestamp += 1

    if (loopPrints.length > 0) {
      loopPrints.forEach(p => {
        let dynamicPrint = p
        // Inject randomized values if they print distance or analog values
        if (p.includes("distance") || p.includes("Distance") || p.includes("Sensor distance")) {
          const randDist = Math.floor(Math.random() * 180) + 10
          dynamicPrint = `${p} ${randDist} cm`
        }
        logs.push(`${formatTime(timestamp)} ${dynamicPrint}`)
      })
    } else {
      // Automatic mock behavior matching the active hardware setup
      if (isUltrasonicExperiment) {
        const distance = i === 3 ? 15 : Math.floor(Math.random() * 100) + 30
        logs.push(`${formatTime(timestamp)} Sensor distance: ${distance} cm`)
        if (distance < 30) {
          logs.push(`${formatTime(timestamp)} ALERT - Obstacle detected - BUZZER active!`)
          if (config.id === "s1e7") {
            logs.push(`${formatTime(timestamp)} OBSTACLE DETECTED! STOPPING MOTORS`)
          }
        } else if (config.id === "s1e7") {
          logs.push(`${formatTime(timestamp)} PATH CLEAR - MOVING FORWARD`)
        }
      } else if (isMotorExperiment) {
        if (i % 2 === 0) {
          logs.push(`${formatTime(timestamp)} Motor A: FORWARD at 80% speed`)
        } else {
          logs.push(`${formatTime(timestamp)} Motor A: STOP`)
        }
      } else if (isServoExperiment) {
        const angles = [0, 45, 90, 135, 180]
        logs.push(`${formatTime(timestamp)} Servo sweeping: moving to ${angles[i % 5]}°`)
      } else if (isButtonExperiment) {
        const pressed = i % 2 === 0
        logs.push(`${formatTime(timestamp)} Button Pressed - LED Active`)
      } else {
        logs.push(`${formatTime(timestamp)} [SERIAL] Loop execution heartbeat...`)
      }
    }
  }

  // 4. Auto-Grader Verification
  // Check if expected keywords exist in our logs list
  const lowerLogs = logs.map(l => l.toLowerCase()).join(" ")
  const matchedKeywords = config.expectedOutputKeywords.filter(kw => {
    return lowerLogs.includes(kw.toLowerCase()) || code.toLowerCase().includes(kw.toLowerCase())
  })

  // Check if wires are connected!
  const hasWires = connections.length > 0
  if (!hasWires) {
    logs.push("⚠️ WARNING: No jumper wires are connected! Peripherals are disconnected.")
    passed = false
  } else {
    passed = matchedKeywords.length === config.expectedOutputKeywords.length
  }

  if (passed) {
    logs.push("🎉 SUCCESS: Experiment validation passed successfully!")
    logs.push(`🏆 +${xpAwarded} XP AWARDED! Status synced to your LMS Profile.`)
  } else {
    logs.push("❌ VALIDATION FAILED: Circuit output did not match expected requirements.")
  }

  return {
    success: true,
    logs,
    passed,
    xpAwarded: passed ? xpAwarded : 0,
    hint: passed ? undefined : config.hint
  }
}
