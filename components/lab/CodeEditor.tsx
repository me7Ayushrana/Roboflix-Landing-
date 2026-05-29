"use client"

import Editor, { Monaco } from "@monaco-editor/react"

interface CodeEditorProps {
  code: string
  onChange: (val: string) => void
}

export default function CodeEditor({ code, onChange }: CodeEditorProps) {
  
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value)
    }
  }

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    // Custom theme configuration for Monaco matching Roboflix cinematic branding
    monaco.editor.defineTheme("roboflix-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6A737D", fontStyle: "italic" },
        { token: "keyword", foreground: "FF4554", fontStyle: "bold" },
        { token: "string", foreground: "9ECE6A" },
        { token: "number", foreground: "FF9E64" },
        { token: "type", foreground: "00B4D8" },
        { token: "function", foreground: "73DACA", fontStyle: "bold" }
      ],
      colors: {
        "editor.background": "#0c0c0c",
        "editor.foreground": "#D4D4D4",
        "editor.lineHighlightBackground": "#141414",
        "editorLineNumber.foreground": "#4A4A4A",
        "editorLineNumber.activeForeground": "#E50914",
        "editor.selectionBackground": "#FF455433"
      }
    })
    
    monaco.editor.setTheme("roboflix-dark")
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0c0c0c] border-b border-gray-800 relative">
      {/* Editor Ribbon Title */}
      <div className="h-9 border-b border-gray-800 bg-[#0d0d0d] flex items-center px-4 justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-mono">
            sketch.ino
          </span>
        </div>
        <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-black/40 border border-white/5 text-gray-500">
          C++ (Arduino)
        </span>
      </div>

      {/* Editor Mount Area */}
      <div className="flex-1 min-h-[200px] relative">
        <Editor
          height="100%"
          defaultLanguage="cpp"
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 13,
            fontFamily: "'Fira Code', 'Courier New', monospace",
            minimap: { enabled: false },
            lineHeight: 20,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            smoothScrolling: true,
            scrollBeyondLastLine: false,
            padding: { top: 12, bottom: 12 },
            automaticLayout: true
          }}
          loading={
            <div className="absolute inset-0 bg-[#0c0c0c] flex items-center justify-center text-xs text-gray-500 font-mono">
              Loading Monaco Editor...
            </div>
          }
        />
      </div>
    </div>
  )
}
