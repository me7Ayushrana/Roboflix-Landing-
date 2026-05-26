"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Plus, Trash2, FileText, Code, CheckCircle, RefreshCw, Sparkles, Youtube, ExternalLink } from "lucide-react"
import { SEASONS_DATA } from "@/lib/lms-data"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

interface User {
  email: string
}

interface FileItem {
  name: string
  type: string
}

interface CodeSnippet {
  language: string
  snippet: string
}

interface Episode {
  id: number
  title: string
  description: string
  duration: string
  isFree?: boolean
  videoUrl: string
  summary: string
  files: FileItem[]
  codes: CodeSnippet[]
}

interface Season {
  id: number
  title: string
  subtitle: string
  tagline: string
  description: string
  image: string
  releaseDate: string
  episodes: Episode[]
}

export default function LmsAdminPanel() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [seasonsData, setSeasonsData] = useState<Season[]>([])

  // Selection states
  const [selectedSeasonId, setSelectedSeasonId] = useState<number>(1)
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<number | "new">(1)

  // Episode Form States
  const [epTitle, setEpTitle] = useState("")
  const [epDesc, setEpDesc] = useState("")
  const [epDuration, setEpDuration] = useState("")
  const [epIsFree, setEpIsFree] = useState(false)
  const [epVideoUrl, setEpVideoUrl] = useState("")
  const [epSummary, setEpSummary] = useState("")
  const [epFiles, setEpFiles] = useState<FileItem[]>([])
  const [epCodes, setEpCodes] = useState<CodeSnippet[]>([])

  // File/Code helper form states
  const [newFileName, setNewFileName] = useState("")
  const [newFileType, setNewFileType] = useState("Code")
  const [newCodeLang, setNewCodeLang] = useState("Arduino")
  const [newCodeSnippet, setNewCodeSnippet] = useState("")

  // UI Toast states
  const [toastMessage, setToastMessage] = useState("")
  const [parsedVideoId, setParsedVideoId] = useState("")

  // ─── Authentication Check ─────────────────────────────────────
  useEffect(() => {
    const checkSession = async () => {
      try {
        if (isSupabaseConfigured()) {
          const { data: { session } } = await supabase.auth.getSession()
          if (session && session.user) {
            setUser({ email: session.user.email || "" })
            setIsLoading(false)
            return
          }
        }
        
        // Fallback to local storage if Supabase is not configured or has no active session
        const storedUser = localStorage.getItem("lms_user")
        if (storedUser) {
          setUser(JSON.parse(storedUser))
          setIsLoading(false)
        } else {
          window.location.href = "/lms/login"
        }
      } catch (err) {
        window.location.href = "/lms/login"
      }
    }

    checkSession()
  }, [])

  // ─── Data Initialization ───────────────────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("roboflix_lms_seasons")
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setSeasonsData(parsed)
        } catch (e) {
          setSeasonsData(SEASONS_DATA)
        }
      } else {
        setSeasonsData(SEASONS_DATA)
        localStorage.setItem("roboflix_lms_seasons", JSON.stringify(SEASONS_DATA))
      }
    }
  }, [])

  // ─── Parse YouTube Video ID on Input Change ───────────────────
  useEffect(() => {
    if (!epVideoUrl) {
      setParsedVideoId("")
      return
    }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = epVideoUrl.match(regExp)
    if (match && match[2].length === 11) {
      setParsedVideoId(match[2])
    } else {
      setParsedVideoId("")
    }
  }, [epVideoUrl])

  // ─── Fill Form fields when selected Season/Episode changes ────
  useEffect(() => {
    if (seasonsData.length === 0) return

    const season = seasonsData.find((s) => s.id === selectedSeasonId)
    if (!season) return

    if (selectedEpisodeId === "new") {
      // Clear for new episode
      const nextId = season.episodes.length > 0 ? Math.max(...season.episodes.map(e => e.id)) + 1 : 1
      setEpTitle(`Episode ${nextId}: New Project`)
      setEpDesc("")
      setEpDuration("45 min")
      setEpIsFree(false)
      setEpVideoUrl("")
      setEpSummary("")
      setEpFiles([])
      setEpCodes([])
    } else {
      const ep = season.episodes.find((e) => e.id === selectedEpisodeId)
      if (ep) {
        setEpTitle(ep.title)
        setEpDesc(ep.description)
        setEpDuration(ep.duration)
        setEpIsFree(!!ep.isFree)
        setEpVideoUrl(ep.videoUrl)
        setEpSummary(ep.summary || "")
        setEpFiles(ep.files || [])
        setEpCodes(ep.codes || [])
      }
    }
  }, [selectedSeasonId, selectedEpisodeId, seasonsData])

  // ─── Actions ───────────────────────────────────────────────────
  const addFile = () => {
    if (!newFileName.trim()) return
    setEpFiles(prev => [...prev, { name: newFileName.trim(), type: newFileType }])
    setNewFileName("")
    showToast("File attachment added")
  }

  const removeFile = (index: number) => {
    setEpFiles(prev => prev.filter((_, i) => i !== index))
    showToast("File attachment removed")
  }

  const addCodeSnippet = () => {
    if (!newCodeSnippet.trim()) return
    setEpCodes(prev => [...prev, { language: newCodeLang, snippet: newCodeSnippet.trim() }])
    setNewCodeSnippet("")
    showToast("Code snippet added")
  }

  const removeCodeSnippet = (index: number) => {
    setEpCodes(prev => prev.filter((_, i) => i !== index))
    showToast("Code snippet removed")
  }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(""), 3000)
  }

  const saveEpisode = () => {
    if (!epTitle.trim()) {
      alert("Episode Title is required")
      return
    }

    const updatedSeasons = seasonsData.map(s => {
      if (s.id !== selectedSeasonId) return s

      let updatedEpisodes = [...s.episodes]

      if (selectedEpisodeId === "new") {
        const nextId = s.episodes.length > 0 ? Math.max(...s.episodes.map(e => e.id)) + 1 : 1
        const newEp: Episode = {
          id: nextId,
          title: epTitle.trim(),
          description: epDesc.trim(),
          duration: epDuration.trim(),
          isFree: epIsFree,
          videoUrl: epVideoUrl.trim(),
          summary: epSummary.trim(),
          files: epFiles,
          codes: epCodes
        }
        updatedEpisodes.push(newEp)
        // Set state to select this newly created episode
        setTimeout(() => setSelectedEpisodeId(nextId), 50)
      } else {
        updatedEpisodes = s.episodes.map(e => {
          if (e.id !== selectedEpisodeId) return e
          return {
            ...e,
            title: epTitle.trim(),
            description: epDesc.trim(),
            duration: epDuration.trim(),
            isFree: epIsFree,
            videoUrl: epVideoUrl.trim(),
            summary: epSummary.trim(),
            files: epFiles,
            codes: epCodes
          }
        })
      }

      return {
        ...s,
        episodes: updatedEpisodes
      }
    })

    setSeasonsData(updatedSeasons)
    localStorage.setItem("roboflix_lms_seasons", JSON.stringify(updatedSeasons))
    showToast("Episode saved successfully! 🚀")
  }

  const deleteEpisode = () => {
    if (selectedEpisodeId === "new") return
    if (!confirm("Are you sure you want to delete this episode? This cannot be undone.")) return

    const updatedSeasons = seasonsData.map(s => {
      if (s.id !== selectedSeasonId) return s
      return {
        ...s,
        episodes: s.episodes.filter(e => e.id !== selectedEpisodeId)
      }
    })

    setSeasonsData(updatedSeasons)
    localStorage.setItem("roboflix_lms_seasons", JSON.stringify(updatedSeasons))
    
    // Select first episode of season after deletion
    const firstEp = updatedSeasons.find(s => s.id === selectedSeasonId)?.episodes[0]
    setSelectedEpisodeId(firstEp ? firstEp.id : "new")
    showToast("Episode deleted successfully")
  }

  const resetAllData = () => {
    if (!confirm("This will erase all custom episodes, YouTube links, and media uploads, restoring Roboflix data to defaults. Continue?")) return
    setSeasonsData(SEASONS_DATA)
    localStorage.setItem("roboflix_lms_seasons", JSON.stringify(SEASONS_DATA))
    setSelectedSeasonId(1)
    setSelectedEpisodeId(1)
    showToast("All data restored to system defaults 🔄")
  }

  if (isLoading || seasonsData.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading Admin Panel...</div>
      </div>
    )
  }

  const currentSeason = seasonsData.find(s => s.id === selectedSeasonId)

  return (
    <div className="min-h-screen bg-[#070707] text-white font-sans antialiased pb-20">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800/80 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/lms/dashboard" className="p-2 hover:bg-white/5 border border-transparent hover:border-white/10 rounded-lg text-gray-400 hover:text-white transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="text-xl font-bold tracking-wider font-display">
            ROBO<span className="text-red-600">FLIX</span> <span className="text-xs uppercase bg-red-600/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded font-mono font-bold ml-1.5">Admin</span>
          </span>
        </div>

        <button
          onClick={resetAllData}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-red-600/10 hover:border-red-500/30 hover:text-red-500 rounded-lg text-xs font-bold uppercase transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </header>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Top bar description */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-red-600 animate-pulse" />
              LMS Course Management
            </h1>
            <p className="text-gray-400 text-sm mt-1">Directly add, modify, and publish course slides, media resources, codes, and high-fidelity video embeds.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Choose Video, Season, and Episode */}
          <div className="lg:col-span-4 space-y-6">
            <div className="border border-white/5 rounded-2xl bg-black/60 backdrop-blur p-6 space-y-6 shadow-2xl">
              
              <h2 className="text-lg font-bold text-white border-b border-white/5 pb-3">Course Navigation</h2>
              
              {/* Season Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Select Season</label>
                <div className="space-y-2">
                  {seasonsData.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedSeasonId(s.id)
                        const firstEp = s.episodes[0]
                        setSelectedEpisodeId(firstEp ? firstEp.id : "new")
                      }}
                      className={`w-full p-4 rounded-xl border text-left flex justify-between items-center transition-all ${
                        selectedSeasonId === s.id
                          ? "bg-red-600/10 border-red-600 text-white font-semibold shadow-[0_0_15px_rgba(220,38,38,0.15)]"
                          : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <div>
                        <p className="text-xs text-red-500 font-bold font-mono">S{s.id}</p>
                        <h3 className="font-bold truncate text-sm mt-0.5">{s.subtitle} — {s.title}</h3>
                      </div>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-black/40 border border-white/5">
                        {s.episodes.length} episodes
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Episode Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Select Episode</label>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {currentSeason?.episodes.map((ep) => (
                    <button
                      key={ep.id}
                      onClick={() => setSelectedEpisodeId(ep.id)}
                      className={`w-full p-3 rounded-lg border text-left text-xs flex justify-between items-center transition-all ${
                        selectedEpisodeId === ep.id
                          ? "bg-white/10 border-white/20 text-white font-bold"
                          : "bg-white/5 border-transparent text-gray-400 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span className="truncate">{ep.title}</span>
                      <span className="font-mono text-[10px] text-gray-500 shrink-0 ml-2">{ep.duration}</span>
                    </button>
                  ))}

                  {/* Add New Episode Trigger */}
                  <button
                    onClick={() => setSelectedEpisodeId("new")}
                    className={`w-full p-3 rounded-lg border border-dashed text-left text-xs flex items-center justify-center gap-2 transition-all ${
                      selectedEpisodeId === "new"
                        ? "bg-red-600/20 border-red-600/50 text-red-500 font-bold"
                        : "border-gray-800 text-gray-500 hover:border-red-600/40 hover:text-red-500"
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Episode</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Dynamic Form Fields */}
          <div className="lg:col-span-8 space-y-6">
            <div className="border border-white/5 rounded-2xl bg-black/60 backdrop-blur p-6 sm:p-8 space-y-8 shadow-2xl">
              
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-white">
                    {selectedEpisodeId === "new" ? "New Episode Setup" : `Edit Episode Data`}
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">Configure text materials, metadata attachments, and video players.</p>
                </div>
                {selectedEpisodeId !== "new" && (
                  <button
                    onClick={deleteEpisode}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 rounded-lg text-xs font-bold uppercase text-red-500 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}
              </div>

              {/* Basic Fields Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Episode Title</label>
                  <input
                    type="text"
                    value={epTitle}
                    onChange={(e) => setEpTitle(e.target.value)}
                    className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none text-white transition-colors"
                    placeholder="e.g. Episode 5: Autonomous Mapping"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Duration Indicator</label>
                  <input
                    type="text"
                    value={epDuration}
                    onChange={(e) => setEpDuration(e.target.value)}
                    className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none text-white transition-colors"
                    placeholder="e.g. 50 min"
                  />
                </div>
              </div>

              {/* Free status toggle */}
              <div className="flex items-center gap-3 bg-[#111] border border-gray-800/80 p-4 rounded-xl">
                <input
                  type="checkbox"
                  id="epIsFree"
                  checked={epIsFree}
                  onChange={(e) => setEpIsFree(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-800 text-red-600 accent-red-600 cursor-pointer"
                />
                <div>
                  <label htmlFor="epIsFree" className="block text-sm font-bold text-white cursor-pointer select-none">
                    Set Episode to Free Preview
                  </label>
                  <p className="text-xs text-gray-400 mt-0.5">Enabling this bypasses active logins and allows prospective students to watch directly.</p>
                </div>
              </div>

              {/* Video URL & Optimization Feedback */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Direct YouTube Link</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <Youtube className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={epVideoUrl}
                    onChange={(e) => setEpVideoUrl(e.target.value)}
                    className="w-full bg-[#111] border border-gray-800 rounded-xl pl-11 pr-4 py-3 text-sm focus:border-red-600 outline-none text-white transition-colors placeholder:text-gray-600"
                    placeholder="e.g. https://www.youtube.com/watch?v=yqWX86uT5jM"
                  />
                </div>

                {/* Instant validation badge */}
                {parsedVideoId ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-red-600/5 border border-red-500/20 p-3 rounded-lg text-xs">
                    <div className="flex items-center gap-2 text-red-500 font-bold">
                      <CheckCircle className="w-4 h-4" />
                      <span>YouTube link parsed successfully!</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono bg-black/40 px-2 py-0.5 rounded border border-white/5 text-gray-400">ID: {parsedVideoId}</span>
                      <a
                        href={`https://www.youtube.com/watch?v=${parsedVideoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-gray-300 hover:text-white underline font-semibold"
                      >
                        <span>Test link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ) : epVideoUrl ? (
                  <div className="bg-amber-600/5 border border-amber-500/20 p-3 rounded-lg text-xs text-amber-500 font-semibold">
                    Warning: Invalid YouTube format. Be sure to paste a raw watch link or sharing code.
                  </div>
                ) : null}
              </div>

              {/* Episode description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Short Description</label>
                <textarea
                  value={epDesc}
                  onChange={(e) => setEpDesc(e.target.value)}
                  className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none text-white transition-colors h-24 resize-none"
                  placeholder="Summarize the core project built in this lesson..."
                />
              </div>

              {/* Summary text */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Deep Lesson Summary</label>
                <textarea
                  value={epSummary}
                  onChange={(e) => setEpSummary(e.target.value)}
                  className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none text-white transition-colors h-32 resize-none"
                  placeholder="Detail the technical concepts, materials, and processes covered in the video..."
                />
              </div>

              {/* Files Upload Attachment Option */}
              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Resource File Attachments</label>
                
                {/* Form fields to add new */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-[#111] border border-gray-800 p-4 rounded-xl items-end">
                  <div className="sm:col-span-6">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">File Name</label>
                    <input
                      type="text"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      placeholder="e.g. starter_circuit.ino"
                      className="w-full bg-black border border-gray-800 rounded-lg px-3 py-2 text-xs focus:border-red-600 outline-none"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Type Category</label>
                    <select
                      value={newFileType}
                      onChange={(e) => setNewFileType(e.target.value)}
                      className="w-full bg-black border border-gray-800 rounded-lg px-3 py-2 text-xs focus:border-red-600 outline-none text-white"
                    >
                      <option value="Code">Code</option>
                      <option value="Guide">Guide</option>
                      <option value="Bill of Materials">Bill of Materials</option>
                      <option value="Other">Other File</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={addFile}
                      className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase rounded-lg transition-colors h-[34px]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                {/* Rendered files list */}
                <div className="space-y-2">
                  {epFiles.length === 0 ? (
                    <p className="text-xs text-gray-500 italic p-2 border border-dashed border-gray-800 rounded-lg text-center">No reference files uploaded</p>
                  ) : (
                    epFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl text-xs">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-red-500" />
                          <span className="font-semibold text-gray-200">{file.name}</span>
                          <span className="text-[10px] uppercase font-mono bg-black/40 px-1.5 py-0.5 rounded border border-white/5 text-gray-500">{file.type}</span>
                        </div>
                        <button
                          onClick={() => removeFile(idx)}
                          className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Code Snippets Section */}
              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Interactive Code Snippets</label>

                {/* Form fields to add code snippet */}
                <div className="bg-[#111] border border-gray-800 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Snippet details</label>
                    <select
                      value={newCodeLang}
                      onChange={(e) => setNewCodeLang(e.target.value)}
                      className="bg-black border border-gray-800 rounded-lg px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase text-white outline-none"
                    >
                      <option value="Arduino">Arduino</option>
                      <option value="Python">Python</option>
                      <option value="C++">C++</option>
                      <option value="HTML/CSS">HTML/CSS</option>
                      <option value="JavaScript">JavaScript</option>
                    </select>
                  </div>
                  <textarea
                    value={newCodeSnippet}
                    onChange={(e) => setNewCodeSnippet(e.target.value)}
                    placeholder="Paste code snippet here..."
                    className="w-full bg-black border border-gray-800 rounded-lg p-3 text-xs font-mono h-24 resize-none outline-none focus:border-red-600 text-white"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={addCodeSnippet}
                      className="flex items-center gap-1 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Code Block</span>
                    </button>
                  </div>
                </div>

                {/* Rendered codes list */}
                <div className="space-y-3">
                  {epCodes.length === 0 ? (
                    <p className="text-xs text-gray-500 italic p-2 border border-dashed border-gray-800 rounded-lg text-center">No interactive snippets provided</p>
                  ) : (
                    epCodes.map((code, idx) => (
                      <div key={idx} className="border border-white/5 bg-white/5 rounded-xl overflow-hidden text-xs">
                        <div className="flex justify-between items-center px-4 py-2.5 bg-black/40 border-b border-white/5">
                          <div className="flex items-center gap-2">
                            <Code className="w-4 h-4 text-red-500" />
                            <span className="font-mono font-bold uppercase tracking-wider text-[10px] text-gray-300">{code.language}</span>
                          </div>
                          <button
                            onClick={() => removeCodeSnippet(idx)}
                            className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-white/5 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <pre className="p-4 overflow-x-auto bg-black/60 text-gray-300 font-mono text-[11px] max-h-32">
                          <code>{code.snippet}</code>
                        </pre>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Form Save Section */}
              <div className="border-t border-white/5 pt-6 flex justify-end gap-3">
                <button
                  onClick={saveEpisode}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold uppercase rounded-xl transition-all shadow-lg shadow-red-600/20 active:scale-[0.98]"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{selectedEpisodeId === "new" ? "Publish Episode" : "Save Changes"}</span>
                </button>
              </div>

            </div>
          </div>

        </div>

      </main>

      {/* Floating interactive feedback toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 px-4 py-3 bg-red-600 border border-red-500 rounded-xl shadow-2xl flex items-center gap-2.5 z-[100] text-sm font-semibold select-none"
          >
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
