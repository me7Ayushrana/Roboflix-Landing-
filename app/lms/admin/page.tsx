"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Plus, Trash2, FileText, Code, CheckCircle, RefreshCw, Sparkles, Youtube, ExternalLink, AlertCircle, X } from "lucide-react"
import { SEASONS_DATA } from "@/lib/lms-data"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

interface User {
  email: string
}

interface FileItem {
  name: string
  type: string
  url?: string
}

interface CodeSnippet {
  language: string
  snippet: string
}

interface UserAccess {
  email: string
  phone: string
  status: "Active" | "Revoked"
  tier: "Pro" | "Founding Batch"
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
  const [newFileUrl, setNewFileUrl] = useState("")
  const [newCodeLang, setNewCodeLang] = useState("Arduino")
  const [newCodeSnippet, setNewCodeSnippet] = useState("")

  // Change Admin Password states
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [newAdminPass, setNewAdminPass] = useState("")
  const [confirmAdminPass, setConfirmAdminPass] = useState("")
  const [changePassLoading, setChangePassLoading] = useState(false)

  // UI Toast states
  const [toastMessage, setToastMessage] = useState("")
  const [parsedVideoId, setParsedVideoId] = useState("")

  // Tab Navigation state
  const [activeTab, setActiveTab] = useState<"course" | "users">("course")

  // Subscription states
  const [usersList, setUsersList] = useState<UserAccess[]>([])
  const [newSubEmail, setNewSubEmail] = useState("")
  const [newSubPassword, setNewSubPassword] = useState("")
  const [newSubTier, setNewSubTier] = useState<"Pro" | "Founding Batch">("Pro")
  const [searchQuery, setSearchQuery] = useState("")
  const [dbStatus, setDbStatus] = useState<"checking" | "connected" | "missing_table" | "error">("checking")
  const [dbErrorMessage, setDbErrorMessage] = useState("")
  const [showSqlModal, setShowSqlModal] = useState(false)

  // ─── Authentication Check ─────────────────────────────────────
  useEffect(() => {
    const checkSession = async () => {
      try {
        let loggedInEmail = ""
        if (isSupabaseConfigured()) {
          const { data: { session } } = await supabase.auth.getSession()
          if (session && session.user) {
            loggedInEmail = session.user.email || ""
          }
        }
        
        if (!loggedInEmail) {
          const storedUser = localStorage.getItem("lms_user")
          if (storedUser) {
            const parsed = JSON.parse(storedUser)
            loggedInEmail = parsed.email || ""
          }
        }

        if (loggedInEmail) {
          // ONLY one admin allowed
          const isUserAdmin = loggedInEmail.toLowerCase() === "ayushamit007@gmail.com"
          
          if (isUserAdmin) {
            setUser({ email: loggedInEmail })
            setIsLoading(false)
          } else {
            alert("Access Denied: You are not authorized to view the LMS Admin Panel.")
            window.location.href = "/lms/dashboard"
          }
        } else {
          window.location.href = "/lms/login"
        }
      } catch (err) {
        window.location.href = "/lms/login"
      }
    }

    checkSession()
  }, [])

  // ─── Subscriptions Data Load ───────────────────────────────────
  useEffect(() => {
    const loadSubscriptions = async () => {
      if (typeof window === "undefined") return

      const defaultList = [
        { email: "hloshishirdwivedi@gmail.com", phone: "6260087052", status: "Active", tier: "Founding Batch" },
        { email: "rkrohan0718@gmail.com", phone: "8449844821", status: "Active", tier: "Pro" },
        { email: "sid22prakash@gmail.com", phone: "9074423858", status: "Active", tier: "Pro" },
        { email: "ansh.ritesh.singh.2010@gmail.com", phone: "9049410576", status: "Active", tier: "Pro" },
        { email: "jemit57@gmail.com", phone: "437-224-3735", status: "Active", tier: "Founding Batch" },
        { email: "ishinder@gmail.com", phone: "8288898544", status: "Active", tier: "Pro" },
      ] as UserAccess[]

      let dbLoadedSuccess = false

      if (isSupabaseConfigured()) {
        try {
          // Attempt to fetch from live Supabase table in real-time
          const { data, error } = await supabase
            .from("roboflix_lms_users")
            .select("*")
            .order("created_at", { ascending: true })

          if (error) {
            console.error("Supabase error fetching users:", error)
            const errMsg = error.message || ""
            if (error.code === "42P01" || errMsg.includes("does not exist") || errMsg.includes("schema cache")) {
              setDbStatus("missing_table")
            } else {
              setDbStatus("error")
            }
            setDbErrorMessage(errMsg)
          } else if (data) {
            setDbStatus("connected")
            dbLoadedSuccess = true
            if (data.length > 0) {
              const formatted = data.map((u: any) => ({
                email: u.email,
                phone: u.phone,
                status: u.status,
                tier: u.tier
              }))
              setUsersList(formatted)
              localStorage.setItem("roboflix_lms_users", JSON.stringify(formatted))
              return
            } else {
              // Table is empty, seed it with defaults in the cloud database!
              const { error: seedError } = await supabase.from("roboflix_lms_users").insert(defaultList)
              if (seedError) {
                console.error("Supabase seeding error:", seedError)
              }
              setUsersList(defaultList)
              localStorage.setItem("roboflix_lms_users", JSON.stringify(defaultList))
              return
            }
          }
        } catch (e: any) {
          console.error("Supabase load exception:", e)
          setDbStatus("error")
          setDbErrorMessage(e?.message || "Unknown connection error")
        }
      } else {
        setDbStatus("error")
        setDbErrorMessage("Supabase is not configured in environmental variables.")
      }

      // Fallback to local storage if Supabase is offline/not configured/errored
      if (!dbLoadedSuccess) {
        const stored = localStorage.getItem("roboflix_lms_users")
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as UserAccess[]
            const ishinder = parsed.find(u => u.email.toLowerCase() === "ishinder@gmail.com")
            let updated = false
            
            if (!ishinder) {
              parsed.push({ email: "ishinder@gmail.com", phone: "8288898544", status: "Active", tier: "Pro" })
              updated = true
            } else if (ishinder.status !== "Active") {
              ishinder.status = "Active"
              updated = true
            }
            
            if (updated) {
              localStorage.setItem("roboflix_lms_users", JSON.stringify(parsed))
              setUsersList(parsed)
            } else {
              setUsersList(parsed)
            }
          } catch (e) {
            setUsersList(defaultList)
            localStorage.setItem("roboflix_lms_users", JSON.stringify(defaultList))
          }
        } else {
          setUsersList(defaultList)
          localStorage.setItem("roboflix_lms_users", JSON.stringify(defaultList))
        }
      }
    }

    loadSubscriptions()
  }, [])

  // ─── Subscription Actions ─────────────────────────────────────
  const addSubscription = async () => {
    if (!newSubEmail.trim() || !newSubPassword.trim()) {
      alert("Email and Password are required to grant access.")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newSubEmail.trim())) {
      alert("Please enter a valid email address.")
      return
    }

    const exists = usersList.some(u => u.email.toLowerCase() === newSubEmail.trim().toLowerCase())
    if (exists) {
      alert("This user email already has an active or revoked access profile.")
      return
    }

    const newUser: UserAccess = {
      email: newSubEmail.trim(),
      phone: newSubPassword.trim(),
      status: "Active",
      tier: newSubTier
    }

    let isSavedInSupabase = false
    if (isSupabaseConfigured() && dbStatus !== "missing_table") {
      try {
        const { error } = await supabase
          .from("roboflix_lms_users")
          .insert([{ email: newUser.email, phone: newUser.phone, status: newUser.status, tier: newUser.tier }])
        
        if (error) {
          console.error("Supabase add error:", error)
          const errMsg = error.message || ""
          if (error.code === "42P01" || errMsg.includes("does not exist") || errMsg.includes("schema cache")) {
            setDbStatus("missing_table")
          }
          alert(`⚠️ Database Write Failed: ${error.message || "Failed to save to cloud database"}.\n\nYour changes are saved locally to this device but won't be accessible on other devices until the Supabase table is configured.`)
        } else {
          isSavedInSupabase = true
          setDbStatus("connected")
        }
      } catch (err: any) {
        console.error("Supabase add exception:", err)
        alert(`⚠️ Database Sync Offline: ${err.message || "Connection timed out"}.\n\nYour changes are saved locally to this device.`)
      }
    } else if (dbStatus === "missing_table") {
      alert("⚠️ Database Sync Offline: The 'roboflix_lms_users' table is missing in Supabase.\n\nYour changes are saved locally to this device but won't be accessible on other devices until table configuration is applied.")
    }

    const updated = [...usersList, newUser]
    setUsersList(updated)
    localStorage.setItem("roboflix_lms_users", JSON.stringify(updated))
    
    setNewSubEmail("")
    setNewSubPassword("")
    showToast(isSavedInSupabase ? `LMS access granted to ${newUser.email} globally! 🌐` : `LMS access granted to ${newUser.email} locally. 💻`)
  }

  const toggleSubscriptionStatus = async (email: string) => {
    let newStatus: "Active" | "Revoked" = "Active"
    
    const updated = usersList.map(u => {
      if (u.email.toLowerCase() !== email.toLowerCase()) return u
      newStatus = u.status === "Active" ? "Revoked" : "Active"
      return { ...u, status: newStatus }
    })

    let isSavedInSupabase = false
    if (isSupabaseConfigured() && dbStatus !== "missing_table") {
      try {
        const { error } = await supabase
          .from("roboflix_lms_users")
          .update({ status: newStatus })
          .eq("email", email)
        
        if (error) {
          console.error("Supabase toggle error:", error)
          alert(`⚠️ Database Update Failed: ${error.message}.\n\nStatus updated locally but could not sync with Supabase.`)
        } else {
          isSavedInSupabase = true
          setDbStatus("connected")
        }
      } catch (err: any) {
        console.error("Supabase toggle exception:", err)
        alert(`⚠️ Database Update Failed: ${err.message}.\n\nStatus updated locally.`)
      }
    }

    setUsersList(updated)
    localStorage.setItem("roboflix_lms_users", JSON.stringify(updated))
    showToast(isSavedInSupabase ? `Access status updated globally 🌐` : `Access status updated locally 💻`)
  }

  const deleteSubscription = async (email: string) => {
    if (!confirm(`Are you sure you want to completely delete LMS access for ${email}?`)) return
    
    const updated = usersList.filter(u => u.email.toLowerCase() !== email.toLowerCase())

    let isSavedInSupabase = false
    if (isSupabaseConfigured() && dbStatus !== "missing_table") {
      try {
        const { error } = await supabase
          .from("roboflix_lms_users")
          .delete()
          .eq("email", email)
        
        if (error) {
          console.error("Supabase delete error:", error)
          alert(`⚠️ Database Delete Failed: ${error.message}.\n\nUser removed locally but could not sync with Supabase.`)
        } else {
          isSavedInSupabase = true
          setDbStatus("connected")
        }
      } catch (err: any) {
        console.error("Supabase delete exception:", err)
        alert(`⚠️ Database Delete Failed: ${err.message}.\n\nUser removed locally.`)
      }
    }

    setUsersList(updated)
    localStorage.setItem("roboflix_lms_users", JSON.stringify(updated))
    showToast(isSavedInSupabase ? `Removed access record globally 🌐` : `Removed access record locally 💻`)
  }

  // ─── Data Initialization ───────────────────────────────────────
  useEffect(() => {
    const loadSeasons = async () => {
      let loadedFromDb = false
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from("roboflix_lms_settings")
            .select("value")
            .eq("key", "seasons_data")
            .maybeSingle()

          if (error) {
            console.error("Supabase load seasons error:", error)
            const errMsg = error.message || ""
            if (error.code === "42P01" || errMsg.includes("does not exist") || errMsg.includes("schema cache")) {
              setDbStatus("missing_table")
            }
          } else if (data && data.value) {
            setSeasonsData(data.value as any)
            localStorage.setItem("roboflix_lms_seasons", JSON.stringify(data.value))
            loadedFromDb = true
          }
        } catch (err) {
          console.error("Supabase load seasons error:", err)
        }
      }

      if (!loadedFromDb && typeof window !== "undefined") {
        const stored = localStorage.getItem("roboflix_lms_seasons")
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            setSeasonsData(parsed)
            
            // Auto-heal background synchronization: Since Supabase was empty or offline 
            // but we have custom local changes on the admin browser, automatically sync them to the cloud!
            if (isSupabaseConfigured()) {
              supabase
                .from("roboflix_lms_settings")
                .upsert({ key: "seasons_data", value: parsed, updated_at: new Date().toISOString() })
                .then(({ error: upsertErr }) => {
                  if (!upsertErr) {
                    console.log("Database Auto-Heal: Synchronized custom videos and links to Supabase! 🌐")
                    setDbStatus("connected")
                  }
                })
            }
          } catch (e) {
            setSeasonsData(SEASONS_DATA)
          }
        } else {
          setSeasonsData(SEASONS_DATA)
          localStorage.setItem("roboflix_lms_seasons", JSON.stringify(SEASONS_DATA))
          
          // Seed the database with default SEASONS_DATA in the background since it was empty
          if (isSupabaseConfigured()) {
            supabase
              .from("roboflix_lms_settings")
              .insert([{ key: "seasons_data", value: SEASONS_DATA, updated_at: new Date().toISOString() }])
              .then(({ error: insertErr }) => {
                if (!insertErr) {
                  setDbStatus("connected")
                }
              })
          }
        }
      }
    }

    loadSeasons()
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
    if (!newFileName.trim()) {
      alert("Resource Name is required")
      return
    }
    if (!newFileUrl.trim()) {
      alert("Google Drive Link is required")
      return
    }
    setEpFiles(prev => [...prev, { name: newFileName.trim(), type: newFileType, url: newFileUrl.trim() }])
    setNewFileName("")
    setNewFileUrl("")
    showToast("Resource link added successfully")
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

  const saveSeasonsToCloud = async (updated: Season[]) => {
    let isSavedInSupabase = false
    if (isSupabaseConfigured() && dbStatus !== "missing_table") {
      try {
        const { error } = await supabase
          .from("roboflix_lms_settings")
          .upsert({ key: "seasons_data", value: updated, updated_at: new Date().toISOString() })

        if (error) {
          console.error("Supabase upsert seasons error:", error)
          const errMsg = error.message || ""
          if (error.code === "42P01" || errMsg.includes("does not exist") || errMsg.includes("schema cache")) {
            setDbStatus("missing_table")
          }
          alert(`⚠️ Database Write Failed: ${error.message || "Failed to save to cloud database"}.\n\nYour changes are saved locally to this device but won't be accessible on other devices until the Supabase table 'roboflix_lms_settings' is configured.`)
        } else {
          isSavedInSupabase = true
          setDbStatus("connected")
        }
      } catch (err: any) {
        console.error("Supabase upsert seasons exception:", err)
        alert(`⚠️ Database Sync Offline: ${err.message || "Connection timed out"}.\n\nYour changes are saved locally to this device.`)
      }
    } else if (dbStatus === "missing_table") {
      alert("⚠️ Database Sync Offline: The 'roboflix_lms_settings' table is missing in Supabase.\n\nYour changes are saved locally to this device but won't be accessible on other devices until table configuration is applied.")
    }
    return isSavedInSupabase
  }

  const saveEpisode = async () => {
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
    
    const isCloudSaved = await saveSeasonsToCloud(updatedSeasons)
    showToast(isCloudSaved ? "Episode saved globally! 🚀" : "Episode saved locally. 💻")
  }

  const deleteEpisode = async () => {
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
    
    const isCloudSaved = await saveSeasonsToCloud(updatedSeasons)
    showToast(isCloudSaved ? "Episode deleted globally" : "Episode deleted locally")
  }

  const resetAllData = async () => {
    if (!confirm("This will erase all custom episodes, YouTube links, and media uploads, restoring Roboflix data to defaults. Continue?")) return
    setSeasonsData(SEASONS_DATA)
    localStorage.setItem("roboflix_lms_seasons", JSON.stringify(SEASONS_DATA))
    setSelectedSeasonId(1)
    setSelectedEpisodeId(1)
    
    const isCloudSaved = await saveSeasonsToCloud(SEASONS_DATA)
    showToast(isCloudSaved ? "All data restored to system defaults globally 🔄" : "All data restored to system defaults locally 🔄")
  }

  const changeAdminPassword = async () => {
    if (!newAdminPass.trim()) {
      showToast("Please enter a new password")
      return
    }
    if (newAdminPass.trim().length < 6) {
      showToast("Password must be at least 6 characters")
      return
    }
    if (newAdminPass !== confirmAdminPass) {
      showToast("Passwords do not match")
      return
    }
    setChangePassLoading(true)
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from("roboflix_lms_settings")
          .upsert([{ key: "admin_password", value: newAdminPass.trim(), updated_at: new Date().toISOString() }], { onConflict: "key" })
        if (error) throw error
        showToast("Admin password updated successfully! ✅")
      } else {
        showToast("Supabase not configured — password not saved to cloud")
      }
      setNewAdminPass("")
      setConfirmAdminPass("")
      setShowChangePassword(false)
    } catch (err) {
      showToast("Failed to update password. Try again.")
    } finally {
      setChangePassLoading(false)
    }
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

        <div className="flex items-center gap-2">
          {/* Change Password Button */}
          <button
            onClick={() => setShowChangePassword(!showChangePassword)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-blue-600/10 hover:border-blue-500/30 hover:text-blue-400 rounded-lg text-xs font-bold uppercase transition-all"
          >
            <span>🔑</span>
            <span className="hidden sm:inline">Change Password</span>
          </button>

          <button
            onClick={resetAllData}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-red-600/10 hover:border-red-500/30 hover:text-red-500 rounded-lg text-xs font-bold uppercase transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>
        </div>
      </header>

      {/* Change Password Dropdown Panel */}
      <AnimatePresence>
        {showChangePassword && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="sticky top-[73px] z-40 bg-[#0d0d0d] border-b border-blue-500/20 px-4 sm:px-6 py-5 shadow-2xl"
          >
            <div className="max-w-md mx-auto">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-4 flex items-center gap-2">
                <span>🔑</span> Change Admin Password
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="password"
                  value={newAdminPass}
                  onChange={e => setNewAdminPass(e.target.value)}
                  placeholder="New password (min 6 chars)"
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
                />
                <input
                  type="password"
                  value={confirmAdminPass}
                  onChange={e => setConfirmAdminPass(e.target.value)}
                  placeholder="Confirm new password"
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
                />
                <button
                  onClick={changeAdminPassword}
                  disabled={changePassLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-all shrink-0"
                >
                  {changePassLoading ? "Saving..." : "Save"}
                </button>
              </div>
              <p className="text-gray-600 text-xs mt-2">Password is stored securely in Supabase and takes effect immediately on all devices.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Top bar description */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-red-600 animate-pulse" />
              LMS Course Management
            </h1>
            <p className="text-gray-400 text-sm mt-1">Directly add, modify, and publish course slides, media resources, codes, and manage user subscription credentials.</p>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex bg-[#111] border border-gray-800 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setActiveTab("course")}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 ${
                activeTab === "course"
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/10"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Episodes & Content</span>
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 ${
                activeTab === "users"
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/10"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>User Subscriptions</span>
            </button>
          </div>
        </div>

        {activeTab === "course" ? (
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
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Resource File Attachments (Google Drive Links)</label>
                
                {/* Form fields to add new */}
                <div className="bg-[#111] border border-gray-800 p-4 rounded-xl space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Resource Name</label>
                      <input
                        type="text"
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        placeholder="e.g. Starter Arduino Sketch"
                        className="w-full bg-black border border-gray-800 rounded-lg px-3 py-2 text-xs focus:border-red-600 outline-none text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Type Category</label>
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
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-10">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Google Drive Link / URL (Required)</label>
                      <input
                        type="text"
                        value={newFileUrl}
                        onChange={(e) => setNewFileUrl(e.target.value)}
                        placeholder="e.g. https://drive.google.com/file/d/.../view"
                        className="w-full bg-black border border-gray-800 rounded-lg px-3 py-2 text-xs focus:border-red-600 outline-none text-white placeholder:text-gray-700"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        onClick={addFile}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase rounded-lg transition-colors h-[34px] shadow-md shadow-red-600/10 active:scale-[0.98]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Rendered files list */}
                <div className="space-y-2">
                  {epFiles.length === 0 ? (
                    <p className="text-xs text-gray-500 italic p-2 border border-dashed border-gray-800 rounded-lg text-center">No reference links configured</p>
                  ) : (
                    epFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl text-xs font-sans">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="w-4 h-4 text-red-500 shrink-0" />
                          <div className="min-w-0 text-left">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-200 truncate">{file.name}</span>
                              <span className="text-[9px] uppercase font-mono bg-red-600/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/10 shrink-0">{file.type}</span>
                            </div>
                            {file.url && (
                              <p className="text-gray-550 text-[10px] truncate mt-0.5 font-mono flex items-center gap-1">
                                <span className="text-gray-600">GDrive:</span>
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-red-500/80 hover:text-red-400 hover:underline inline-flex items-center gap-0.5 truncate max-w-[200px] sm:max-w-[300px]"
                                >
                                  {file.url}
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(idx)}
                          className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-white/5 transition-colors shrink-0 ml-2"
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
        ) : (
          <div className="space-y-6 w-full">
            {/* Supabase Status Warning Banner */}
            {(dbStatus === "missing_table" || dbStatus === "error") && (
              <div className="p-5 rounded-2xl bg-red-950/20 border border-red-500/20 backdrop-blur-md relative overflow-hidden group shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
                
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0 shadow-lg shadow-red-600/5 animate-pulse">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Supabase Database Sync is Offline</h3>
                      <p className="text-gray-400 text-xs mt-1 leading-relaxed max-w-2xl text-left">
                        {dbStatus === "missing_table" 
                          ? "We detected that the custom database table 'roboflix_lms_users' does not exist in your Supabase project yet. Additions and deletions will only save locally to this device's browser and won't sync globally across all devices."
                          : `An error occurred while connecting to Supabase: ${dbErrorMessage || "Connection error"}. Currently operating in local-only fallback mode.`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full md:w-auto">
                    <button
                      onClick={() => setShowSqlModal(true)}
                      className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-red-600/20 active:scale-[0.98] text-center flex items-center justify-center gap-2"
                    >
                      <Code className="w-4 h-4" />
                      <span>View SQL Setup Script</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Grant Access Form */}
            <div className="lg:col-span-4 space-y-6">
              <div className="border border-white/5 rounded-2xl bg-black/60 backdrop-blur p-6 space-y-6 shadow-2xl">
                <h2 className="text-lg font-bold text-white border-b border-white/5 pb-3 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-red-500" />
                  Grant Student Access
                </h2>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Student Email</label>
                  <input
                    type="email"
                    value={newSubEmail}
                    onChange={(e) => setNewSubEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none text-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">LMS Password / Phone</label>
                  <input
                    type="text"
                    value={newSubPassword}
                    onChange={(e) => setNewSubPassword(e.target.value)}
                    placeholder="Enter phone or password"
                    className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none text-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Access Tier Level</label>
                  <select
                    value={newSubTier}
                    onChange={(e) => setNewSubTier(e.target.value as any)}
                    className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none text-white transition-colors"
                  >
                    <option value="Pro">Pro Membership (Standard)</option>
                    <option value="Founding Batch">Founding Batch (All seasons)</option>
                  </select>
                </div>

                <button
                  onClick={addSubscription}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold uppercase rounded-xl transition-all shadow-lg shadow-red-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Grant LMS Access</span>
                </button>
              </div>
            </div>

            {/* Right Column: Users Subscriptions Directory */}
            <div className="lg:col-span-8 space-y-6">
              <div className="border border-white/5 rounded-2xl bg-black/60 backdrop-blur p-6 sm:p-8 space-y-6 shadow-2xl">
                
                {/* Header & Search */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-white">Active Subscriptions Directory</h2>
                    <p className="text-xs text-gray-400 mt-1">Manage and audit student logins, edit access states, or revoke credentials instantly.</p>
                  </div>
                  
                  {/* Search input */}
                  <div className="relative shrink-0 w-full sm:w-64">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search student email..."
                      className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-2.5 text-xs focus:border-red-600 outline-none text-white transition-colors placeholder:text-gray-600"
                    />
                  </div>
                </div>

                {/* Subscriptions List */}
                <div className="space-y-3">
                  {usersList.filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                    <div className="p-12 border border-dashed border-gray-800 rounded-2xl text-center text-gray-500 italic">
                      No active student profiles found matching your search.
                    </div>
                  ) : (
                    usersList
                      .filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((sub, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl gap-4 hover:border-white/10 transition-all text-left">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500 font-bold shrink-0">
                              {sub.email.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-sm text-white truncate">{sub.email}</h3>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-[9px] uppercase font-mono bg-black/40 text-gray-500 px-1.5 py-0.5 rounded border border-white/5 shrink-0">
                                  PW: {sub.phone}
                                </span>
                                <span className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded shrink-0 ${
                                  sub.tier === "Founding Batch"
                                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                                }`}>
                                  {sub.tier}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 justify-end shrink-0">
                            {/* Access Status Badge / Button */}
                            <button
                              onClick={() => toggleSubscriptionStatus(sub.email)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5 border ${
                                sub.status === "Active"
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500"
                                  : "bg-red-500/10 border-red-500/30 text-red-500 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-500"
                              }`}
                              title={sub.status === "Active" ? "Click to Revoke Access" : "Click to Enable Access"}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                sub.status === "Active" ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                              }`} />
                              <span>{sub.status === "Active" ? "Active" : "Revoked"}</span>
                            </button>

                            {/* Delete User Access completely */}
                            <button
                              onClick={() => deleteSubscription(sub.email)}
                              className="p-2 hover:bg-red-600/10 hover:border-red-500/30 border border-transparent rounded-lg text-gray-500 hover:text-red-500 transition-all"
                              title="Delete Student Profile"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>

              </div>
            </div>

          </div>
        </div>
        )}

      </main>

      {/* Interactive SQL Copier Modal */}
      <AnimatePresence>
        {showSqlModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0b0b0b] border border-gray-800 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden text-left"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-800">
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500">
                    <Code className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white leading-tight">Database Table Configuration</h3>
                    <p className="text-gray-400 text-xs mt-0.5">Initialize the real-time student subscriptions schema in Supabase</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSqlModal(false)}
                  className="p-1.5 hover:bg-white/5 border border-transparent hover:border-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Instructions */}
              <div className="space-y-4 mb-6 text-sm text-gray-300 leading-relaxed text-left">
                <p>
                  To sync student subscriptions dynamically across all devices globally in real-time, you need to create the <code className="text-red-500 px-1 py-0.5 bg-red-500/10 rounded font-mono">roboflix_lms_users</code> table in your Supabase project.
                </p>
                <div className="bg-red-600/5 border border-red-500/10 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-red-400/90 font-medium">
                  <span className="text-base leading-none">💡</span>
                  <span>
                    <strong>How to apply:</strong> Go to your <strong>Supabase Dashboard</strong> ➡️ <strong>SQL Editor</strong> ➡️ Click <strong>"New Query"</strong> ➡️ Paste the code block below ➡️ Click <strong>"Run"</strong>. That's it!
                  </span>
                </div>
              </div>

              {/* SQL Code Box */}
              <div className="relative group rounded-xl border border-gray-800 overflow-hidden bg-black/60 font-mono text-xs">
                <div className="flex justify-between items-center px-4 py-2.5 bg-[#121212] border-b border-gray-800 text-[10px] uppercase font-bold tracking-wider text-gray-500">
                  <span>PostgreSQL Schema Script</span>
                  <button
                    onClick={() => {
                      const sqlText = `-- Safe, non-destructive initialization script (does NOT wipe existing tables or data)

-- 1. Create Student Subscriptions Table safely
create table if not exists public.roboflix_lms_users (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  phone text not null, -- Password
  status text not null default 'Active' check (status in ('Active', 'Revoked')),
  tier text not null default 'Pro' check (tier in ('Pro', 'Founding Batch')),
  session_id text, -- Concurrency lock
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security on Users safely
alter table public.roboflix_lms_users enable row level security;

-- 2. Create LMS settings & Widescreen Lecture settings table safely
create table if not exists public.roboflix_lms_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security on Settings safely
alter table public.roboflix_lms_settings enable row level security;

-- 3. Create Open Access Policies safely without throwing conflict errors
do $$
begin
  -- Users policies
  if not exists (select 1 from pg_policies where policyname = 'Allow public read' and tablename = 'roboflix_lms_users') then
    create policy "Allow public read" on public.roboflix_lms_users for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow public insert' and tablename = 'roboflix_lms_users') then
    create policy "Allow public insert" on public.roboflix_lms_users for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow public update' and tablename = 'roboflix_lms_users') then
    create policy "Allow public update" on public.roboflix_lms_users for update using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow public delete' and tablename = 'roboflix_lms_users') then
    create policy "Allow public delete" on public.roboflix_lms_users for delete using (true);
  end if;
  
  -- Settings policies
  if not exists (select 1 from pg_policies where policyname = 'Allow public read settings' and tablename = 'roboflix_lms_settings') then
    create policy "Allow public read settings" on public.roboflix_lms_settings for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow public write settings' and tablename = 'roboflix_lms_settings') then
    create policy "Allow public write settings" on public.roboflix_lms_settings for all using (true) with check (true);
  end if;
end
$$;`
                      navigator.clipboard.writeText(sqlText)
                      showToast("SQL Script copied to clipboard! 📋")
                    }}
                    className="text-red-500 hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer font-sans normal-case text-xs font-semibold"
                  >
                    Copy Script
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-gray-350 max-h-[220px] overflow-y-auto leading-relaxed select-text font-mono text-left">
{`-- Safe, non-destructive initialization script (does NOT wipe existing tables or data)

-- 1. Create Student Subscriptions Table safely
create table if not exists public.roboflix_lms_users (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  phone text not null, -- Password
  status text not null default 'Active' check (status in ('Active', 'Revoked')),
  tier text not null default 'Pro' check (tier in ('Pro', 'Founding Batch')),
  session_id text, -- Concurrency lock
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security on Users safely
alter table public.roboflix_lms_users enable row level security;

-- 2. Create LMS settings & Widescreen Lecture settings table safely
create table if not exists public.roboflix_lms_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security on Settings safely
alter table public.roboflix_lms_settings enable row level security;

-- 3. Create Open Access Policies safely without throwing conflict errors
do $$
begin
  -- Users policies
  if not exists (select 1 from pg_policies where policyname = 'Allow public read' and tablename = 'roboflix_lms_users') then
    create policy "Allow public read" on public.roboflix_lms_users for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow public insert' and tablename = 'roboflix_lms_users') then
    create policy "Allow public insert" on public.roboflix_lms_users for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow public update' and tablename = 'roboflix_lms_users') then
    create policy "Allow public update" on public.roboflix_lms_users for update using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow public delete' and tablename = 'roboflix_lms_users') then
    create policy "Allow public delete" on public.roboflix_lms_users for delete using (true);
  end if;
  
  -- Settings policies
  if not exists (select 1 from pg_policies where policyname = 'Allow public read settings' and tablename = 'roboflix_lms_settings') then
    create policy "Allow public read settings" on public.roboflix_lms_settings for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow public write settings' and tablename = 'roboflix_lms_settings') then
    create policy "Allow public write settings" on public.roboflix_lms_settings for all using (true) with check (true);
  end if;
end
$$;`}
                </pre>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-gray-800 flex justify-end">
                <button
                  onClick={() => setShowSqlModal(false)}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-red-600/20 active:scale-[0.98]"
                >
                  Close & Refresh
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
