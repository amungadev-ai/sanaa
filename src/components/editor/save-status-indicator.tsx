"use client"

import { Save, Loader2, CloudOff, AlertCircle, Check } from "lucide-react"
import { type SaveStatus } from "@/hooks/use-auto-save"

interface SaveStatusIndicatorProps {
  status: SaveStatus
  lastSavedAt: Date | null
  hasUnsavedChanges: boolean
}

export function SaveStatusIndicator({
  status,
  lastSavedAt,
  hasUnsavedChanges,
}: SaveStatusIndicatorProps) {
  const formatTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)

    if (diffSec < 5) return "just now"
    if (diffSec < 60) return `${diffSec}s ago`
    if (diffMin < 60) return `${diffMin}m ago`
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  if (hasUnsavedChanges && status !== "saving") {
    return (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground animate-pulse">
        <AlertCircle className="size-3.5" />
        <span>Unsaved changes</span>
      </div>
    )
  }

  switch (status) {
    case "saving":
      return (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          <span>Saving...</span>
        </div>
      )

    case "saved":
      return (
        <div className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 transition-colors duration-300">
          <Check className="size-3.5" />
          <span>
            All changes saved
            {lastSavedAt && (
              <span className="text-muted-foreground ml-1">
                {formatTime(lastSavedAt)}
              </span>
            )}
          </span>
        </div>
      )

    case "offline":
      return (
        <div className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
          <CloudOff className="size-3.5" />
          <span>
            Offline — saved locally
            {lastSavedAt && (
              <span className="text-muted-foreground ml-1">
                {formatTime(lastSavedAt)}
              </span>
            )}
          </span>
        </div>
      )

    case "error":
      return (
        <div className="flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="size-3.5" />
          <span>Error saving</span>
        </div>
      )

    case "idle":
    default:
      return null
  }
}
