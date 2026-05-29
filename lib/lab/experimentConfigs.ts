export interface LabComponent {
  id: string
  name: string
  icon: string
  pins: { id: string; label: string; x: number; y: number }[]
  width: number
  height: number
  color: string
  imageUrl?: string
}

export interface ExperimentConfig {
  id: string
  name: string
  title: string
  season: number
  episode: number
  components: string[] // List of allowed component IDs
  starterCode: string
  objective: string
  expectedOutputKeywords: string[]
  hint: string
}

export const LAB_COMPONENTS: Record<string, LabComponent> = {
  "arduino-uno": {
    id: "arduino-uno",
    name: "Arduino Uno R3",
    icon: "🔌",
    width: 140,
    height: 100,
    color: "#00878F",
    imageUrl: "/arduino-uno.png",
    pins: [
      { id: "vcc-5v", label: "5V", x: 45, y: 95 },
      { id: "gnd-1", label: "GND", x: 60, y: 95 },
      { id: "gnd-2", label: "GND", x: 75, y: 95 },
      { id: "pin-2", label: "D2", x: 10, y: 5 },
      { id: "pin-3", label: "D3~", x: 22, y: 5 },
      { id: "pin-4", label: "D4", x: 34, y: 5 },
      { id: "pin-5", label: "D5~", x: 46, y: 5 },
      { id: "pin-6", label: "D6~", x: 58, y: 5 },
      { id: "pin-7", label: "D7", x: 70, y: 5 },
      { id: "pin-8", label: "D8", x: 82, y: 5 },
      { id: "pin-9", label: "D9~", x: 94, y: 5 },
      { id: "pin-10", label: "D10~", x: 106, y: 5 },
      { id: "pin-11", label: "D11~", x: 118, y: 5 },
      { id: "pin-12", label: "D12", x: 130, y: 5 },
      { id: "pin-13", label: "D13", x: 130, y: 20 },
      { id: "pin-a0", label: "A0", x: 10, y: 95 },
      { id: "pin-a1", label: "A1", x: 20, y: 95 },
      { id: "pin-a2", label: "A2", x: 30, y: 95 },
    ],
  },
  "esp32": {
    id: "esp32",
    name: "ESP32 Development Board",
    icon: "📶",
    width: 120,
    height: 90,
    color: "#2C2C2C",
    pins: [
      { id: "vcc-3v3", label: "3V3", x: 10, y: 85 },
      { id: "gnd", label: "GND", x: 25, y: 85 },
      { id: "pin-g2", label: "GPIO2", x: 40, y: 5 },
      { id: "pin-g4", label: "GPIO4", x: 55, y: 5 },
      { id: "pin-g5", label: "GPIO5", x: 70, y: 5 },
      { id: "pin-g12", label: "GPIO12", x: 85, y: 5 },
      { id: "pin-g13", label: "GPIO13", x: 100, y: 5 },
      { id: "pin-g14", label: "GPIO14", x: 110, y: 30 },
      { id: "pin-g15", label: "GPIO15", x: 110, y: 55 },
    ],
  },
  "hc-sr04": {
    id: "hc-sr04",
    name: "HC-SR04 Ultrasonic Sensor",
    icon: "🦇",
    width: 100,
    height: 50,
    color: "#1E3A8A",
    pins: [
      { id: "vcc", label: "VCC", x: 15, y: 45 },
      { id: "trig", label: "TRIG", x: 38, y: 45 },
      { id: "echo", label: "ECHO", x: 62, y: 45 },
      { id: "gnd", label: "GND", x: 85, y: 45 },
    ],
  },
  "led-red": {
    id: "led-red",
    name: "Red LED",
    icon: "🚨",
    width: 40,
    height: 40,
    color: "#DC2626",
    pins: [
      { id: "anode", label: "ANODE (+)", x: 10, y: 35 },
      { id: "cathode", label: "CATHODE (-)", x: 30, y: 35 },
    ],
  },
  "resistor": {
    id: "resistor",
    name: "220Ω Resistor",
    icon: "〰️",
    width: 60,
    height: 24,
    color: "#D97706",
    pins: [
      { id: "pin-1", label: "1", x: 5, y: 12 },
      { id: "pin-2", label: "2", x: 55, y: 12 },
    ],
  },
  "buzzer": {
    id: "buzzer",
    name: "Active Buzzer",
    icon: "🔊",
    width: 60,
    height: 60,
    color: "#1F2937",
    pins: [
      { id: "pos", label: "+", x: 15, y: 50 },
      { id: "neg", label: "-", x: 45, y: 50 },
    ],
  },
  "push-button": {
    id: "push-button",
    name: "Push Button",
    icon: "🔘",
    width: 40,
    height: 40,
    color: "#4B5563",
    pins: [
      { id: "pin-1a", label: "1A", x: 5, y: 20 },
      { id: "pin-1b", label: "1B", x: 35, y: 20 },
    ],
  },
  "l298n": {
    id: "l298n",
    name: "L298N Motor Driver",
    icon: "🎛️",
    width: 100,
    height: 80,
    color: "#7F1D1D",
    pins: [
      { id: "ena", label: "ENA", x: 10, y: 75 },
      { id: "in1", label: "IN1", x: 25, y: 75 },
      { id: "in2", label: "IN2", x: 40, y: 75 },
      { id: "in3", label: "IN3", x: 55, y: 75 },
      { id: "in4", label: "IN4", x: 70, y: 75 },
      { id: "enb", label: "ENB", x: 85, y: 75 },
      { id: "vcc-12v", label: "12V", x: 15, y: 5 },
      { id: "gnd", label: "GND", x: 35, y: 5 },
      { id: "out1", label: "OUT1", x: 85, y: 15 },
      { id: "out2", label: "OUT2", x: 85, y: 35 },
    ],
  },
  "dc-motor": {
    id: "dc-motor",
    name: "DC Gearbox Motor",
    icon: "⚙️",
    width: 80,
    height: 50,
    color: "#B45309",
    pins: [
      { id: "pos", label: "+", x: 10, y: 25 },
      { id: "neg", label: "-", x: 70, y: 25 },
    ],
  },
  "servo-motor": {
    id: "servo-motor",
    name: "SG90 Servo Motor",
    icon: "🔄",
    width: 70,
    height: 50,
    color: "#2563EB",
    imageUrl: "/servo-sg90.png",
    pins: [
      { id: "pwm", label: "PWM", x: 10, y: 40 },
      { id: "vcc", label: "5V", x: 35, y: 40 },
      { id: "gnd", label: "GND", x: 60, y: 40 },
    ],
  },
  "breadboard": {
    id: "breadboard",
    name: "Half Breadboard",
    icon: "🔲",
    width: 220,
    height: 80,
    color: "#E5E7EB",
    pins: [
      { id: "power-pos-1", label: "R+", x: 20, y: 10 },
      { id: "power-neg-1", label: "R-", x: 40, y: 10 },
      { id: "row-a-1", label: "A1", x: 20, y: 35 },
      { id: "row-e-1", label: "E1", x: 20, y: 55 },
      { id: "row-f-1", label: "F1", x: 20, y: 70 },
      { id: "power-pos-2", label: "R+", x: 200, y: 10 },
      { id: "power-neg-2", label: "R-", x: 180, y: 10 },
    ],
  },
  "potentiometer": {
    id: "potentiometer",
    name: "10k Potentiometer",
    icon: "🎛️",
    width: 60,
    height: 60,
    color: "#059669",
    pins: [
      { id: "vcc", label: "VCC", x: 10, y: 50 },
      { id: "sig", label: "WIPER", x: 30, y: 50 },
      { id: "gnd", label: "GND", x: 50, y: 50 },
    ],
  },
  "dht11": {
    id: "dht11",
    name: "DHT11 Temp/Humidity",
    icon: "🌡️",
    width: 70,
    height: 50,
    color: "#2563EB",
    pins: [
      { id: "vcc", label: "VCC", x: 15, y: 40 },
      { id: "sig", label: "DATA", x: 35, y: 40 },
      { id: "gnd", label: "GND", x: 55, y: 40 },
    ],
  },
  "ir-sensor": {
    id: "ir-sensor",
    name: "IR Obstacle Sensor",
    icon: "👁️",
    width: 70,
    height: 40,
    color: "#7C3AED",
    pins: [
      { id: "vcc", label: "VCC", x: 15, y: 32 },
      { id: "gnd", label: "GND", x: 35, y: 32 },
      { id: "out", label: "OUT", x: 55, y: 32 },
    ],
  },
  "lcd1602": {
    id: "lcd1602",
    name: "I2C LCD 1602 Display",
    icon: "📺",
    width: 160,
    height: 70,
    color: "#0D9488",
    pins: [
      { id: "gnd", label: "GND", x: 20, y: 62 },
      { id: "vcc", label: "VCC", x: 40, y: 62 },
      { id: "sda", label: "SDA", x: 60, y: 62 },
      { id: "scl", label: "SCL", x: 80, y: 62 },
    ],
  },
  "rgb-led": {
    id: "rgb-led",
    name: "RGB LED",
    icon: "🌈",
    width: 60,
    height: 40,
    color: "#EC4899",
    pins: [
      { id: "red", label: "R", x: 10, y: 32 },
      { id: "gnd", label: "GND", x: 25, y: 32 },
      { id: "green", label: "G", x: 40, y: 32 },
      { id: "blue", label: "B", x: 55, y: 32 },
    ],
  },
  "photoresistor": {
    id: "photoresistor",
    name: "LDR Photoresistor",
    icon: "☀️",
    width: 50,
    height: 40,
    color: "#F59E0B",
    pins: [
      { id: "pin-1", label: "1", x: 15, y: 32 },
      { id: "pin-2", label: "2", x: 35, y: 32 },
    ],
  },
  "servo-mg996r": {
    id: "servo-mg996r",
    name: "MG996R Metal Servo",
    icon: "🦾",
    width: 80,
    height: 55,
    color: "#1E293B",
    imageUrl: "/servo-mg996r.png",
    pins: [
      { id: "pwm", label: "PWM (ORG)", x: 15, y: 45 },
      { id: "vcc", label: "VCC (RED)", x: 40, y: 45 },
      { id: "gnd", label: "GND (BRN)", x: 65, y: 45 },
    ],
  },
  "pca9685": {
    id: "pca9685",
    name: "PCA9685 Servo Driver",
    icon: "⛓️",
    width: 130,
    height: 70,
    color: "#065F46",
    pins: [
      { id: "gnd", label: "GND", x: 10, y: 60 },
      { id: "oe", label: "OE", x: 25, y: 60 },
      { id: "scl", label: "SCL", x: 40, y: 60 },
      { id: "sda", label: "SDA", x: 55, y: 60 },
      { id: "vcc", label: "VCC", x: 70, y: 60 },
      { id: "vplus", label: "V+", x: 85, y: 60 },
      { id: "ch0-pwm", label: "CH0 PWM", x: 10, y: 5 },
      { id: "ch0-vplus", label: "CH0 V+", x: 22, y: 5 },
      { id: "ch0-gnd", label: "CH0 GND", x: 34, y: 5 },
      { id: "ch15-pwm", label: "CH15 PWM", x: 106, y: 5 },
      { id: "ch15-vplus", label: "CH15 V+", x: 118, y: 5 },
      { id: "ch15-gnd", label: "CH15 GND", x: 130, y: 20 },
    ],
  },
  "geared-dc-motor": {
    id: "geared-dc-motor",
    name: "Geared Motor & Tyre",
    icon: "🛞",
    width: 100,
    height: 60,
    color: "#B45309",
    imageUrl: "/geared-dc-motor.png",
    pins: [
      { id: "pos", label: "MOTOR +", x: 20, y: 50 },
      { id: "neg", label: "MOTOR -", x: 80, y: 50 },
    ],
  },
  "raspberry-pi-4": {
    id: "raspberry-pi-4",
    name: "Raspberry Pi 4 Model B",
    icon: "🍓",
    width: 150,
    height: 110,
    color: "#991B1B",
    imageUrl: "/raspberry-pi-4.png",
    pins: [
      { id: "pin-5v-1", label: "5V (Pin 2)", x: 40, y: 5 },
      { id: "pin-5v-2", label: "5V (Pin 4)", x: 52, y: 5 },
      { id: "pin-gnd-1", label: "GND (Pin 6)", x: 64, y: 5 },
      { id: "pin-gpio2", label: "SDA (GPIO2)", x: 76, y: 5 },
      { id: "pin-gpio3", label: "SCL (GPIO3)", x: 88, y: 5 },
      { id: "pin-gpio4", label: "GCLK (GPIO4)", x: 100, y: 5 },
      { id: "pin-gnd-2", label: "GND (Pin 9)", x: 112, y: 5 },
      { id: "pin-gpio14", label: "TXD (GPIO14)", x: 124, y: 5 },
      { id: "pin-gpio15", label: "RXD (GPIO15)", x: 136, y: 5 },
      { id: "usb-c-pwr", label: "USB-C POWER", x: 10, y: 105 },
      { id: "hdmi-0", label: "MICRO-HDMI 0", x: 60, y: 105 },
      { id: "ethernet", label: "ETH PORT", x: 140, y: 50 },
    ],
  },
  "raspberry-pi-5": {
    id: "raspberry-pi-5",
    name: "Raspberry Pi 5 (8GB)",
    icon: "⚡",
    width: 150,
    height: 110,
    color: "#0369A1",
    pins: [
      { id: "pin-5v-1", label: "5V (Pin 2)", x: 40, y: 5 },
      { id: "pin-5v-2", label: "5V (Pin 4)", x: 52, y: 5 },
      { id: "pin-gnd-1", label: "GND (Pin 6)", x: 64, y: 5 },
      { id: "pin-sda", label: "SDA1", x: 76, y: 5 },
      { id: "pin-scl", label: "SCL1", x: 88, y: 5 },
      { id: "pin-gnd-2", label: "GND (Pin 9)", x: 100, y: 5 },
      { id: "pin-uart-tx", label: "UART TX", x: 112, y: 5 },
      { id: "pin-uart-rx", label: "UART RX", x: 124, y: 5 },
      { id: "pcie-port", label: "PCIe FPC", x: 10, y: 50 },
      { id: "usb-c-pwr", label: "USB-C PWR", x: 10, y: 105 },
      { id: "power-button", label: "PWR BUTTON", x: 140, y: 100 },
    ],
  },
  "tp4056": {
    id: "tp4056",
    name: "Type-C TP4056 Charger",
    icon: "🔌",
    width: 75,
    height: 45,
    color: "#1D4ED8",
    pins: [
      { id: "usb-in", label: "USB-C IN", x: 5, y: 22 },
      { id: "in-plus", label: "IN +", x: 15, y: 5 },
      { id: "in-minus", label: "IN -", x: 15, y: 40 },
      { id: "bat-plus", label: "BAT +", x: 70, y: 5 },
      { id: "bat-minus", label: "BAT -", x: 70, y: 40 },
      { id: "out-plus", label: "OUT +", x: 55, y: 5 },
      { id: "out-minus", label: "OUT -", x: 55, y: 40 },
    ],
  },
  "lipo-battery": {
    id: "lipo-battery",
    name: "LiPo Battery 3.7V",
    icon: "🔋",
    width: 80,
    height: 45,
    color: "#F59E0B",
    imageUrl: "/lipo-battery.png",
    pins: [
      { id: "pos", label: "RED (+)", x: 70, y: 10 },
      { id: "neg", label: "BLK (-)", x: 70, y: 35 },
    ],
  },
  "lm2596-buck": {
    id: "lm2596-buck",
    name: "LM2596 Buck Converter",
    icon: "⚡",
    width: 90,
    height: 50,
    color: "#115E59",
    imageUrl: "/lm2596-buck.png",
    pins: [
      { id: "in-plus", label: "IN +", x: 10, y: 10 },
      { id: "in-minus", label: "IN -", x: 10, y: 40 },
      { id: "out-plus", label: "OUT +", x: 80, y: 10 },
      { id: "out-minus", label: "OUT -", x: 80, y: 40 },
      { id: "pot-adj", label: "ADJ POT", x: 45, y: 10 },
    ],
  },
  "level-shifter": {
    id: "level-shifter",
    name: "3.3V-5V Level Shifter",
    icon: "🔄",
    width: 80,
    height: 50,
    color: "#374151",
    pins: [
      { id: "lv", label: "LV (3.3V)", x: 10, y: 10 },
      { id: "lv1", label: "LV1", x: 25, y: 10 },
      { id: "lv2", label: "LV2", x: 40, y: 10 },
      { id: "gnd-l", label: "GND", x: 55, y: 10 },
      { id: "hv", label: "HV (5V)", x: 10, y: 40 },
      { id: "hv1", label: "HV1", x: 25, y: 40 },
      { id: "hv2", label: "HV2", x: 40, y: 40 },
      { id: "gnd-h", label: "GND", x: 55, y: 40 },
    ],
  },
  "jumper-m-m": {
    id: "jumper-m-m",
    name: "Jumper Wires Pack",
    icon: "🪢",
    width: 60,
    height: 35,
    color: "#4B5563",
    pins: [
      { id: "pin-a", label: "TIP A", x: 10, y: 17 },
      { id: "pin-b", label: "TIP B", x: 50, y: 17 },
    ],
  },
}

export const EXPERIMENT_CONFIGS: Record<string, ExperimentConfig> = {
  "s1e1": {
    id: "s1e1",
    name: "S1E1 - Getting Started with Circuits",
    title: "S1E1 - Getting Started with Circuits",
    season: 1,
    episode: 1,
    components: ["arduino-uno", "led-red", "resistor"],
    starterCode: `// Episode 1: LED Blink Starter
#define LED_PIN 13

void setup() {
  Serial.begin(9600);
  pinMode(LED_PIN, OUTPUT);
  Serial.println("Circuit Initialized!");
}

void loop() {
  digitalWrite(LED_PIN, HIGH);
  Serial.println("LED turned ON");
  delay(1000);
  digitalWrite(LED_PIN, LOW);
  Serial.println("LED turned OFF");
  delay(1000);
}`,
    objective: "Wire the Red LED to Arduino Pin 13 through the 220Ω resistor. Connect the LED anode to Pin 13 and cathode to GND. Run the code to verify LED blink logs in the serial monitor.",
    expectedOutputKeywords: ["initialized", "on", "off"],
    hint: "Make sure you connect Pin 13 of the Arduino to one pin of the resistor, the other pin of the resistor to the LED anode (+), and the LED cathode (-) to Arduino GND.",
  },
  "s1e2": {
    id: "s1e2",
    name: "S1E2 - Arduino Programming Basics",
    title: "S1E2 - Arduino Programming Basics",
    season: 1,
    episode: 2,
    components: ["arduino-uno", "push-button", "led-red", "resistor"],
    starterCode: `// Episode 2: Push Button Control
#define BUTTON_PIN 2
#define LED_PIN 13

void setup() {
  Serial.begin(9600);
  pinMode(BUTTON_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  Serial.println("Ready for Button press...");
}

void loop() {
  int val = digitalRead(BUTTON_PIN);
  if (val == HIGH) {
    digitalWrite(LED_PIN, HIGH);
    Serial.println("Button Pressed - LED Active");
  } else {
    digitalWrite(LED_PIN, LOW);
  }
  delay(100);
}`,
    objective: "Wire a push button to Pin 2 on the Arduino Uno, and the Red LED to Pin 13. Press run and trigger button active logs.",
    expectedOutputKeywords: ["ready", "pressed", "active"],
    hint: "Wire Pin 2 of Arduino to the Push Button, VCC-5V to the other button pin. Also make sure Pin 13 routes to LED anode through the resistor, and cathode to GND.",
  },
  "s1e3": {
    id: "s1e3",
    name: "S1E3 - Sensor Integration (HC-SR04)",
    title: "S1E3 - Sensor Integration (HC-SR04)",
    season: 1,
    episode: 3,
    components: ["arduino-uno", "hc-sr04", "buzzer"],
    starterCode: `// Episode 3: HC-SR04 Ultrasonic Distance sensor
#define TRIG_PIN 7
#define ECHO_PIN 6
#define BUZZER_PIN 8

void setup() {
  Serial.begin(9600);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  Serial.println("Sensor Node Configured.");
}

void loop() {
  // Trigger sensor pulse
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  long duration = pulseIn(ECHO_PIN, HIGH);
  long distanceCm = duration * 0.034 / 2;
  
  // Custom reading mock fallback
  distanceCm = analogRead(A0) / 5; // Simulating distance values
  
  Serial.print("Sensor distance: ");
  Serial.print(distanceCm);
  Serial.println(" cm");
  
  if (distanceCm < 30) {
    digitalWrite(BUZZER_PIN, HIGH);
    Serial.println("ALERT - Obstacle detected - BUZZER active!");
  } else {
    digitalWrite(BUZZER_PIN, LOW);
  }
  delay(1000);
}`,
    objective: "Wire the HC-SR04 sensor (VCC to 5V, GND to GND, TRIG to Pin 7, ECHO to Pin 6) and the buzzer to Pin 8. Trigger buzzer alarm by simulating distance < 30cm.",
    expectedOutputKeywords: ["sensor", "distance", "alert", "buzzer"],
    hint: "Make sure all HC-SR04 pins are mapped correctly: TRIG to 7, ECHO to 6. Wire the Buzzer + leg to Pin 8, and - to GND.",
  },
  "s1e4": {
    id: "s1e4",
    name: "S1E4 - Motor Speed & Direction Control",
    title: "S1E4 - Motor Speed & Direction Control",
    season: 1,
    episode: 4,
    components: ["arduino-uno", "l298n", "dc-motor"],
    starterCode: `// Episode 4: L298N Motor Controller
#define ENA 9
#define IN1 4
#define IN2 5

void setup() {
  Serial.begin(9600);
  pinMode(ENA, OUTPUT);
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  Serial.println("Driver setup complete.");
}

void loop() {
  // Drive forward at 80% speed
  analogWrite(ENA, 200); 
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  Serial.println("Motor A: FORWARD at 80% speed");
  delay(2000);
  
  // Stop
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);
  Serial.println("Motor A: STOP");
  delay(1000);
}`,
    objective: "Wire L298N inputs to Pin 9 (ENA), Pin 4 (IN1), Pin 5 (IN2), and connect OUT1 / OUT2 to the DC Motor. Complete the simulation script to drive and stop.",
    expectedOutputKeywords: ["driver", "forward", "stop", "motor"],
    hint: "Verify ENA is connected to Pin 9 for PWM output. IN1 and IN2 are digital pins on 4 and 5.",
  },
  "s1e5": {
    id: "s1e5",
    name: "S1E5 - ESP32 IoT Node Simulation",
    title: "S1E5 - ESP32 IoT Node Simulation",
    season: 1,
    episode: 5,
    components: ["esp32"],
    starterCode: `// Episode 5: ESP32 IoT Node
void setup() {
  Serial.begin(115200);
  Serial.println("WiFi Connecting...");
  delay(1000);
  Serial.println("WiFi Connected! IP: 192.168.1.45");
}

void loop() {
  float temp = 24.5 + (random(-10, 10) / 10.0);
  Serial.print("[IoT] Temp telemetry: ");
  Serial.print(temp);
  Serial.println(" C");
  delay(1500);
}`,
    objective: "Explore high-speed ESP32 operations. Simply compile and verify wifi connectivity telemetry outputs in the console.",
    expectedOutputKeywords: ["wifi", "connected", "telemetry", "temp"],
    hint: "Press Run to execute the ESP32 code simulation.",
  },
  "s1e6": {
    id: "s1e6",
    name: "S1E6 - Servo Swiping Kinematics",
    title: "S1E6 - Servo Swiping Kinematics",
    season: 1,
    episode: 6,
    components: ["arduino-uno", "servo-motor"],
    starterCode: `// Episode 6: SG90 Servo Sweeper
#define SERVO_PIN 9

void setup() {
  Serial.begin(9600);
  Serial.println("Servo Initialized on Pin 9.");
}

void loop() {
  Serial.println("Servo sweeping: moving to 0");
  delay(1000);
  Serial.println("Servo sweeping: moving to 90");
  delay(1000);
  Serial.println("Servo sweeping: moving to 180");
  delay(1000);
}`,
    objective: "Wire the Servo PWM input line to Pin 9 on the Arduino, and complete a full servo movement sweep loop.",
    expectedOutputKeywords: ["servo", "initialized", "sweeping", "moving"],
    hint: "SG90 Servo wire layout: PWM (Signal) to Pin 9, VCC to 5V, GND to GND.",
  },
  "s1e7": {
    id: "s1e7",
    name: "S1E7 - Full Autonomy Obstacle Avoidance",
    title: "S1E7 - Full Autonomy Obstacle Avoidance",
    season: 1,
    episode: 7,
    components: ["arduino-uno", "hc-sr04", "l298n", "dc-motor"],
    starterCode: `// Episode 7: Complete Obstacle Avoidance Robot
#define TRIG_PIN 7
#define ECHO_PIN 6
#define ENA 9
#define IN1 4
#define IN2 5

void setup() {
  Serial.begin(9600);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(ENA, OUTPUT);
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  Serial.println("Autonomy System Waking...");
}

void loop() {
  // Read distance (Mocking using Analog pin read)
  long distanceCm = analogRead(A0) / 6;
  Serial.print("Distance: ");
  Serial.print(distanceCm);
  Serial.println(" cm");
  
  if (distanceCm < 20) {
    // STOP motors
    digitalWrite(IN1, LOW);
    digitalWrite(IN2, LOW);
    Serial.println("OBSTACLE DETECTED! STOPPING MOTORS");
  } else {
    // Move Forward
    analogWrite(ENA, 180);
    digitalWrite(IN1, HIGH);
    digitalWrite(IN2, LOW);
    Serial.println("PATH CLEAR - MOVING FORWARD");
  }
  delay(1000);
}`,
    objective: "Wire HC-SR04 (TRIG=7, ECHO=6) and L298N motor driver inputs. Drive forward when path is clear, and stop when an obstacle is within 20cm.",
    expectedOutputKeywords: ["autonomy", "distance", "obstacle", "stopping", "moving"],
    hint: "Make sure all sensor wires and motor driver lines are connected securely on your virtual canvas.",
  },
}
