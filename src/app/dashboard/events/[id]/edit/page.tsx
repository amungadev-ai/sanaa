"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  Loader2,
  Save,
  ImageIcon,
  X,
  Globe,
  Ticket,
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TiptapEditor } from "@/components/editor/tiptap-editor"
import { toast } from "sonner"
import { format } from "date-fns"

interface EventData {
  id: string
  title: string
  slug: string
  description: string
  coverImage: string | null
  eventType: string
  venue: string | null
  location: string | null
  city: string | null
  country: string | null
  startDate: string
  endDate: string | null
  timezone: string
  websiteUrl: string | null
  ticketUrl: string | null
  isFree: boolean
  price: string | null
  isFeatured: boolean
  isActive: boolean
  categories: { category: { id: string; name: string } }[]
}

interface Category { id: string; name: string; slug: string }

export default function EditEventPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string
  const queryClient = useQueryClient()

  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [coverImage, setCoverImage] = useState("")
  const [eventType, setEventType] = useState("IN_PERSON")
  const [venue, setVenue] = useState("")
  const [location, setLocation] = useState("")
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [startDate, setStartDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endDate, setEndDate] = useState("")
  const [endTime, setEndTime] = useState("")
  const [timezone, setTimezone] = useState("Africa/Nairobi")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [ticketUrl, setTicketUrl] = useState("")
  const [isFree, setIsFree] = useState(false)
  const [price, setPrice] = useState("")
  const [isFeatured, setIsFeatured] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const { data: event, isLoading: eventLoading } = useQuery<EventData>({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const res = await fetch(`/api/events/${eventId}`)
      if (!res.ok) throw new Error("Failed to fetch event")
      return res.json()
    },
    enabled: !!eventId,
  })

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories")
      if (!res.ok) throw new Error("Failed to fetch categories")
      return res.json()
    },
  })

  useEffect(() => {
    if (event) {
      setTitle(event.title)
      setSlug(event.slug)
      setDescription(event.description)
      setCoverImage(event.coverImage || "")
      setEventType(event.eventType)
      setVenue(event.venue || "")
      setLocation(event.location || "")
      setCity(event.city || "")
      setCountry(event.country || "")
      const sd = new Date(event.startDate)
      setStartDate(format(sd, "yyyy-MM-dd"))
      setStartTime(format(sd, "HH:mm"))
      if (event.endDate) {
        const ed = new Date(event.endDate)
        setEndDate(format(ed, "yyyy-MM-dd"))
        setEndTime(format(ed, "HH:mm"))
      }
      setTimezone(event.timezone)
      setWebsiteUrl(event.websiteUrl || "")
      setTicketUrl(event.ticketUrl || "")
      setIsFree(event.isFree)
      setPrice(event.price || "")
      setIsFeatured(event.isFeatured)
      setIsActive(event.isActive)
      setSelectedCategories(event.categories.map((c) => c.category.id))
    }
  }, [event])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", "events")
    try {
      const res = await fetch("/api/media", { method: "POST", body: formData })
      const data = await res.json()
      if (data.url) { setCoverImage(data.url); toast.success("Image uploaded") }
    } catch { toast.error("Failed to upload image") }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const body: Record<string, unknown> = {
        title, slug, description,
        coverImage: coverImage || undefined,
        eventType, venue: venue || undefined, location: location || undefined,
        city: city || undefined, country: country || undefined,
        startDate: new Date(`${startDate}T${startTime || "00:00"}`).toISOString(),
        endDate: endDate ? new Date(`${endDate}T${endTime || "23:59"}`).toISOString() : undefined,
        timezone, websiteUrl: websiteUrl || undefined, ticketUrl: ticketUrl || undefined,
        isFree, price: price || undefined, isFeatured, isActive,
        categoryIds: selectedCategories,
      }
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to update event") }
      queryClient.invalidateQueries({ queryKey: ["event", eventId] })
      toast.success("Event updated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update event")
    } finally { setIsSaving(false) }
  }

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id])
  }

  if (eventLoading) {
    return <div className="space-y-6"><div className="h-8 w-64 bg-muted animate-pulse rounded" /><div className="h-96 bg-muted animate-pulse rounded-lg" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/events"><Button variant="ghost" size="icon"><ArrowLeft className="size-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Event</h1>
          <p className="text-muted-foreground">{event?.title}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Event Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-lg" />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <TiptapEditor content={description} onChange={setDescription} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Date & Time</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Start Time</Label><Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></div>
                <div className="space-y-2"><Label>End Date</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
                <div className="space-y-2"><Label>End Time</Label><Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} /></div>
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Africa/Nairobi">Africa/Nairobi (EAT)</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                    <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Location</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Venue</Label><Input value={venue} onChange={(e) => setVenue(e.target.value)} /></div>
                <div className="space-y-2"><Label>Location</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} /></div>
                <div className="space-y-2"><Label>City</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
                <div className="space-y-2"><Label>Country</Label><Input value={country} onChange={(e) => setCountry(e.target.value)} /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Cover Image</CardTitle></CardHeader>
            <CardContent>
              {coverImage ? (
                <div className="relative group">
                  <img src={coverImage} alt="Cover" className="w-full h-40 object-cover rounded-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  <Button variant="destructive" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity size-7" onClick={() => setCoverImage("")}><X className="size-3" /></Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                  <ImageIcon className="size-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Click to upload</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Event Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Event Type</Label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN_PERSON">In Person</SelectItem>
                    <SelectItem value="VIRTUAL">Virtual</SelectItem>
                    <SelectItem value="HYBRID">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between"><Label>Free Event</Label><Switch checked={isFree} onCheckedChange={setIsFree} /></div>
              {!isFree && <div className="space-y-2"><Label>Price</Label><Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="KES 1,500" /></div>}
              <div className="flex items-center justify-between"><Label>Featured</Label><Switch checked={isFeatured} onCheckedChange={setIsFeatured} /></div>
              <div className="flex items-center justify-between"><Label>Active</Label><Switch checked={isActive} onCheckedChange={setIsActive} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Links</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label className="flex items-center gap-1"><Globe className="size-3" /> Website</Label><Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} /></div>
              <div className="space-y-2"><Label className="flex items-center gap-1"><Ticket className="size-3" /> Tickets</Label><Input value={ticketUrl} onChange={(e) => setTicketUrl(e.target.value)} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Categories</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {categories?.map((cat) => (
                  <Badge key={cat.id} variant={selectedCategories.includes(cat.id) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleCategory(cat.id)}>{cat.name}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
