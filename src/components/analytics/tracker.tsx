"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

/**
 * Client component that sends page view data to /api/analytics/track on mount.
 * Add this to blog layout to track all public page views.
 */
export function AnalyticsTracker() {
  const pathname = usePathname()
  const hasTracked = useRef<string>("")

  useEffect(() => {
    // Don't track the same path twice (React strict mode)
    if (hasTracked.current === pathname) return
    hasTracked.current = pathname

    // Don't track dashboard or API routes
    if (
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/auth") ||
      pathname.startsWith("/_next")
    ) {
      return
    }

    const trackPageView = async () => {
      try {
        await fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: pathname,
            referrer: document.referrer || null,
          }),
        })
      } catch {
        // Silently fail — don't disrupt user experience
      }
    }

    // Small delay to avoid blocking initial render
    const timer = setTimeout(trackPageView, 100)
    return () => clearTimeout(timer)
  }, [pathname])

  return null
}
