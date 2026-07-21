"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import {
  Plus,
  Search,
  Palette,
  MapPin,
  Star,
  MoreHorizontal,
  Pencil,
  Trash2,
  LayoutGrid,
  List,
  Eye,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
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
import { toast } from "sonner"

interface ArtistItem {
  id: string
  name: string
  slug: string
  stageName: string | null
  image: string | null
  coverImage: string | null
  artistType: string
  location: string | null
  country: string | null
  isFeatured: boolean
  isActive: boolean
  shortBio: string | null
  categories: { category: { id: string; name: string; slug: string } }[]
}

const ARTIST_TYPE_LABELS: Record<string, string> = {
  MUSICIAN: "Musician",
  WRITER: "Writer",
  PAINTER: "Painter",
  PHOTOGRAPHER: "Photographer",
  FILMMAKER: "Filmmaker",
  DANCER: "Dancer",
  ACTOR: "Actor",
  SCULPTOR: "Sculptor",
  CURATOR: "Curator",
  DJ: "DJ",
  PRODUCER: "Producer",
  OTHER: "Other",
}

export default function ArtistsDashboardPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("ALL")
  const [deleteArtist, setDeleteArtist] = useState<ArtistItem | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const { data: artistsData, isLoading } = useQuery<{ artists: ArtistItem[]; pagination: { total: number } }>({
    queryKey: ["dashboard-artists", search, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (typeFilter && typeFilter !== "ALL") params.set("artistType", typeFilter)
      params.set("limit", "50")
      const res = await fetch(`/api/artists?${params}`)
      if (!res.ok) throw new Error("Failed to fetch artists")
      return res.json()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/artists/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to delete artist")
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-artists"] })
      setDeleteArtist(null)
      toast.success("Artist deleted")
    },
    onError: (err) => toast.error(err.message),
  })

  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, isFeatured }: { id: string; isFeatured: boolean }) => {
      const res = await fetch(`/api/artists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured }),
      })
      if (!res.ok) throw new Error("Failed to update artist")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-artists"] })
      toast.success("Featured status updated")
    },
    onError: () => toast.error("Failed to update featured status"),
  })

  const getArtistTypeBadge = (type: string) => {
    const colorMap: Record<string, string> = {
      MUSICIAN: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
      WRITER: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
      PAINTER: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
      PHOTOGRAPHER: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
      FILMMAKER: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
      DANCER: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
      ACTOR: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      SCULPTOR: "bg-stone-100 text-stone-800 dark:bg-stone-900/30 dark:text-stone-400",
      CURATOR: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
      DJ: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      PRODUCER: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
      OTHER: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    }
    return (
      <Badge className={colorMap[type] || colorMap.OTHER} variant="outline">
        {ARTIST_TYPE_LABELS[type] || type}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Palette className="size-6" />
            Artists
          </h1>
          <p className="text-muted-foreground">Manage artist and creator profiles</p>
        </div>
        <Link href="/dashboard/artists/new">
          <Button className="gap-2">
            <Plus className="size-4" />
            New Artist
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Search artists..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Artist type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                {Object.entries(ARTIST_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
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
              <Skeleton className="h-48 w-full" />
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
          {artistsData?.artists?.map((artist) => (
            <Card key={artist.id} className="overflow-hidden hover:shadow-md transition-shadow group">
              {/* Cover / Image area */}
              <div className="relative h-32 bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
                {artist.coverImage ? (
                  <img src={artist.coverImage} alt="" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-article.svg' }} />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Palette className="size-12 text-primary/20" />
                  </div>
                )}
                {/* Profile image overlay */}
                <div className="absolute -bottom-8 left-4">
                  <div className="size-16 rounded-full border-4 border-background overflow-hidden bg-muted">
                    {artist.image ? (
                      <img src={artist.image} alt={artist.name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-article.svg' }} />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold text-lg">
                        {artist.name.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
                {/* Badges */}
                <div className="absolute top-2 right-2 flex gap-1">
                  {artist.isFeatured && (
                    <Badge className="bg-amber-500 text-white text-xs">
                      <Star className="size-3 mr-0.5" /> Featured
                    </Badge>
                  )}
                </div>
              </div>
              <CardContent className="pt-12 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{artist.name}</h3>
                    {artist.stageName && (
                      <p className="text-xs text-muted-foreground truncate">&ldquo;{artist.stageName}&rdquo;</p>
                    )}
                  </div>
                  {getArtistTypeBadge(artist.artistType)}
                </div>
                {artist.shortBio && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{artist.shortBio}</p>
                )}
                {artist.location && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <MapPin className="size-3" />
                    {artist.location}
                  </div>
                )}
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <div className="flex gap-1">
                    <Link href={`/artist/${artist.slug}`} target="_blank">
                      <Button variant="ghost" size="sm" className="size-7 p-0">
                        <Eye className="size-3" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-7 p-0"
                      onClick={() => toggleFeaturedMutation.mutate({ id: artist.id, isFeatured: !artist.isFeatured })}
                      title={artist.isFeatured ? "Remove from featured" : "Add to featured"}
                    >
                      <Star className={`size-3 ${artist.isFeatured ? "fill-amber-400 text-amber-400" : ""}`} />
                    </Button>
                  </div>
                  <div className="flex gap-1">
                    <Link href={`/dashboard/artists/${artist.id}/edit`}>
                      <Button variant="outline" size="sm" className="gap-1 h-7 text-xs">
                        <Pencil className="size-3" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive size-7 p-0"
                      onClick={() => setDeleteArtist(artist)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
        {/* Mobile: Card list */}
        <div className="sm:hidden space-y-3">
          {artistsData?.artists?.map((artist) => (
            <div key={artist.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="size-10 rounded-full overflow-hidden bg-muted shrink-0">
                    {artist.image ? (
                      <img src={artist.image} alt={artist.name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-article.svg' }} />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold text-sm">
                        {artist.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{artist.name}</p>
                    {artist.stageName && <p className="text-xs text-muted-foreground truncate">&ldquo;{artist.stageName}&rdquo;</p>}
                  </div>
                </div>
                {getArtistTypeBadge(artist.artistType)}
              </div>
              <div className="flex items-center gap-1 flex-wrap text-xs text-muted-foreground">
                {artist.location && <span className="flex items-center gap-0.5"><MapPin className="size-3" />{artist.location}</span>}
                <Badge variant={artist.isActive ? "default" : "secondary"} className="text-[10px] h-5">
                  {artist.isActive ? "Active" : "Inactive"}
                </Badge>
                {artist.isFeatured && (
                  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] h-5">
                    <Star className="size-2.5 mr-0.5" /> Featured
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 pt-1 border-t">
                <Link href={`/artist/${artist.slug}`} target="_blank">
                  <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
                    <Eye className="size-3" /> View
                  </Button>
                </Link>
                <Link href={`/dashboard/artists/${artist.id}/edit`}>
                  <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
                    <Pencil className="size-3" /> Edit
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 gap-1"
                  onClick={() => toggleFeaturedMutation.mutate({ id: artist.id, isFeatured: !artist.isFeatured })}
                >
                  <Star className={`size-3 ${artist.isFeatured ? "fill-amber-400 text-amber-400" : ""}`} />
                  {artist.isFeatured ? "Unfeature" : "Feature"}
                </Button>
                <Button variant="ghost" size="sm" className="text-xs h-7 gap-1 text-destructive" onClick={() => setDeleteArtist(artist)}>
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
                  <TableHead>Artist</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {artistsData?.artists?.map((artist) => (
                  <TableRow key={artist.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full overflow-hidden bg-muted shrink-0">
                          {artist.image ? (
                            <img src={artist.image} alt={artist.name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-article.svg' }} />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold text-xs">
                              {artist.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{artist.name}</p>
                          {artist.stageName && <p className="text-xs text-muted-foreground">&ldquo;{artist.stageName}&rdquo;</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getArtistTypeBadge(artist.artistType)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {artist.location || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Badge variant={artist.isActive ? "default" : "secondary"}>
                          {artist.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {artist.isFeatured && (
                          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                            <Star className="size-3 mr-0.5" /> Featured
                          </Badge>
                        )}
                      </div>
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
                            <Link href={`/artist/${artist.slug}`} target="_blank">
                              <Eye className="mr-2 size-4" /> View Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/artists/${artist.id}/edit`}>
                              <Pencil className="mr-2 size-4" /> Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleFeaturedMutation.mutate({ id: artist.id, isFeatured: !artist.isFeatured })}>
                            <Star className={`mr-2 size-4 ${artist.isFeatured ? "fill-amber-400 text-amber-400" : ""}`} />
                            {artist.isFeatured ? "Unfeature" : "Feature"}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteArtist(artist)}>
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

      {(!artistsData?.artists || artistsData.artists.length === 0) && !isLoading && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Palette className="size-8 mx-auto mb-2 opacity-50" />
            <p>No artists found</p>
            <Link href="/dashboard/artists/new" className="mt-2 inline-block">
              <Button variant="outline" size="sm" className="gap-2 mt-2">
                <Plus className="size-4" />
                Add your first artist
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!deleteArtist} onOpenChange={(open) => !open && setDeleteArtist(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Artist</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deleteArtist?.name}&rdquo;? This will remove their profile and all associated links. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteArtist && deleteMutation.mutate(deleteArtist.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
