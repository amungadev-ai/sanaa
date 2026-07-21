"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowLeft,
  Loader2,
  Save,
  ImageIcon,
  X,
  Globe,
  MapPin,
  Star,
  Music,
  BookOpen,
  Camera,
  Film,
  Palette,
  Mic2,
  Theatre,
  User,
  Link2,
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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

interface Category { id: string; name: string; slug: string }
interface PostItem { id: string; title: string; slug: string }
interface EventItem { id: string; title: string; slug: string }

const ARTIST_TYPES = [
  { value: "MUSICIAN", label: "Musician" },
  { value: "WRITER", label: "Writer / Poet" },
  { value: "PAINTER", label: "Painter" },
  { value: "PHOTOGRAPHER", label: "Photographer" },
  { value: "FILMMAKER", label: "Filmmaker" },
  { value: "DANCER", label: "Dancer" },
  { value: "ACTOR", label: "Actor" },
  { value: "SCULPTOR", label: "Sculptor" },
  { value: "CURATOR", label: "Curator" },
  { value: "DJ", label: "DJ" },
  { value: "PRODUCER", label: "Producer" },
  { value: "OTHER", label: "Other" },
]

export default function NewArtistPage() {
  const router = useRouter()

  const [name, setName] = useState("")
  const [stageName, setStageName] = useState("")
  const [slug, setSlug] = useState("")
  const [bio, setBio] = useState("")
  const [shortBio, setShortBio] = useState("")
  const [image, setImage] = useState("")
  const [coverImage, setCoverImage] = useState("")
  const [artistType, setArtistType] = useState("MUSICIAN")
  const [location, setLocation] = useState("")
  const [country, setCountry] = useState("")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [isFeatured, setIsFeatured] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedPosts, setSelectedPosts] = useState<string[]>([])
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [postSearch, setPostSearch] = useState("")
  const [eventSearch, setEventSearch] = useState("")

  // Social links
  const [twitter, setTwitter] = useState("")
  const [instagram, setInstagram] = useState("")
  const [youtube, setYoutube] = useState("")
  const [spotify, setSpotify] = useState("")
  const [soundcloud, setSoundcloud] = useState("")
  const [facebook, setFacebook] = useState("")

  const [isSaving, setIsSaving] = useState(false)

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories")
      if (!res.ok) throw new Error("Failed to fetch categories")
      return res.json()
    },
  })

  const { data: postsData } = useQuery<{ posts: PostItem[] }>({
    queryKey: ["posts-search", postSearch],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set("limit", "20")
      params.set("status", "PUBLISHED")
      if (postSearch) params.set("search", postSearch)
      const res = await fetch(`/api/posts?${params}`)
      if (!res.ok) throw new Error("Failed to fetch posts")
      return res.json()
    },
  })

  const { data: eventsData } = useQuery<{ events: EventItem[] }>({
    queryKey: ["events-search", eventSearch],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set("limit", "20")
      if (eventSearch) params.set("search", eventSearch)
      const res = await fetch(`/api/events?${params}`)
      if (!res.ok) throw new Error("Failed to fetch events")
      return res.json()
    },
  })

  useEffect(() => {
    if (name && !slug) {
      setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""))
    }
  }, [name, slug])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "image" | "coverImage") => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", "artists")
    try {
      const res = await fetch("/api/media", { method: "POST", body: formData })
      const data = await res.json()
      if (data.url) {
        if (target === "image") setImage(data.url)
        else setCoverImage(data.url)
        toast.success("Image uploaded")
      }
    } catch {
      toast.error("Failed to upload image")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { toast.error("Name is required"); return }
    if (!bio.trim()) { toast.error("Bio is required"); return }

    setIsSaving(true)
    try {
      const socialLinksObj: Record<string, string> = {}
      if (twitter) socialLinksObj.twitter = twitter
      if (instagram) socialLinksObj.instagram = instagram
      if (youtube) socialLinksObj.youtube = youtube
      if (spotify) socialLinksObj.spotify = spotify
      if (soundcloud) socialLinksObj.soundcloud = soundcloud
      if (facebook) socialLinksObj.facebook = facebook

      const body: Record<string, unknown> = {
        name,
        slug: slug || undefined,
        stageName: stageName || undefined,
        bio,
        shortBio: shortBio || undefined,
        image: image || undefined,
        coverImage: coverImage || undefined,
        artistType,
        location: location || undefined,
        country: country || undefined,
        websiteUrl: websiteUrl || undefined,
        socialLinks: Object.keys(socialLinksObj).length > 0 ? JSON.stringify(socialLinksObj) : undefined,
        isFeatured,
        isActive,
        categoryIds: selectedCategories,
        postIds: selectedPosts,
        eventIds: selectedEvents,
      }

      const res = await fetch("/api/artists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create artist")
      }

      const artist = await res.json()
      toast.success("Artist created")
      router.push(`/dashboard/artists/${artist.id}/edit`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create artist")
    } finally {
      setIsSaving(false)
    }
  }

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id])
  }

  const togglePost = (id: string) => {
    setSelectedPosts((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id])
  }

  const toggleEvent = (id: string) => {
    setSelectedEvents((prev) => prev.includes(id) ? prev.filter((ev) => ev !== id) : [...prev, id])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/artists">
          <Button variant="ghost" size="icon"><ArrowLeft className="size-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Artist</h1>
          <p className="text-muted-foreground">Create a new artist or creator profile</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name..." className="text-lg" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Stage Name / Pen Name</Label>
                  <Input value={stageName} onChange={(e) => setStageName(e.target.value)} placeholder="e.g. Sauti Sol, Ngugi wa Thiong&apos;o" />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="url-friendly-slug" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Short Bio</Label>
                <Input value={shortBio} onChange={(e) => setShortBio(e.target.value)} placeholder="1-2 sentence tagline..." />
              </div>
              <div className="space-y-2">
                <Label>Full Bio *</Label>
                <TiptapEditor content={bio} onChange={setBio} placeholder="Full biography of the artist..." />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Social Links</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><span className="text-sm">𝕏</span> Twitter / X</Label>
                  <Input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://x.com/..." />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">📸 Instagram</Label>
                  <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/..." />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">▶️ YouTube</Label>
                  <Input value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="https://youtube.com/..." />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">🎵 Spotify</Label>
                  <Input value={spotify} onChange={(e) => setSpotify(e.target.value)} placeholder="https://open.spotify.com/..." />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">🔊 SoundCloud</Label>
                  <Input value={soundcloud} onChange={(e) => setSoundcloud(e.target.value)} placeholder="https://soundcloud.com/..." />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">📘 Facebook</Label>
                  <Input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/..." />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Link to Posts</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Search posts..." value={postSearch} onChange={(e) => setPostSearch(e.target.value)} />
              <div className="max-h-48 overflow-y-auto space-y-1">
                {postsData?.posts?.map((post) => (
                  <div
                    key={post.id}
                    className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors text-sm ${
                      selectedPosts.includes(post.id)
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-accent"
                    }`}
                    onClick={() => togglePost(post.id)}
                  >
                    <div className={`size-4 rounded border ${selectedPosts.includes(post.id) ? "bg-primary border-primary" : "border-border"} flex items-center justify-center`}>
                      {selectedPosts.includes(post.id) && <span className="text-primary-foreground text-xs">✓</span>}
                    </div>
                    <span className="truncate">{post.title}</span>
                  </div>
                ))}
                {(!postsData?.posts || postsData.posts.length === 0) && (
                  <p className="text-sm text-muted-foreground py-2 text-center">No posts found</p>
                )}
              </div>
              {selectedPosts.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedPosts.length} post(s) selected
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Link to Events</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Search events..." value={eventSearch} onChange={(e) => setEventSearch(e.target.value)} />
              <div className="max-h-48 overflow-y-auto space-y-1">
                {eventsData?.events?.map((event) => (
                  <div
                    key={event.id}
                    className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors text-sm ${
                      selectedEvents.includes(event.id)
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-accent"
                    }`}
                    onClick={() => toggleEvent(event.id)}
                  >
                    <div className={`size-4 rounded border ${selectedEvents.includes(event.id) ? "bg-primary border-primary" : "border-border"} flex items-center justify-center`}>
                      {selectedEvents.includes(event.id) && <span className="text-primary-foreground text-xs">✓</span>}
                    </div>
                    <span className="truncate">{event.title}</span>
                  </div>
                ))}
                {(!eventsData?.events || eventsData.events.length === 0) && (
                  <p className="text-sm text-muted-foreground py-2 text-center">No events found</p>
                )}
              </div>
              {selectedEvents.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedEvents.length} event(s) selected
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Profile Photo</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {image ? (
                <div className="relative group">
                  <img src={image} alt="Profile" className="w-32 h-32 object-cover rounded-full mx-auto" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  <Button variant="destructive" size="icon" className="absolute top-0 right-4 opacity-0 group-hover:opacity-100 transition-opacity size-7" onClick={() => setImage("")}>
                    <X className="size-3" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                  <ImageIcon className="size-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Upload photo</span>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "image")} className="hidden" />
                </label>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Cover Image</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {coverImage ? (
                <div className="relative group">
                  <img src={coverImage} alt="Cover" className="w-full h-32 object-cover rounded-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  <Button variant="destructive" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity size-7" onClick={() => setCoverImage("")}>
                    <X className="size-3" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                  <ImageIcon className="size-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Upload cover</span>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "coverImage")} className="hidden" />
                </label>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Artist Type *</Label>
                <Select value={artistType} onValueChange={setArtistType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ARTIST_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><MapPin className="size-3" /> Location</Label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Nairobi, Kenya" />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Kenya" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Globe className="size-3" /> Website</Label>
                <Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1"><Star className="size-3" /> Featured</Label>
                <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Categories</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {categories?.map((cat) => (
                  <Badge key={cat.id} variant={selectedCategories.includes(cat.id) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleCategory(cat.id)}>
                    {cat.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
            Create Artist
          </Button>
        </div>
      </form>
    </div>
  )
}
