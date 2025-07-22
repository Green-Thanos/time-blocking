"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import {
  Pencil,
  Clock,
  Plus,
  Trash2,
  Save,
  FolderOpen,
  ArrowLeft,
  Eye,
  Edit3,
  GripVertical,
  Download,
  Upload,
  Camera,
  FileText,
  AlertTriangle,
} from "lucide-react"

interface TimeBlock {
  id: string
  startTime: string
  endTime: string
  activity: string
  category: string
  color: {
    background: string
    border: string
    text: string
  }
}

interface SavedSchedule {
  id: string
  name: string
  blocks: TimeBlock[]
  createdAt: string
  lastModified: string
}

interface ExportData {
  version: "1.0"
  exportedAt: string
  schedules: SavedSchedule[]
}

type ViewMode = "editor" | "saved-schedules"

const defaultColors = [
  { background: "linear-gradient(135deg, #e6fffa 0%, #b2f5ea 100%)", border: "#38b2ac", text: "#234e52" },
  { background: "linear-gradient(135deg, #fef5e7 0%, #fbd38d 100%)", border: "#ed8936", text: "#744210" },
  { background: "linear-gradient(135deg, #f0fff4 0%, #9ae6b4 100%)", border: "#48bb78", text: "#22543d" },
  { background: "linear-gradient(135deg, #faf5ff 0%, #d6bcfa 100%)", border: "#9f7aea", text: "#44337a" },
  { background: "linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%)", border: "#f56565", text: "#742a2a" },
  { background: "linear-gradient(135deg, #ebf8ff 0%, #90cdf4 100%)", border: "#4299e1", text: "#2a4365" },
  { background: "linear-gradient(135deg, #f0f9ff 0%, #bae6fd 100%)", border: "#0ea5e9", text: "#0c4a6e" },
  { background: "linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)", border: "#f59e0b", text: "#78350f" },
  { background: "linear-gradient(135deg, #f3e8ff 0%, #c4b5fd 100%)", border: "#8b5cf6", text: "#581c87" },
  { background: "linear-gradient(135deg, #ecfdf5 0%, #86efac 100%)", border: "#22c55e", text: "#14532d" },
]

const initialBlocks: TimeBlock[] = [
  {
    id: "1",
    startTime: "08:45",
    endTime: "10:45",
    activity: "Deep Work Session 1",
    category: "Work",
    color: defaultColors[0],
  },
  {
    id: "2",
    startTime: "10:45",
    endTime: "11:15",
    activity: "Morning Break",
    category: "Break",
    color: defaultColors[1],
  },
  {
    id: "3",
    startTime: "11:15",
    endTime: "13:15",
    activity: "Deep Work Session 2",
    category: "Work",
    color: defaultColors[0],
  },
  {
    id: "4",
    startTime: "13:15",
    endTime: "14:15",
    activity: "Lunch Break",
    category: "Lunch",
    color: defaultColors[2],
  },
  {
    id: "5",
    startTime: "14:15",
    endTime: "17:15",
    activity: "Passion Project",
    category: "Passion",
    color: defaultColors[3],
  },
  {
    id: "6",
    startTime: "17:15",
    endTime: "18:15",
    activity: "Workout",
    category: "Fitness",
    color: defaultColors[4],
  },
  {
    id: "7",
    startTime: "18:15",
    endTime: "19:15",
    activity: "Evening Break",
    category: "Break",
    color: defaultColors[1],
  },
  {
    id: "8",
    startTime: "19:15",
    endTime: "23:00",
    activity: "Reading & Wind Down",
    category: "Personal",
    color: defaultColors[5],
  },
]

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

function calculateDuration(startTime: string, endTime: string): number {
  const start = timeToMinutes(startTime)
  let end = timeToMinutes(endTime)

  if (end < start) {
    end += 24 * 60
  }

  return end - start
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function InteractiveTimeBlocking() {
  const [viewMode, setViewMode] = useState<ViewMode>("editor")
  const [blocks, setBlocks] = useState<TimeBlock[]>(initialBlocks)
  const [savedSchedules, setSavedSchedules] = useState<SavedSchedule[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<TimeBlock>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveName, setSaveName] = useState("")
  const [editingScheduleName, setEditingScheduleName] = useState<string | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importData, setImportData] = useState("")
  const [showDataWarning, setShowDataWarning] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const screenshotRef = useRef<HTMLDivElement>(null)

  // Load saved schedules from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("timeBlockingSchedules")
    if (saved) {
      setSavedSchedules(JSON.parse(saved))
    }
  }, [])

  // Save to localStorage whenever savedSchedules changes
  useEffect(() => {
    localStorage.setItem("timeBlockingSchedules", JSON.stringify(savedSchedules))
  }, [savedSchedules])

  // Show data warning on first load
  useEffect(() => {
    const hasSeenWarning = localStorage.getItem("timeBlockingDataWarningShown")
    if (!hasSeenWarning) {
      setShowDataWarning(true)
      localStorage.setItem("timeBlockingDataWarningShown", "true")
    }
  }, [])

  const startEdit = (block: TimeBlock) => {
    setEditingId(block.id)
    setEditForm({ ...block })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const saveEdit = () => {
    if (editingId && editForm.startTime && editForm.endTime && editForm.activity && editForm.category) {
      setBlocks(blocks.map((block) => (block.id === editingId ? ({ ...block, ...editForm } as TimeBlock) : block)))
      setEditingId(null)
      setEditForm({})
    }
  }

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter((block) => block.id !== id))
  }

  const addNewBlock = () => {
    const newBlock: TimeBlock = {
      id: generateId(),
      startTime: "09:00",
      endTime: "10:00",
      activity: "New Activity",
      category: "Custom",
      color: defaultColors[0],
    }

    const newBlocks = [...blocks, newBlock].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
    setBlocks(newBlocks)
    setShowAddForm(false)
    setTimeout(() => startEdit(newBlock), 100)
  }

  const saveSchedule = () => {
    if (!saveName.trim()) return

    const newSchedule: SavedSchedule = {
      id: generateId(),
      name: saveName.trim(),
      blocks: [...blocks],
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    }

    setSavedSchedules([newSchedule, ...savedSchedules])
    setShowSaveDialog(false)
    setSaveName("")
  }

  const loadSchedule = (schedule: SavedSchedule) => {
    setBlocks([...schedule.blocks])
    setViewMode("editor")
  }

  const deleteSchedule = (id: string) => {
    setSavedSchedules(savedSchedules.filter((s) => s.id !== id))
  }

  const renameSchedule = (id: string, newName: string) => {
    setSavedSchedules(
      savedSchedules.map((s) => (s.id === id ? { ...s, name: newName, lastModified: new Date().toISOString() } : s)),
    )
    setEditingScheduleName(null)
  }

  const reorderSchedules = (fromIndex: number, toIndex: number) => {
    const newSchedules = [...savedSchedules]
    const [removed] = newSchedules.splice(fromIndex, 1)
    newSchedules.splice(toIndex, 0, removed)
    setSavedSchedules(newSchedules)
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      reorderSchedules(draggedIndex, index)
      setDraggedIndex(index)
    }
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  // Export functions
  const exportToJSON = () => {
    const exportData: ExportData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      schedules: savedSchedules,
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement("a")
    link.href = url
    link.download = `time-blocking-schedules-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setShowExportMenu(false)
  }

  const exportCurrentAsJSON = () => {
    const currentSchedule: SavedSchedule = {
      id: generateId(),
      name: "Current Schedule",
      blocks: [...blocks],
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    }

    const exportData: ExportData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      schedules: [currentSchedule],
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement("a")
    link.href = url
    link.download = `current-schedule-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setShowExportMenu(false)
  }

  const exportScreenshot = () => {
    // For now, just export as JSON since screenshot functionality requires additional setup
    exportCurrentAsJSON()
  }

  // Import functions
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setImportData(content)
      setShowImportDialog(true)
    }
    reader.readAsText(file)
  }

  const importFromJSON = () => {
    try {
      const data: ExportData = JSON.parse(importData)

      if (!data.version || !data.schedules) {
        throw new Error("Invalid file format")
      }

      // Merge with existing schedules, avoiding duplicates
      const existingIds = new Set(savedSchedules.map((s) => s.id))
      const newSchedules = data.schedules.filter((s) => !existingIds.has(s.id))

      setSavedSchedules([...savedSchedules, ...newSchedules])
      setShowImportDialog(false)
      setImportData("")

      alert(`Successfully imported ${newSchedules.length} schedule(s)!`)
    } catch (error) {
      alert("Invalid JSON file. Please check the file format and try again.")
    }
  }

  const totalMinutes = blocks.reduce((total, block) => total + calculateDuration(block.startTime, block.endTime), 0)

  // Data Warning Modal
  if (showDataWarning) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-lg border">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-semibold text-slate-800">Data Storage Notice</h2>
          </div>
          <div className="space-y-3 text-sm text-slate-600 mb-6">
            <p>
              <strong>Your schedules are saved locally in your browser.</strong> This means they could be lost if:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>You clear browser data/cookies</li>
              <li>You use incognito/private mode</li>
              <li>Browser storage limits are exceeded</li>
              <li>You switch devices or browsers</li>
            </ul>
            <p className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
              <strong>💡 Tip:</strong> Use the Export feature regularly to backup your schedules as JSON files!
            </p>
          </div>
          <button
            onClick={() => setShowDataWarning(false)}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
          >
            Got it, let's start!
          </button>
        </div>
      </div>
    )
  }

  if (viewMode === "saved-schedules") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-2">📚 Saved Schedules</h1>
              <p className="text-slate-600">
                {savedSchedules.length} saved schedule{savedSchedules.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 top-12 bg-white rounded-lg shadow-lg border p-2 z-10 min-w-48">
                    <button
                      onClick={exportToJSON}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Export All as JSON
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Import
              </button>
              <button
                onClick={() => setViewMode("editor")}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Editor
              </button>
            </div>
          </div>

          {/* Hidden file input */}
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileImport} className="hidden" />

          {/* Import Dialog */}
          {showImportDialog && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-96 overflow-hidden">
                <h3 className="text-lg font-semibold mb-4">Import Schedules</h3>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Paste JSON data here..."
                  className="w-full h-48 px-3 py-2 border rounded-lg text-sm font-mono resize-none"
                />
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={importFromJSON}
                    className="flex-1 bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600"
                  >
                    Import
                  </button>
                  <button
                    onClick={() => {
                      setShowImportDialog(false)
                      setImportData("")
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Saved Schedules List */}
          {savedSchedules.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-600 mb-2">No saved schedules yet</h3>
              <p className="text-slate-500 mb-4">Create and save your first schedule in the editor!</p>
              <button
                onClick={() => setViewMode("editor")}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Go to Editor
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {savedSchedules.map((schedule, index) => (
                <div
                  key={schedule.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`bg-white rounded-xl border-2 p-6 transition-all duration-200 hover:shadow-md cursor-move ${
                    draggedIndex === index ? "opacity-50 scale-95" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <GripVertical className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0" />

                      <div className="flex-1">
                        {editingScheduleName === schedule.id ? (
                          <div className="flex gap-2 mb-2">
                            <input
                              type="text"
                              defaultValue={schedule.name}
                              className="flex-1 px-3 py-1 border rounded-lg text-lg font-semibold"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  renameSchedule(schedule.id, e.currentTarget.value)
                                } else if (e.key === "Escape") {
                                  setEditingScheduleName(null)
                                }
                              }}
                              onBlur={(e) => renameSchedule(schedule.id, e.target.value)}
                              autoFocus
                            />
                          </div>
                        ) : (
                          <h3
                            className="text-xl font-semibold text-slate-800 mb-2 cursor-pointer hover:text-blue-600"
                            onClick={() => setEditingScheduleName(schedule.id)}
                          >
                            {schedule.name}
                          </h3>
                        )}

                        <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                          <span>Created: {formatDate(schedule.createdAt)}</span>
                          <span>•</span>
                          <span>{schedule.blocks.length} activities</span>
                          <span>•</span>
                          <span>
                            {formatDuration(
                              schedule.blocks.reduce(
                                (total, block) => total + calculateDuration(block.startTime, block.endTime),
                                0,
                              ),
                            )}
                          </span>
                        </div>

                        {/* Preview of blocks */}
                        <div className="flex flex-wrap gap-2">
                          {schedule.blocks.slice(0, 6).map((block) => (
                            <div
                              key={block.id}
                              className="px-3 py-1 rounded-full text-xs font-medium border"
                              style={{
                                background: block.color.background,
                                borderColor: block.color.border,
                                color: block.color.text,
                              }}
                            >
                              {block.startTime} {block.activity}
                            </div>
                          ))}
                          {schedule.blocks.length > 6 && (
                            <div className="px-3 py-1 rounded-full text-xs bg-slate-100 text-slate-600">
                              +{schedule.blocks.length - 6} more
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => loadSchedule(schedule)}
                        className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                        title="Load and edit this schedule"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => deleteSchedule(schedule.id)}
                        className="flex items-center gap-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                        title="Delete this schedule"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">How to manage schedules:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>
                • <strong>Backup:</strong> Use "Export All as JSON" to backup all your schedules
              </li>
              <li>
                • <strong>Restore:</strong> Use "Import" to restore schedules from a JSON file
              </li>
              <li>
                • <strong>Rename:</strong> Click any schedule name to edit it
              </li>
              <li>
                • <strong>Reorder:</strong> Drag schedules by the grip handle to reorder them
              </li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">✏️ Schedule Editor</h1>
          <p className="text-slate-600 flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            Total planned time: {formatDuration(totalMinutes)} • {blocks.length} activities
          </p>
        </div>

        {/* Single Schedule Container - Both Interactive and Screenshot */}
        <div ref={screenshotRef} className="space-y-2 mb-8">
          {blocks.map((block) => {
            const duration = calculateDuration(block.startTime, block.endTime)
            const height = Math.max(80, duration * 0.8)

            return (
              <div
                key={block.id}
                className="relative rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-md"
                style={{
                  height: `${height}px`,
                  background: block.color.background,
                  borderColor: block.color.border,
                  color: block.color.text,
                }}
              >
                {/* Interactive Display Mode */}
                <div className="absolute inset-0 p-4 flex items-center justify-between group">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-lg">
                        {block.startTime} - {block.endTime}
                      </span>
                      <span className="text-sm opacity-75 bg-white/30 px-2 py-1 rounded-full">
                        {formatDuration(duration)}
                      </span>
                    </div>
                    <div className="font-medium text-base mb-1">{block.activity}</div>
                    <div className="text-sm opacity-75">{block.category}</div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(block)}
                      className="p-2 hover:bg-white/20 rounded-lg"
                      title="Edit this block"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteBlock(block.id)}
                      className="p-2 hover:bg-white/20 rounded-lg text-red-600"
                      title="Delete this block"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Edit Block Modal */}
        {editingId && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-xl font-semibold text-gray-800">Edit Time Block</h3>
                <p className="text-sm text-gray-500 mt-1">Customize your activity details</p>
              </div>

              {/* Modal Content */}
              <div className="px-6 py-6 space-y-5">
                {/* Time Inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                    <input
                      type="time"
                      value={editForm.startTime || ""}
                      onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-800 bg-gray-50 hover:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                    <input
                      type="time"
                      value={editForm.endTime || ""}
                      onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-800 bg-gray-50 hover:bg-white"
                    />
                  </div>
                </div>

                {/* Activity Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Activity Name</label>
                  <input
                    type="text"
                    value={editForm.activity || ""}
                    onChange={(e) => setEditForm({ ...editForm, activity: e.target.value })}
                    placeholder="What will you be doing?"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-800 bg-gray-50 hover:bg-white"
                  />
                </div>

                {/* Category Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <input
                    type="text"
                    value={editForm.category || ""}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    placeholder="Work, Personal, Health, etc."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-800 bg-gray-50 hover:bg-white"
                  />
                </div>

                {/* Color Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Color Theme</label>
                  <div className="grid grid-cols-5 gap-3">
                    {defaultColors.map((color, index) => (
                      <button
                        key={index}
                        onClick={() => setEditForm({ ...editForm, color: color })}
                        className={`w-12 h-12 rounded-xl border-3 hover:scale-105 transition-all duration-200 ${
                          editForm.color === color
                            ? "border-gray-800 shadow-lg"
                            : "border-gray-200 hover:border-gray-400"
                        }`}
                        style={{
                          background: color.background,
                        }}
                        title={`Color theme ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Duration Preview */}
                {editForm.startTime && editForm.endTime && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-blue-800">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Duration: {formatDuration(calculateDuration(editForm.startTime, editForm.endTime))}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                <button
                  onClick={cancelEdit}
                  className="flex-1 px-4 py-3 text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={!editForm.startTime || !editForm.endTime || !editForm.activity || !editForm.category}
                  className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-3 mb-6 flex-wrap">
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Block
          </button>
          <button
            onClick={() => setShowSaveDialog(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            Save Schedule
          </button>
          <button
            onClick={() => setViewMode("saved-schedules")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors shadow-sm"
          >
            <Eye className="w-4 h-4" />
            View Saved ({savedSchedules.length})
          </button>
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-12 bg-white rounded-lg shadow-lg border p-2 z-10 min-w-48">
                <button
                  onClick={exportCurrentAsJSON}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Export Current as JSON
                </button>
                <button
                  onClick={exportScreenshot}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Export as Image
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Save Dialog */}
        {showSaveDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold mb-4">Save Schedule</h3>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Enter schedule name..."
                className="w-full px-3 py-2 border rounded-lg mb-4"
                onKeyDown={(e) => e.key === "Enter" && saveSchedule()}
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={saveSchedule}
                  disabled={!saveName.trim()}
                  className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowSaveDialog(false)
                    setSaveName("")
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold mb-4">Add New Time Block</h3>
              <p className="text-sm text-gray-600 mb-4">
                A new block will be added and you can immediately edit it to customize the details.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={addNewBlock}
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
                >
                  Add Block
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Editor Mode:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>
              • <strong>Backup:</strong> Export your schedules as JSON files for safekeeping
            </li>
            <li>
              • <strong>Share:</strong> Export as image to share your schedule visually
            </li>
            <li>
              • <strong>Import:</strong> Restore schedules from JSON backup files
            </li>
            <li>
              • <strong>Edit:</strong> Hover over blocks to edit or delete them
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
