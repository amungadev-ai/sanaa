'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Loader2, ImageIcon, CheckCircle2, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { MediaGalleryPicker } from '@/components/dashboard/media-gallery-picker'

interface ImageUploadProps {
  /** Current image URL (controlled) */
  value: string | null
  /** Called when upload completes with the new URL */
  onChange: (url: string) => void
  /** CDN folder for the upload */
  folder: 'posts' | 'artists' | 'events' | 'profiles' | 'ads' | 'misc'
  /** Label text */
  label?: string
  /** Hint text shown below the upload area */
  hint?: string
  /** Aspect ratio class for the preview container */
  aspectClass?: string
  /** Whether upload is disabled */
  disabled?: boolean
  /** Alt text for the preview image */
  altText?: string
  /** Show compact mode (no label text in the upload area) */
  compact?: boolean
}

interface UploadState {
  status: 'idle' | 'uploading' | 'success' | 'error'
  progress: number
  fileName: string
  error: string | null
  originalSize: number | null
  convertedSize: number | null
}

export function ImageUpload({
  value,
  onChange,
  folder,
  label = 'Image',
  hint = 'Click or drag to upload',
  aspectClass = 'aspect-video',
  disabled = false,
  altText = 'Preview',
  compact = false,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    fileName: '',
    error: null,
    originalSize: null,
    convertedSize: null,
  })

  const uploadFile = useCallback(async (file: File) => {
    // Validate type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG, AVIF')
      return
    }

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum: 10MB')
      return
    }

    setUploadState({
      status: 'uploading',
      progress: 0,
      fileName: file.name,
      error: null,
      originalSize: file.size,
      convertedSize: null,
    })

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      // Use XMLHttpRequest for progress tracking
      const result = await new Promise<{ url: string; size: number; originalSize?: number; mimeType: string }>(
        (resolve, reject) => {
          const xhr = new XMLHttpRequest()

          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100)
              setUploadState((prev) => ({ ...prev, progress: percent }))
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
          xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')))

          xhr.open('POST', '/api/media')
          xhr.send(formData)
        }
      )

      setUploadState((prev) => ({
        ...prev,
        status: 'success',
        progress: 100,
        convertedSize: result.size,
      }))

      onChange(result.url)
      toast.success('Image uploaded successfully')

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setUploadState({
          status: 'idle',
          progress: 0,
          fileName: '',
          error: null,
          originalSize: null,
          convertedSize: null,
        })
      }, 2000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      setUploadState((prev) => ({
        ...prev,
        status: 'error',
        error: message,
      }))
      toast.error(message)

      // Reset after 3 seconds
      setTimeout(() => {
        setUploadState({
          status: 'idle',
          progress: 0,
          fileName: '',
          error: null,
          originalSize: null,
          convertedSize: null,
        })
      }, 3000)
    }
  }, [folder, onChange])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    // Reset input so same file can be re-selected
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleRemove = () => {
    onChange('')
    setUploadState({
      status: 'idle',
      progress: 0,
      fileName: '',
      error: null,
      originalSize: null,
      convertedSize: null,
    })
  }

  const handleGallerySelect = (url: string) => {
    onChange(url)
    setUploadState({
      status: 'idle',
      progress: 0,
      fileName: '',
      error: null,
      originalSize: null,
      convertedSize: null,
    })
    toast.success('Image selected from gallery')
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  const isUploading = uploadState.status === 'uploading'
  const isSuccess = uploadState.status === 'success'
  const isError = uploadState.status === 'error'

  // Show existing image with overlay actions
  if (value && !isUploading && !isError) {
    return (
      <div className="space-y-2">
        {label && !compact && (
          <label className="text-sm font-medium">{label}</label>
        )}
        <div className={`relative group rounded-lg overflow-hidden border ${aspectClass}`}>
          <img
            src={value}
            alt={altText}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-article.svg'
            }}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 sm:gap-2 p-2">
            <Button
              variant="secondary"
              size="sm"
              className="gap-1 h-7 text-xs px-2 sm:h-8 sm:text-sm sm:px-3"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
            >
              <Upload className="size-3.5" />
              <span className="hidden sm:inline">Replace</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="gap-1 h-7 text-xs px-2 sm:h-8 sm:text-sm sm:px-3"
              onClick={(e) => { e.stopPropagation(); setGalleryOpen(true) }}
              disabled={disabled}
            >
              <FolderOpen className="size-3.5" />
              <span className="hidden sm:inline">Gallery</span>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="gap-1 h-7 text-xs px-2 sm:h-8 sm:text-sm sm:px-3"
              onClick={handleRemove}
              disabled={disabled}
            >
              <X className="size-3.5" />
              <span className="hidden sm:inline">Remove</span>
            </Button>
          </div>
          {isSuccess && (
            <div className="absolute top-2 right-2">
              <CheckCircle2 className="size-5 text-emerald-400 drop-shadow" />
            </div>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
        <MediaGalleryPicker
          open={galleryOpen}
          onClose={() => setGalleryOpen(false)}
          onSelect={handleGallerySelect}
          currentUrl={value}
        />
      </div>
    )
  }

  // Upload area (no image or uploading or error)
  return (
    <div className="space-y-2">
      {label && !compact && (
        <label className="text-sm font-medium">{label}</label>
      )}
      <div
        className={`
          relative rounded-lg border-2 border-dashed transition-colors
          ${dragActive ? 'border-primary bg-primary/5' : isError ? 'border-destructive/50 bg-destructive/5' : 'border-muted-foreground/25 hover:border-primary/50'}
          ${aspectClass}
          flex flex-col items-center justify-center
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragActive(false)}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-3 px-4 w-full max-w-[240px]">
            <Loader2 className="size-8 animate-spin text-primary" />
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground truncate max-w-[160px]">
                  {uploadState.fileName}
                </span>
                <span className="font-medium">{uploadState.progress}%</span>
              </div>
              <Progress value={uploadState.progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {uploadState.progress < 50 ? 'Uploading...' : uploadState.progress < 90 ? 'Processing...' : 'Almost done...'}
              </p>
            </div>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-2 px-4 text-center">
            <X className="size-8 text-destructive" />
            <p className="text-sm font-medium text-destructive">Upload failed</p>
            <p className="text-xs text-muted-foreground">{uploadState.error}</p>
            <Button variant="outline" size="sm" className="mt-1" onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}>
              Try Again
            </Button>
          </div>
        ) : isSuccess ? (
          <div className="flex flex-col items-center gap-2 px-4 text-center">
            <CheckCircle2 className="size-8 text-emerald-500" />
            <p className="text-sm font-medium text-emerald-600">Uploaded!</p>
            {uploadState.originalSize && uploadState.convertedSize && (
              <p className="text-xs text-muted-foreground">
                {formatSize(uploadState.originalSize)} → {formatSize(uploadState.convertedSize)}
                {uploadState.convertedSize < (uploadState.originalSize || 0) && (
                  <span className="text-emerald-600 ml-1">
                    ({Math.round((1 - uploadState.convertedSize / (uploadState.originalSize || 1)) * 100)}% smaller)
                  </span>
                )}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 text-center cursor-pointer" onClick={() => inputRef.current?.click()}>
            <ImageIcon className="size-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">{hint}</p>
            <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WebP — max 10MB</p>
            <p className="text-[10px] text-muted-foreground/70">Auto-converted to WebP for performance</p>
          </div>
        )}
      </div>

      {/* Action buttons below upload area — stack on mobile, row on desktop */}
      {!isUploading && !isSuccess && !isError && (
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
          >
            <Upload className="size-3.5" />
            Upload
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => setGalleryOpen(true)}
            disabled={disabled}
          >
            <FolderOpen className="size-3.5" />
            Gallery
          </Button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />
      <MediaGalleryPicker
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        onSelect={handleGallerySelect}
        currentUrl={value}
      />
    </div>
  )
}
