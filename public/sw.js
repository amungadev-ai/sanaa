// Service Worker for Push Notifications + Offline Sync

const CACHE_NAME = "sanaa-cache-v1"
const OFFLINE_URLS = ["/", "/dashboard", "/dashboard/posts"]

// ─── Install ───────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS).catch(() => {
        // Some URLs may not be available during install, that's okay
      })
    })
  )
  self.skipWaiting()
})

// ─── Activate ──────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// ─── Fetch — Cache-first for pages, network-first for API ──
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)

  // Skip non-GET requests
  if (event.request.method !== "GET") return

  // For API requests, try network first, fall back to cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful API responses for offline reading
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone)
            })
          }
          return response
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(event.request)
        })
    )
    return
  }

  // For page requests, try network first then cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone)
          })
        }
        return response
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          return cached || caches.match("/")
        })
      })
  )
})

// ─── Push Events ───────────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = {
    title: "New Notification",
    body: "You have a new notification",
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    url: "/",
    type: "info",
  }

  if (event.data) {
    try {
      const parsed = event.data.json()
      data = { ...data, ...parsed }
    } catch {
      data.body = event.data.text() || data.body
    }
  }

  // Map notification type to appropriate icon/badge
  const typeIcons = {
    new_post: { icon: "/icon-192x192.png", badge: "/icon-192x192.png" },
    comment_reply: { icon: "/icon-192x192.png", badge: "/icon-192x192.png" },
    post_approved: { icon: "/icon-192x192.png", badge: "/icon-192x192.png" },
    post_rejected: { icon: "/icon-192x192.png", badge: "/icon-192x192.png" },
  }

  const icons = typeIcons[data.type] || typeIcons.info || {}

  const options = {
    body: data.body,
    icon: data.icon || icons.icon || "/icon-192x192.png",
    badge: data.badge || icons.badge || "/icon-192x192.png",
    data: {
      link: data.url || "/",
      type: data.type || "info",
    },
    vibrate: [100, 50, 100],
    tag: `push-${data.type || "info"}-${Date.now()}`,
    requireInteraction: data.type === "post_rejected",
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

// ─── Notification Click ────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.link || "/"
  const notificationType = event.notification.data?.type || "info"

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If there's already a window open, navigate it to the target URL
        for (const client of clientList) {
          if (
            client.url.includes(self.location.origin) &&
            "focus" in client
          ) {
            client.navigate(targetUrl)
            return client.focus()
          }
        }
        // No window open, open a new one
        return self.clients.openWindow(targetUrl)
      })
  )
})

// ─── Push Subscription Change ──────────────────────────────
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    self.registration.pushManager.getSubscription().then((subscription) => {
      if (subscription) {
        return fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription),
        })
      }
    })
  )
})

// ─── Background Sync ──────────────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-pending-operations") {
    event.waitUntil(syncPendingOperations())
  }
})

async function syncPendingOperations() {
  const DB_NAME = "sanaa-offline-db"
  const PENDING_OPS_STORE = "pending-operations"

  try {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })

    const operations = await new Promise((resolve, reject) => {
      const tx = db.transaction(PENDING_OPS_STORE, "readonly")
      const store = tx.objectStore(PENDING_OPS_STORE)
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })

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
          // Remove from store
          await new Promise((resolve, reject) => {
            const tx = db.transaction(PENDING_OPS_STORE, "readwrite")
            const store = tx.objectStore(PENDING_OPS_STORE)
            const request = store.delete(op.id)
            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
          })
          synced++
        } else {
          failed++
        }
      } catch {
        failed++
      }
    }

    db.close()

    // Show notification if we synced anything
    if (synced > 0) {
      self.registration.showNotification("Sync Complete", {
        body: `${synced} item(s) synced successfully.${failed > 0 ? ` ${failed} failed.` : ""}`,
        icon: "/icon-192x192.png",
        tag: "sync-notification",
      })
    }
  } catch (error) {
    console.error("Background sync failed:", error)
  }
}
