'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  X,
  Loader2,
  CheckCircle2,
  Image as ImageIcon,
  FolderOpen,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

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

interface MediaGalleryPickerProps {
  /** Whether the dialog is open */
  open: boolean
  /** Called when dialog should close */
  onClose: () => void
  /** Called when user selects an image */
  onSelect: (url: string, mediaItem?: MediaItem) => void
  /** Currently selected image URL (for highlighting) */
  currentUrl?: string | null
  /** Dialog title */
  title?: string
}

export function MediaGalleryPicker({
  open,
  onClose,
  onSelect,
  currentUrl,
  title = 'Choose from Gallery',
}: MediaGalleryPickerProps) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch media
  const fetchMedia = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '24')
      if (debouncedSearch) params.set('search', debouncedSearch)

      const res = await fetch(`/api/media?${params}`)
      if (!res.ok) throw new Error('Failed to fetch media')
      const data = await res.json()

      if (page === 1) {
        setMedia(data.media)
      } else {
        setMedia(prev => [...prev, ...data.media])
      }
      setTotalPages(data.pagination.totalPages)
      setTotal(data.pagination.total)
    } catch (err) {
      console.error('Failed to fetch media:', err)
      toast.error('Failed to load media gallery')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch])

  useEffect(() => {
    if (open) {
      fetchMedia()
    }
  }, [open, page, debouncedSearch]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setSearch('')
      setDebouncedSearch('')
      setPage(1)
      setSelectedId(null)
      setSelectedItem(null)
    }
  }, [open])

  const handleSelect = (item: MediaItem) => {
    if (selectedId === item.id) {
      // Deselect
      setSelectedId(null)
      setSelectedItem(null)
    } else {
      setSelectedId(item.id)
      setSelectedItem(item)
    }
  }

  const handleConfirm = () => {
    if (selectedItem) {
      onSelect(selectedItem.url, selectedItem)
      onClose()
    }
  }

  const loadMore = () => {
    if (page < totalPages) {
      setPage(prev => prev + 1)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="size-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        {/* Search Bar */}
        <div className="flex items-center gap-3 pb-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by filename or alt text..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {total} image{total !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Selected Image Preview */}
        {selectedItem && (
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
            <div className="size-16 rounded overflow-hidden shrink-0">
              <img
                src={selectedItem.url}
                alt={selectedItem.altText || selectedItem.originalName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedItem.originalName}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span>{formatSize(selectedItem.size)}</span>
                <span>·</span>
                <span>{selectedItem.mimeType.split('/')[1]?.toUpperCase()}</span>
                <span>·</span>
                <span>{formatDate(selectedItem.createdAt)}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 size-8"
              onClick={() => {
                setSelectedId(null)
                setSelectedItem(null)
              }}
            >
              <X className="size-4" />
            </Button>
          </div>
        )}

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading && media.length === 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 p-1">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : media.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 p-1">
              {media.map((item) => {
                const isSelected = selectedId === item.id
                const isCurrent = currentUrl === item.url
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`
                      relative aspect-square rounded-lg overflow-hidden border-2 transition-all group
                      ${isSelected
                        ? 'border-primary ring-2 ring-primary/30'
                        : isCurrent
                        ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                        : 'border-transparent hover:border-muted-foreground/30'
                      }
                    `}
                    onClick={() => handleSelect(item)}
                  >
                    <img
                      src={item.url}
                      alt={item.altText || item.originalName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-article.svg'
                      }}
                    />
                    {/* Hover overlay with filename */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end">
                      <div className="w-full p-1.5 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[10px] text-white truncate">{item.originalName}</p>
                      </div>
                    </div>
                    {/* Selected checkmark */}
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5">
                        <CheckCircle2 className="size-5 text-primary drop-shadow-md fill-background stroke-primary" />
                      </div>
                    )}
                    {/* Current image badge */}
                    {isCurrent && !isSelected && (
                      <div className="absolute top-1.5 left-1.5">
                        <Badge className="text-[8px] px-1 py-0 h-4 bg-emerald-500/90 text-white border-0">
                          Current
                        </Badge>
                      </div>
                    )}
                    {/* WebP badge */}
                    {item.mimeType === 'image/webp' && (
                      <div className="absolute bottom-1 left-1">
                        <Badge className="text-[8px] px-1 py-0 h-3.5 bg-emerald-500/70 text-white border-0">
                          WebP
                        </Badge>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ImageIcon className="size-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">No images found</p>
              <p className="text-xs mt-1">
                {debouncedSearch
                  ? 'Try a different search term'
                  : 'Upload images to your media library first'}
              </p>
            </div>
          )}

          {/* Load More */}
          {media.length > 0 && page < totalPages && (
            <div className="flex justify-center py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={loadMore}
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : null}
                Load More
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 pt-2 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedItem}
            className="gap-2"
          >
            {selectedItem ? (
              <>
                <CheckCircle2 className="size-4" />
                Use Selected Image
              </>
            ) : (
              'Select an Image'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
