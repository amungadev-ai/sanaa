"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useOnlineStatus } from "./use-online-status"
import {
  saveDraft,
  getDraft,
  deleteDraft,
  addPendingOperation,
  syncPendingOperations,
  type OfflineDraft,
} from "@/lib/offline-db"

export type SaveStatus = "idle" | "saving" | "saved" | "offline" | "error"

interface UseAutoSaveOptions {
  draftId: string // unique ID for this editing session
  entityType: "post" | "event" | "artist"
  data: Record<string, unknown>
  interval?: number // auto-save interval in ms (default 30000 = 30s)
  debounceMs?: number // debounce before saving (default 2000 = 2s)
  serverSaveUrl?: string // API endpoint for server save (e.g., "/api/posts")
  serverSaveMethod?: "POST" | "PATCH"
  entityId?: string // existing server ID for updates
  enabled?: boolean // enable/disable auto-save
}

interface UseAutoSaveReturn {
  saveStatus: SaveStatus
  lastSavedAt: Date | null
  isOnline: boolean
  saveNow: () => Promise<void> // manual save trigger
  hasUnsavedChanges: boolean
  draftData: OfflineDraft | null // the draft data from IndexedDB (for recovery)
}

export function useAutoSave(options: UseAutoSaveOptions): UseAutoSaveReturn {
  const {
    draftId,
    entityType,
    data,
    interval = 30000,
    debounceMs = 2000,
    serverSaveUrl,
    serverSaveMethod = "POST",
    entityId,
    enabled = true,
  } = options

  const isOnline = useOnlineStatus()
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [draftData, setDraftData] = useState<OfflineDraft | null>(null)

  // Refs to avoid stale closures
  const dataRef = useRef(data)
  const lastSavedDataRef = useRef<string>("")
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const serverIntervalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isOnlineRef = useRef(isOnline)
  const draftIdRef = useRef(draftId)
  const entityIdRef = useRef(entityId)
  const serverSaveUrlRef = useRef(serverSaveUrl)
  const serverSaveMethodRef = useRef(serverSaveMethod)
  const entityTypeRef = useRef(entityType)
  const enabledRef = useRef(enabled)
  const isSavingRef = useRef(false)

  // Keep refs in sync
  useEffect(() => {
    dataRef.current = data
  }, [data])

  useEffect(() => {
    isOnlineRef.current = isOnline
  }, [isOnline])

  useEffect(() => {
    entityIdRef.current = entityId
  }, [entityId])

  useEffect(() => {
    serverSaveUrlRef.current = serverSaveUrl
  }, [serverSaveUrl])

  useEffect(() => {
    serverSaveMethodRef.current = serverSaveMethod
  }, [serverSaveMethod])

  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  // Save to IndexedDB
  const saveToIndexedDB = useCallback(async () => {
    if (!enabledRef.current || isSavingRef.current) return

    isSavingRef.current = true
    setSaveStatus("saving")

    try {
      const now = Date.now()
      const currentData = dataRef.current

      const draft: OfflineDraft = {
        id: draftIdRef.current,
        type: entityTypeRef.current,
        data: currentData,
        createdAt: (await getDraft(draftIdRef.current))?.createdAt ?? now,
        updatedAt: now,
        syncedAt: null,
        isOnline: isOnlineRef.current,
      }

      await saveDraft(draft)
      lastSavedDataRef.current = JSON.stringify(currentData)
      setLastSavedAt(new Date(now))
      setHasUnsavedChanges(false)
      setDraftData(draft)

      if (!isOnlineRef.current) {
        setSaveStatus("offline")
      } else {
        setSaveStatus("saved")
      }
    } catch {
      setSaveStatus("error")
    } finally {
      isSavingRef.current = false
    }
  }, [])

  // Save to server
  const saveToServer = useCallback(async () => {
    if (!isOnlineRef.current || !serverSaveUrlRef.current || !enabledRef.current) return

    try {
      const currentData = { ...dataRef.current }

      const res = await fetch(serverSaveUrlRef.current, {
        method: serverSaveMethodRef.current,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentData),
      })

      if (res.ok) {
        // Mark draft as synced
        const now = Date.now()
        const existing = await getDraft(draftIdRef.current)
        if (existing) {
          existing.syncedAt = now
          await saveDraft(existing)
        }
        setSaveStatus("saved")
      }
    } catch {
      // Server save failed — data is still in IndexedDB, that's fine
    }
  }, [])

  // Queue pending operation (for when offline)
  const queuePendingOperation = useCallback(async () => {
    const opType = entityIdRef.current ? "update" : "create"
    await addPendingOperation({
      id: crypto.randomUUID(),
      type: opType,
      entityType: entityTypeRef.current,
      entityId: entityIdRef.current || draftIdRef.current,
      data: dataRef.current,
      createdAt: Date.now(),
      retryCount: 0,
    })
  }, [])

  // Manual save trigger
  const saveNow = useCallback(async () => {
    await saveToIndexedDB()

    if (isOnlineRef.current && serverSaveUrlRef.current) {
      await saveToServer()
    } else if (!isOnlineRef.current) {
      await queuePendingOperation()
    }
  }, [saveToIndexedDB, saveToServer, queuePendingOperation])

  // Detect unsaved changes
  useEffect(() => {
    const serialized = JSON.stringify(data)
    if (lastSavedDataRef.current && serialized !== lastSavedDataRef.current) {
      setHasUnsavedChanges(true)
    }
  }, [data])

  // Debounced save — save 2s after last change
  useEffect(() => {
    if (!enabled) return

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      const serialized = JSON.stringify(data)
      if (serialized !== lastSavedDataRef.current) {
        saveToIndexedDB()
      }
    }, debounceMs)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [data, enabled, debounceMs, saveToIndexedDB])

  // Periodic save every `interval` ms
  useEffect(() => {
    if (!enabled) return

    intervalTimerRef.current = setInterval(() => {
      const serialized = JSON.stringify(dataRef.current)
      if (serialized !== lastSavedDataRef.current) {
        saveToIndexedDB()
      }
    }, interval)

    return () => {
      if (intervalTimerRef.current) {
        clearInterval(intervalTimerRef.current)
      }
    }
  }, [enabled, interval, saveToIndexedDB])

  // Periodic server save every 60s when online
  useEffect(() => {
    if (!enabled || !serverSaveUrl) return

    serverIntervalTimerRef.current = setInterval(() => {
      if (isOnlineRef.current && serverSaveUrlRef.current) {
        const serialized = JSON.stringify(dataRef.current)
        if (serialized !== lastSavedDataRef.current) {
          saveToServer()
        }
      }
    }, 60000)

    return () => {
      if (serverIntervalTimerRef.current) {
        clearInterval(serverIntervalTimerRef.current)
      }
    }
  }, [enabled, serverSaveUrl, saveToServer])

  // When coming back online, sync pending operations
  useEffect(() => {
    if (isOnline) {
      syncPendingOperations().then(({ synced, failed }) => {
        if (synced > 0 || failed > 0) {
          // Could show a toast here, but we'll let the component handle it
        }
      })
    }
  }, [isOnline])

  // Load existing draft on mount
  useEffect(() => {
    if (!enabled) return

    getDraft(draftId).then((draft) => {
      if (draft) {
        setDraftData(draft)
        setLastSavedAt(new Date(draft.updatedAt))
        lastSavedDataRef.current = JSON.stringify(draft.data)
        setSaveStatus(draft.isOnline ? "saved" : "offline")
      }
    })
  }, [draftId, enabled])

  return {
    saveStatus,
    lastSavedAt,
    isOnline,
    saveNow,
    hasUnsavedChanges,
    draftData,
  }
}
