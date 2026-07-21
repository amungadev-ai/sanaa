"use client"

import { useState } from "react"
import { WifiOff, X } from "lucide-react"
import { useOnlineStatus } from "@/hooks/use-online-status"

/**
 * Tracks how many times the user has gone offline.
 * Each time they go offline, the count increases.
 * When they dismiss, we store the count at which they dismissed.
 * If they go offline again (new count), the banner re-appears.
 */
let offlineSessionCount = 0
let lastOnlineState = true

if (typeof window !== "undefined") {
  // Initialize from current state
  lastOnlineState = navigator.onLine
  if (!lastOnlineState) {
    offlineSessionCount = 1
  }

  // Track transitions
  window.addEventListener("offline", () => {
    if (lastOnlineState) {
      offlineSessionCount++
      lastOnlineState = false
    }
  })
  window.addEventListener("online", () => {
    lastOnlineState = true
  })
}

export function OfflineBanner() {
  const isOnline = useOnlineStatus()
  const [dismissedSession, setDismissedSession] = useState<number | null>(null)

  if (isOnline) return null
  if (dismissedSession === offlineSessionCount) return null

  return (
    <div className="bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-800 px-4 py-2.5">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <WifiOff className="size-4 shrink-0" />
          <p className="text-sm">
            You&apos;re offline — your work is being saved locally and will sync
            when you&apos;re back online
          </p>
        </div>
        <button
          onClick={() => setDismissedSession(offlineSessionCount)}
          className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 transition-colors ml-4 shrink-0"
          aria-label="Dismiss offline banner"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
