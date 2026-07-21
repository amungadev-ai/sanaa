"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  CalendarIcon,
  Clock,
  AlertCircle,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface CalendarItem {
  id: string
  title: string
  date: string
  type: "post_scheduled" | "post_published" | "event"
  status: string
  color: string
  href: string
}

interface CalendarData {
  items: CalendarItem[]
  stats: {
    postsThisMonth: number
    eventsThisMonth: number
    pendingReviews: number
  }
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function getTypeIcon(type: CalendarItem["type"]) {
  switch (type) {
    case "post_scheduled":
      return <Clock className="size-3" />
    case "post_published":
      return <FileText className="size-3" />
    case "event":
      return <CalendarIcon className="size-3" />
  }
}

function getTypeLabel(type: CalendarItem["type"]) {
  switch (type) {
    case "post_scheduled":
      return "Scheduled"
    case "post_published":
      return "Published"
    case "event":
      return "Event"
  }
}

export default function CalendarPage() {
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth() + 1) // 1-indexed
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [isMobileWeekView, setIsMobileWeekView] = useState(false)

  const { data, isLoading } = useQuery<CalendarData>({
    queryKey: ["calendar", currentYear, currentMonth],
    queryFn: async () => {
      const res = await fetch(
        `/api/calendar?year=${currentYear}&month=${currentMonth}`
      )
      if (!res.ok) throw new Error("Failed to fetch calendar data")
      return res.json()
    },
  })

  // Calendar grid calculation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1)
    const lastDay = new Date(currentYear, currentMonth, 0)
    const startDayOfWeek = firstDay.getDay()
    const totalDays = lastDay.getDate()

    const days: (Date | null)[] = []

    // Fill in blank days before the first
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null)
    }

    // Fill in actual days
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(currentYear, currentMonth - 1, d))
    }

    // Fill remaining cells to complete the grid (6 rows × 7 cols = 42)
    while (days.length < 42) {
      days.push(null)
    }

    return days
  }, [currentYear, currentMonth])

  // Group items by day
  const itemsByDay = useMemo(() => {
    const map: Record<string, CalendarItem[]> = {}
    if (data?.items) {
      for (const item of data.items) {
        const dayStr = new Date(item.date).toISOString().slice(0, 10)
        if (!map[dayStr]) map[dayStr] = []
        map[dayStr].push(item)
      }
    }
    return map
  }, [data])

  // Get items for selected day
  const selectedDayItems = selectedDay ? itemsByDay[selectedDay] || [] : []

  // Navigation
  const goToPreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  const goToToday = () => {
    const now = new Date()
    setCurrentYear(now.getFullYear())
    setCurrentMonth(now.getMonth() + 1)
  }

  const isToday = (date: Date) => {
    const now = new Date()
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    )
  }

  // Mobile: find current week
  const currentWeekDays = useMemo(() => {
    const todayIdx = calendarDays.findIndex(
      (d) => d && isToday(d)
    )
    if (todayIdx === -1) {
      // Show first week that has days
      const firstDayIdx = calendarDays.findIndex((d) => d !== null)
      if (firstDayIdx === -1) return calendarDays.slice(0, 7)
      const weekStart = Math.floor(firstDayIdx / 7) * 7
      return calendarDays.slice(weekStart, weekStart + 7)
    }
    const weekStart = Math.floor(todayIdx / 7) * 7
    return calendarDays.slice(weekStart, weekStart + 7)
  }, [calendarDays])

  const displayDays = isMobileWeekView ? currentWeekDays : calendarDays

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Content Calendar</h1>
          <p className="text-muted-foreground">
            Plan and schedule your content
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setIsMobileWeekView(!isMobileWeekView)}
          >
            {isMobileWeekView ? "Month" : "Week"}
          </Button>
          <Link href="/dashboard/posts/new">
            <Button size="sm" className="gap-1.5">
              <FileText className="size-4" />
              New Post
            </Button>
          </Link>
        </div>
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-10 mt-1" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-amber-50 dark:bg-amber-950/30">
                    <FileText className="size-3.5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Posts</p>
                    <p className="text-lg font-bold">
                      {data?.stats.postsThisMonth || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-rose-50 dark:bg-rose-950/30">
                    <CalendarIcon className="size-3.5 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Events</p>
                    <p className="text-lg font-bold">
                      {data?.stats.eventsThisMonth || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-orange-50 dark:bg-orange-950/30">
                    <AlertCircle className="size-3.5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pending</p>
                    <p className="text-lg font-bold">
                      {data?.stats.pendingReviews || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {MONTHS[currentMonth - 1]} {currentYear}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToPreviousMonth}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 px-3" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="text-xs text-muted-foreground">Scheduled</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-orange-600" />
              <span className="text-xs text-muted-foreground">Published</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-rose-600" />
              <span className="text-xs text-muted-foreground">Event</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-px mb-px">
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {displayDays.map((date, idx) => {
              if (!date) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="bg-background min-h-[80px] sm:min-h-[100px] lg:min-h-[120px] p-1.5"
                  />
                )
              }

              const dayStr = date.toISOString().slice(0, 10)
              const dayItems = itemsByDay[dayStr] || []
              const isCurrentDay = isToday(date)
              const isCurrentMonth = date.getMonth() === currentMonth - 1

              return (
                <button
                  key={dayStr}
                  onClick={() => setSelectedDay(dayStr)}
                  className={cn(
                    "bg-background min-h-[80px] sm:min-h-[100px] lg:min-h-[120px] p-1.5 text-left transition-colors hover:bg-muted/50",
                    !isCurrentMonth && "opacity-40",
                    selectedDay === dayStr && "bg-muted/50 ring-1 ring-inset ring-primary"
                  )}
                >
                  <div
                    className={cn(
                      "text-xs font-medium mb-1 h-6 w-6 flex items-center justify-center rounded-full",
                      isCurrentDay
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground"
                    )}
                  >
                    {date.getDate()}
                  </div>

                  <div className="space-y-0.5 overflow-hidden">
                    {dayItems.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "text-[10px] sm:text-xs px-1 py-0.5 rounded truncate flex items-center gap-1",
                          item.type === "post_scheduled" &&
                            "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
                          item.type === "post_published" &&
                            "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
                          item.type === "event" &&
                            "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400"
                        )}
                      >
                        {getTypeIcon(item.type)}
                        <span className="truncate">{item.title}</span>
                      </div>
                    ))}
                    {dayItems.length > 3 && (
                      <div className="text-[10px] text-muted-foreground px-1">
                        +{dayItems.length - 3} more
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day Detail Dialog */}
      <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDay
                ? new Date(selectedDay + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : ""}
            </DialogTitle>
            <DialogDescription>
              {selectedDayItems.length} item{selectedDayItems.length !== 1 ? "s" : ""} scheduled
            </DialogDescription>
          </DialogHeader>

          {selectedDayItems.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              {selectedDayItems.map((item) => (
                <Link key={item.id} href={item.href}>
                  <div
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-muted/50",
                      item.type === "post_scheduled" && "border-l-4 border-l-amber-500",
                      item.type === "post_published" && "border-l-4 border-l-orange-600",
                      item.type === "event" && "border-l-4 border-l-rose-600"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <p className="text-sm font-medium truncate">
                          {item.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            item.type === "post_scheduled" &&
                              "border-amber-500 text-amber-600",
                            item.type === "post_published" &&
                              "border-orange-600 text-orange-600",
                            item.type === "event" &&
                              "border-rose-600 text-rose-600"
                          )}
                        >
                          {getTypeLabel(item.type)}
                        </Badge>
                        {item.status && (
                          <span className="text-[10px] text-muted-foreground">
                            {item.status}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(item.date).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              No items scheduled for this day
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
