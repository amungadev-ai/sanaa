"use client"

import { useState, useCallback, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Copy,
  Search,
  X,
  Loader2,
  CheckCircle2,
  FileImage,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface MediaItem {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  altText: string | null
  createdAt: string
}

interface UploadProgress {
  fileName: string
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
  originalSize?: number
  convertedSize?: number
  converted?: boolean
}

export default function MediaPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null)
  const [deleteItem, setDeleteItem] = useState<MediaItem | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: mediaData, isLoading } = useQuery<{ media: MediaItem[]; total: number }>({
    queryKey: ["media", search],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      const res = await fetch(`/api/media?${params}`)
      if (!res.ok) throw new Error("Failed to fetch media")
      return res.json()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/media/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] })
      setDeleteItem(null)
      toast.success("Media deleted")
    },
    onError: () => toast.error("Failed to delete media"),
  })

  const uploadFiles = useCallback(async (files: FileList, folder: string = "misc") => {
    const newUploads: UploadProgress[] = Array.from(files)
      .filter(f => f.type.startsWith("image/"))
      .map(f => ({
        fileName: f.name,
        progress: 0,
        status: 'uploading' as const,
        originalSize: f.size,
      }))

    if (newUploads.length === 0) {
      toast.error("No valid image files selected")
      return
    }

    setUploads(prev => [...prev, ...newUploads])

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith("image/")) continue

      const uploadIndex = uploads.length + i

      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("folder", folder)

        const result = await new Promise<{ url: string; size: number; originalSize?: number; converted?: boolean }>(
          (resolve, reject) => {
            const xhr = new XMLHttpRequest()

            xhr.upload.addEventListener('progress', (event) => {
              if (event.lengthComputable) {
                const percent = Math.round((event.loaded / event.total) * 100)
                setUploads(prev => prev.map((u, idx) =>
                  idx === uploadIndex ? { ...u, progress: percent } : u
                ))
              }
            })

            xhr.addEventListener('load', () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const data = JSON.parse(xhr.responseText)
                  resolve(data)
                } catch {
                  reject(new Error('Invalid response'))
                }
              } else {
                try {
                  const data = JSON.parse(xhr.responseText)
                  reject(new Error(data.error || 'Upload failed'))
                } catch {
                  reject(new Error('Upload failed'))
                }
              }
            })

            xhr.addEventListener('error', () => reject(new Error('Network error')))
            xhr.open('POST', '/api/media')
            xhr.send(formData)
          }
        )

        setUploads(prev => prev.map((u, idx) =>
          idx === uploadIndex ? {
            ...u,
            status: 'success' as const,
            progress: 100,
            convertedSize: result.size,
            converted: result.converted,
          } : u
        ))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed'
        setUploads(prev => prev.map((u, idx) =>
          idx === uploadIndex ? {
            ...u,
            status: 'error' as const,
            error: message,
          } : u
        ))
      }
    }

    queryClient.invalidateQueries({ queryKey: ["media"] })

    // Clear completed uploads after 5 seconds
    setTimeout(() => {
      setUploads(prev => prev.filter(u => u.status === 'uploading'))
    }, 5000)
  }, [queryClient, uploads.length])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files)
  }, [uploadFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback(() => setDragActive(false), [])

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success("URL copied to clipboard")
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString()

  const activeUploads = uploads.filter(u => u.status === 'uploading')
  const hasActiveUploads = activeUploads.length > 0

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground">Upload and manage images — auto-converted to WebP</p>
        </div>
      </div>

      {/* Upload Area */}
      <div className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-colors ${
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {hasActiveUploads ? (
          <div className="space-y-4 max-w-md mx-auto">
            <Loader2 className="size-8 animate-spin text-primary mx-auto" />
            <p className="text-sm font-medium">Uploading {activeUploads.length} file{activeUploads.length > 1 ? 's' : ''}...</p>
            {uploads.map((upload, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground truncate max-w-[200px]">{upload.fileName}</span>
                  <span className="font-medium">{upload.progress}%</span>
                </div>
                <Progress value={upload.progress} className="h-2" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <Upload className="size-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">Drag and drop files here</p>
            <p className="text-xs text-muted-foreground mb-1">or click to browse</p>
            <p className="text-[10px] text-muted-foreground/70 mb-3">Images are automatically converted to WebP for faster loading</p>
            <label>
              <Button variant="outline" size="sm" className="cursor-pointer" asChild>
                <span>
                  <Upload className="size-3.5 mr-1" />
                  Select Files
                </span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && uploadFiles(e.target.files)}
              />
            </label>
          </>
        )}
      </div>

      {/* Upload Results (completed uploads) */}
      {uploads.some(u => u.status !== 'uploading') && (
        <div className="space-y-2">
          {uploads.filter(u => u.status !== 'uploading').map((upload, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                upload.status === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/30'
                  : 'bg-destructive/5 border-destructive/20'
              }`}
            >
              {upload.status === 'success' ? (
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              ) : (
                <X className="size-4 text-destructive shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{upload.fileName}</p>
                {upload.status === 'success' ? (
                  <p className="text-xs text-muted-foreground">
                    {upload.originalSize && formatSize(upload.originalSize)}
                    {upload.converted && upload.convertedSize && upload.originalSize && (
                      <> → {formatSize(upload.convertedSize)} <Badge variant="secondary" className="text-[10px] ml-1">WebP {Math.round((1 - upload.convertedSize / upload.originalSize) * 100)}% smaller</Badge></>
                    )}
                  </p>
                ) : (
                  <p className="text-xs text-destructive">{upload.error}</p>
                )}
              </div>
              {upload.status === 'error' && (
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => {
                  // Remove the failed upload from list
                  setUploads(prev => prev.filter((_, i) => i !== idx))
                }}>
                  Dismiss
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input placeholder="Search media..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : mediaData?.media && mediaData.media.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {mediaData.media.map((item) => (
            <Card
              key={item.id}
              className="group cursor-pointer overflow-hidden hover:shadow-md transition-shadow"
              onClick={() => setPreviewItem(item)}
            >
              <CardContent className="p-0">
                <div className="aspect-square relative">
                  {item.mimeType.startsWith("image/") ? (
                    <img src={item.url} alt={item.altText || item.originalName} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-article.svg' }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <ImageIcon className="size-8 text-muted-foreground" />
                    </div>
                  )}
                  {/* Touch: always visible. Desktop: hover only. */}
                  <div className="absolute inset-0 bg-black/50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="size-8"
                      onClick={(e) => { e.stopPropagation(); copyUrl(item.url) }}
                    >
                      <Copy className="size-3.5" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="size-8"
                      onClick={(e) => { e.stopPropagation(); setDeleteItem(item) }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                  {/* WebP badge for converted images */}
                  {item.mimeType === 'image/webp' && (
                    <div className="absolute top-1.5 left-1.5">
                      <Badge className="text-[9px] px-1 py-0 h-4 bg-emerald-500/80 text-white border-0">WebP</Badge>
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs truncate font-medium">{item.originalName}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{formatSize(item.size)}</p>
                    <p className="text-[10px] text-muted-foreground">{item.mimeType.split('/')[1]?.toUpperCase()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <ImageIcon className="size-8 mx-auto mb-2 opacity-50" />
            <p>No media files yet</p>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileImage className="size-5" />
              {previewItem?.originalName}
            </DialogTitle>
          </DialogHeader>
          {previewItem && (
            <div className="space-y-4">
              <img src={previewItem.url} alt={previewItem.altText || previewItem.originalName} className="w-full max-h-96 object-contain rounded-lg" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-article.svg' }} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Size:</span> {formatSize(previewItem.size)}</div>
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Type:</span> {previewItem.mimeType.split('/')[1]?.toUpperCase()}
                  {previewItem.mimeType === 'image/webp' && (
                    <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">Optimized</Badge>
                  )}
                </div>
                <div><span className="text-muted-foreground">Uploaded:</span> {formatDate(previewItem.createdAt)}</div>
                <div><span className="text-muted-foreground">Filename:</span> <span className="text-xs break-all">{previewItem.filename}</span></div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">URL:</span>{" "}
                  <span className="break-all text-xs">{previewItem.url}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => previewItem && copyUrl(previewItem.url)} className="gap-2">
              <Copy className="size-4" /> Copy URL
            </Button>
            <Button
              variant="destructive"
              onClick={() => { if (previewItem) { setDeleteItem(previewItem); setPreviewItem(null) } }}
              className="gap-2"
            >
              <Trash2 className="size-4" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Media</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteItem?.originalName}&quot;? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteItem && deleteMutation.mutate(deleteItem.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
