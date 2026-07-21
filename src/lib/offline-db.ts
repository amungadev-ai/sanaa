// IndexedDB wrapper for offline draft storage
// No external dependencies — uses native browser APIs

const DB_NAME = "sanaa-offline-db"
const DB_VERSION = 1
const DRAFTS_STORE = "drafts"
const PENDING_OPS_STORE = "pending-operations"

export interface OfflineDraft {
  id: string // crypto.randomUUID()
  type: "post" | "event" | "artist"
  data: Record<string, unknown>
  createdAt: number
  updatedAt: number
  syncedAt: number | null
  isOnline: boolean // was it created online or offline?
}

export interface PendingOperation {
  id: string
  type: "create" | "update"
  entityType: "post" | "event" | "artist"
  entityId: string // the actual server ID if update, or draft ID if create
  data: Record<string, unknown>
  createdAt: number
  retryCount: number
}

// Open database
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error("Failed to open IndexedDB"))
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create drafts store
      if (!db.objectStoreNames.contains(DRAFTS_STORE)) {
        const draftsStore = db.createObjectStore(DRAFTS_STORE, { keyPath: "id" })
        draftsStore.createIndex("type", "type", { unique: false })
        draftsStore.createIndex("updatedAt", "updatedAt", { unique: false })
      }

      // Create pending operations store
      if (!db.objectStoreNames.contains(PENDING_OPS_STORE)) {
        const opsStore = db.createObjectStore(PENDING_OPS_STORE, { keyPath: "id" })
        opsStore.createIndex("entityType", "entityType", { unique: false })
        opsStore.createIndex("createdAt", "createdAt", { unique: false })
      }
    }
  })
}

// Helper to run a transaction
async function withTransaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode)
    const store = tx.objectStore(storeName)
    const request = callback(store)

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject(request.error)
    }

    tx.oncomplete = () => {
      db.close()
    }

    tx.onerror = () => {
      reject(tx.error)
    }
  })
}

// ─── Drafts CRUD ───────────────────────────────────────────

export async function saveDraft(draft: OfflineDraft): Promise<void> {
  await withTransaction(DRAFTS_STORE, "readwrite", (store) => {
    return store.put(draft)
  })
}

export async function getDraft(id: string): Promise<OfflineDraft | null> {
  const result = await withTransaction<OfflineDraft | undefined>(
    DRAFTS_STORE,
    "readonly",
    (store) => store.get(id)
  )
  return result ?? null
}

export async function getDraftsByType(type: string): Promise<OfflineDraft[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DRAFTS_STORE, "readonly")
    const store = tx.objectStore(DRAFTS_STORE)
    const index = store.index("type")
    const request = index.getAll(type)

    request.onsuccess = () => {
      resolve(request.result || [])
    }

    request.onerror = () => {
      reject(request.error)
    }

    tx.oncomplete = () => {
      db.close()
    }
  })
}

export async function getAllDrafts(): Promise<OfflineDraft[]> {
  const result = await withTransaction<OfflineDraft[]>(
    DRAFTS_STORE,
    "readonly",
    (store) => store.getAll()
  )
  return result || []
}

export async function deleteDraft(id: string): Promise<void> {
  await withTransaction(DRAFTS_STORE, "readwrite", (store) => {
    return store.delete(id)
  })
}

export async function clearSyncedDrafts(): Promise<void> {
  const drafts = await getAllDrafts()
  const synced = drafts.filter((d) => d.syncedAt !== null)
  for (const draft of synced) {
    await deleteDraft(draft.id)
  }
}

// Find a draft by entity type and an optional entity ID stored in data
export async function findDraft(
  type: string,
  matchFn: (draft: OfflineDraft) => boolean
): Promise<OfflineDraft | null> {
  const drafts = await getDraftsByType(type)
  return drafts.find(matchFn) ?? null
}

// ─── Pending Operations CRUD ──────────────────────────────

export async function addPendingOperation(op: PendingOperation): Promise<void> {
  await withTransaction(PENDING_OPS_STORE, "readwrite", (store) => {
    return store.put(op)
  })
}

export async function getPendingOperations(): Promise<PendingOperation[]> {
  const result = await withTransaction<PendingOperation[]>(
    PENDING_OPS_STORE,
    "readonly",
    (store) => store.getAll()
  )
  return result || []
}

export async function removePendingOperation(id: string): Promise<void> {
  await withTransaction(PENDING_OPS_STORE, "readwrite", (store) => {
    return store.delete(id)
  })
}

export async function clearPendingOperations(): Promise<void> {
  await withTransaction(PENDING_OPS_STORE, "readwrite", (store) => {
    return store.clear()
  })
}

// ─── Sync Helpers ─────────────────────────────────────────

export async function syncPendingOperations(): Promise<{
  synced: number
  failed: number
}> {
  const operations = await getPendingOperations()
  let synced = 0
  let failed = 0

  for (const op of operations) {
    try {
      const url =
        op.type === "create"
          ? `/api/${op.entityType}s`
          : `/api/${op.entityType}s/${op.entityId}`

      const method = op.type === "create" ? "POST" : "PATCH"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(op.data),
      })

      if (res.ok) {
        await removePendingOperation(op.id)
        synced++
      } else {
        // Increment retry count
        op.retryCount++
        if (op.retryCount >= 5) {
          await removePendingOperation(op.id)
          failed++
        } else {
          await addPendingOperation(op)
          failed++
        }
      }
    } catch {
      op.retryCount++
      if (op.retryCount >= 5) {
        await removePendingOperation(op.id)
      } else {
        await addPendingOperation(op)
      }
      failed++
    }
  }

  return { synced, failed }
}
