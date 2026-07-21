"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Plus,
  Pencil,
  Trash2,
  Megaphone,
  Pause,
  Play,
  Eye,
  MousePointer,
  MoreHorizontal,
  Upload,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { format } from "date-fns"

interface Ad {
  id: string
  title: string
  description: string | null
  imageUrl: string
  linkUrl: string
  placement: string
  status: string
  startDate: string
  endDate: string | null
  impressions: number
  clicks: number
  createdAt: string
}

const defaultForm = {
  title: "",
  description: "",
  imageUrl: "",
  linkUrl: "",
  placement: "SIDEBAR",
  startDate: "",
  endDate: "",
}

export default function AdsPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const role = (session?.user?.role as string) || ""
  const canManage = ["ADMIN"].includes(role)

  const [showDialog, setShowDialog] = useState(false)
  const [editingAd, setEditingAd] = useState<Ad | null>(null)
  const [deleteAd, setDeleteAd] = useState<Ad | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [uploadingAdImage, setUploadingAdImage] = useState(false)

  const { data: adsData, isLoading } = useQuery<{ ads: Ad[] }>({
    queryKey: ["ads"],
    queryFn: async () => {
      const res = await fetch("/api/ads")
      if (!res.ok) throw new Error("Failed to fetch ads")
      return res.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const body: Record<string, unknown> = {
        title: data.title,
        description: data.description || undefined,
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl,
        placement: data.placement,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : new Date().toISOString(),
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
      }
      const res = await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to create ad") }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] })
      setShowDialog(false)
      setForm(defaultForm)
      toast.success("Ad created")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/ads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to update ad") }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] })
      setEditingAd(null)
      toast.success("Ad updated")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/ads/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete ad")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] })
      setDeleteAd(null)
      toast.success("Ad deleted")
    },
    onError: () => toast.error("Failed to delete ad"),
  })

  const openEdit = (ad: Ad) => {
    setForm({
      title: ad.title,
      description: ad.description || "",
      imageUrl: ad.imageUrl,
      linkUrl: ad.linkUrl,
      placement: ad.placement,
      startDate: format(new Date(ad.startDate), "yyyy-MM-dd"),
      endDate: ad.endDate ? format(new Date(ad.endDate), "yyyy-MM-dd") : "",
    })
    setEditingAd(ad)
  }

  const getPlacementLabel = (placement: string) => {
    const labels: Record<string, string> = {
      HEADER_BANNER: "Header Banner",
      SIDEBAR: "Sidebar",
      IN_ARTICLE: "In Article",
      FOOTER: "Footer",
      BETWEEN_POSTS: "Between Posts",
    }
    return labels[placement] || placement
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      ACTIVE: { label: "Active", variant: "default" },
      PAUSED: { label: "Paused", variant: "outline" },
      EXPIRED: { label: "Expired", variant: "secondary" },
      DRAFT: { label: "Draft", variant: "secondary" },
    }
    const info = variants[status] || { label: status, variant: "secondary" as const }
    return <Badge variant={info.variant}>{info.label}</Badge>
  }

  const handleAdImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAdImage(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", "ads")
    try {
      const res = await fetch("/api/media", { method: "POST", body: formData })
      const data = await res.json()
      if (data.url) {
        setForm({ ...form, imageUrl: data.url })
        toast.success("Image uploaded")
      }
    } catch {
      toast.error("Failed to upload image")
    } finally {
      setUploadingAdImage(false)
    }
  }

  if (!canManage) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">You don&apos;t have permission to manage ads.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Advertisements</h1>
          <p className="text-muted-foreground">Manage ad placements and campaigns</p>
        </div>
        <Button onClick={() => { setForm(defaultForm); setShowDialog(true) }} className="gap-2">
          <Plus className="size-4" />
          New Ad
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Megaphone className="size-5" />
            All Ads ({adsData?.ads?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-16 w-24 rounded" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <>
            {/* Mobile: Card view */}
            <div className="sm:hidden space-y-3">
              {adsData?.ads?.map((ad) => (
                <div key={ad.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <img src={ad.imageUrl} alt={ad.title} className="size-10 object-cover rounded shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-article.svg' }} />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{ad.title}</p>
                        <p className="text-xs text-muted-foreground">{getPlacementLabel(ad.placement)}</p>
                      </div>
                    </div>
                    {getStatusBadge(ad.status)}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{format(new Date(ad.startDate), "PP")}{ad.endDate ? ` – ${format(new Date(ad.endDate), "PP")}` : ''}</span>
                    <span className="flex items-center gap-2">
                      <span className="flex items-center gap-0.5"><Eye className="size-3" />{ad.impressions}</span>
                      <span className="flex items-center gap-0.5"><MousePointer className="size-3" />{ad.clicks}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1 pt-1 border-t">
                    <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => openEdit(ad)}>
                      <Pencil className="size-3" /> Edit
                    </Button>
                    {ad.status === "ACTIVE" && (
                      <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => updateMutation.mutate({ id: ad.id, data: { status: "PAUSED" } })}>
                        <Pause className="size-3" /> Pause
                      </Button>
                    )}
                    {ad.status === "PAUSED" && (
                      <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => updateMutation.mutate({ id: ad.id, data: { status: "ACTIVE" } })}>
                        <Play className="size-3" /> Resume
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-xs h-7 gap-1 text-destructive" onClick={() => setDeleteAd(ad)}>
                      <Trash2 className="size-3" /> Delete
                    </Button>
                  </div>
                </div>
              ))}
              {(!adsData?.ads || adsData.ads.length === 0) && (
                <p className="text-center text-muted-foreground py-8">No ads yet</p>
              )}
            </div>
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ad</TableHead>
                    <TableHead>Placement</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Stats</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adsData?.ads?.map((ad) => (
                    <TableRow key={ad.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img src={ad.imageUrl} alt={ad.title} className="size-14 object-cover rounded" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-article.svg' }} />
                          <div>
                            <p className="font-medium text-sm">{ad.title}</p>
                            {ad.description && <p className="text-xs text-muted-foreground line-clamp-1">{ad.description}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getPlacementLabel(ad.placement)}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(ad.status)}</TableCell>
                      <TableCell className="text-sm">
                        <div>{format(new Date(ad.startDate), "PP")}</div>
                        {ad.endDate && <div className="text-muted-foreground">to {format(new Date(ad.endDate), "PP")}</div>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1"><Eye className="size-3" /> {ad.impressions}</span>
                          <span className="flex items-center gap-1"><MousePointer className="size-3" /> {ad.clicks}</span>
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
                            <DropdownMenuItem onClick={() => openEdit(ad)}>
                              <Pencil className="mr-2 size-4" /> Edit
                            </DropdownMenuItem>
                            {ad.status === "ACTIVE" && (
                              <DropdownMenuItem onClick={() => updateMutation.mutate({ id: ad.id, data: { status: "PAUSED" } })}>
                                <Pause className="mr-2 size-4" /> Pause
                              </DropdownMenuItem>
                            )}
                            {ad.status === "PAUSED" && (
                              <DropdownMenuItem onClick={() => updateMutation.mutate({ id: ad.id, data: { status: "ACTIVE" } })}>
                                <Play className="mr-2 size-4" /> Resume
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteAd(ad)}>
                              <Trash2 className="mr-2 size-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!adsData?.ads || adsData.ads.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No ads yet</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog || !!editingAd} onOpenChange={(open) => { if (!open) { setShowDialog(false); setEditingAd(null) } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAd ? "Edit Ad" : "New Advertisement"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ad campaign name" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Ad Image</Label>
              <div className="flex flex-wrap gap-2">
                <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://... or upload" className="flex-1" />
                <label>
                  <Button variant="outline" size="icon" className="shrink-0" asChild disabled={uploadingAdImage}>
                    <span>
                      {uploadingAdImage ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                    </span>
                  </Button>
                  <input type="file" accept="image/*" onChange={handleAdImageUpload} className="hidden" />
                </label>
              </div>
              {form.imageUrl && (
                <img src={form.imageUrl} alt="Preview" className="h-20 w-full object-cover rounded mt-2" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              )}
            </div>
            <div className="space-y-2">
              <Label>Link URL</Label>
              <Input value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Placement</Label>
              <Select value={form.placement} onValueChange={(val) => setForm({ ...form, placement: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="HEADER_BANNER">Header Banner</SelectItem>
                  <SelectItem value="SIDEBAR">Sidebar</SelectItem>
                  <SelectItem value="IN_ARTICLE">In Article</SelectItem>
                  <SelectItem value="FOOTER">Footer</SelectItem>
                  <SelectItem value="BETWEEN_POSTS">Between Posts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); setEditingAd(null) }}>Cancel</Button>
            <Button
              onClick={() => editingAd
                ? updateMutation.mutate({ id: editingAd.id, data: form })
                : createMutation.mutate(form)
              }
              disabled={!form.title.trim() || !form.imageUrl.trim()}
            >
              {editingAd ? "Save Changes" : "Create Ad"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteAd} onOpenChange={(open) => !open && setDeleteAd(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ad</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteAd?.title}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteAd && deleteMutation.mutate(deleteAd.id)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
