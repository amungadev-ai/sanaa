"use client"

import { useState, Suspense } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Plus,
  Search,
  Calendar,
  MapPin,
  MoreHorizontal,
  Pencil,
  Trash2,
  LayoutGrid,
  List,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { toast } from "sonner"
import { format } from "date-fns"

interface EventItem {
  id: string
  title: string
  slug: string
  excerpt: string | null
  coverImage: string | null
  eventType: string
  venue: string | null
  city: string | null
  country: string | null
  startDate: string
  endDate: string | null
  isFree: boolean
  price: string | null
  isFeatured: boolean
  isActive: boolean
  categories: { category: { id: string; name: string } }[]
}

interface EventsResponse {
  events: EventItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

function EventsContent() {
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("ALL")
  const [deleteEvent, setDeleteEvent] = useState<EventItem | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Pagination from URL
  const currentPage = parseInt(searchParams.get("page") || "1")
  const currentLimit = parseInt(searchParams.get("limit") || "10")

  const { data: eventsData, isLoading } = useQuery<EventsResponse>({
    queryKey: ["events", search, typeFilter, currentPage, currentLimit],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (typeFilter && typeFilter !== "ALL") params.set("eventType", typeFilter)
      params.set("page", String(currentPage))
      params.set("limit", String(currentLimit))
      const res = await fetch(`/api/events?${params}`)
      if (!res.ok) throw new Error("Failed to fetch events")
      return res.json()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete event")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] })
      setDeleteEvent(null)
      toast.success("Event deleted")
    },
    onError: () => toast.error("Failed to delete event"),
  })

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(page))
    router.push(`?${params.toString()}`)
  }

  const handlePageSizeChange = (size: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("limit", String(size))
    params.set("page", "1")
    router.push(`?${params.toString()}`)
  }

  const getEventTypeBadge = (type: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      IN_PERSON: { label: "In Person", variant: "default" },
      VIRTUAL: { label: "Virtual", variant: "secondary" },
      HYBRID: { label: "Hybrid", variant: "outline" },
    }
    const info = variants[type] || { label: type, variant: "secondary" as const }
    return <Badge variant={info.variant}>{info.label}</Badge>
  }

  const pagination = eventsData?.pagination

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground">Manage art events and exhibitions</p>
        </div>
        <Link href="/dashboard/events/new">
          <Button className="gap-2">
            <Plus className="size-4" />
            New Event
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="IN_PERSON">In Person</SelectItem>
                <SelectItem value="VIRTUAL">Virtual</SelectItem>
                <SelectItem value="HYBRID">Hybrid</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              <Button variant={viewMode === "grid" ? "default" : "outline"} size="icon" onClick={() => setViewMode("grid")}>
                <LayoutGrid className="size-4" />
              </Button>
              <Button variant={viewMode === "list" ? "default" : "outline"} size="icon" onClick={() => setViewMode("list")}>
                <List className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-40 w-full" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {eventsData?.events?.map((event) => (
            <Card key={event.id} className="overflow-hidden hover:shadow-md transition-shadow">
              {event.coverImage ? (
                <img src={event.coverImage} alt={event.title} className="h-40 w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-article.svg' }} />
              ) : (
                <div className="h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <Calendar className="size-12 text-primary/30" />
                </div>
              )}
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {getEventTypeBadge(event.eventType)}
                  {event.isFree && <Badge variant="outline">Free</Badge>}
                  {event.isFeatured && <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">Featured</Badge>}
                </div>
                <h3 className="font-semibold text-sm line-clamp-2 mb-1">{event.title}</h3>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    {format(new Date(event.startDate), "PPP")}
                  </div>
                  {event.venue && (
                    <div className="flex items-center gap-1">
                      <MapPin className="size-3" />
                      {event.venue}{event.city ? `, ${event.city}` : ""}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <Link href={`/dashboard/events/${event.id}/edit`}>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Pencil className="size-3" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setDeleteEvent(event)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
        {/* Mobile: Card list */}
        <div className="sm:hidden space-y-3">
          {eventsData?.events?.map((event) => (
            <div key={event.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm">{event.title}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="size-3" />
                    {format(new Date(event.startDate), "PPP")}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {getEventTypeBadge(event.eventType)}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-wrap text-xs text-muted-foreground">
                {event.city && <span className="flex items-center gap-0.5"><MapPin className="size-3" />{event.city}</span>}
                <Badge variant={event.isActive ? "default" : "secondary"} className="text-[10px] h-5">
                  {event.isActive ? "Active" : "Inactive"}
                </Badge>
                {event.isFree && <Badge variant="outline" className="text-[10px] h-5">Free</Badge>}
              </div>
              <div className="flex items-center gap-1 pt-1 border-t">
                <Link href={`/dashboard/events/${event.id}/edit`}>
                  <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
                    <Pencil className="size-3" /> Edit
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" className="text-xs h-7 gap-1 text-destructive" onClick={() => setDeleteEvent(event)}>
                  <Trash2 className="size-3" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
        {/* Desktop: Table */}
        <Card className="hidden sm:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventsData?.events?.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>{getEventTypeBadge(event.eventType)}</TableCell>
                    <TableCell className="text-sm">{format(new Date(event.startDate), "PPP")}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{event.city || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={event.isActive ? "default" : "secondary"}>
                        {event.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/events/${event.id}/edit`}>
                              <Pencil className="mr-2 size-4" /> Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteEvent(event)}>
                            <Trash2 className="mr-2 size-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        </>
      )}

      {(!eventsData?.events || eventsData.events.length === 0) && !isLoading && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Calendar className="size-8 mx-auto mb-2 opacity-50" />
            <p>No events found</p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 0 && (
        <PaginationControls
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={pagination.limit}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      <AlertDialog open={!!deleteEvent} onOpenChange={(open) => !open && setDeleteEvent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteEvent?.title}&quot;? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteEvent && deleteMutation.mutate(deleteEvent.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function EventsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>}>
      <EventsContent />
    </Suspense>
  )
}
